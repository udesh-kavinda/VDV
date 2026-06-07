'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VehicleForm } from '@/components/vehicle-form'

export default function NewVehiclePage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(data: { name: string; plate: string; icon: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('vehicles').insert({ ...data, user_id: user!.id })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <h1 className="text-xl font-bold">Add Vehicle</h1>
      </div>
      <VehicleForm onSubmit={handleSubmit} />
    </div>
  )
}
