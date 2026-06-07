'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DocumentForm } from '@/components/document-form'
import type { DocumentType } from '@/lib/documents'

function NewDocumentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get('vehicleId')
  const supabase = createClient()

  async function handleSubmit(data: { type: DocumentType; label?: string; expires_at: string; notes?: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: doc } = await supabase.from('documents')
      .insert({ ...data, vehicle_id: vehicleId ?? null, user_id: user!.id })
      .select('id').single()

    if (doc) {
      await supabase.rpc('insert_preset_links', { doc_id: doc.id, doc_type: data.type })
    }

    const back = vehicleId ? `/vehicles/${vehicleId}` : '/dashboard'
    router.push(back)
    router.refresh()
  }

  const backHref = vehicleId ? `/vehicles/${vehicleId}` : '/dashboard'

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href={backHref}>
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <h1 className="text-xl font-bold">Add Document</h1>
      </div>
      <DocumentForm onSubmit={handleSubmit} />
    </div>
  )
}

export default function NewDocumentPage() {
  return (
    <Suspense>
      <NewDocumentContent />
    </Suspense>
  )
}
