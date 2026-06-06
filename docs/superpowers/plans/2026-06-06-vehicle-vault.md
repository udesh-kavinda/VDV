# Vehicle Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA for tracking vehicle document expiries with cloud sync, push notifications, and one-tap renewal links.

**Architecture:** Next.js 14 App Router PWA with Supabase (Postgres + Auth + Edge Functions). Client components handle interactivity; server components fetch data. A Supabase Edge Function runs daily to dispatch Web Push notifications via a `notification_log` deduplication table.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Auth + Postgres + Edge Functions), next-pwa (Workbox), Vitest + React Testing Library, Vercel

---

## File Map

```
vehicle-vault/
├── app/
│   ├── (auth)/login/page.tsx          # magic link + email/password login
│   ├── (app)/
│   │   ├── layout.tsx                 # authenticated shell (bottom nav)
│   │   ├── dashboard/page.tsx         # home: alert banner + vehicle list
│   │   ├── vehicles/
│   │   │   ├── new/page.tsx           # add vehicle form
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # vehicle detail + document list
│   │   │       └── edit/page.tsx      # edit vehicle
│   │   ├── documents/
│   │   │   ├── new/page.tsx           # add document (vehicleId in searchParams)
│   │   │   └── [id]/edit/page.tsx     # edit document + manage links
│   │   └── settings/page.tsx          # notifications + devices + account
│   ├── api/push/subscribe/route.ts    # save Web Push subscription to DB
│   ├── globals.css                    # shadcn CSS vars (warm palette override)
│   ├── layout.tsx                     # root layout (PWA meta, font)
│   └── page.tsx                       # redirect → /dashboard or /login
├── components/
│   ├── ui/                            # shadcn/ui generated (do not edit)
│   ├── alert-banner.tsx               # amber expiry warning banner
│   ├── vehicle-card.tsx               # vehicle summary card with status pills
│   ├── document-card.tsx              # single document row with links
│   ├── document-form.tsx              # add/edit document (client component)
│   ├── vehicle-form.tsx               # add/edit vehicle (client component)
│   ├── status-pill.tsx                # green/amber/red expiry badge
│   ├── link-editor.tsx                # manage renewal links for a document
│   └── push-prompt.tsx               # "Enable notifications" prompt UI
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # createBrowserClient()
│   │   ├── server.ts                  # createServerClient() (cookies)
│   │   └── types.ts                   # generated Database types (from CLI)
│   ├── vehicles.ts                    # getVehicles, createVehicle, updateVehicle, deleteVehicle
│   ├── documents.ts                   # getDocuments, createDocument, updateDocument, deleteDocument
│   ├── links.ts                       # getLinks, upsertLink, deleteLink
│   ├── notifications.ts               # subscribeToPush, unsubscribe helpers
│   └── expiry.ts                      # getExpiryStatus(date) → 'ok'|'warn'|'danger'|'expired'
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql             # all tables + updated_at trigger
│   │   └── 002_rls.sql                # all RLS policies
│   ├── seed/preset_links.sql          # default renewal links per document type
│   └── functions/send-notifications/
│       └── index.ts                   # Edge Function: daily push dispatch
├── public/
│   ├── manifest.json
│   └── icons/                         # 192x192, 512x512 PNG icons
├── middleware.ts                       # auth redirect guard
├── next.config.js                      # next-pwa config
└── __tests__/
    ├── expiry.test.ts
    ├── vehicles.test.ts
    └── documents.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- Create: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Create the Next.js project**

```bash
cd /Users/uk/Developer/Projects
npx create-next-app@latest vehicle-vault \
  --typescript --tailwind --eslint --app \
  --src-dir no --import-alias "@/*" --no-git
cd vehicle-vault
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr \
  next-pwa web-push \
  @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

npm install -D vitest @vitejs/plugin-react @testing-library/react \
  @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Initialise shadcn/ui**

```bash
npx shadcn@latest init
# Choose: Default style, Neutral base colour, CSS variables: yes
```

Then install the components used in this project:

```bash
npx shadcn@latest add button card badge input label textarea sheet \
  dialog alert separator avatar dropdown-menu toast
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
})
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Apply warm palette to shadcn CSS variables**

Replace the `:root` block in `app/globals.css` with:

```css
:root {
  --background: 30 20% 97%;         /* #faf8f5 */
  --foreground: 0 0% 18%;           /* #2d2d2d */
  --card: 0 0% 100%;
  --card-foreground: 0 0% 18%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 18%;
  --primary: 0 0% 18%;
  --primary-foreground: 0 0% 98%;
  --secondary: 30 15% 93%;          /* #ede8e0 */
  --secondary-foreground: 0 0% 18%;
  --muted: 30 15% 93%;
  --muted-foreground: 25 10% 60%;   /* #9a8f84 */
  --accent: 30 15% 93%;
  --accent-foreground: 0 0% 18%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;
  --border: 30 20% 88%;             /* #ede8e0 */
  --input: 30 20% 88%;
  --ring: 0 0% 18%;
  --radius: 0.75rem;
  --warning: 38 92% 50%;
  --warning-foreground: 38 80% 20%;
}
```

- [ ] **Step 6: Create root layout**

`app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vehicle Vault',
  description: 'Track your vehicle documents',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Vehicle Vault' },
}

