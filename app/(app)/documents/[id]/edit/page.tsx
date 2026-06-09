'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { use } from 'react'
import { ArrowLeft, Trash2, Paperclip, X, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DocumentForm } from '@/components/document-form'
import { LinkEditor } from '@/components/link-editor'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import type { DocumentType } from '@/lib/documents'
import type { DocumentLink } from '@/lib/links'

type SavedImage = { id: string; storage_path: string; url: string }
type AttachedFile = { file: File; preview: string | null }

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [doc, setDoc] = useState<any>(null)
  const [links, setLinks] = useState<DocumentLink[]>([])
  const [savedImages, setSavedImages] = useState<SavedImage[]>([])
  const [newFiles, setNewFiles] = useState<AttachedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('documents').select('*').eq('id', id).single()
      .then(({ data }) => setDoc(data))
    supabase.from('document_links').select('*').eq('document_id', id)
      .order('is_preset', { ascending: false })
      .then(({ data }) => setLinks(data ?? []))
    supabase.from('document_images').select('id, storage_path').eq('document_id', id)
      .order('created_at', { ascending: true })
      .then(async ({ data }) => {
        if (!data) return
        const withUrls = await Promise.all(data.map(async img => {
          const { data: urlData } = supabase.storage.from('document-images').getPublicUrl(img.storage_path)
          return { ...img, url: urlData.publicUrl }
        }))
        setSavedImages(withUrls)
      })
  }, [id])

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    const added: AttachedFile[] = picked.map(f => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }))
    setNewFiles(prev => [...prev, ...added])
    e.target.value = ''
  }

  function removeNewFile(i: number) {
    setNewFiles(prev => {
      if (prev[i].preview) URL.revokeObjectURL(prev[i].preview!)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  async function deleteSavedImage(img: SavedImage) {
    await supabase.storage.from('document-images').remove([img.storage_path])
    await supabase.from('document_images').delete().eq('id', img.id)
    setSavedImages(prev => prev.filter(i => i.id !== img.id))
  }

  async function uploadNewFiles() {
    if (newFiles.length === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    await Promise.all(newFiles.map(async ({ file }) => {
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${user!.id}/${id}/${crypto.randomUUID()}.${ext}`
      const { data: upload } = await supabase.storage.from('document-images').upload(path, file, { upsert: false })
      if (upload) {
        const { data: saved } = await supabase.from('document_images')
          .insert({ document_id: id, user_id: user!.id, storage_path: upload.path })
          .select('id, storage_path').single()
        if (saved) {
          const { data: urlData } = supabase.storage.from('document-images').getPublicUrl(saved.storage_path)
          setSavedImages(prev => [...prev, { ...saved, url: urlData.publicUrl }])
        }
      }
    }))
    setNewFiles([])
  }

  async function handleSubmit(data: { type: DocumentType; label?: string; expires_at: string; notes?: string }) {
    await supabase.from('documents').update(data).eq('id', id)
    await uploadNewFiles()
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
    <div className="px-4 pt-4 pb-10">
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

      <DocumentForm initial={doc} onSubmit={handleSubmit} hideSubmit formId="edit-doc-form" />

      <Separator className="my-6" />
      <LinkEditor documentId={id} initial={links} />

      <Separator className="my-6" />

      {/* Attachments */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground block">Attachments</Label>

        {(savedImages.length > 0 || newFiles.length > 0) && (
          <div className="flex gap-2 flex-wrap">
            {savedImages.map(img => (
              <div key={img.id} className="relative">
                <img src={img.url} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" />
                <button
                  type="button"
                  onClick={() => deleteSavedImage(img)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {newFiles.map((f, i) => (
              <div key={i} className="relative">
                {f.preview ? (
                  <img src={f.preview} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-dashed border-[#2d2d2d]" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-secondary border-2 border-dashed border-[#2d2d2d] flex flex-col items-center justify-center gap-1">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate w-16 text-center px-1">{f.file.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#2d2d2d] rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFiles} />
        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
          <Paperclip className="w-4 h-4 mr-1" /> Attach Photo or PDF
        </Button>
        <p className="text-xs text-muted-foreground">New files upload when you save. Saved images have a red ✕.</p>
      </div>

      {/* Single save button at the bottom */}
      <Button type="submit" form="edit-doc-form" size="lg" className="w-full h-12 text-base rounded-xl mt-8">
        Save Document
      </Button>
    </div>
  )
}
