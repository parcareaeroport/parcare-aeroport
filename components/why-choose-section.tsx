"use client"

import Image from "next/image"

export default function WhyChooseSection() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 md:mb-16 text-center">
            De ce să alegi parcarea noastră de lângă aeroportul Otopeni?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 md:gap-x-10 gap-y-10 md:gap-y-16">
            {/* Feature 1 */}
            <div className="text-center card-hover">
              <div className="relative mx-auto mb-6 md:mb-8">
                <div className="absolute -z-10 w-24 sm:w-32 h-24 sm:h-32 bg-primary/10 rounded-full blur-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-28 h-28 sm:w-40 sm:h-40 mx-auto rounded-full bg-primary/5 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=location-illustration-modern"
                    alt="Locație strategică"
                    width={100}
                    height={100}
                    className="object-contain w-16 h-16 sm:w-24 sm:h-24"
                  />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Locație strategică</h3>
              <p className="text-gray-600 mx-auto max-w-xs leading-relaxed text-sm sm:text-base">
                La doar 4 minute de Aeroportul Henri Coandă, parcarea noastră oferă acces rapid și convenabil pentru
                călătorii.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center card-hover">
              <div className="relative mx-auto mb-6 md:mb-8">
                <div className="absolute -z-10 w-24 sm:w-32 h-24 sm:h-32 bg-yellow-100 rounded-full blur-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-28 h-28 sm:w-40 sm:h-40 mx-auto rounded-full bg-yellow-50 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=security-illustration-modern"
                    alt="Siguranță maximă"
                    width={100}
                    height={100}
                    className="object-contain w-16 h-16 sm:w-24 sm:h-24"
                  />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Parcare inteligentă</h3>
              <p className="text-gray-600 mx-auto max-w-xs leading-relaxed text-sm sm:text-base">
                Economisește timp, bani și stres rezervând locul tău înainte de a pleca la drum.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center card-hover sm:col-span-2 md:col-span-1">
              <div className="relative mx-auto mb-6 md:mb-8">
                <div className="absolute -z-10 w-24 sm:w-32 h-24 sm:h-32 bg-red-100 rounded-full blur-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-28 h-28 sm:w-40 sm:h-40 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=peace-of-mind-illustration-modern"
                    alt="Liniște sufletească"
                    width={100}
                    height={100}
                    className="object-contain w-16 h-16 sm:w-24 sm:h-24"
                  />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Liniște sufletească</h3>
              <p className="text-gray-600 mx-auto max-w-xs leading-relaxed text-sm sm:text-base">
                Găsește cel mai bun loc, vezi exact cât plătești și poți chiar să-ți prelungești șederea prin aplicația
                noastră premiată.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
