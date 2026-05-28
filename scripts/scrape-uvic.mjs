/**
 * Scrapes all scholarships from the UVic webfilters API and upserts them
 * into the Supabase `scholarships` table.
 *
 * Usage:
 *   node scripts/scrape-uvic.mjs
 *   (reads NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ── Load env ──────────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '..', '.env.local')
const env = {}
try {
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) env[k.trim()] = v.join('=').trim()
  })
} catch { /* no .env.local, rely on process.env */ }

const SUPABASE_URL  = env.NEXT_PUBLIC_SUPABASE_URL  || process.env.NEXT_PUBLIC_SUPABASE_URL
// Prefer service role key (bypasses RLS); fall back to anon key
const SUPABASE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
                   || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const usingServiceRole = !!(env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log(`Auth mode: ${usingServiceRole ? 'service role (bypasses RLS)' : 'anon key (RLS must be disabled)'}`)

// ── Fetch from UVic API ───────────────────────────────────────────────────────
const API = 'https://webfilters.uvic.ca/api/scholarships?start=0&end=9999'
console.log('Fetching from UVic API…')
const res = await fetch(API)
if (!res.ok) throw new Error(`UVic API returned ${res.status}`)
const json = await res.json()
const raw  = json.data   // array of arrays

console.log(`Fetched ${raw.length} scholarships from UVic`)

// ── Parse a single record ─────────────────────────────────────────────────────
// Each record is an array of cell objects; order matches the display columns:
//  [0] name + description HTML
//  [1] deadline text
//  [2] "Value: $X | Number: Y"
//  [3] department/availability tags  (may be missing)
//  [4] application required tags
//  [5] renewable tags
//  [6] student focus tags
//  [7] award type tags

function parseAmount(valueStr) {
  if (!valueStr) return null
  const m = valueStr.match(/\$([0-9,]+)/)
  if (!m) return null
  return parseFloat(m[1].replace(/,/g, ''))
}

function getText(cell) {
  return (cell?.text ?? '').replace(/<[^>]+>/g, '').trim()
}

function getTags(cell) {
  return Array.isArray(cell?.tags) ? cell.tags : []
}

function parseRecord(row) {
  // row is an array of cell objects; find by presence of `text` or `tags`
  const textCells = row.filter(c => c.text !== undefined)
  const tagCells  = row.filter(c => c.tags !== undefined)

  // ── Name & description
  const nameCell = textCells[0] ?? {}
  const rawHTML  = nameCell.text ?? ''
  const nameMatch = rawHTML.match(/<a[^>]*>([^<]+)<\/a>/)
  const rawName = nameMatch ? nameMatch[1].trim() : getText(nameCell).split('\n')[0].trim()
  // Strip trailing asterisk (UVic "subject to Senate approval" marker) and any stray whitespace
  const name = rawName.replace(/\*+$/, '').trim()

  // Strip the name anchor to get pure description HTML, then strip all tags
  const descHTML = rawHTML.replace(/<a[^>]*>[^<]*<\/a>/, '').trim()
  const description = descHTML.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || null

  // URL to the individual scholarship page
  const urlMatch = rawHTML.match(/href='([^']+)'/)
  const source_url = urlMatch ? urlMatch[1] : null

  // ── Deadline
  // UVic uses "no application required" as a deadline placeholder — store as null
  const rawDeadline = getText(textCells[1])
  const deadline_text = (rawDeadline && rawDeadline.toLowerCase() !== 'no application required')
    ? rawDeadline
    : null

  // ── Value / quantity
  const valueText = getText(textCells[2]) || ''
  const amountStr = valueText.split('|')[0] ?? ''
  const quantityStr = valueText.split('|')[1] ?? ''
  const amount   = parseAmount(amountStr)
  const quantity = quantityStr.replace('Number:', '').trim() || null

  // ── Tags (order: dept, app_required, renewable, focus, type)
  // Map tag cells by their content
  let dept_tags    = []
  let app_tags     = []
  let renew_tags   = []
  let focus_tags   = []
  let type_tags    = []

  const typeValues = new Set(['Entrance scholarship', 'In-course scholarships for continuing students', 'Travel awards for continuing students'])
  const appValues  = new Set(['Required', 'Not Required'])
  const renewValues= new Set(['Yes', 'No'])
  const focusValues= new Set(['Athletics', 'Gender-based', 'Indigenous students', 'International students', 'Refugee/Protected Person', 'Students with disabilities', 'Visible minorities'])

  for (const cell of tagCells) {
    const tags = getTags(cell)
    if (!tags.length) continue
    const first = tags[0]
    if (typeValues.has(first))   { type_tags   = tags; continue }
    if (appValues.has(first))    { app_tags    = tags; continue }
    if (renewValues.has(first))  { renew_tags  = tags; continue }
    if (focusValues.has(first))  { focus_tags  = tags; continue }
    dept_tags = tags  // remaining → department
  }

  const scholarship_type = type_tags.includes('Entrance scholarship')
    ? 'Entrance'
    : type_tags.includes('In-course scholarships for continuing students')
    ? 'In-Course'
    : type_tags.includes('Travel awards for continuing students')
    ? 'Travel'
    : null

  const application_required = app_tags.includes('Required') ? true
    : app_tags.includes('Not Required') ? false : null

  const renewable = renew_tags.includes('Yes') ? true
    : renew_tags.includes('No') ? false : null

  const faculty = dept_tags.filter(t => t !== 'Available to all').join(', ') || null

  const indigenous = focus_tags.includes('Indigenous students')
  const disability = focus_tags.includes('Students with disabilities')
  const gender     = focus_tags.includes('Gender-based') ? 'Gender-based' : null
  const nationality = focus_tags.includes('International students') ? 'International' : null

  return {
    name,
    scholarship_type,
    application_required,
    description,
    quantity,
    faculty,
    gender,
    year: null,
    disability,
    indigenous,
    race: focus_tags.includes('Visible minorities') ? 'Visible minority' : null,
    nationality,
    gpa: null,
    amount,
    gpa_based: null,
    medals_prizes: null,
    renewable,
    deadline_text,
    deadline: null,
    source_url,
  }
}

