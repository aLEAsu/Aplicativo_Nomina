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

    console.log("[v0] Intentando login con:", email)

    try {
      const { user, error: supaError } = await signIn(email, password)

      console.log("[v0] Resultado de signIn:", user, supaError)

      console.log("[LOGIN] Cookies antes:", document.cookie);

      if (!user) {
        setError(supaError || "Credenciales inválidas");
        setLoading(false);
        console.log("[LOGIN] Cookies después (fallo):", document.cookie);
        return;
      }

      // Establecer la cookie de sesión manualmente
      document.cookie = "session=true; path=/; max-age=86400";

      // Establecer cookie 'session' que usa el middleware para permitir rutas protegidas
      try {
        document.cookie = "session=true; path=/; max-age=86400"
        console.log("[LOGIN] Cookie 'session' establecida:", document.cookie)
      } catch (err) {
        console.warn("[LOGIN] No se pudo establecer la cookie 'session':", err)
      }

      // Esperar un momento breve para asegurarnos que la cookie esté presente antes de redirigir
      setTimeout(() => {
        console.log("[LOGIN] Cookies antes de redirigir:", document.cookie)
        window.location.href = "/dashboard"
      }, 250)
    } catch (err) {
      console.error("[v0] Error en login:", err)
      setError("Error al iniciar sesión")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sistema de Nómina PAE</CardTitle>
          <CardDescription className="text-center">Ingresa tus credenciales para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError("")
                }}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
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
          <div className="mt-6 p-4 bg-muted rounded-md text-sm">
            <p className="font-semibold mb-2">Credenciales de prueba:</p>
            <p className="text-muted-foreground">Admin: admin@empresa.com / admin123</p>
            <p className="text-muted-foreground">Usuario: usuario@empresa.com / user123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
