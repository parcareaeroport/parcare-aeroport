"use client"
import Image from "next/image"

export default function FacilitiesSection() {
  return (
    <section className="py-12 md:py-16 bg-primary/5">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 md:mb-10 text-center text-gray-800">
            Mergi liniștit în vacanță alături de cei drag sau în călătoria ta de afaceri, noi avem grijă de mașina ta!
          </h2>
          <p className="text-lg sm:text-xl text-center text-gray-700 mb-10 md:mb-12 max-w-4xl mx-auto">
            Cauți cea mai bună parcare privată aeroport Otopeni? Sau parcare long term Otopeni? Sau chiar o parcare Otopeni ieftină? Suntem aici pentru tine!
          </p>

          <div className="relative">
            {/* Horizontal connecting line - hidden on mobile, visible on desktop */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 hidden md:block"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative">
              {/* Facility 1 - City break */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative z-10 card-hover">
                <div className="p-6 md:p-8 flex flex-col items-center">
                  <div className="mb-4 md:mb-6 relative">
                    <div className="absolute -z-10 w-16 sm:w-20 h-16 sm:h-20 bg-primary/10 rounded-full blur-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <Image
                      src="/placeholder.svg?key=city-break-modern"
                      alt="City break - parcare pentru vacanțe urbane scurte"
                      width={80}
                      height={80}
                      className="object-contain w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-center">City break</h3>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-yellow-400 hidden md:block"></div>
              </div>

              {/* Facility 2 - Sejur prelungit */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative z-10 card-hover">
                <div className="p-6 md:p-8 flex flex-col items-center">
                  <div className="mb-4 md:mb-6 relative">
                    <div className="absolute -z-10 w-16 sm:w-20 h-16 sm:h-20 bg-primary/10 rounded-full blur-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <Image
                      src="/placeholder.svg?key=long-stay-modern"
                      alt="Sejur prelungit - parcare long term pentru vacanțe lungi"
                      width={80}
                      height={80}
                      className="object-contain w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-center">Sejur prelungit</h3>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-yellow-400 hidden md:block"></div>
              </div>

              {/* Facility 3 - Business trip */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative z-10 card-hover">
                <div className="p-6 md:p-8 flex flex-col items-center">
                  <div className="mb-4 md:mb-6 relative">
                    <div className="absolute -z-10 w-16 sm:w-20 h-16 sm:h-20 bg-primary/10 rounded-full blur-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <Image
                      src="/placeholder.svg?key=business-trip-modern"
                      alt="Business trip - parcare pentru călătorii de afaceri"
                      width={80}
                      height={80}
                      className="object-contain w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-center">Business trip</h3>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-yellow-400 hidden md:block"></div>
              </div>

              {/* Facility 4 - Călătorii pentru evenimente */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative z-10 card-hover">
                <div className="p-6 md:p-8 flex flex-col items-center">
                  <div className="mb-4 md:mb-6 relative">
                    <div className="absolute -z-10 w-16 sm:w-20 h-16 sm:h-20 bg-primary/10 rounded-full blur-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <Image
                      src="/placeholder.svg?key=events-travel-modern"
                      alt="Călătorii pentru evenimente - parcare pentru concerte, festivaluri, evenimente"
                      width={80}
                      height={80}
                      className="object-contain w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-center">Călătorii pentru evenimente</h3>
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
