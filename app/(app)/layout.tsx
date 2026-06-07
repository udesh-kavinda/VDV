import Link from 'next/link'
import { Home, Settings } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <main className="flex-1 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-border flex">
        <Link href="/dashboard" className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Home className="w-5 h-5" />
          Home
        </Link>
        <Link href="/settings" className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </nav>
    </div>
  )
}
