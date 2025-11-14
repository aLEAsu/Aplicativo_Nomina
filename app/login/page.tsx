"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { user, error: supaError } = await signIn(email, password)

      if (!user) {
        setError(supaError || "Credenciales inválidas");
        setLoading(false);
        return;
      }

      // Establecer cookie de sesión para el middleware
      document.cookie = "session=true; path=/; max-age=86400"
      // Pequeño defer para asegurar persistencia de cookie antes de navegar
      setTimeout(() => {
        router.replace("/dashboard")
      }, 100)
    } catch (err) {
      console.error("[v0] Error en login:", err)
      setError("Error al iniciar sesión")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_500px_at_80%_-10%,hsl(var(--primary)/0.12),transparent_60%),radial-gradient(900px_450px_at_-10%_10%,hsl(var(--muted-foreground)/0.08),transparent_60%)]">
      <div className="mx-auto flex min-h-screen max-w-[1400px] items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">A</div>
            <CardTitle className="text-2xl font-semibold tracking-tight">Ingreso al Sistema de Nomina</CardTitle>
            <CardDescription>Fundacion para el Desarrollo Social</CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder=""
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError("")
                }}
                required
                disabled={loading}
                  autoFocus
                  spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                  autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError("")
                }}
                required
                disabled={loading}
              />
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
          <div className="mt-6 rounded-md bg-muted p-3 text-xs text-muted-foreground">Solo para uso del administrador</div>
        </CardContent>
        </Card> 
      </div>
      <div className="footer py-4 text-center text-sm text-muted-foreground">
          <p> © 2025 FUPADESO, Todos los derechos reservados.</p>
      </div>
    </div>
  )
}
