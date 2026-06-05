import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still loading, null = logged out, object = logged in
  const [session,     setSession]     = useState(undefined)
  // undefined = loading, null = no profile found, object = profile
  const [userProfile, setUserProfile] = useState(undefined)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', userId)
      .single()
    setUserProfile(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session ?? null
      setSession(s)
      if (s) fetchProfile(s.user.id)
      else   setUserProfile(null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const s = session ?? null
        setSession(s)
        if (s) fetchProfile(s.user.id)
        else   setUserProfile(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, userProfile, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
