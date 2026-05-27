# ScholarU

A scholarship finder for UVic students. Browse and filter 1,300+ scholarships scraped directly from the UVic awards database, save the ones you're interested in, and track deadlines — all in one place.

## Features

- **1,300+ scholarships** sourced live from the UVic webfilters API
- **Instant filtering** by type, faculty, GPA, renewable status, application requirement, and eligibility criteria (Indigenous students, students with disabilities)
- **Full-text search** across scholarship names and descriptions
- **Deadline tracking** with urgency indicators (overdue / due soon / upcoming)
- **Save scholarships** and track application status (Saved → Applied → Awarded)
- **User profiles** — store your faculty, year, and GPA for future matching
- **Google sign-in** or email/password auth via Supabase

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth + email) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/VikeLabs/scholar-u.git
cd scholar-u
npm install
```

### 2. Configure environment

Create a `.env.local` file in the project root (see `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Set up the database

Run the migration in the Supabase SQL editor:

```
supabase/migrations/001_initial.sql
```

This creates the `scholarships`, `user_profiles`, and `saved_scholarships` tables with Row Level Security policies.

### 4. Seed scholarship data

Add your Supabase service role key to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Then run the scraper:

```bash
node scripts/scrape-uvic.mjs
```

This fetches all scholarships from the UVic webfilters API and upserts them into the database.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client
2. Add `https://<your-project>.supabase.co/auth/v1/callback` as an authorized redirect URI
3. In Supabase → Authentication → Providers → Google, enable the provider and paste your Client ID and Client Secret

## Project Structure

```
app/
  page.tsx              # Home — scholarship browse
  dashboard/            # User dashboard (saved, deadlines, profile)
  auth/                 # Login, signup, OAuth callback
  api/                  # saved/ and profile/ API routes
components/
  ScholarshipGrid.tsx   # Client-side filtering + pagination
  ScholarshipCard.tsx   # Individual scholarship card
  FilterPanel.tsx       # Sidebar filters
  OAuthButtons.tsx      # Google sign-in button
  DashboardContent.tsx  # Dashboard tabs
lib/
  supabase/             # Server + browser Supabase clients
  utils.ts              # Formatting helpers
scripts/
  scrape-uvic.mjs       # UVic scholarship scraper
supabase/
  migrations/           # SQL schema
types/
  index.ts              # TypeScript interfaces
```

## Contributing

This project is maintained by [VikeLabs](https://vikelabs.ca). PRs are welcome — please open an issue first to discuss larger changes.
