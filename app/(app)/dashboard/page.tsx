import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getVehicles } from '@/lib/vehicles'
import { getDocuments, getUserDocuments } from '@/lib/documents'
import { getLinks } from '@/lib/links'
import { VehicleCard } from '@/components/vehicle-card'
import { AlertBanner } from '@/components/alert-banner'
import { DocumentCard } from '@/components/document-card'

export default async function DashboardPage() {
  const vehicles = await getVehicles()

  const vehiclesWithDocs = await Promise.all(
    vehicles.map(async v => ({
      vehicle: v,
      documents: await getDocuments(v.id),
    }))
  )

  const allDocs = vehiclesWithDocs.flatMap(v => v.documents)
  const userDocs = await getUserDocuments()
  const allDocsForBanner = [...allDocs, ...userDocs]

  const userDocsWithLinks = await Promise.all(
    userDocs.map(async d => ({ document: d, links: await getLinks(d.id) }))
  )

  return (
    <div className="pt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">My Vehicles</h1>
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-base">👤</div>
      </div>

      {/* Alert banner */}
      <AlertBanner documents={allDocsForBanner} />

      {/* Vehicle list */}
      <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your vehicles</p>
      <div className="px-4 space-y-2.5">
        {vehiclesWithDocs.map(({ vehicle, documents }) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} documents={documents} />
        ))}
      </div>

      {/* Add vehicle */}
      <div className="px-4 mt-3">
        <Link href="/vehicles/new">
          <button className="w-full border-2 border-dashed border-border rounded-2xl py-3 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-foreground/20 transition-colors">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </Link>
      </div>

      {/* User-level docs (driver's licence etc) */}
      {userDocsWithLinks.length > 0 && (
        <>
          <p className="px-4 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">My Documents</p>
          <div className="px-4 space-y-2.5">
            {userDocsWithLinks.map(({ document, links }) => (
              <DocumentCard key={document.id} document={document} links={links} />
            ))}
          </div>
        </>
      )}

      <div className="px-4 mt-3 mb-4">
        <Link href="/documents/new">
          <button className="w-full border-2 border-dashed border-border rounded-2xl py-3 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-foreground/20 transition-colors">
            <Plus className="w-4 h-4" /> Add Personal Document
          </button>
        </Link>
      </div>
    </div>
  )
}
