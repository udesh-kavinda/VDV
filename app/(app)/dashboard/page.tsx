import { getVehicles } from '@/lib/vehicles'
import { Fab } from '@/components/fab'
import { getDocuments, getUserDocuments } from '@/lib/documents'
import { getLinks } from '@/lib/links'
import { VehicleCard } from '@/components/vehicle-card'
import { AlertBanner } from '@/components/alert-banner'
import { DocumentCard } from '@/components/document-card'
import { PushPrompt } from '@/components/push-prompt'

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
        <Fab />
      </div>

      {/* Alert banner */}
      <AlertBanner documents={allDocsForBanner} />
      <PushPrompt />

      {/* Vehicle list */}
      <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your vehicles</p>
      <div className="px-4 space-y-2.5">
        {vehiclesWithDocs.map(({ vehicle, documents }) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} documents={documents} />
        ))}
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

      <div className="pb-6" />
    </div>
  )
}
