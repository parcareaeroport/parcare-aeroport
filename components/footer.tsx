"use client"

import Link from "next/link"
import { Instagram, Facebook, Twitter, Linkedin, ArrowUp } from "lucide-react"

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <footer className="bg-[#0A1172] text-white pt-10 sm:pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Logo and Trustpilot - Same for all devices */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-[#FF0066] mb-4 md:mb-6">Parcare-Aeroport</h2>

          <div className="mb-2">
            <p className="text-base sm:text-lg font-medium text-green-500 mb-2">Trustpilot</p>
          </div>

          <div className="flex mb-2">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                width="20"
                height="20"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <rect width="28" height="28" fill="#00B67A" />
                <path
                  d="M14 4L16.944 9.83688L23.4616 10.7451L18.7308 15.3331L19.8885 21.8149L14 18.77L8.11148 21.8149L9.26916 15.3331L4.53839 10.7451L11.056 9.83688L14 4Z"
                  fill="white"
                />
                {i === 4 && (
                  <>
                    <rect x="21" width="7" height="28" fill="#DCDCE6" />
                    <path d="M24.5 4L27.444 9.83688L34 10.7451V28H21V10.7451L27.5 9.83688L24.5 4Z" fill="#DCDCE6" />
                  </>
                )}
              </svg>
            ))}
          </div>

          <div className="text-xs sm:text-sm text-gray-300">
            <div>TrustScore 4.5</div>
            <div>151,132 recenzii</div>
          </div>
        </div>

        {/* Mobile Footer Sections - No Accordion */}
        <div className="md:hidden space-y-8">
          {/* Information Section */}
          <div>
            <h3 className="text-base font-medium mb-3 text-white">Informații</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Despre noi
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Parteneriate
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Centru de resurse
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Cariere
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Acoperire media
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Hartă site
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="text-base font-medium mb-3 text-white">Servicii</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Conturi business
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Management parcări
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Încărcare vehicule electrice
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Închiriază spațiul tău
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Închiriază încărcătorul EV
                </Link>
              </li>
            </ul>
          </div>

          {/* Points of interest Section */}
          <div>
            <h3 className="text-base font-medium mb-3 text-white">Puncte de interes</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Parcare aeroport
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Parcare oraș
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Parcare stadion
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Parcare gară
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-base font-medium mb-3 text-white">Contactează-ne</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Cum funcționează Parcare-Aeroport
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Centru de ajutor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Desktop Footer Sections - Hidden on Mobile */}
        <div className="hidden md:grid md:grid-cols-5 gap-4 md:gap-8 mb-8 md:mb-12">
          {/* Logo and Trustpilot - Desktop */}
          <div className="md:col-span-1"></div>

          {/* Information */}
          <div className="hidden md:block md:col-span-1">
            <h3 className="text-lg font-medium mb-4">Informații</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Despre noi
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Parteneriate
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Centru de resurse
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Cariere
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Acoperire media
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Hartă site
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="hidden md:block md:col-span-1">
            <h3 className="text-lg font-medium mb-4">Servicii</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Conturi business
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Management parcări
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Încărcare vehicule electrice
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Închiriază spațiul tău
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Închiriază încărcătorul EV
                </Link>
              </li>
            </ul>
          </div>

          {/* Points of interest */}
          <div className="hidden md:block md:col-span-1">
            <h3 className="text-lg font-medium mb-4">Puncte de interes</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Parcare aeroport
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Parcare oraș
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Parcare stadion
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Parcare gară
                </Link>
              </li>
            </ul>
          </div>

          {/* Get in touch */}
          <div className="hidden md:block md:col-span-1">
            <h3 className="text-lg font-medium mb-4">Contactează-ne</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Cum funcționează Parcare-Aeroport
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                  Centru de ajutor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social and App Links */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#1a2285] pt-6 md:pt-8">
          <div className="flex space-x-4 mb-6 md:mb-0">
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              <Instagram size={20} className="sm:w-5 sm:h-5" />
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              <Facebook size={20} className="sm:w-5 sm:h-5" />
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              <Twitter size={20} className="sm:w-5 sm:h-5" />
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              <Linkedin size={20} className="sm:w-5 sm:h-5" />
            </Link>
          </div>

          <div></div>
        </div>

        {/* Copyright and Legal */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#1a2285] pt-6 md:pt-8 mt-6 md:mt-8 text-xs sm:text-sm text-gray-400">
          <div className="mb-4 md:mb-0">© Copyright Parcare-Aeroport {new Date().getFullYear()}</div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/politica-anulare" className="hover:text-white transition-colors">
              Politica de anulare
            </Link>
            <Link href="/confidentialitate" className="hover:text-white transition-colors">
              Politica de confidențialitate
            </Link>
            <Link href="/termeni" className="hover:text-white transition-colors">
              Termeni de utilizare
            </Link>
          </div>
        </div>

        {/* Company Info */}
        <div className="text-[10px] sm:text-xs text-gray-500 mt-6 md:mt-8 text-center md:text-left">
          Parcare-Aeroport este numele comercial al Parcare-Aeroport SRL Înregistrat în România cu nr. J40/12345/2023.
          Strada Parcărilor, Nr. 10, București, România
        </div>

        {/* Scroll to top button */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 bg-[#0A1172] hover:bg-[#080d5a] text-white rounded-full p-2 shadow-lg transition-all duration-300"
          aria-label="Scroll to top"
        >
          <ArrowUp size={16} className="sm:w-4 sm:h-4" />
        </button>
      </div>
    </footer>
  )
}
