"use client"

import { Play, X } from "lucide-react"
import { useState, useEffect } from "react"

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isPlaying])

  return (
    <section className="relative h-[400px] sm:h-[500px] md:h-[600px] w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/placeholder.svg?key=airport-night-view-modern')",
          filter: "brightness(0.6)",
        }}
      ></div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <p className="text-base sm:text-lg mb-1 sm:mb-2 opacity-90 tracking-wide">Descoperiți</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-8 tracking-tight">
          Aeroportul Otopeni
        </h2>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-2xl mb-8 sm:mb-10 md:mb-12 opacity-90 leading-relaxed">
          La Parcare-Aeroport, nu oferim doar parcare. Vă deschidem ușile către o experiență de călătorie fără stres.
        </p>

        <button
          onClick={() => setIsPlaying(true)}
          className="flex items-center gap-2 sm:gap-3 bg-white/10 hover:bg-white/20 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg text-sm sm:text-base"
        >
          <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-white" />
          <span className="font-medium">Urmăriți videoclipul</span>
        </button>
      </div>

      {/* Video Modal */}
      {isPlaying && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-3xl mx-auto">
            {/* Close button */}
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Închide videoclipul"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Video container */}
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Aeroportul Otopeni Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
