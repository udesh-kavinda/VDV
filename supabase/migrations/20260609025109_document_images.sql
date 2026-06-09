create table document_images (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now()
);

alter table document_images enable row level security;

create policy "images_select" on document_images for select
  to authenticated using ((select auth.uid()) = user_id);

create policy "images_insert" on document_images for insert
  to authenticated with check ((select auth.uid()) = user_id);

create policy "images_delete" on document_images for delete
  to authenticated using ((select auth.uid()) = user_id);
