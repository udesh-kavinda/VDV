'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ICONS = [
  '🚗','🚙','🛻','🚕','🏎','🚐',
  '🚌','🚎','🚑','🚒','🚓','🚚',
  '🚛','🚜','🏍','🛵','🚲','🛴',
  '✈️','🚤','⛵','🛥','🚁','🛺',
]

export function VehicleForm({
  initial,
  onSubmit,
}: {
  initial?: { name: string; plate: string; icon: string }
  onSubmit: (data: { name: string; plate: string; icon: string }) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [plate, setPlate] = useState(initial?.plate ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '🚗')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit({ name, plate, icon })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Icon</Label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(i => (
            <button
              key={i} type="button"
              onClick={() => setIcon(i)}
              className={`relative w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all duration-150 active:scale-90 ${
                icon === i
                  ? 'bg-[#2d2d2d] ring-2 ring-[#2d2d2d] ring-offset-2 scale-105 shadow-md'
                  : 'bg-secondary hover:bg-secondary/70'
              }`}
            >
              {i}
              {icon === i && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="name">Vehicle Name</Label>
        <Input id="name" required placeholder="e.g. Toyota Prius" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="plate">Number Plate</Label>
        <Input id="plate" required placeholder="e.g. ABC 1234" value={plate} onChange={e => setPlate(e.target.value)} />
      </div>
      <Button type="submit" size="lg" className="w-full h-12 text-base rounded-xl" disabled={loading}>
        {loading ? 'Saving…' : 'Save Vehicle'}
      </Button>
    </form>
  )
}
