"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function AdminRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return // Așteaptă până când autentificarea este verificată
    
    if (user) {
      router.push("/admin/dashboard")
    } else {
      router.push("/admin/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Se verifică autentificarea...</div>
  }

  return null
}
