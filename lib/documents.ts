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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('expires_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getUserDocuments(): Promise<VehicleDocument[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .is('vehicle_id', null)
    .order('expires_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getDocument(id: string): Promise<VehicleDocument> {
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const supabase = await createClient()
  const { error } = await supabase.from('documents').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteDocument(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}