export const viewport: Viewport = {
  themeColor: '#faf8f5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Create root redirect page**

`app/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/dashboard')
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```
Expected: server starts on http://localhost:3000, redirects to /dashboard (404 is fine at this stage).

- [ ] **Step 9: Commit**

```bash
git init && git add -A
git commit -m "feat: scaffold Next.js project with shadcn/ui and warm palette"
```

---

## Task 2: PWA Configuration

**Files:**
- Create: `next.config.js`, `public/manifest.json`, `public/icons/` (two PNGs)

- [ ] **Step 1: Configure next-pwa**

`next.config.js`:

```js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = withPWA(nextConfig)
```

- [ ] **Step 2: Create web manifest**

`public/manifest.json`:

```json
{
  "name": "Vehicle Vault",
  "short_name": "VehicleVault",
  "description": "Track your vehicle document expiries",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#faf8f5",
  "theme_color": "#faf8f5",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 3: Generate icons**

Create `public/icons/` directory. Use any image editor or online tool to produce:
- `icon-192.png` — 192×192px, car/shield icon on `#2d2d2d` background
- `icon-512.png` — 512×512px, same design

A quick placeholder via ImageMagick if available:

```bash
mkdir -p public/icons
# If ImageMagick is installed:
convert -size 192x192 xc:#2d2d2d -fill white -font DejaVu-Sans-Bold \
  -pointsize 80 -gravity center -annotate 0 "VV" public/icons/icon-192.png
convert -size 512x512 xc:#2d2d2d -fill white -font DejaVu-Sans-Bold \
  -pointsize 200 -gravity center -annotate 0 "VV" public/icons/icon-512.png
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest and next-pwa config"
```

---

## Task 3: Supabase Project & Database Schema

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Create: `supabase/migrations/002_rls.sql`
- Create: `supabase/seed/preset_links.sql`
- Create: `.env.local`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New Project. Note down:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key → `SUPABASE_SERVICE_ROLE_KEY` (for Edge Function only)

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:your@email.com
```

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```
Copy the output into `.env.local`.

- [ ] **Step 2: Write schema migration**

`supabase/migrations/001_schema.sql`:

```sql
-- updated_at trigger function (reused across all tables)
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- vehicles
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  plate text not null,
  icon text not null default '🚗',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger vehicles_updated_at before update on vehicles
  for each row execute function set_updated_at();

-- documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'insurance','licence','emission','fuel_pass','roadworthy','custom'
  )),
  label text,
  expires_at date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger documents_updated_at before update on documents
  for each row execute function set_updated_at();

-- document_links
create table document_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  label text not null,
  url text not null,
  is_preset boolean not null default false
);

-- push_subscriptions
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  device_id uuid not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique(user_id, device_id)
);

-- notification_log
create table notification_log (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  threshold_days int not null check (threshold_days in (1,7,14,30)),
  expires_at_snapshot date not null,
  sent_at timestamptz not null default now(),
  unique(document_id, threshold_days, expires_at_snapshot)
);
```

- [ ] **Step 3: Write RLS migration**

`supabase/migrations/002_rls.sql`:

```sql
-- vehicles
alter table vehicles enable row level security;
create policy "users own vehicles"
  on vehicles for all using (auth.uid() = user_id);

-- documents
alter table documents enable row level security;
create policy "users own documents"
  on documents for all using (auth.uid() = user_id);

-- document_links (join through documents)
alter table document_links enable row level security;
create policy "users own document_links"
  on document_links for all using (
    exists (
      select 1 from documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

-- push_subscriptions
alter table push_subscriptions enable row level security;
create policy "users own push_subscriptions"
  on push_subscriptions for all using (auth.uid() = user_id);

-- notification_log — service role only (Edge Function uses service key)
alter table notification_log enable row level security;
-- no user-facing policy; access via service role key in Edge Function
```

- [ ] **Step 4: Write preset links seed**

`supabase/seed/preset_links.sql` — this SQL is called from application code (not a Supabase seed file) as a helper function that inserts default links when a document is first created:

```sql
-- Helper function: insert preset links for a newly created document
create or replace function insert_preset_links(doc_id uuid, doc_type text)
returns void language plpgsql security definer as $$
begin
  case doc_type
    when 'insurance' then
      insert into document_links(document_id, label, url, is_preset) values
        (doc_id, 'Check insurance status', 'https://www.insurance.lk', true);
    when 'licence' then
      insert into document_links(document_id, label, url, is_preset) values
        (doc_id, 'Revenue Licence Portal', 'https://www.motortraffic.gov.lk', true);
    when 'emission' then
      insert into document_links(document_id, label, url, is_preset) values
        (doc_id, 'VE Test Portal', 'https://emissiontest.gov.lk', true);
    when 'fuel_pass' then
      insert into document_links(document_id, label, url, is_preset) values
        (doc_id, 'Fuel Pass Portal', 'https://fuelpass.gov.lk', true);
    when 'roadworthy' then
      insert into document_links(document_id, label, url, is_preset) values
        (doc_id, 'Roadworthy Certificate', 'https://www.motortraffic.gov.lk', true);
    else null;
  end case;
end;
$$;
```

- [ ] **Step 5: Apply migrations to Supabase**

Option A — Supabase CLI:
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Option B — Supabase Dashboard SQL editor: paste and run `001_schema.sql`, then `002_rls.sql`, then the `insert_preset_links` function from the seed file.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema, RLS policies, and preset links function"
```

---

## Task 4: Supabase Client & Auth Helpers

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`
- Create: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Write browser Supabase client**

`lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Write server Supabase client**

`lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 3: Write auth middleware**

`middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
}
```

- [ ] **Step 4: Build login page**

`app/(auth)/login/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/dashboard` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🚗</div>
          <CardTitle>Vehicle Vault</CardTitle>
          <CardDescription>Enter your email to sign in or create an account</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-center text-muted-foreground">
              Check your email — we sent you a magic link.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" type="email" required placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send magic link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
```

- [ ] **Step 5: Verify auth flow**

```bash
npm run dev
```
Navigate to http://localhost:3000 — should redirect to /login. Enter your email, check inbox for magic link, click it, confirm you land on /dashboard (404 is fine).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Supabase auth clients, middleware, and login page"
```

---

## Task 5: Expiry Utility + Tests

**Files:**
- Create: `lib/expiry.ts`
- Create: `__tests__/expiry.test.ts`

- [ ] **Step 1: Write failing tests**

`__tests__/expiry.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getExpiryStatus, daysUntil } from '@/lib/expiry'

describe('daysUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06'))
  })

  it('returns positive days for future date', () => {
    expect(daysUntil('2026-07-06')).toBe(30)
  })

  it('returns 0 for today', () => {
    expect(daysUntil('2026-06-06')).toBe(0)
  })

  it('returns negative for past date', () => {
    expect(daysUntil('2026-06-01')).toBe(-5)
  })
})

describe('getExpiryStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06'))
  })

  it('returns expired for past date', () => {
    expect(getExpiryStatus('2026-06-05')).toBe('expired')
  })

  it('returns danger for ≤7 days', () => {
    expect(getExpiryStatus('2026-06-13')).toBe('danger')
  })

  it('returns warn for 8–30 days', () => {
    expect(getExpiryStatus('2026-06-20')).toBe('warn')
  })

  it('returns ok for >30 days', () => {
    expect(getExpiryStatus('2026-07-10')).toBe('ok')
  })
})
```

- [ ] **Step 2: Run tests — confirm failure**

```bash
npm run test:run -- __tests__/expiry.test.ts
```
Expected: FAIL — `getExpiryStatus` not found.

- [ ] **Step 3: Implement expiry utility**

`lib/expiry.ts`:

```ts
export type ExpiryStatus = 'ok' | 'warn' | 'danger' | 'expired'

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getExpiryStatus(dateStr: string): ExpiryStatus {
  const days = daysUntil(dateStr)
  if (days < 0) return 'expired'
  if (days <= 7) return 'danger'
  if (days <= 30) return 'warn'
  return 'ok'
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npm run test:run -- __tests__/expiry.test.ts
```
Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/expiry.ts __tests__/expiry.test.ts
git commit -m "feat: add expiry status utility with tests"
```

---

## Task 6: Data Query Helpers

**Files:**
- Create: `lib/vehicles.ts`
- Create: `lib/documents.ts`
- Create: `lib/links.ts`

- [ ] **Step 1: Write vehicles helpers**

`lib/vehicles.ts`:

```ts
import { createClient } from '@/lib/supabase/server'

export type Vehicle = {
  id: string
  name: string
  plate: string
  icon: string
  user_id: string
}

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createVehicle(input: { name: string; plate: string; icon: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('vehicles').insert({ ...input, user_id: user!.id })
  if (error) throw error
}

export async function updateVehicle(id: string, input: Partial<{ name: string; plate: string; icon: string }>) {
  const supabase = createClient()
  const { error } = await supabase.from('vehicles').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteVehicle(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 2: Write documents helpers**

`lib/documents.ts`:

```ts
import { createClient } from '@/lib/supabase/server'

export type DocumentType = 'insurance' | 'licence' | 'emission' | 'fuel_pass' | 'roadworthy' | 'custom'

export type VehicleDocument = {
  id: string
  vehicle_id: string | null
  user_id: string
  type: DocumentType
  label: string | null
  expires_at: string
  notes: string | null
}

export async function getDocuments(vehicleId: string): Promise<VehicleDocument[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('expires_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getUserDocuments(): Promise<VehicleDocument[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .is('vehicle_id', null)
    .order('expires_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getDocument(id: string): Promise<VehicleDocument> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('documents').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createDocument(input: {
  vehicle_id?: string | null
  type: DocumentType
  label?: string
  expires_at: string
  notes?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('documents')
    .insert({ ...input, user_id: user!.id })
    .select('id')
    .single()
  if (error) throw error

  // Insert preset links via DB function
  await supabase.rpc('insert_preset_links', {
    doc_id: data.id,
    doc_type: input.type,
  })

  return data.id
}

export async function updateDocument(id: string, input: Partial<{
  type: DocumentType; label: string; expires_at: string; notes: string
}>) {
  const supabase = createClient()
  const { error } = await supabase.from('documents').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteDocument(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 3: Write links helpers**

`lib/links.ts`:

```ts
import { createClient } from '@/lib/supabase/server'

export type DocumentLink = {
  id: string
  document_id: string
  label: string
  url: string
  is_preset: boolean
}

export async function getLinks(documentId: string): Promise<DocumentLink[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('document_links')
    .select('*')
    .eq('document_id', documentId)
    .order('is_preset', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertLink(input: Partial<DocumentLink> & { document_id: string; label: string; url: string }) {
  const supabase = createClient()
  const { error } = await supabase.from('document_links').upsert(input)
  if (error) throw error
}

export async function deleteLink(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('document_links').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/
git commit -m "feat: add data query helpers for vehicles, documents, and links"
```

---

## Task 7: Shared UI Components

**Files:**
- Create: `components/status-pill.tsx`
- Create: `components/alert-banner.tsx`
- Create: `components/vehicle-card.tsx`
- Create: `components/document-card.tsx`

- [ ] **Step 1: StatusPill component**

`components/status-pill.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { getExpiryStatus, daysUntil } from '@/lib/expiry'

const styles = {
  ok:      'bg-green-50 text-green-800 border border-green-200',
  warn:    'bg-amber-50 text-amber-800 border border-amber-200',
  danger:  'bg-red-50 text-red-800 border border-red-200',
  expired: 'bg-red-100 text-red-900 border border-red-300',
}

const labels = {
  ok:      (days: number) => `${days}d`,
  warn:    (days: number) => `${days}d`,
  danger:  (days: number) => days <= 0 ? 'Today' : `${days}d`,
  expired: () => 'Expired',
}

export function StatusPill({ expiresAt }: { expiresAt: string }) {
  const status = getExpiryStatus(expiresAt)
  const days = daysUntil(expiresAt)
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', styles[status])}>
      {labels[status](days)}
    </span>
  )
}
```

- [ ] **Step 2: AlertBanner component**

`components/alert-banner.tsx`:

```tsx
import { getExpiryStatus, daysUntil } from '@/lib/expiry'
import type { VehicleDocument } from '@/lib/documents'

export function AlertBanner({ documents }: { documents: VehicleDocument[] }) {
  const urgent = documents.filter(d => {
    const s = getExpiryStatus(d.expires_at)
    return s === 'danger' || s === 'expired' || s === 'warn'
  }).sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())

  if (urgent.length === 0) return null

  return (
    <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-700 mb-1.5">
        ⚠ {urgent.length} item{urgent.length > 1 ? 's' : ''} need attention
      </p>
      <ul className="space-y-0.5">
        {urgent.slice(0, 3).map(d => (
          <li key={d.id} className="text-xs text-amber-600">
            · {d.label ?? d.type} — {daysUntil(d.expires_at) <= 0 ? 'expired' : `${daysUntil(d.expires_at)} days`}
          </li>
        ))}
        {urgent.length > 3 && (
          <li className="text-xs text-amber-500">+ {urgent.length - 3} more</li>
        )}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: VehicleCard component**

`components/vehicle-card.tsx`:

```tsx
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { StatusPill } from './status-pill'
import { getExpiryStatus } from '@/lib/expiry'
import type { Vehicle } from '@/lib/vehicles'
import type { VehicleDocument } from '@/lib/documents'

const DOC_TYPE_LABELS: Record<string, string> = {
  insurance: 'Insurance',
  licence: 'Licence',
  emission: 'Emission',
  fuel_pass: 'Fuel Pass',
  roadworthy: 'Roadworthy',
  custom: 'Custom',
}

export function VehicleCard({ vehicle, documents }: { vehicle: Vehicle; documents: VehicleDocument[] }) {
  const hasUrgent = documents.some(d => ['danger','expired','warn'].includes(getExpiryStatus(d.expires_at)))

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="block">
      <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
        <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
          {vehicle.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{vehicle.name}</p>
          <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
          {documents.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {documents.map(d => (
                <div key={d.id} className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[d.type] ?? d.label}</span>
                  <StatusPill expiresAt={d.expires_at} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No documents yet</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: DocumentCard component**

`components/document-card.tsx`:

```tsx
import Link from 'next/link'
import { ExternalLink, Pencil } from 'lucide-react'
import { StatusPill } from './status-pill'
import { Button } from '@/components/ui/button'
import type { VehicleDocument } from '@/lib/documents'
import type { DocumentLink } from '@/lib/links'

const ICONS: Record<string, string> = {
  insurance: '🛡', licence: '📄', emission: '💨',
  fuel_pass: '⛽', roadworthy: '🔧', custom: '📌',
}

export function DocumentCard({
  document,
  links,
}: {
  document: VehicleDocument
  links: DocumentLink[]
}) {
  const label = document.label ?? document.type.replace('_', ' ')

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">
            {ICONS[document.type] ?? '📌'} {label.charAt(0).toUpperCase() + label.slice(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Expires {new Date(document.expires_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
          </p>
          {document.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{document.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusPill expiresAt={document.expires_at} />
          <Link href={`/documents/${document.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {links.map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 hover:bg-amber-100 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/
git commit -m "feat: add StatusPill, AlertBanner, VehicleCard, DocumentCard components"
```

---

## Task 8: App Layout & Dashboard

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Build authenticated app layout**

`app/(app)/layout.tsx`:

```tsx
import Link from 'next/link'
import { Home, Settings } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <main className="flex-1 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-border flex">
        <Link href="/dashboard" className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Home className="w-5 h-5" />
          Home
        </Link>
        <Link href="/settings" className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: Build dashboard page**

`app/(app)/dashboard/page.tsx`:

```tsx
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getVehicles } from '@/lib/vehicles'
import { getDocuments, getUserDocuments } from '@/lib/documents'
import { VehicleCard } from '@/components/vehicle-card'
import { AlertBanner } from '@/components/alert-banner'
import { DocumentCard } from '@/components/document-card'
import { getLinks } from '@/lib/links'

export default async function DashboardPage() {
  const vehicles = await getVehicles()

  const vehiclesWithDocs = await Promise.all(
    vehicles.map(async v => ({
      vehicle: v,
      documents: await getDocuments(v.id),
    }))
  )

  const allDocs = vehiclesWithDocs.flatMap(v => v.documents)
  const userDocs = await getUserDocuments()
  const allDocsForBanner = [...allDocs, ...userDocs]

  const userDocsWithLinks = await Promise.all(
    userDocs.map(async d => ({ document: d, links: await getLinks(d.id) }))
  )

  return (
    <div className="pt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">My Vehicles</h1>
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-base">👤</div>
      </div>

      {/* Alert banner */}
      <AlertBanner documents={allDocsForBanner} />

      {/* Vehicle list */}
      <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your vehicles</p>
      <div className="px-4 space-y-2.5">
        {vehiclesWithDocs.map(({ vehicle, documents }) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} documents={documents} />
        ))}
      </div>

      {/* Add vehicle */}
      <div className="px-4 mt-3">
        <Link href="/vehicles/new">
          <button className="w-full border-2 border-dashed border-border rounded-2xl py-3 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-foreground/20 transition-colors">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </Link>
      </div>

      {/* User-level docs (driver's licence etc) */}
      {userDocsWithLinks.length > 0 && (
        <>
          <p className="px-4 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">My Documents</p>
          <div className="px-4 space-y-2.5">
            {userDocsWithLinks.map(({ document, links }) => (
              <DocumentCard key={document.id} document={document} links={links} />
            ))}
          </div>
        </>
      )}

      <div className="px-4 mt-3 mb-4">
        <Link href="/documents/new">
          <button className="w-full border-2 border-dashed border-border rounded-2xl py-3 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-foreground/20 transition-colors">
            <Plus className="w-4 h-4" /> Add Personal Document
          </button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify dashboard renders**

```bash
npm run dev
```
Sign in and confirm the dashboard page renders with your vehicles (empty state is fine).

- [ ] **Step 4: Commit**

```bash
git add app/
git commit -m "feat: add app shell layout and dashboard page"
```

---

## Task 9: Vehicle Forms (Add & Edit)

**Files:**
- Create: `components/vehicle-form.tsx`
- Create: `app/(app)/vehicles/new/page.tsx`
- Create: `app/(app)/vehicles/[id]/page.tsx`
- Create: `app/(app)/vehicles/[id]/edit/page.tsx`

- [ ] **Step 1: Build VehicleForm component**

`components/vehicle-form.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ICONS = ['🚗','🚙','🚐','🚕','🚌','🚎','🏎','🚑','🚒','🛻']

export function VehicleForm({
  initial,
  onSubmit,
}: {
  initial?: { name: string; plate: string; icon: string }
  onSubmit: (data: { name: string; plate: string; icon: string }) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [plate, setPlate] = useState(initial?.plate ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '🚗')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit({ name, plate, icon })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Icon</Label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(i => (
            <button
              key={i} type="button"
              onClick={() => setIcon(i)}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-colors ${
                icon === i ? 'bg-foreground text-background' : 'bg-secondary hover:bg-secondary/70'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="name">Vehicle Name</Label>
        <Input id="name" required placeholder="e.g. Toyota Prius" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="plate">Number Plate</Label>
        <Input id="plate" required placeholder="e.g. ABC 1234" value={plate} onChange={e => setPlate(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : 'Save Vehicle'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Add Vehicle page**

`app/(app)/vehicles/new/page.tsx`:

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { VehicleForm } from '@/components/vehicle-form'

export default function NewVehiclePage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(data: { name: string; plate: string; icon: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('vehicles').insert({ ...data, user_id: user!.id })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <h1 className="text-xl font-bold">Add Vehicle</h1>
      </div>
      <VehicleForm onSubmit={handleSubmit} />
    </div>
  )
}
```

- [ ] **Step 3: Vehicle Detail page**

`app/(app)/vehicles/[id]/page.tsx`:

```tsx
import Link from 'next/link'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import { getVehicle } from '@/lib/vehicles'
import { getDocuments } from '@/lib/documents'
import { getLinks } from '@/lib/links'
import { DocumentCard } from '@/components/document-card'
import { AlertBanner } from '@/components/alert-banner'

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = await getVehicle(params.id)
  const documents = await getDocuments(params.id)
  const docsWithLinks = await Promise.all(
    documents.map(async d => ({ document: d, links: await getLinks(d.id) }))
  )

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold leading-tight">{vehicle.name}</h1>
            <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
          </div>
        </div>
        <Link href={`/vehicles/${params.id}/edit`}>
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <Pencil className="w-4 h-4" />
          </button>
        </Link>
      </div>

      <AlertBanner documents={documents} />

      <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</p>
      <div className="px-4 space-y-2.5">
        {docsWithLinks.map(({ document, links }) => (
          <DocumentCard key={document.id} document={document} links={links} />
        ))}
      </div>

      <div className="px-4 mt-3">
        <Link href={`/documents/new?vehicleId=${params.id}`}>
          <button className="w-full border-2 border-dashed border-border rounded-2xl py-3 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Document
          </button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Edit Vehicle page**

`app/(app)/vehicles/[id]/edit/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VehicleForm } from '@/components/vehicle-form'
import { Button } from '@/components/ui/button'

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  const [vehicle, setVehicle] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('vehicles').select('*').eq('id', params.id).single()
      .then(({ data }) => setVehicle(data))
  }, [params.id])

  async function handleSubmit(data: { name: string; plate: string; icon: string }) {
    await supabase.from('vehicles').update(data).eq('id', params.id)
    router.push(`/vehicles/${params.id}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this vehicle and all its documents?')) return
    await supabase.from('vehicles').delete().eq('id', params.id)
    router.push('/dashboard')
    router.refresh()
  }

  if (!vehicle) return null

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/vehicles/${params.id}`}>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">Edit Vehicle</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <VehicleForm initial={vehicle} onSubmit={handleSubmit} />
    </div>
  )
}
```

- [ ] **Step 5: Test add/edit/delete vehicle flow manually**

```bash
npm run dev
```
- Add a new vehicle → confirm it appears on dashboard
- Edit the vehicle name → confirm update persists
- Delete the vehicle → confirm it's removed

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add vehicle CRUD pages (add, detail, edit, delete)"
```

---

## Task 10: Document Forms (Add & Edit)

**Files:**
- Create: `components/document-form.tsx`
- Create: `components/link-editor.tsx`
- Create: `app/(app)/documents/new/page.tsx`
- Create: `app/(app)/documents/[id]/edit/page.tsx`

- [ ] **Step 1: Build DocumentForm component**

`components/document-form.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { DocumentType } from '@/lib/documents'

const DOC_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: 'insurance',  label: 'Insurance',   icon: '🛡' },
  { value: 'licence',    label: 'Licence',      icon: '📄' },
  { value: 'emission',   label: 'Emission',     icon: '💨' },
  { value: 'fuel_pass',  label: 'Fuel Pass',    icon: '⛽' },
  { value: 'roadworthy', label: 'Roadworthy',   icon: '🔧' },
  { value: 'custom',     label: 'Custom',       icon: '📌' },
]

export function DocumentForm({
  initial,
  onSubmit,
}: {
  initial?: { type: DocumentType; label?: string; expires_at: string; notes?: string }
  onSubmit: (data: { type: DocumentType; label?: string; expires_at: string; notes?: string }) => Promise<void>
}) {
  const [type, setType] = useState<DocumentType>(initial?.type ?? 'insurance')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit({ type, label: label || undefined, expires_at: expiresAt, notes: notes || undefined })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {DOC_TYPES.map(t => (
            <button
              key={t.value} type="button" onClick={() => setType(t.value)}
              className={`rounded-xl p-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                type === t.value ? 'bg-foreground text-background' : 'bg-secondary hover:bg-secondary/70'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {type === 'custom' && (
        <div className="space-y-1">
          <Label htmlFor="label">Custom Name</Label>
          <Input id="label" required={type === 'custom'} placeholder="e.g. Road Tax" value={label} onChange={e => setLabel(e.target.value)} />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="expires">Expiry Date</Label>
        <Input id="expires" type="date" required value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea id="notes" rows={3} placeholder="Policy number, provider, etc." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : 'Save Document'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Build LinkEditor component**

`components/link-editor.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { DocumentLink } from '@/lib/links'

export function LinkEditor({ documentId, initial }: { documentId: string; initial: DocumentLink[] }) {
  const [links, setLinks] = useState(initial)
  const [addingLabel, setAddingLabel] = useState('')
  const [addingUrl, setAddingUrl] = useState('')
  const supabase = createClient()

  async function addLink() {
    if (!addingLabel || !addingUrl) return
    const { data } = await supabase.from('document_links')
      .insert({ document_id: documentId, label: addingLabel, url: addingUrl, is_preset: false })
      .select('*').single()
    if (data) setLinks(prev => [...prev, data])
    setAddingLabel('')
    setAddingUrl('')
  }

  async function removeLink(id: string) {
    await supabase.from('document_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Renewal Links</p>
      {links.map(link => (
        <div key={link.id} className="flex items-center gap-2 bg-secondary rounded-xl p-3">
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{link.label}</p>
            <p className="text-xs text-muted-foreground truncate">{link.url}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLink(link.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <div className="space-y-2">
        <Input placeholder="Link label (e.g. AIA Portal)" value={addingLabel} onChange={e => setAddingLabel(e.target.value)} />
        <Input placeholder="https://" type="url" value={addingUrl} onChange={e => setAddingUrl(e.target.value)} />
        <Button type="button" variant="outline" className="w-full" onClick={addLink}>
          <Plus className="w-4 h-4 mr-1" /> Add Link
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add Document page**

`app/(app)/documents/new/page.tsx`:

```tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DocumentForm } from '@/components/document-form'
import type { DocumentType } from '@/lib/documents'

export default function NewDocumentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get('vehicleId')
  const supabase = createClient()

  async function handleSubmit(data: { type: DocumentType; label?: string; expires_at: string; notes?: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: doc } = await supabase.from('documents')
      .insert({ ...data, vehicle_id: vehicleId ?? null, user_id: user!.id })
      .select('id').single()

    if (doc) {
      await supabase.rpc('insert_preset_links', { doc_id: doc.id, doc_type: data.type })
    }

    const back = vehicleId ? `/vehicles/${vehicleId}` : '/dashboard'
    router.push(back)
    router.refresh()
  }

  const backHref = vehicleId ? `/vehicles/${vehicleId}` : '/dashboard'

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href={backHref}>
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <h1 className="text-xl font-bold">Add Document</h1>
      </div>
      <DocumentForm onSubmit={handleSubmit} />
    </div>
  )
}
```

- [ ] **Step 4: Edit Document page**

`app/(app)/documents/[id]/edit/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DocumentForm } from '@/components/document-form'
import { LinkEditor } from '@/components/link-editor'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { DocumentType } from '@/lib/documents'
import type { DocumentLink } from '@/lib/links'

export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<any>(null)
  const [links, setLinks] = useState<DocumentLink[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('documents').select('*').eq('id', params.id).single()
      .then(({ data }) => setDoc(data))
    supabase.from('document_links').select('*').eq('document_id', params.id)
      .order('is_preset', { ascending: false })
      .then(({ data }) => setLinks(data ?? []))
  }, [params.id])

  async function handleSubmit(data: { type: DocumentType; label?: string; expires_at: string; notes?: string }) {
    await supabase.from('documents').update(data).eq('id', params.id)
    const back = doc?.vehicle_id ? `/vehicles/${doc.vehicle_id}` : '/dashboard'
    router.push(back)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this document?')) return
    await supabase.from('documents').delete().eq('id', params.id)
    const back = doc?.vehicle_id ? `/vehicles/${doc.vehicle_id}` : '/dashboard'
    router.push(back)
    router.refresh()
  }

  if (!doc) return null

  const backHref = doc.vehicle_id ? `/vehicles/${doc.vehicle_id}` : '/dashboard'

  return (
    <div className="px-4 pt-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={backHref}>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">Edit Document</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <DocumentForm initial={doc} onSubmit={handleSubmit} />
      <Separator className="my-6" />
      <LinkEditor documentId={params.id} initial={links} />
    </div>
  )
}
```

- [ ] **Step 5: Test document CRUD manually**

```bash
npm run dev
```
- Add a document to a vehicle → confirm preset links appear
- Edit the document → change expiry date
- Add a custom link → confirm it appears in DocumentCard
- Delete the document → confirm it's removed from vehicle detail

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add document CRUD pages with link editor"
```

---

## Task 11: Push Notifications

**Files:**
- Create: `app/api/push/subscribe/route.ts`
- Create: `components/push-prompt.tsx`
- Create: `lib/notifications.ts`
- Create: `supabase/functions/send-notifications/index.ts`

- [ ] **Step 1: Write push subscription API route**

`app/api/push/subscribe/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subscription, device_id, user_agent } = await req.json()
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    subscription,
    device_id,
    user_agent,
  }, { onConflict: 'user_id,device_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { device_id } = await req.json()
  await supabase.from('push_subscriptions')
    .delete().eq('user_id', user.id).eq('device_id', device_id)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Write notifications helper**

`lib/notifications.ts`:

```ts
'use client'

function getDeviceId(): string {
  let id = localStorage.getItem('vv_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('vv_device_id', id)
  }
  return id
}

export async function subscribeToPush(vapidPublicKey: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      device_id: getDeviceId(),
      user_agent: navigator.userAgent,
    }),
  })

  return true
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()

  await fetch('/api/push/subscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: getDeviceId() }),
  })
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
```

- [ ] **Step 3: Build PushPrompt component**

`components/push-prompt.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { subscribeToPush, isPushSubscribed } from '@/lib/notifications'

export function PushPrompt() {
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

  useEffect(() => {
    isPushSubscribed().then(setSubscribed)
  }, [])

  if (subscribed === null || subscribed === true) return null

  return (
    <div className="mx-4 mb-4 rounded-xl border border-border bg-secondary p-4 flex items-start gap-3">
      <Bell className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium">Enable notifications</p>
        <p className="text-xs text-muted-foreground mt-0.5">Get alerts when your documents are about to expire.</p>
      </div>
      <Button size="sm" onClick={async () => {
        const ok = await subscribeToPush(vapidKey)
        if (ok) setSubscribed(true)
      }}>
        Enable
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Add PushPrompt to dashboard**

In `app/(app)/dashboard/page.tsx`, add after the alert banner:

```tsx
import { PushPrompt } from '@/components/push-prompt'
// ...inside JSX, after <AlertBanner .../>:
<PushPrompt />
```

- [ ] **Step 5: Write Edge Function**

`supabase/functions/send-notifications/index.ts`:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_EMAIL')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

Deno.serve(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thresholds = [1, 7, 14, 30]

  for (const days of thresholds) {
    const target = new Date(today)
    target.setDate(target.getDate() + days)
    const targetStr = target.toISOString().split('T')[0]

    // Fetch documents expiring on exactly this threshold date
    const { data: docs } = await supabase
      .from('documents')
      .select('id, expires_at, user_id, type, label')
      .eq('expires_at', targetStr)

    if (!docs) continue

    for (const doc of docs) {
      // Check deduplication
      const { data: logged } = await supabase
        .from('notification_log')
        .select('id')
        .eq('document_id', doc.id)
        .eq('threshold_days', days)
        .eq('expires_at_snapshot', doc.expires_at)
        .single()

      if (logged) continue

      // Get push subscriptions for this user
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', doc.user_id)

      if (!subs) continue

      const label = doc.label ?? doc.type.replace('_', ' ')
      const body = `${label} expires in ${days} day${days > 1 ? 's' : ''}`

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({ title: 'Vehicle Vault', body })
          )
        } catch (err: any) {
          // Remove stale subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          }
        }
      }

      // Log successful dispatch
      await supabase.from('notification_log').insert({
        document_id: doc.id,
        threshold_days: days,
        expires_at_snapshot: doc.expires_at,
      })
    }
  }

  return new Response('ok')
})
```

- [ ] **Step 6: Deploy Edge Function & set up cron**

```bash
npx supabase functions deploy send-notifications
```

Set Edge Function secrets (these are server-side only — note `VAPID_PUBLIC_KEY` here, NOT the `NEXT_PUBLIC_` prefix used in Next.js):

```bash
npx supabase secrets set \
  VAPID_EMAIL="mailto:you@example.com" \
  VAPID_PUBLIC_KEY="your-vapid-public-key" \
  VAPID_PRIVATE_KEY="your-vapid-private-key"
