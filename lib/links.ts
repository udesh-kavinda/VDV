import { createClient } from '@/lib/supabase/server'

export type DocumentLink = {
  id: string
  document_id: string
  label: string
  url: string
  is_preset: boolean
}

export async function getLinks(documentId: string): Promise<DocumentLink[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('document_links')
    .select('*')
    .eq('document_id', documentId)
    .order('is_preset', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertLink(input: Partial<DocumentLink> & { document_id: string; label: string; url: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('document_links').upsert(input)
  if (error) throw error
}

export async function deleteLink(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('document_links').delete().eq('id', id)
  if (error) throw error
}
