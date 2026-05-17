import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Hammer } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface LayoutProps {
  children?: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white relative">
      {/* Top Bar (Mobile Only) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between z-40">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)} className="text-zinc-400">
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center ml-3">
            <Hammer className="h-5 w-5 text-amber-500 mr-2" />
            <span className="font-bold text-white tracking-tight">MovelaSystem</span>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile Only) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        onClose={() => setIsMenuOpen(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      />

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-6 lg:p-8 pt-24 lg:pt-8 min-w-0 transition-all duration-300",
        "lg:ml-64"
      )}>
        <div className="max-w-7xl mx-auto">
          {children || <Outlet />}
        </div>
      </main>

      <Toaster />
    </div>
  )
}
