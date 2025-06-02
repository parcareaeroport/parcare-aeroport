"use client"

import Image from "next/image"

export default function WhyChooseSection() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 md:mb-16 text-center">
            De ce să alegi parcarea noastră de lângă aeroportul Otopeni?
            <br />
            <span className="text-primary">Facilități premium, preț avantajos</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 md:gap-x-10 gap-y-10 md:gap-y-16">
            {/* Feature 1 */}
            <div className="text-center card-hover">
              <div className="relative mx-auto mb-6 md:mb-8">
                <div className="absolute -z-10 w-24 sm:w-32 h-24 sm:h-32 bg-primary/10 rounded-full blur-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-28 h-28 sm:w-40 sm:h-40 mx-auto rounded-full bg-primary/5 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=premium-facilities-modern"
                    alt="Facilități premium, preț avantajos"
                    width={100}
                    height={100}
                    className="object-contain w-16 h-16 sm:w-24 sm:h-24"
                  />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Confort și siguranță garantate</h3>
              <p className="text-gray-600 mx-auto max-w-xs leading-relaxed text-sm sm:text-base">
                Ai parte de o parcare iluminată, asfaltată, locuri de parcare generoase trasate și un spațiu special pentru relaxare, cu cafea si snacks-uri. Parchezi ușor și eviți zgârieturile, cu spațiu suficient între vehicule. Rămâne doar să rezervi!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center card-hover">
              <div className="relative mx-auto mb-6 md:mb-8">
                <div className="absolute -z-10 w-24 sm:w-32 h-24 sm:h-32 bg-yellow-100 rounded-full blur-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-28 h-28 sm:w-40 sm:h-40 mx-auto rounded-full bg-yellow-50 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=smart-parking-system-modern"
                    alt="Parcare inteligentă cu rezervare online și acces automatizat"
                    width={100}
                    height={100}
                    className="object-contain w-16 h-16 sm:w-24 sm:h-24"
                  />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Parcare inteligentă cu rezervare online și acces automatizat</h3>
              <p className="text-gray-600 mx-auto max-w-xs leading-relaxed text-sm sm:text-base">
                Am pregătit pentru tine un sistem de rezervare online simplu și intuitiv. Accesul în parcare se poate face și prin citirea automată a numărului de înmatriculare sau a codului QR pe care îl generăm special pentru tine.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center card-hover">
              <div className="relative mx-auto mb-6 md:mb-8">
                <div className="absolute -z-10 w-24 sm:w-32 h-24 sm:h-32 bg-red-100 rounded-full blur-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-28 h-28 sm:w-40 sm:h-40 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=security-surveillance-modern"
                    alt="Supraveghere CCTV și pază dedicată"
                    width={100}
                    height={100}
                    className="object-contain w-16 h-16 sm:w-24 sm:h-24"
                  />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Supraveghere CCTV și pază dedicată</h3>
              <p className="text-gray-600 mx-auto max-w-xs leading-relaxed text-sm sm:text-base">
                Monitorizare video CCTV 24/7 la care tu ai acces, pază umană, gard împrejmuitor și barieră cu cod de acces. Mașina ta este protejată în permanență.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
