'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DocumentForm } from '@/components/document-form'
import { LinkEditor } from '@/components/link-editor'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { DocumentType } from '@/lib/documents'
import type { DocumentLink } from '@/lib/links'

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [doc, setDoc] = useState<any>(null)
  const [links, setLinks] = useState<DocumentLink[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('documents').select('*').eq('id', id).single()
      .then(({ data }) => setDoc(data))
    supabase.from('document_links').select('*').eq('document_id', id)
      .order('is_preset', { ascending: false })
      .then(({ data }) => setLinks(data ?? []))
  }, [id])

  async function handleSubmit(data: { type: DocumentType; label?: string; expires_at: string; notes?: string }) {
    await supabase.from('documents').update(data).eq('id', id)
    const back = doc?.vehicle_id ? `/vehicles/${doc.vehicle_id}` : '/dashboard'
    router.push(back)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this document?')) return
    await supabase.from('documents').delete().eq('id', id)
    const back = doc?.vehicle_id ? `/vehicles/${doc.vehicle_id}` : '/dashboard'
    router.push(back)
    router.refresh()
  }

  if (!doc) return null

  const backHref = doc.vehicle_id ? `/vehicles/${doc.vehicle_id}` : '/dashboard'

  return (
    <div className="px-4 pt-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={backHref}>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">Edit Document</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <DocumentForm initial={doc} onSubmit={handleSubmit} />
      <Separator className="my-6" />
      <LinkEditor documentId={id} initial={links} />
    </div>
  )
}
