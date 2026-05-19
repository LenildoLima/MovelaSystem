import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types'

interface AuthContextType {
  user: User | null
  perfil: Usuario | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setPerfil(null)
      return
    }
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', currentUser.id)
      .single()
    if (data?.ativo === false) {
      await supabase.auth.signOut()
      setPerfil(null)
      setUser(null)
      setSession(null)
    } else {
      setPerfil(data ?? null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      loadUserProfile(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        setTimeout(() => {
          loadUserProfile(currentSession.user)
        }, 0)
      } else {
        setPerfil(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      const { data: perfilData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single()
      if (perfilData && !perfilData.ativo) {
        await supabase.auth.signOut()
        throw new Error('Sua conta ainda não foi ativada. Aguarde a aprovação do administrador.')
      }
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setPerfil(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, perfil, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
