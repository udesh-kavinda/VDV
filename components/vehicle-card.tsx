import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { StatusPill } from './status-pill'
import type { Vehicle } from '@/lib/vehicles'
import type { VehicleDocument } from '@/lib/documents'

const DOC_TYPE_LABELS: Record<string, string> = {
  insurance: 'Insurance',
  licence: 'Licence',
  emission: 'Emission',
  fuel_pass: 'Fuel Pass',
  roadworthy: 'Roadworthy',
  custom: 'Custom',
}

export function VehicleCard({ vehicle, documents }: { vehicle: Vehicle; documents: VehicleDocument[] }) {
  return (
    <Link href={`/vehicles/${vehicle.id}`} className="block">
      <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
        <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
          {vehicle.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{vehicle.name}</p>
          <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
          {documents.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {documents.map(d => (
                <div key={d.id} className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[d.type] ?? d.label}</span>
                  <StatusPill expiresAt={d.expires_at} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No documents yet</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  )
}
