"use client"
import { useEffect, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { AuthProvider, useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, ListTree, LogOut, Tag, Car, Loader2 } from "lucide-react"

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  console.log("[AdminLayoutContent] Rendering. Pathname:", pathname, "Loading:", loading, "User:", user)

  useEffect(() => {
    console.log("[AdminLayoutContent] useEffect triggered. Pathname:", pathname, "Loading:", loading, "User:", user)
    if (loading || pathname === "/admin/login") {
      console.log("[AdminLayoutContent] useEffect: Exiting early (loading or on login page).")
      return
    }
    if (!user) {
      console.log("[AdminLayoutContent] useEffect: No user and not on login page, redirecting to /admin/login.")
      router.push("/admin/login")
    }
  }, [user, loading, router, pathname])

  if (loading && pathname !== "/admin/login") {
    console.log("[AdminLayoutContent] Displaying global loader for admin area.")
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Se verifică autentificarea...</p>
      </div>
    )
  }

  // Modificat: Verifică dacă user este null *după* ce loading este false și nu suntem pe pagina de login
  // Aceasta este o măsură de siguranță, useEffect ar trebui să se ocupe de redirect.
  if (!user && !loading && pathname !== "/admin/login") {
    console.log(
      "[AdminLayoutContent] No user, not loading, not on login page. Returning null (should be redirected by useEffect).",
    )
    return null
  }

  if (pathname === "/admin/login") {
    console.log("[AdminLayoutContent] Rendering children directly for /admin/login.")
    return <>{children}</>
  }

  // Navigație pentru admin (doar dacă user-ul este logat și nu suntem pe pagina de login)
  if (user) {
    console.log("[AdminLayoutContent] User is authenticated, rendering admin dashboard layout.")
    const adminNavItems = [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/dashboard/bookings", label: "Rezervări", icon: Car },
      { href: "/admin/dashboard/prices", label: "Prețuri", icon: Tag },
      { href: "/admin/dashboard/api-test", label: "Test API", icon: ListTree },
    ]
    return (
      <div className="flex min-h-screen bg-gray-100">
        <aside className="w-64 bg-white p-6 border-r border-gray-200 flex flex-col">
          <div className="mb-8">
            <Link href="/admin/dashboard" className="flex items-center">
              <Image
                src="/sigla-transparenta.png"
                alt="Parcare-Aeroport Logo"
                width={140}
                height={50}
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <nav className="flex-grow">
            <ul className="space-y-2">
              {adminNavItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center p-2 text-gray-700 rounded-md hover:bg-gray-100 hover:text-primary transition-colors"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <Button variant="outline" onClick={signOut} className="w-full flex items-center justify-center">
              <LogOut className="w-5 h-5 mr-2" />
              Deconectare
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    )
  }

  // Fallback în cazul în care niciuna dintre condițiile de mai sus nu este îndeplinită
  // (de ex., user este null, dar suntem pe o pagină protejată - useEffect ar trebui să fi redirecționat)
  console.log("[AdminLayoutContent] Fallback: No user, returning null. Pathname:", pathname)
  return null
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  console.log("[AdminLayout] Rendering. Wrapping children with AuthProvider.")
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  )
}
