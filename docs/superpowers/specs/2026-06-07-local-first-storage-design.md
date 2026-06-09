# Local-First Storage + Document Image Upload — Design Spec

## Goal

Make Vehicle Vault work flawlessly offline, prioritising local data for all reads and writes, while syncing to Supabase in the background when internet is available. Add support for uploading multiple photos per document (e.g. front and back of a physical document).

---

## Architecture Overview

Three storage layers:

| Layer | Technology | Holds |
|---|---|---|
| Local structured data | Dexie.js (IndexedDB) | vehicles, documents, document_links, document_images metadata |
| Local binary data | IndexedDB (via Dexie) | image blobs |
| Cloud structured data | Supabase Postgres | vehicles, documents, document_links, document_images |
| Cloud binary data | Supabase Storage | image files (`document-images` bucket) |

Dexie is the **primary store**. Supabase is the **sync target and source of truth across devices**.

---

## Data Flow

### Writes (create / update / delete)
1. Write to Dexie immediately — UI updates with no network dependency.
2. Insert a record into the local `pending_sync` Dexie table (operation type, table name, record UUID, metadata only — **never blobs**).
3. A sync engine flushes the queue to Supabase whenever online.
4. On success, mark the pending_sync record as complete and delete it.
5. For images: blob is saved to Dexie `document_images.local_blob` immediately. The Supabase Storage upload and the `document_images` row insert happen together in the background sync flush — **the Supabase row is only written after the Storage upload succeeds**, since `storage_path` is required on the server.

### Reads (app load)
1. Read from Dexie via live query hooks → render immediately. No loading spinner for normal usage.
2. If online: pull latest from Supabase in the background. Merge into Dexie using `updated_at` (last-write-wins per record).
3. UI updates reactively via Dexie's `useLiveQuery` hook when Dexie data changes.

### Conflict Resolution
- **vehicles, documents:** Last-write-wins based on `updated_at` timestamp.
- **document_links:** Delete-and-replace strategy per `document_id` on sync (no `updated_at` column on this table). On push: delete all server-side links for the document, re-insert from local. On pull: replace local links for each document with server copy.
- **document_images:** Append-only. No conflict resolution needed — images are never edited, only added or deleted.

---

## Primary Key Strategy

All records use **client-side UUID primary keys** (`crypto.randomUUID()`). UUIDs are generated at creation time locally and used as the primary key in both Dexie and Supabase. This eliminates the id-reconciliation problem after sync and makes `pending_sync` tracking straightforward.

---

## Sync Engine

A singleton `SyncEngine` class (`lib/sync/engine.ts`) responsible for:

- **On first initialisation:** immediately trigger a full pull from Supabase (covers new device / fresh install where Dexie is empty). Sync status shows `'syncing'` during this window; the UI renders an empty state until the pull completes.
- Listening to `navigator.onLine` / `online` / `offline` events.
- On reconnect: run a full pull (Supabase → Dexie merge) then flush the pending queue.
- On each write: attempt an immediate flush if online; otherwise leave in queue.
- Exposing a reactive sync status: `'synced' | 'pending' | 'syncing' | 'error'`.

The engine is **not initialised in `app/(app)/layout.tsx`** (a server component). Instead, a new client wrapper `components/sync-provider.tsx` is imported into the layout and handles `useEffect`-based initialisation on the client.

---

## Dexie Schema (`lib/db.ts`)

Column names mirror the Supabase schema exactly.

```ts
// Dexie version().stores() syntax:
// &field = unique index, [a+b] = compound index, plain field = indexed, no prefix = not indexed
{
  vehicles:        '&id, user_id, updated_at',
  documents:       '&id, vehicle_id, user_id, updated_at',
  document_links:  '&id, document_id',           // no updated_at — delete-and-replace on sync
  document_images: '&id, document_id, synced',   // indexed on document_id for per-document queries
                                                 // local_blob stored but not indexed (Blob)
                                                 // storage_path = null until uploaded; synced = 0/1

  // Sync queue — local only, never pushed to Supabase as a table
  pending_sync:    '++pk, table_name, record_id, operation',
                   // record_id = UUID of the affected row; operation = insert|update|delete
                   // no blob payload — metadata only
}
```

All `id` fields are UUID strings generated client-side via `crypto.randomUUID()`.

---

## Supabase Changes

### New table: `document_images`
```sql
create table document_images (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  storage_path text not null,   -- only inserted after Storage upload succeeds
  created_at timestamptz default now()
);
alter table document_images enable row level security;

create policy "images_select" on document_images for select
  to authenticated using ((select auth.uid()) = user_id);

create policy "images_insert" on document_images for insert
  to authenticated with check ((select auth.uid()) = user_id);

create policy "images_delete" on document_images for delete
  to authenticated using ((select auth.uid()) = user_id);
```

