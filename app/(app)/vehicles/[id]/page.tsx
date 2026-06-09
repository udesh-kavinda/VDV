import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import { getVehicle } from '@/lib/vehicles'
import { getDocuments } from '@/lib/documents'
import { getLinks } from '@/lib/links'
import { DocumentCard } from '@/components/document-card'
import { AlertBanner } from '@/components/alert-banner'

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let vehicle
  try {
    vehicle = await getVehicle(id)
  } catch {
    notFound()
  }
  const documents = await getDocuments(id)
  const docsWithLinks = await Promise.all(
    documents.map(async d => ({ document: d, links: await getLinks(d.id) }))
  )

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold leading-tight">{vehicle.name}</h1>
            <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/documents/new?vehicleId=${id}`}>
            <button className="w-8 h-8 rounded-full bg-[#2d2d2d] flex items-center justify-center active:scale-90 transition-transform">
              <Plus className="w-4 h-4 text-white" />
            </button>
          </Link>
          <Link href={`/vehicles/${id}/edit`}>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <AlertBanner documents={documents} />

      <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</p>
      <div className="px-4 space-y-2.5">
        {docsWithLinks.map(({ document, links }) => (
          <DocumentCard key={document.id} document={document} links={links} />
        ))}
      </div>

      <div className="pb-6" />
    </div>
  )
}
