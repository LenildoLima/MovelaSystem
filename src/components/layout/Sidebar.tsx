import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Hammer, 
  ClipboardList, 
  DollarSign, 
  Users, 
  Truck,
  LogOut,
  User 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Estoque', path: '/estoque', icon: Package },
  { name: 'Produtos', path: '/produtos', icon: Hammer },
  { name: 'Ordens', path: '/ordens', icon: ClipboardList },
  { name: 'Financeiro', path: '/financeiro', icon: DollarSign },
  { name: 'Clientes', path: '/clientes', icon: Users },
  { name: 'Fornecedores', path: '/fornecedores', icon: Truck },
]

export function Sidebar() {
  const { perfil, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-zinc-950 border-r border-zinc-800 fixed left-0 top-0">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <Hammer className="h-6 w-6 text-amber-500 mr-2" />
        <span className="text-xl font-bold tracking-tight text-white">MovelaSystem</span>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-500 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-4">
        {perfil && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/50">
            <div className="bg-amber-500/10 p-2 rounded-full">
              <User className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex flex-col min-w-0">
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
          </div>
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
