import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Toaster } from '@/components/ui/toaster'

interface LayoutProps {
  children?: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* Top Navigation */}
      <Topbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {children || <Outlet />}
      </main>

      <Toaster />
    </div>
  )
}
