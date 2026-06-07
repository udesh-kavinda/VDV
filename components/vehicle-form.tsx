'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ICONS = ['🚗','🚙','🚐','🚕','🚌','🚎','🏎','🚑','🚒','🛻']

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
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-colors ${
                icon === i ? 'bg-foreground text-background' : 'bg-secondary hover:bg-secondary/70'
              }`}
            >
              {i}
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
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : 'Save Vehicle'}
      </Button>
    </form>
  )
}
