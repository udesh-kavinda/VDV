'use client'
import { useState } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { DocumentLink } from '@/lib/links'

export function LinkEditor({ documentId, initial }: { documentId: string; initial: DocumentLink[] }) {
  const [links, setLinks] = useState(initial)
  const [addingLabel, setAddingLabel] = useState('')
  const [addingUrl, setAddingUrl] = useState('')
  const supabase = createClient()

  async function addLink() {
    if (!addingLabel || !addingUrl) return
    const { data } = await supabase.from('document_links')
      .insert({ document_id: documentId, label: addingLabel, url: addingUrl, is_preset: false })
      .select('*').single()
    if (data) setLinks(prev => [...prev, data])
    setAddingLabel('')
    setAddingUrl('')
  }

  async function removeLink(id: string) {
    await supabase.from('document_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Renewal Links</p>
      {links.map(link => (
        <div key={link.id} className="flex items-center gap-2 bg-secondary rounded-xl p-3">
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{link.label}</p>
            <p className="text-xs text-muted-foreground truncate">{link.url}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLink(link.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <div className="space-y-2">
        <Input placeholder="Link label (e.g. AIA Portal)" value={addingLabel} onChange={e => setAddingLabel(e.target.value)} />
        <Input placeholder="https://" type="url" value={addingUrl} onChange={e => setAddingUrl(e.target.value)} />
        <Button type="button" variant="outline" className="w-full" onClick={addLink}>
          <Plus className="w-4 h-4 mr-1" /> Add Link
        </Button>
      </div>
    </div>
  )
}
