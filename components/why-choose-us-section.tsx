import Image from "next/image"

export default function WhyChooseUsSection() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-12 md:mb-16 text-center">
            De ce să alegi parcarea noastră?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative">
            {/* Vertical dividing lines - only visible on desktop */}
            <div className="hidden md:block absolute left-1/3 top-0 bottom-0 w-px bg-gray-200"></div>
            <div className="hidden md:block absolute left-2/3 top-0 bottom-0 w-px bg-gray-200"></div>

            {/* Feature 1 */}
            <div className="text-center px-4 md:px-8">
              <div className="relative mx-auto mb-6 w-40 h-40 rounded-full bg-green-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=secure-parking-icon&height=80&width=80"
                    alt="Control total și eficiență maximă"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center">
                  <div className="w-6 h-6 bg-yellow-300 rounded-full transform rotate-45"></div>
                  <div className="absolute w-4 h-4 bg-yellow-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">Control total și eficiență maximă</h3>
              <p className="text-gray-600 leading-relaxed">
                Alege parcarea noastră și economisești nu doar bani, ci și timp prețios și energie. Începi și termini călătoria relaxat, fără surprize neplăcute, cu un serviciu premium la un preț corect și transparent.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center px-4 md:px-8">
              <div className="relative mx-auto mb-6 w-40 h-40 rounded-full bg-green-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=payment-control-icon&height=80&width=80"
                    alt="Acces rapid în parcare"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center">
                  <div className="w-6 h-6 bg-yellow-300 rounded-full transform rotate-45"></div>
                  <div className="absolute w-4 h-4 bg-yellow-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">Acces rapid în parcare</h3>
              <p className="text-gray-600 leading-relaxed">
                Accesul în parcare se poate face prin citirea automată a numărului de înmatriculare sau codul QR generat pentru tine. În plus, ai parte de un tarif avantajos pentru parcare lângă aeroportul Otopeni.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center px-4 md:px-8">
              <div className="relative mx-auto mb-6 w-40 h-40 rounded-full bg-green-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=car-community-icon&height=80&width=80"
                    alt="Zonă de relaxare"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center">
                  <div className="w-6 h-6 bg-yellow-300 rounded-full transform rotate-45"></div>
                  <div className="absolute w-4 h-4 bg-yellow-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">Zonă de relaxare</h3>
              <p className="text-gray-600 leading-relaxed">
                Așteaptă transferul sau relaxează-te după un zbor lung în zona noastră special amenajată. Savurează o cafea aromată, un ceai sau răcorește-te cu o apă plată și mici snack-uri pentru un plus de energie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
