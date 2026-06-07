import { createClient } from '@/lib/supabase/server'

export type Vehicle = {
  id: string
  name: string
  plate: string
  icon: string
  user_id: string
}

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vehicles').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createVehicle(input: { name: string; plate: string; icon: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('vehicles').insert({ ...input, user_id: user!.id })
  if (error) throw error
}

export async function updateVehicle(id: string, input: Partial<{ name: string; plate: string; icon: string }>) {
  const supabase = await createClient()
  const { error } = await supabase.from('vehicles').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
}
