import { supabase } from "./supabaseClient"

export interface User {
  id: string
  email: string
  fullName?: string
  role?: string
}

export async function signIn(email: string, password: string): Promise<{ user: User | null, error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return { user: null, error: error?.message || "Credenciales inválidas" }
  }
  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? "",
      fullName: data.user.user_metadata?.fullName,
      role: data.user.user_metadata?.role,
    },
    error: null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: data.user.user_metadata?.fullName,
    role: data.user.user_metadata?.role,
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

// Ya no es necesario setCurrentUser, Supabase gestiona la sesión
