"use client"

import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook, Twitter, Linkedin, ArrowUp, Phone, Mail, MapPin, Navigation } from "lucide-react"

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
        {/* Logo Section */}
        <div className="mb-8 md:mb-12 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            {/* <Image
              src="/sigla-transparenta.png"
              alt="Parcare-Aeroport Logo"
              width={200}
              height={80}
              className="h-16 md:h-20 w-auto"
            /> */}
            <h2 className="text-xl sm:text-2xl font-bold text-[#FF0066]">Parcare-Aeroport</h2>
          </div>
        </div>

        {/* Main Footer Content - Three Equal Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
          
          {/* Left Section - Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-4 text-white">Despre noi</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Parcare Aeroport Otopeni oferă servicii de parcare securizată la doar 2 km de aeroportul Henri Coandă. 
              Cu transfer gratuit, supraveghere 24/7 și facilități moderne, suntem alegerea ideală pentru călătoriile tale.
            </p>
            <p className="text-gray-300 text-sm">
              Experiență fără stres, siguranță maximă și servicii profesionale pentru mașina ta.
            </p>
          </div>

          {/* Middle Section - Utile (Site Pages) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-4 text-white">Utile</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Acasă
                </Link>
              </li>
              <li>
                <Link href="/plasare-comanda" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Rezervare online
                </Link>
              </li>
              <li>
                <Link href="/tarife" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Tarife
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Dashboard Admin
                </Link>
              </li>
              <li>
                <Link href="/confirmare" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Confirmare rezervare
                </Link>
              </li>
              <li>
                <Link href="/termeni" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Termeni și condiții
                </Link>
              </li>
              <li>
                <Link href="/confidentialitate" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Politica de confidențialitate
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Section - Contact rapid */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-4 text-white">Contact rapid</h3>
            <div className="space-y-4">
              {/* Phone */}
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-[#FF0066] flex-shrink-0" />
                <a href="tel:+40123456789" className="text-gray-300 hover:text-white transition-colors text-sm">
                  +40 123 456 789
                </a>
              </div>
              
              {/* Email */}
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-[#FF0066] flex-shrink-0" />
                <a href="mailto:contact@parcare-aeroport.ro" className="text-gray-300 hover:text-white transition-colors text-sm">
                  contact@parcare-aeroport.ro
                </a>
              </div>

              {/* Maps */}
              <div className="space-y-3 pt-2">
                <p className="text-gray-400 text-sm mb-2">Navigare rapidă:</p>
                
                {/* Google Maps */}
                <div className="flex items-center space-x-3">
                  <MapPin size={16} className="text-[#FF0066] flex-shrink-0" />
                  <a 
                    href="https://maps.google.com/?q=Parcare+Aeroport+Otopeni,+DN1,+Otopeni,+Romania" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Google Maps
                  </a>
                </div>
                
                {/* Waze */}
                <div className="flex items-center space-x-3">
                  <Navigation size={16} className="text-[#FF0066] flex-shrink-0" />
                  <a 
                    href="https://waze.com/ul?q=Parcare%20Aeroport%20Otopeni&navigate=yes" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Waze
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
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
