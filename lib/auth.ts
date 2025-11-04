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

// Caché simple para evitar múltiples llamadas en un corto período
let userCache: { user: User | null; timestamp: number } | null = null
const CACHE_DURATION = 5000 // 5 segundos

// Promise compartida para evitar múltiples llamadas simultáneas
let pendingRequest: Promise<User | null> | null = null

export async function getCurrentUser(forceRefresh = false): Promise<User | null> {
  // Usar caché si está disponible y no es forzado
  const now = Date.now()
  if (!forceRefresh && userCache && (now - userCache.timestamp) < CACHE_DURATION) {
    return userCache.user
  }

  // Si hay una solicitud pendiente, esperar a que termine
  if (pendingRequest && !forceRefresh) {
    return pendingRequest
  }

  // Crear nueva solicitud
  pendingRequest = (async () => {
    try {
      // Usar getSession primero (más eficiente que getUser)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !sessionData.session) {
        userCache = { user: null, timestamp: Date.now() }
        return null
      }

      // Si tenemos sesión, obtener usuario
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        userCache = { user: null, timestamp: Date.now() }
        return null
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email ?? "",
        fullName: data.user.user_metadata?.fullName,
        role: data.user.user_metadata?.role,
      }

      userCache = { user, timestamp: Date.now() }
      return user
    } catch (error) {
      console.error("Error al obtener usuario:", error)
      userCache = { user: null, timestamp: Date.now() }
      return null
    } finally {
      pendingRequest = null
    }
  })()

  return pendingRequest
}

// Función para limpiar caché (útil después de logout)
export function clearUserCache(): void {
  userCache = null
  pendingRequest = null
}

export async function signOut(): Promise<void> {
  clearUserCache()
  await supabase.auth.signOut()
}

// Ya no es necesario setCurrentUser, Supabase gestiona la sesión
