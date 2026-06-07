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