```

Set up the daily cron via `pg_cron` (Supabase Dashboard → Database → Extensions → enable `pg_cron`, then run in the SQL editor):

```sql
select cron.schedule(
  'send-notifications-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Replace `current_setting` values with your actual project URL and service role key, or use Supabase's built-in `pg_net` + `vault` if you prefer not to hardcode secrets.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add push notification subscription, prompt UI, and Edge Function"
```

---

## Task 12: Settings Page

**Files:**
- Create: `app/(app)/settings/page.tsx`

- [ ] **Step 1: Build settings page**

`app/(app)/settings/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '@/lib/notifications'

export default function SettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    isPushSubscribed().then(setPushEnabled)
  }, [])

  async function togglePush() {
    if (pushEnabled) {
      await unsubscribeFromPush()
      setPushEnabled(false)
    } else {
      const ok = await subscribeToPush(vapidKey)
      if (ok) setPushEnabled(true)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <Button variant="outline" className="w-full" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get push alerts 30, 14, 7, and 1 day before a document expires.
          </p>
          <Button
            variant={pushEnabled ? 'outline' : 'default'}
            className="w-full"
            onClick={togglePush}
          >
            {pushEnabled ? 'Disable Notifications' : 'Enable Notifications'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Data</CardTitle></CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={async () => {
              if (!confirm('Delete your account and all data? This cannot be undone.')) return
              // Requires service-role key — handled via Supabase Auth admin API
              // For now, direct user to support
              alert('To delete your account, contact support.')
            }}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/settings/
git commit -m "feat: add settings page with push toggle and sign out"
```

---

## Task 13: Deploy to Vercel

**Files:**
- Create: `.gitignore` (ensure `.env.local` is excluded)
- Modify: `next.config.js` (confirm production PWA enabled)

- [ ] **Step 1: Verify .gitignore excludes secrets**

```bash
grep -E "\.env" .gitignore
```
Expected: `.env*.local` is listed. If not, add it:

```bash
echo ".env*.local" >> .gitignore
```

- [ ] **Step 2: Push to GitHub**

```bash
git add -A && git commit -m "chore: pre-deploy tidy"
gh repo create vehicle-vault --private --source=. --remote=origin --push
```

- [ ] **Step 3: Deploy on Vercel**

```bash
npx vercel --prod
```
Or via Vercel Dashboard: Import the GitHub repo.

Add all environment variables from `.env.local` in the Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`
- `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 4: Set Supabase redirect URL**

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/dashboard`

- [ ] **Step 5: Test on mobile**

1. Open the deployed URL on your phone
2. Add to Home Screen (iOS: Share → Add to Home Screen; Android: browser menu → Install)
3. Confirm standalone mode (no browser chrome)
4. Sign in, add a vehicle and documents, confirm everything works
5. Enable notifications, confirm permission prompt appears

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: production deployment config"
git push
```

---

## Done ✓

The app is live as an installable PWA with:
- Vehicle + document CRUD with expiry tracking
- One-tap renewal links per document
- In-app alert banner for urgent items
- Daily push notifications via Edge Function
- Cloud sync via Supabase with row-level security
