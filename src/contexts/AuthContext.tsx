import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types'

interface AuthContextType {
  user: User | null
  perfil: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. Obter sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError)
          setLoading(false)
          return
        }

        if (!mounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        // 2. Se houver usuário, carregar perfil
        if (currentUser) {
          try {
            const { data, error } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', currentUser.id)
              .single()

            if (!error && data && mounted) {
              setPerfil(data)
            }
          } catch (error) {
            console.error('Erro ao buscar perfil:', error)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Erro na inicialização:', error)
        setLoading(false)
      }
    }

    initAuth()

    // 3. Escutar mudanças de autenticação DEPOIS da inicialização
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (!currentUser) {
        setPerfil(null)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  async function fetchPerfil(userId: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar perfil:', error)
        return null
      }
      setPerfil(data)
      return data
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      setPerfil(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
