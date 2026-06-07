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
