-- vehicles
alter table vehicles enable row level security;

create policy "vehicles_select" on vehicles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "vehicles_insert" on vehicles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "vehicles_update" on vehicles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "vehicles_delete" on vehicles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- documents
alter table documents enable row level security;

create policy "documents_select" on documents
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "documents_insert" on documents
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "documents_update" on documents
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "documents_delete" on documents
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- document_links (join through documents for ownership check)
alter table document_links enable row level security;

create policy "document_links_select" on document_links
  for select to authenticated
  using (
    exists (
      select 1 from documents d
      where d.id = document_id and d.user_id = (select auth.uid())
    )
  );

create policy "document_links_insert" on document_links
  for insert to authenticated
  with check (
    exists (
      select 1 from documents d
      where d.id = document_id and d.user_id = (select auth.uid())
    )
  );

create policy "document_links_update" on document_links
  for update to authenticated
  using (
    exists (
      select 1 from documents d
      where d.id = document_id and d.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from documents d
      where d.id = document_id and d.user_id = (select auth.uid())
    )
  );

create policy "document_links_delete" on document_links
  for delete to authenticated
  using (
    exists (
      select 1 from documents d
      where d.id = document_id and d.user_id = (select auth.uid())
    )
  );

-- push_subscriptions
alter table push_subscriptions enable row level security;

create policy "push_subscriptions_select" on push_subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "push_subscriptions_insert" on push_subscriptions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_update" on push_subscriptions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_delete" on push_subscriptions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- notification_log — service role only (no user-facing policies)
alter table notification_log enable row level security;
-- Intentionally no policies: only accessible via service_role key in Edge Function
