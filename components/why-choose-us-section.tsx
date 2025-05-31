import Image from "next/image"

export default function WhyChooseUsSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
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
                    alt="Parcare sigură"
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
              <h3 className="text-xl font-bold mb-3">Parcare sigură</h3>
              <p className="text-gray-600 leading-relaxed">
                Parcarea noastră este supravegheată video 24/7 și păzită permanent. Mașina ta este în siguranță maximă
                pe toată durata staționării.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center px-4 md:px-8">
              <div className="relative mx-auto mb-6 w-40 h-40 rounded-full bg-green-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=payment-control-icon&height=80&width=80"
                    alt="Tu deții controlul"
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
              <h3 className="text-xl font-bold mb-3">Tu deții controlul</h3>
              <p className="text-gray-600 leading-relaxed">
                Alege zilele și orele care ți se potrivesc și stabilește-ți propriul program. Rezervă online și primește
                confirmarea instant, fără complicații.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center px-4 md:px-8">
              <div className="relative mx-auto mb-6 w-40 h-40 rounded-full bg-green-50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/placeholder.svg?key=car-community-icon&height=80&width=80"
                    alt="Comunitate de șoferi"
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
              <h3 className="text-xl font-bold mb-3">Mii de clienți mulțumiți</h3>
              <p className="text-gray-600 leading-relaxed">
                Comunitatea noastră în creștere de șoferi verificați este dovada calității serviciilor. Mai multe
                rezervări pentru tine înseamnă mai multă liniște pentru noi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
