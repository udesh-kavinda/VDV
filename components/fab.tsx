'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Car, FileText } from 'lucide-react'

export function Fab() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [open])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <div ref={ref} className="relative">
      {/* + button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-8 h-8 rounded-full bg-[#2d2d2d] flex items-center justify-center transition-transform duration-200 active:scale-90 ${open ? 'rotate-45' : ''}`}
        aria-label="Add"
      >
        <Plus className="w-4 h-4 text-white" />
      </button>

      {/* Dropdown options */}
      <div
        className={`absolute right-0 top-10 flex flex-col gap-1.5 transition-all duration-150 z-50 ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <button
          onClick={() => go('/vehicles/new')}
          className="flex items-center gap-2 bg-[#2d2d2d] text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg whitespace-nowrap"
        >
          <Car className="w-3.5 h-3.5" />
          Add Vehicle
        </button>
        <button
          onClick={() => go('/documents/new')}
          className="flex items-center gap-2 bg-[#2d2d2d] text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg whitespace-nowrap"
        >
          <FileText className="w-3.5 h-3.5" />
          Add Document
        </button>
      </div>
    </div>
  )
}
