import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout/Layout'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Pages
import { Dashboard } from './pages/Dashboard'
import { Estoque } from './pages/Estoque'
import { Produtos } from './pages/Produtos'
import { Ordens } from './pages/Ordens'
import { Financeiro } from './pages/Financeiro'
import { Clientes } from './pages/Clientes'
import { Fornecedores } from './pages/Fornecedores'
import { Login } from './pages/Login'
import { Cadastro } from './pages/Cadastro'
import { EsqueciSenha } from './pages/EsqueciSenha'
import { Usuarios } from './pages/Usuarios'
import { Perfil } from './pages/Perfil'
import { Navigate } from 'react-router-dom'
import { useAuth } from './hooks/use-auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { perfil, loading } = useAuth()
  
  if (loading) return null
  
  if (perfil?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/produtos" element={<Produtos />} />
                    <Route path="/ordens" element={<Ordens />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/fornecedores" element={<Fornecedores />} />
                    <Route path="/usuarios" element={
                      <AdminRoute>
                        <Usuarios />
                      </AdminRoute>
                    } />
                    <Route path="/perfil" element={<Perfil />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}
