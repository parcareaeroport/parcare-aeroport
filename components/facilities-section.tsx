"use client"
import Image from "next/image"

export default function FacilitiesSection() {
  return (
    <section className="py-12 md:py-20 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 md:mb-16 text-center text-gray-800">
            Unde mergi data viitoare?
          </h2>

          <div className="relative">
            {/* Horizontal connecting line - hidden on mobile, visible on desktop */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 hidden md:block"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 relative">
              {/* Facility 1 - Office (Birou) */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative z-10 card-hover">
                <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center">
                  <div className="mb-4 md:mb-6 relative">
                    <div className="absolute -z-10 w-16 sm:w-20 h-16 sm:h-20 bg-primary/10 rounded-full blur-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <Image
                      src="/placeholder.svg?key=office-worker-modern"
                      alt="Parcare pentru birou - soluții pentru angajați și companii"
                      width={80}
                      height={80}
                      className="object-contain w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-center">Birou</h3>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-yellow-400 hidden md:block"></div>
              </div>

              {/* Facility 2 - Airports (Aeroporturi) */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative z-10 card-hover">
                <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center">
                  <div className="mb-4 md:mb-6 relative">
                    <div className="absolute -z-10 w-16 sm:w-20 h-16 sm:h-20 bg-primary/10 rounded-full blur-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <Image
                      src="/placeholder.svg?key=airplane-clouds-modern"
                      alt="Parcare pentru aeroporturi - soluții pentru călători"
                      width={80}
                      height={80}
                      className="object-contain w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-center">Aeroporturi</h3>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-yellow-400 hidden md:block"></div>
              </div>

              {/* Facility 3 - Stadiums (Stadioane) */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative z-10 card-hover">
                <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center">
                  <div className="mb-4 md:mb-6 relative">
                    <div className="absolute -z-10 w-16 sm:w-20 h-16 sm:h-20 bg-primary/10 rounded-full blur-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <Image
                      src="/placeholder.svg?key=stadium-illustration-modern"
                      alt="Parcare pentru stadioane - soluții pentru evenimente sportive"
                      width={80}
                      height={80}
                      className="object-contain w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-center">Stadioane</h3>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-yellow-400 hidden md:block"></div>
              </div>

              {/* Facility 4 - City Breaks (Vacanțe Urbane) */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative z-10 card-hover">
                <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center">
                  <div className="mb-4 md:mb-6 relative">
                    <div className="absolute -z-10 w-16 sm:w-20 h-16 sm:h-20 bg-primary/10 rounded-full blur-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <Image
                      src="/placeholder.svg?key=city-traveler-modern"
                      alt="Parcare pentru vacanțe urbane - soluții pentru turiști"
                      width={80}
                      height={80}
                      className="object-contain w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-center">Vacanțe Urbane</h3>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-yellow-400 hidden md:block"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
