/**
 * Migrates scholarship data from scholarship-finder.scholarships.json into Supabase.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/migrate.mjs
 *
 * Or copy .env.local values and run:
 *   node -r dotenv/config scripts/migrate.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const raw = JSON.parse(readFileSync(join(__dirname, '..', 'scholarship-finder.scholarships.json'), 'utf-8'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function parseBool(val) {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.toLowerCase() === 'true' || val === 'Yes'
  return null
}

function parseAmount(val) {
  if (!val) return null
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : n
}

const scholarships = raw.map((s) => ({
  name: s.name,
  scholarship_type: s.scholarshipType || null,
  application_required: parseBool(s.applicationRequired),
  description: s.description || null,
  quantity: s.quantity || null,
  preference: s.preference && s.preference !== 'N/A' ? s.preference : null,
  faculty: s.faculty && s.faculty !== 'N/A' ? s.faculty : null,
  gender: s.gender && s.gender !== 'N/A' ? s.gender : null,
  year: s.year && s.year !== 'N/A' ? s.year : null,
  disability: parseBool(s.disability),
  indigenous: parseBool(s.indigenous),
  race: s.race && s.race !== 'N/A' ? s.race : null,
  nationality: s.nationality && s.nationality !== 'N/A' ? s.nationality : null,
  gpa: parseAmount(s.gpa),
  amount: parseAmount(s.amount),
  gpa_based: parseBool(s.gpaBased),
  medals_prizes: parseBool(s.medalsPrizes),
  deadline: null,
}))

console.log(`Inserting ${scholarships.length} scholarships…`)

const BATCH_SIZE = 50
for (let i = 0; i < scholarships.length; i += BATCH_SIZE) {
  const batch = scholarships.slice(i, i + BATCH_SIZE)
  const { error } = await supabase.from('scholarships').insert(batch)
  if (error) {
    console.error(`Error at batch ${i}:`, error.message)
    process.exit(1)
  }
  console.log(`  ✓ Inserted ${Math.min(i + BATCH_SIZE, scholarships.length)} / ${scholarships.length}`)
}

console.log('Migration complete!')
