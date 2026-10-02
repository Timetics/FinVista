import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const fileText = await file.text()
    const parsedTransactions: Array<{
      user_id: string
      transaction_date: string
      description: string
      amount: number
      category: string
    }> = []

    // 3. Simple CSV Parser Logic
    if (file.name.endsWith('.csv')) {
      const lines = fileText.split(/\r?\n/)
      
      // Skip header row (line 0) and iterate through lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Assuming basic standard CSV: Date, Description, Amount, Category
        const cols = line.split(',')
        if (cols.length >= 3) {
          const rawDate = cols[0].trim()
          const description = cols[1].trim()
          const amount = parseFloat(cols[2].trim())
          const category = cols[3] ? cols[3].trim() : 'Uncategorized'

          if (!isNaN(amount) && rawDate) {
            parsedTransactions.push({
              user_id: user.id,
              transaction_date: rawDate, // Expecting YYYY-MM-DD
              description: description,
              amount: amount,
              category: category,
            })
          }
        }
      }
    } else {
      return new Response(JSON.stringify({ error: 'PDF parsing currently requires setup. Please test CSV file first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (parsedTransactions.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid transactions found in file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Batch Insert Into Supabase DB
    const { data, error: dbError } = await supabaseClient
      .from('transactions')
      .insert(parsedTransactions)
      .select()

    if (dbError) {
      throw dbError
    }

    // 5. Return JSON Response
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


