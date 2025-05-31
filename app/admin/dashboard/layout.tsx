"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { BarChart3, Calendar, DollarSign, Wrench } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)

  useEffect(() => {
    setIsClient(true)
    // Verificăm dacă utilizatorul este autentificat
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userData = localStorage.getItem("user")

    if (!isLoggedIn) {
      router.push("/admin/login")
    } else if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("user")
    router.push("/admin/login")
  }

  if (!isClient) {
    return null // Evităm renderarea pe server pentru a preveni erorile de hidratare
  }

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
    { name: "Prețuri", href: "/admin/dashboard/prices", icon: DollarSign },
    { name: "Rezervări", href: "/admin/dashboard/bookings", icon: Calendar },
    { name: "Test API", href: "/admin/dashboard/api-test", icon: Wrench },
    // { name: "Clienți", href: "/admin/dashboard/clients", icon: User },
    // { name: "Plăți", href: "/admin/dashboard/payments", icon: CreditCard },
    // { name: "Setări", href: "/admin/dashboard/settings", icon: Settings },
  ]

  console.log("[DashboardLayout] Rendering. Acest layout NU ar trebui să mai definească un sidebar.")

  return <>{children}</>
}
