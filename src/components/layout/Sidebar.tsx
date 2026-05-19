import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Hammer, 
  ClipboardList, 
  DollarSign, 
  Users as UsersIcon, 
  Truck,
  LogOut,
  User,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'

const menuCategories = [
  {
    title: 'Visão Geral',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Operacional',
    items: [
      { name: 'Estoque', path: '/estoque', icon: Package },
      { name: 'Produtos', path: '/produtos', icon: Hammer },
      { name: 'Ordens', path: '/ordens', icon: ClipboardList },
    ]
  },
  {
    title: 'Financeiro',
    items: [
      { name: 'Financeiro', path: '/financeiro', icon: DollarSign }
    ]
  },
  {
    title: 'Pessoas',
    items: [
      { name: 'Clientes', path: '/clientes', icon: UsersIcon },
      { name: 'Fornecedores', path: '/fornecedores', icon: Truck },
      { name: 'Usuários', path: '/usuarios', icon: UsersIcon, adminOnly: true }
    ]
  }
]

interface SidebarProps {
  onClose?: () => void
  className?: string
}

export function Sidebar({ onClose, className }: SidebarProps) {
  const { perfil, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'Visão Geral': true,
    'Operacional': true,
    'Financeiro': true,
    'Pessoas': true,
  })

  const toggleCategory = (title: string) => {
    setOpenCategories(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  return (
    <div className={cn("flex h-screen w-64 flex-col bg-zinc-950 border-r border-zinc-800", className)}>
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <Hammer className="h-6 w-6 text-amber-500 mr-2" />
        <span className="text-xl font-bold tracking-tight text-white">MovelaSystem</span>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {menuCategories.map((category) => {
          const visibleItems = category.items.filter(item => !item.adminOnly || perfil?.role === 'admin')
          
          if (visibleItems.length === 0) return null

          const isOpen = openCategories[category.title]
          
          return (
            <div key={category.title} className="space-y-1">
              <button
                onClick={() => toggleCategory(category.title)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
              >
                {category.title}
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              
              {isOpen && (
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive || (item.path !== '/' && location.pathname.startsWith(item.path))
                            ? 'bg-amber-500 text-white'
                            : 'text-zinc-400 hover:bg-zinc-900 hover:text-white ml-2 border-l border-zinc-800/50'
                        )
                      }
                    >
                      <item.icon className={cn("mr-3 h-4 w-4", location.pathname === item.path ? "text-white" : "text-zinc-500")} />
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-zinc-800 space-y-2">
        {perfil && (
          <NavLink 
            to="/perfil"
            onClick={onClose}
            className={({ isActive }) => 
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors border",
                isActive 
                  ? "bg-amber-500/10 border-amber-500/30" 
                  : "bg-zinc-900/50 border-transparent hover:bg-zinc-900"
              )
            }
          >
            <div className="bg-amber-500/10 p-2 rounded-full">
              <User className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate">{perfil.nome}</span>
              <div className="flex items-center mt-1">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] px-2 py-0 h-4 border-none",
                    perfil.role === 'admin' ? "bg-amber-500/20 text-amber-500" : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  {perfil.role === 'admin' ? 'Admin' : 'Operador'}
                </Badge>
              </div>
            </div>
            <Settings className="h-4 w-4 text-zinc-500 ml-auto" />
          </NavLink>
        )}

        <button 
          onClick={handleSignOut}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  )
}
