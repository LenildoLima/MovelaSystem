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
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'

const menuCategories = [
  {
    title: 'Operacional',
    icon: Package,
    items: [
      { name: 'Estoque', path: '/estoque', icon: Package },
      { name: 'Produtos', path: '/produtos', icon: Hammer },
      { name: 'Ordens', path: '/ordens', icon: ClipboardList },
    ]
  },
  {
    title: 'Financeiro',
    icon: DollarSign,
    items: [
      { name: 'Financeiro', path: '/financeiro', icon: DollarSign }
    ]
  },
  {
    title: 'Pessoas',
    icon: UsersIcon,
    items: [
      { name: 'Clientes', path: '/clientes', icon: UsersIcon },
      { name: 'Fornecedores', path: '/fornecedores', icon: Truck },
      { name: 'Usuários', path: '/usuarios', icon: UsersIcon, adminOnly: true },
      { name: 'Meu Perfil', path: '/perfil', icon: User }
    ]
  }
]

export function Topbar() {
  const { perfil, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-[1600px] mx-auto">
        
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <Hammer className="h-6 w-6 text-amber-500 mr-2" />
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">MovelaSystem</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 ml-6 flex-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) => cn(
              "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
              isActive ? "text-amber-500 bg-amber-500/10" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </NavLink>

          {menuCategories.map(category => {
            const visibleItems = category.items.filter(item => !item.adminOnly || perfil?.role === 'admin')
            if (visibleItems.length === 0) return null

            return (
              <div key={category.title} className="relative group">
                <button className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
                  {category.icon && <category.icon className="mr-2 h-4 w-4" />}
                  {category.title}
                  <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                </button>
                <div className="absolute left-0 mt-1 w-56 rounded-md bg-zinc-900 border border-zinc-800 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1">
                  {visibleItems.map(item => {
                    const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center px-4 py-2.5 text-sm transition-colors",
                          isActive ? "bg-amber-500/10 text-amber-500" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        )}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Desktop Profile & Logout */}
        <div className="hidden lg:flex items-center pl-4 ml-auto">
          {perfil && (
            <div className="flex items-center gap-3 pl-3 pr-1 py-1.5">
              <div className="bg-amber-500/10 p-1.5 rounded-full flex-shrink-0">
                <User className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex flex-col min-w-0 max-w-[150px]">
                <span className="text-sm font-semibold text-white truncate leading-tight">{perfil.nome}</span>
                <div className="flex items-center mt-0.5">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[9px] px-1.5 py-0 h-4 border-none uppercase rounded",
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
            title="Sair do sistema"
            className="flex items-center justify-center p-1.5 ml-1 rounded-md text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden ml-auto">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-zinc-950 border-b border-zinc-800 shadow-2xl animate-in slide-in-from-top-2">
          <div className="px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto">
            
            <div className="space-y-1">
              <NavLink
                to="/"
                end
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-amber-500 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                )}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Dashboard
              </NavLink>
            </div>

            {menuCategories.map(category => {
              const visibleItems = category.items.filter(item => !item.adminOnly || perfil?.role === 'admin')
              if (visibleItems.length === 0) return null

              return (
                <div key={category.title} className="space-y-1">
                  <span className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center">
                    {category.icon && <category.icon className="mr-2 h-4 w-4" />}
                    {category.title}
                  </span>
                  <div className="space-y-1 mt-1">
                    {visibleItems.map(item => {
                      const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive ? "bg-amber-500 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                          )}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className="border-t border-zinc-800 pt-4 mt-2 space-y-2">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