const scholarships = raw.map(parseRecord).filter(s => s.name)

console.log(`Parsed ${scholarships.length} scholarships`)

// Preview a few
console.log('\nSample records:')
scholarships.slice(0, 3).forEach(s => {
  console.log(` - ${s.name} | ${s.scholarship_type} | $${s.amount ?? '?'} | ${s.faculty ?? 'all'} | app=${s.application_required}`)
})

// ── Upsert into Supabase ──────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 1. Clear existing records (delete saved_scholarships first to satisfy FK)
console.log('\nClearing existing data…')
const { error: delSavedError } = await supabase.from('saved_scholarships').delete().neq('id', '00000000-0000-0000-0000-000000000000')
if (delSavedError) { console.error('Delete saved_scholarships error:', delSavedError.message); process.exit(1) }

const { error: delError } = await supabase.from('scholarships').delete().neq('id', '00000000-0000-0000-0000-000000000000')
if (delError) { console.error('Delete scholarships error:', delError.message); process.exit(1) }

// 2. Insert in batches of 100
const BATCH = 100
let inserted = 0
for (let i = 0; i < scholarships.length; i += BATCH) {
  const batch = scholarships.slice(i, i + BATCH)
  const { error } = await supabase.from('scholarships').insert(batch)
  if (error) { console.error(`Insert error at batch ${i}:`, error.message); process.exit(1) }
  inserted += batch.length
  process.stdout.write(`\r  ✓ Inserted ${inserted} / ${scholarships.length}`)
}

console.log('\nDone! Scholarships in database:', scholarships.length)
