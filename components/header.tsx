"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone } from "lucide-react"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMobileMenuOpen])

  const navItems = [
    { name: "Acasa", href: "/", title: "Pagina principală Parcare Otopeni" },
    { name: "Regulile Parcarii", href: "/reguli", title: "Regulile parcării Otopeni" },
    { name: "Contact", href: "/contact", title: "Contactează-ne pentru parcare Otopeni" },
  ]

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between py-3">
        {/* Logo în stânga */}
        <Link href="/" className="flex items-center" title="Parcare-Aeroport Otopeni" aria-label="Acasă">
          <Image
            src="/sigla-transparenta.png"
            alt="Parcare-Aeroport Logo"
            width={170}
            height={55}
            className="h-12 md:h-14 w-auto"
            priority
          />
        </Link>

        {/* Meniul și butoanele în dreapta */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* Meniul de navigare */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Navigare principală">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.title}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-1 rounded-md text-sm font-medium transition-all duration-200 hover:bg-waze-blue/10 hover:text-waze-blue hover:scale-105 ${
                      pathname === item.href ? "bg-waze-blue/10 text-waze-blue" : ""
                    }`}
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
            </div>
          </nav>
          {/* Buton Secundar - Fundal alb + Border & Text roz */}
          <Link href="/tarife">
            <Button
              className="bg-white hover:bg-[#ff0066]/5 text-[#ff0066] hover:text-[#ff0066] border-2 border-[#ff0066] hover:border-[#e6005c] rounded-md text-sm font-medium px-3 md:px-4 py-2 h-auto transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="Vezi tarifele"
            >
              <span>Tarife</span>
            </Button>
          </Link>
          {/* Buton Principal - Fundal roz + Text alb */}
          <Link
            href="tel:0740123456"
            className="bg-[#ff0066] hover:bg-[#e6005c] rounded-md text-sm font-medium shadow-md hover:shadow-lg px-3 md:px-4 py-2 h-auto flex items-center text-white transition-all duration-200"
            aria-label="Contact rapid telefonic"
          >
            <Phone className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Contact rapid</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? "Închide meniul" : "Deschide meniul"}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile sidebar menu - slides from left */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          ></div>

          {/* Sidebar */}
          <div
            className="md:hidden fixed inset-0 left-0 w-[280px] h-[100vh] bg-white z-50 shadow-xl overflow-y-auto animate-slide-in"
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Meniu mobil"
            style={{ height: "100vh", maxHeight: "100vh", top: 0 }}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
                title="Parcare-Aeroport Otopeni"
              >
                <Image
                  src="/sigla-transparenta.png"
                  alt="Parcare-Aeroport Logo"
                  width={100}
                  height={35}
                  className="h-7 w-auto"
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Închide meniul"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="py-4 px-4 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Navigare</h3>
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      title={item.title}
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      <Button
                        variant="ghost"
                        className={`flex items-center justify-start w-full rounded-lg text-left h-auto py-3 transition-all duration-200 hover:bg-waze-blue/10 hover:text-waze-blue hover:pl-4 ${
                          pathname === item.href ? "bg-waze-blue/10 text-waze-blue" : ""
                        }`}
                      >
                        <span className="font-medium">{item.name}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-center space-x-4 mt-6">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-waze-blue transition-all duration-200 hover:scale-110"
                    aria-label="Instagram"
                    title="Urmărește-ne pe Instagram"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-waze-blue transition-all duration-200 hover:scale-110"
                    aria-label="Facebook"
                    title="Urmărește-ne pe Facebook"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-waze-blue transition-all duration-200 hover:scale-110"
                    aria-label="Twitter"
                    title="Urmărește-ne pe Twitter"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
