import Image from "next/image"

export default function PricingHero() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-800">
            Tarife Parcare Otopeni
          </h1>
          <p className="text-base md:text-lg text-slate-600 mb-8 md:mb-10 max-w-3xl mx-auto">
            Descoperă tarifele noastre competitive pentru parcare securizată lângă Aeroportul Henri Coandă.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
          {/* Left - Parcare Securizată */}
          <div className="text-center relative">
            <div className="bg-green-50 p-6 md:p-8 rounded-2xl">
              <div className="hidden md:block absolute top-1/2 right-0 w-8 h-0.5 bg-green-500 transform translate-x-full">
                <div className="absolute right-0 top-1/2 w-4 h-4 bg-green-500 rounded-full transform -translate-y-1/2"></div>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Parcare Securizată</h3>
              <p className="text-sm text-gray-600">Supraveghere video 24/7</p>
              <div className="hidden md:block absolute top-1/2 right-0 w-8 h-0.5 bg-green-500 transform translate-x-full">
                <div className="absolute right-0 top-1/2 w-4 h-4 bg-green-500 rounded-full transform -translate-y-1/2"></div>
              </div>
            </div>
          </div>

          {/* Center - Logo or Main Feature */}
          <div className="text-center">
            <div className="bg-primary/10 p-6 md:p-8 rounded-2xl">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-primary">Rezervare Online</h3>
              <p className="text-sm text-gray-600">Simplu și rapid</p>
            </div>
          </div>

          {/* Right - Transfer Gratuit */}
          <div className="text-center relative">
            <div className="bg-blue-50 p-6 md:p-8 rounded-2xl">
              <div className="hidden md:block absolute top-1/2 left-0 w-8 h-0.5 bg-green-500 transform -translate-x-full">
                <div className="absolute left-0 top-1/2 w-4 h-4 bg-green-500 rounded-full transform -translate-y-1/2"></div>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m-4-5v9" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7l-5-5-5 5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Transfer Gratuit</h3>
              <p className="text-sm text-gray-600">La și de la aeroport</p>
              <div className="hidden md:block absolute top-1/2 left-0 w-8 h-0.5 bg-green-500 transform -translate-x-full">
                <div className="absolute left-0 top-1/2 w-4 h-4 bg-green-500 rounded-full transform -translate-y-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
