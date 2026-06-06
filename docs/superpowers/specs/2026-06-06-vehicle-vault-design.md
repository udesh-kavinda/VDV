# Vehicle Vault — Design Spec
**Date:** 2026-06-06

---

## 1. Overview

A PWA for tracking vehicle document expiries (insurance, licence, emission test, fuel pass, roadworthy, driver's licence, and custom types). Up to ~5 vehicles per user. Each document stores an expiry date, optional notes, and one or more links (preset official portals + custom URLs). Data syncs to the cloud via Supabase. Push notifications + in-app badges alert the user when documents are expiring soon.

---

## 2. Target Users & Context

- Personal / small family use (1–5 vehicles)
- Primary device: mobile (phone browser / installed PWA)
- Usage pattern: infrequent check-ins, urgent glance when a document is near expiry, quick tap-through to a renewal portal

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | PWA support, file-based routing, server components |
| UI components | shadcn/ui + Tailwind CSS | Clean, accessible, customisable |
| Auth | Supabase Auth | Email/password + magic link, free tier |
| Database | Supabase Postgres (via RLS) | Row-level security per user, real-time capable |
| PWA | `next-pwa` (Workbox) | Service worker, offline shell, installable |
| Push notifications | Web Push API via Supabase Edge Functions | Scheduled daily check → push if expiry within threshold |
| Hosting | Vercel | Zero-config Next.js deploy |

---

## 4. Data Model

### `vehicles`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | Supabase auth.users |
| name | text | e.g. "Toyota Prius" |
| plate | text | e.g. "ABC 1234" |
| icon | text | emoji or preset slug |
| created_at | timestamptz | |
| updated_at | timestamptz | updated via Postgres trigger |

### `documents`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vehicle_id | uuid FK | nullable — null for user-level docs (driver's licence) |
| user_id | uuid FK | for RLS |
| type | text | enum: insurance, licence, emission, fuel_pass, roadworthy, custom |
| label | text | custom name (used when type = custom) |
| expires_at | date | calendar date; threshold checks compare against date at midnight UTC |
| notes | text | optional |
| created_at | timestamptz | |
| updated_at | timestamptz | updated via Postgres trigger |

> **Driver's licence** is a user-level document (not tied to a specific vehicle). It is stored with `vehicle_id = null` and surfaced in a "My Documents" section on the dashboard alongside the vehicle list.

### `document_links`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| document_id | uuid FK | |
| label | text | e.g. "Renew on AIA Portal" |
| url | text | |
| is_preset | boolean | true = app-seeded default, false = user-added |

> **RLS:** `document_links` has no `user_id` column. RLS policy uses a join: `EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.user_id = auth.uid())`.
> **Preset links** are seeded per document `type` in a `seed/preset_links.sql` file (one row per type with a suggested label + URL placeholder). They are inserted when a document is created via a Postgres function, not a separate table. Users can edit or delete presets; `is_preset` is informational only.

### `push_subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| subscription | jsonb | Web Push subscription object |
| device_id | uuid | stable random id stored in localStorage on the client, used to identify rows in the /settings device list |
| user_agent | text | browser/device hint for display label |
| created_at | timestamptz | |

> Stale subscriptions: when the Edge Function receives a `410 Gone` or `404` response from the push service, it deletes that row automatically.

### `notification_log`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| document_id | uuid FK | |
| threshold_days | int | 30, 14, 7, or 1 |
| sent_at | timestamptz | |

> The Edge Function checks this table before sending. A notification for a given `(document_id, threshold_days)` pair is sent at most once **per expiry cycle** — the dedup key is `(document_id, threshold_days, expires_at_snapshot)` where `expires_at_snapshot` is copied from the document at send time. This way, if the user renews a document (updates `expires_at`), old log rows no longer suppress notifications for the new expiry date.


---

## 5. Screen Structure

```
/                   → redirect to /dashboard or /login
/login              → email + magic link auth
/dashboard          → home: alert banner + vehicle card list + "My Documents" (user-level docs)
/vehicles/new       → add vehicle form
/vehicles/[id]      → vehicle detail: all documents with status
/vehicles/[id]/edit → edit vehicle name/plate/icon (with delete vehicle action — cascades documents + links)
/documents/new?vehicleId=  → add document form (vehicleId omitted for user-level docs)
/documents/[id]/edit       → edit document (with delete document action)
/settings           → notification preferences (toggle each threshold: 30d/14d/7d/1d), manage push devices (list + remove), sign out, delete account
```

---

## 6. UI Design

**Style:** Warm neutral tones (off-white background `#faf8f5`, card white `#ffffff`, warm borders `#ede8e0`). No harsh blacks — use `#2d2d2d` for headings. Accent: amber/warm orange for warnings (`#b45309`). shadcn/ui components restyled with this palette via CSS variables in `globals.css`.

**Layout:**
- **Dashboard:** Alert banner (amber, only shown when ≥1 doc expiring within 30 days) → "Your vehicles" section → vehicle cards → subtle dashed "+ Add Vehicle" button at bottom.
- **Vehicle card:** Vehicle icon (emoji) + name + plate + row of status pills (one per document type, colour-coded: green=valid, amber=<30 days, red=<7 days).
- **Vehicle detail:** Back nav → vehicle header → per-document cards showing type, expiry date, status pill, notes snippet, and tappable link chips.
- **Document card link:** Small amber pill button `↗ Renew on AIA Portal` — taps open URL in new tab.

**Status colours:**
- Green (`#ecfdf5` / `#166534`): > 30 days remaining
- Amber (`#fffbeb` / `#92400e`): 8–30 days remaining  
- Red (`#fef2f2` / `#991b1b`): ≤ 7 days or expired

---

## 7. Notifications

- On document add/edit: browser requests push permission.
- Supabase Edge Function runs daily (cron): queries all documents expiring within 30 days → sends Web Push to subscribed devices.
- In-app: dashboard alert banner computed client-side from fetched data — no extra infra needed.
- Notification thresholds: 30 days, 14 days, 7 days, 1 day.

---

## 8. Offline Behaviour

- Service worker caches the app shell (pages, assets) so the app loads offline.
- Data is fetched from Supabase on load; no offline write support in v1 (show a "you're offline" toast if Supabase is unreachable).

---

## 9. Out of Scope (v1)

- Document image/file uploads
- Sharing vehicles with other users
- Multiple user roles / fleet management
- Native app (iOS/Android) — PWA only
- SMS notifications

---

## 10. Success Criteria

- User can add a vehicle and all its document types in under 2 minutes
- Tapping a document link opens the correct renewal portal
- Push notification arrives the day a document crosses a threshold
- App installs to home screen on iOS Safari and Android Chrome
- All screens usable on a 375px wide phone without horizontal scroll
