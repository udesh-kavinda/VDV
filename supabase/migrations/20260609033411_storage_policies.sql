-- Ensure the document-images bucket exists and is public
insert into storage.buckets (id, name, public)
values ('document-images', 'document-images', true)
on conflict (id) do update set public = true;

-- Allow authenticated users to upload their own files
create policy "storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'document-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Allow authenticated users to read their own files
create policy "storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'document-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Allow public (anonymous) read access for public bucket URLs
create policy "storage_public_select" on storage.objects
  for select to anon
  using (bucket_id = 'document-images');

-- Allow authenticated users to delete their own files
create policy "storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'document-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
