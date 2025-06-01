"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import ReservationForm from "@/components/reservation-form"

const SLIDES = Array(5).fill({
  headline: "Parcare aeroport Otopeni",
  subheadline:
    "Parcarea ta inteligentă și sigură, la doar 3 minute de aeroportul Otopeni. Confort garantat, transfer rapid și zero stres, la un preț avantajos. Pentru călătoria ta perfectă!",
})

export default function HeroSection() {
  const [current, setCurrent] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Autoplay logic
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setCurrent((c) => (c === SLIDES.length - 1 ? 0 : c + 1))
    }, 5000)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [current])

  // Slide direction for animation
  const [direction, setDirection] = useState<"left" | "right">("right")
  const goTo = (idx: number) => {
    setDirection(idx > current ? "right" : "left")
    setCurrent(idx)
  }

  return (
    <section className="w-full bg-gradient-to-br from-[#e6007a] to-[#4f2683] py-10 md:py-16 relative overflow-hidden">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8 md:gap-16">
        {/* Slider text */}
        <div className="flex-1 flex flex-col items-start justify-center text-white z-10 relative min-h-[220px] md:min-h-[260px]">
          <nav aria-label="Slider navigation" className="mb-4 flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                className={`w-3 h-3 rounded-full ${i === current ? "bg-white" : "bg-white/40"}`}
                onClick={() => goTo(i)}
                type="button"
              />
            ))}
          </nav>
          <div className="relative w-full h-[120px] md:h-[160px]">
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out
                  ${i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}
                  ${i === current
                    ? "translate-x-0"
                    : i < current
                    ? "-translate-x-10 scale-95"
                    : "translate-x-10 scale-95"}
                `}
                aria-hidden={i !== current}
              >
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight" style={{textShadow:'0 2px 8px #0002'}}>
                  {slide.headline}
                </h1>
                <p className="text-lg md:text-2xl mb-6 max-w-xl" style={{textShadow:'0 2px 8px #0002'}}>
                  {slide.subheadline}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* Imagine decorativă */}
        <div className="flex-1 flex justify-center items-center relative min-h-[320px]">
          <Image
            src="/placeholder.svg?key=modern-parking-lot"
            alt="Parcare Otopeni lângă Aeroportul Henri Coandă - vedere panoramică a parcării asfaltate"
            width={500}
            height={500}
            className="rounded-2xl shadow-2xl object-cover w-full max-w-[400px] h-[320px] md:h-[400px]"
            priority
          />
        </div>
      </div>
      {/* Formular pe orizontală, suprapus */}
      <div className="absolute left-1/2 bottom-0 translate-x-[-50%] translate-y-1/2 w-full max-w-4xl px-2 z-20">
        <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-2 border border-gray-100">
          <ReservationForm />
        </div>
      </div>
    </section>
  )
}
