'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VehicleForm } from '@/components/vehicle-form'
import { Button } from '@/components/ui/button'

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [vehicle, setVehicle] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('vehicles').select('*').eq('id', id).single()
      .then(({ data }) => setVehicle(data))
  }, [id])

  async function handleSubmit(data: { name: string; plate: string; icon: string }) {
    await supabase.from('vehicles').update(data).eq('id', id)
    router.push(`/vehicles/${id}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this vehicle and all its documents?')) return
    await supabase.from('vehicles').delete().eq('id', id)
    router.push('/dashboard')
    router.refresh()
  }

  if (!vehicle) return null

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/vehicles/${id}`}>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">Edit Vehicle</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <VehicleForm initial={vehicle} onSubmit={handleSubmit} />
    </div>
  )
}
