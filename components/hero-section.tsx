"use client"

import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import ReservationForm from "@/components/reservation-form"

export default function HeroSection() {
  return (
    <section className="container mx-auto grid md:grid-cols-2 gap-8 md:gap-12 py-8 md:py-16 items-center">
      <div className="order-2 md:order-1 relative">
        <div className="absolute -z-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <Image
          src="/placeholder.svg?key=modern-parking-lot"
          alt="Parcare Otopeni lângă Aeroportul Henri Coandă - vedere panoramică a parcării asfaltate"
          width={600}
          height={700}
          className="rounded-2xl shadow-xl object-cover h-[300px] sm:h-[400px] md:h-[500px] w-full"
          priority
        />
        <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-lg p-4 max-w-[180px] hidden sm:block">
          <p className="text-sm font-medium">Parcare garantată</p>
          <p className="text-xs text-gray-500">Rezervă acum și economisește timp</p>
        </div>
      </div>

      <div className="order-1 md:order-2">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Parcare rezolvată
          <span className="relative ml-2">
            <span className="absolute bottom-2 left-0 w-full h-3 bg-primary/20 -z-10 rounded-full"></span>
            în secunde.
          </span>
        </h2>

        <div className="flex items-center gap-1 my-4 md:my-6">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            ))}
          </div>
          <Link
            href="https://maps.google.com"
            className="text-xs sm:text-sm ml-2 text-gray-600 hover:text-primary transition-colors flex items-center"
            target="_blank"
            rel="noopener noreferrer"
            title="Vezi locația parcării pe Google Maps"
          >
            <span className="border-b border-dashed border-gray-400">Vezi locația pe Google Maps</span>
          </Link>
        </div>

        <p className="text-base sm:text-lg text-gray-600 mb-6 md:mb-8">
          Introduceți locația și perioada pentru care aveți nevoie de parcare și vă vom găsi locul perfect pentru
          dumneavoastră.
        </p>

        <ReservationForm />
      </div>
    </section>
  )
}