### Add `updated_at` to `document_links`
```sql
alter table document_links add column updated_at timestamptz default now();
create trigger set_updated_at_document_links
  before update on document_links
  for each row execute procedure set_updated_at();
-- Uses the existing set_updated_at() function defined in 001_schema.sql (consistent with all other tables)
```
> Note: delete-and-replace is used for link sync despite this column; `updated_at` is added for consistency and future use.

### Storage bucket: `document-images`
Private bucket. Files stored at path: `{user_id}/{document_id}/{uuid}.jpg`

```sql
-- Storage RLS policies
create policy "images_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'document-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "images_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'document-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "images_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'document-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
```

---

## React Integration — Client Hooks

The existing `lib/vehicles.ts`, `lib/documents.ts`, `lib/links.ts` are **server-side helpers** (they import from `@/lib/supabase/server`) and are kept for use in the sync engine's push/pull logic. They are **not modified** for client-side use.

New client-side hooks backed by Dexie live queries replace direct Supabase calls in UI components:

```
lib/hooks/use-vehicles.ts       useLiveQuery → db.vehicles
lib/hooks/use-documents.ts      useLiveQuery → db.documents
lib/hooks/use-links.ts          useLiveQuery → db.document_links
lib/hooks/use-document-images.ts useLiveQuery → db.document_images
```

Mutations (create/update/delete) go through a thin write layer:

```
lib/local-writes.ts    All write operations: write to Dexie + enqueue pending_sync
```

---

## Image Upload UX

- In the document detail/edit view, a horizontal photo strip shows existing images as thumbnails.
- Tapping `+` opens the native file picker (`accept="image/*" capture` for camera on mobile).
- Images are compressed client-side before storing: max 1200px on the longest side, 80% JPEG quality, using `browser-image-compression` (handles iOS Safari PWA quirks that affect raw `canvas.toBlob()`).
- Multiple images displayed in a horizontal scroll strip.
- Tap an image to view full-screen. Delete button in full-screen view.
- While `synced = false`, a small amber dot overlays the thumbnail.

---

## Sync Status Indicator

A small dot in the bottom nav bar via `components/sync-indicator.tsx`:
- 🟢 Green — all data synced
- 🟡 Amber — pending local changes not yet synced
- 🔴 Red — sync error (tap to retry)
- No dot — offline with no pending changes

---

## New Files

```
lib/db.ts                              Dexie database schema and instance
lib/local-writes.ts                    All write operations (Dexie + enqueue)
lib/sync/engine.ts                     SyncEngine class
lib/sync/pull.ts                       Pull latest from Supabase → merge into Dexie
lib/sync/push.ts                       Flush pending_sync queue → Supabase
lib/sync/images.ts                     Upload local blobs → Supabase Storage
lib/sync/status.ts                     Reactive sync status (React context)
lib/hooks/use-vehicles.ts              Dexie live query hook
lib/hooks/use-documents.ts             Dexie live query hook
lib/hooks/use-links.ts                 Dexie live query hook
lib/hooks/use-document-images.ts       Dexie live query hook
components/sync-provider.tsx           Client wrapper — initialises SyncEngine
components/sync-indicator.tsx          Sync status dot in nav bar
components/image-strip.tsx             Horizontal image thumbnail strip
components/image-viewer.tsx            Full-screen image viewer
supabase/migrations/004_document_images.sql
```

---

## Modified Files

```
app/(app)/layout.tsx                   Import <SyncProvider /> (no 'use client' added to layout)
app/(app)/dashboard/page.tsx           Convert to client component; use useVehicles / useDocuments hooks
app/(app)/vehicles/[id]/page.tsx       Extract data-rendering into <VehicleDetailClient /> client child;
                                       parent page shell becomes a thin client component
app/(app)/documents/[id]/edit/page.tsx Switch to useDocuments/useLinks hooks (already a client component) + add image strip
app/(app)/documents/new/page.tsx       Use local-writes instead of direct Supabase insert
```

> **Server → client migration pattern:** Pages currently implemented as `async` server components (dashboard, vehicles detail) are converted to `'use client'` components that use `useLiveQuery`-backed hooks. Server-side rendering is not critical for this app — data is user-specific and cannot be meaningfully pre-rendered. The immediate Dexie render replaces the role that SSR previously served.

> **`document_images` has no UPDATE policy** — intentional. The table is append-only (insert, select, delete only). Implementers should not add an update policy.

---

## Out of Scope

- Image annotation or cropping beyond basic compression.
- Sharing documents or images with other users.
- Vehicle photos (document photos only, as agreed).
- Multi-user conflict resolution (single-user app).
