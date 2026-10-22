#!/usr/bin/env node
/**
 * Screenshot helper for FinVista.
 *
 *   node scripts/screenshot.mjs                                   # local preview, Edge
 *   node scripts/screenshot.mjs --url https://fin-vista-chi.vercel.app
 *   node scripts/screenshot.mjs --url http://localhost:4173/ --out shot.png --width 1440
 *
 * Why there are two modes
 * -----------------------
 * This machine's egress blocks the TLS handshake for `*.vercel.app` -- the
 * connection is reset before the ClientHello completes. It is an SNI filter,
 * not an IP filter: forcing `api.vercel.com` onto the same IP works fine,
 * while forcing `fin-vista-chi.vercel.app` onto a working IP still fails.
 *
 * So:
 *   - localhost  -> rendered locally with headless Microsoft Edge.
 *   - any public URL -> rendered by a server-side browser (microlink), which
 *     is not affected by the local egress filter.
 *
 * Note: some screenshot services freeze CSS animations. FinVista's
 * `animate-fade-up` starts at opacity 0, so a frozen animation leaves the
 * hero invisible. microlink lets animations run and waits for the page to
 * settle, so the full hero renders.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const EDGE_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const url = arg('url', 'http://localhost:4173/');
const out = resolve(arg('out', 'screenshot.png'));
const width = Number(arg('width', '1440'));
const height = Number(arg('height', '900'));
const wait = Number(arg('wait', '3000'));

const findEdge = () => EDGE_CANDIDATES.find((p) => existsSync(p));

const isLocal = (() => {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
})();

mkdirSync(dirname(out), { recursive: true });

/** Render with headless Microsoft Edge. */
function shootWithEdge() {
  const edge = findEdge();
  if (!edge) {
    console.error('Microsoft Edge not found. Looked in:\n  ' + EDGE_CANDIDATES.join('\n  '));
    process.exit(1);
  }

  const profile = resolve(tmpdir(), 'opencode-edge-profile');
  rmSync(profile, { recursive: true, force: true });

  const args = [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    `--screenshot=${out}`,
    `--virtual-time-budget=${wait}`,
    url,
  ];

  return new Promise((resolvePromise, reject) => {
    const child = spawn(edge, args, { stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0 && existsSync(out)) resolvePromise();
      else reject(new Error(`Edge exited with code ${code}`));
    });
  });
}

/** Render with a server-side browser (microlink). */
async function shootViaProxy() {
  const params = new URLSearchParams({
    url,
    screenshot: 'true',
    meta: 'false',
    waitForTimeout: String(wait),
    'viewport.width': String(width),
    'viewport.height': String(height),
    embed: 'screenshot.url',
  });

  const res = await fetch(`https://api.microlink.io/?${params}`);
  if (!res.ok) throw new Error(`microlink responded ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(out, buf);
  rmSync(resolve(tmpdir(), 'opencode-edge-profile'), { recursive: true, force: true });
}

(async () => {
  const mode = isLocal ? 'edge (local)' : 'microlink (server-side)';
  console.log(`capturing ${url}`);
  console.log(`mode   ${mode}`);
  console.log(`output ${out}`);

  try {
    if (isLocal) await shootWithEdge();
    else await shootViaProxy();
    console.log('done');
  } catch (err) {
    console.error('failed:', err.message);
    process.exit(1);
  }
})();
