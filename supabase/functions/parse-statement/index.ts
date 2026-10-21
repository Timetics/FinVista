import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB, matches the UI limit

/**
 * Deterministic 36-bit row id.
 *
 * IMPORTANT: this MUST stay in sync with `stableTransactionId` in
 * src/utils/helpers.js. Both the client-side CSV path and this edge function
 * must derive the same id for the same logical row, because the table's
 * primary key is (user_id, id) and the upsert relies on that id being stable
 * across re-scans of the same statement.
 *
 * The range is [1, 2^36) so it can never collide with the ids assigned by the
 * `transactions_id_seq` sequence (which starts at 10^15).
 */
const stableTransactionId = (
  date: string,
  description: string,
  amount: number,
  occurrence: number,
): number => {
  const key = `${date ?? ''}|${description ?? ''}|${amount ?? 0}|${occurrence}`
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i)
    h1 ^= c
    h1 = Math.imul(h1, 0x01000193) >>> 0
    h2 ^= c
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0
  }
  const high = h1 & 0x7fff // 15 bits
  const low = h2 & 0x1fffff // 21 bits
  return high * 0x200000 + low + 1 // 36 bits, always >= 1
}

/** Split a single CSV line, honouring quoted fields that contain commas. */
const splitCsvLine = (line: string): string[] => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells.map((c) => c.trim())
}

/** Normalise a date to YYYY-MM-DD. Mirrors parseCSV() in src/utils/helpers.js. */
const normalizeDate = (raw: string): string => {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return trimmed
}

/**
 * Parse an amount cell into an absolute value plus a credit/debit type.
 * Mirrors parseCSV() in src/utils/helpers.js so both paths agree on values.
 */
const parseAmount = (raw: string): { amount: number; type: 'credit' | 'debit' } | null => {
  const value = (raw ?? '').trim()
  if (!value) return null

  const isParenNegative = value.includes('(') && value.includes(')')
  // Strip everything that is not part of a number, including currency symbols
  // and thousands separators.
  const cleaned = value.replace(/[()]/g, '').replace(/,/g, '').replace(/[^0-9.\s+-]/g, '')
  let numeric = parseFloat(cleaned)
  if (isNaN(numeric)) return null

  const isNegative = isParenNegative || value.includes('-') || value.includes('\u2212') || numeric < 0
  if (isNegative) numeric = -Math.abs(numeric)

  return { amount: Math.abs(numeric), type: isNegative ? 'debit' : 'credit' }
}

/**
 * Detect the header row and the column indexes, mirroring parseCSV() in
 * src/utils/helpers.js.
 */
const detectColumns = (headerLine: string) => {
  const firstLine = (headerLine || '').toLowerCase()
  const hasHeader =
    /date|description|amount|category/.test(firstLine) ||
    /transaction|merchant|memo|payee/.test(firstLine)

  if (!hasHeader) {
    return { hasHeader: false, colDate: 0, colDesc: 1, colAmt: 2, colCat: 3 }
  }

  const header = splitCsvLine(headerLine).map((h) => h.toLowerCase())
  return {
    hasHeader: true,
    colDate: header.findIndex((h) => /date|transaction date|posted date/i.test(h)),
    colDesc: header.findIndex((h) => /description|merchant|memo|payee|transaction|category/i.test(h)),
    colAmt: header.findIndex((h) => /amount|debit|credit|transaction amount/i.test(h)),
    colCat: header.findIndex((h) => /category|type/i.test(h)),
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify Authentication Header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase Client with User's JWT token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get Logged-in User Info
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Extract File from Request
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fileName = (file.name || '').toLowerCase()
    if (!fileName.endsWith('.csv')) {
      return new Response(
        JSON.stringify({
          error: 'Only CSV statements can be parsed server-side. Please upload a .csv file.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return new Response(JSON.stringify({ error: 'File is larger than the 10 MB limit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fileText = await file.text()
    const lines = fileText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid transactions found in file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { hasHeader, colDate, colDesc, colAmt, colCat } = detectColumns(lines[0])
    const rows = hasHeader ? lines.slice(1) : lines

    type ParsedTransaction = {
      id: number
      user_id: string
      date: string
      description: string
      amount: number
      category: string
      type: 'credit' | 'debit'
      confidence: number
      flags: string[]
      source: string
    }

    const parsedTransactions: ParsedTransaction[] = []
    // Tracks how many times an identical (date, description, amount) row has
    // been seen, so two identical transactions in one statement get distinct
    // ids while a re-scan of the same statement reproduces the same ids.
    const occurrenceCounts = new Map<string, number>()

    for (const line of rows) {
      const cells = splitCsvLine(line)
      if (cells.length === 0) continue

      const rawDate = colDate >= 0 && colDate < cells.length ? cells[colDate] : ''
      const rawDescription = colDesc >= 0 && colDesc < cells.length ? cells[colDesc] : ''
      const rawAmount = colAmt >= 0 && colAmt < cells.length ? cells[colAmt] : ''
      const rawCategory = colCat >= 0 && colCat < cells.length ? cells[colCat] : ''

      if (!rawDescription && !rawAmount) continue

      const parsedAmount = parseAmount(rawAmount)
      if (!parsedAmount) continue

      const date = normalizeDate(rawDate)
      const description = rawDescription || 'Unnamed Transaction'
      const category = rawCategory || ''

      const dedupeKey = `${date}|${description}|${parsedAmount.amount}`
      const occurrence = occurrenceCounts.get(dedupeKey) ?? 0
      occurrenceCounts.set(dedupeKey, occurrence + 1)

      parsedTransactions.push({
        id: stableTransactionId(date, description, parsedAmount.amount, occurrence),
        user_id: user.id,
        date,
        description,
        amount: parsedAmount.amount,
        category,
        type: parsedAmount.type,
        confidence: 99,
        flags: [],
        source: 'csv',
      })
    }

    if (parsedTransactions.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid transactions found in file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Upsert into Supabase DB.
    //    The primary key is (user_id, id) and the ids are deterministic, so
    //    re-scanning the same statement overwrites its rows instead of
    //    duplicating them.
    const { data, error: dbError } = await supabaseClient
      .from('transactions')
      .upsert(parsedTransactions, { onConflict: 'user_id,id' })
      .select()

    if (dbError) {
      throw dbError
    }

    // 4. Return JSON Response
    return new Response(
      JSON.stringify({
        message: 'Successfully processed and stored transactions',
        count: data.length,
        transactions: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
