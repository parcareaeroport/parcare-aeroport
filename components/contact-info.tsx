import Link from "next/link"
import { Phone, Mail, MapPin, Clock, Navigation, MessageSquare } from "lucide-react"

export default function ContactInfo() {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Call Now */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#e6f9ff] rounded-full flex items-center justify-center mb-4">
                <Phone className="h-5 w-5 text-[#33CCFF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sună acum</h3>
              <p className="text-gray-700 mb-1">
                <span className="font-medium">Telefon:</span> 0740.123.456
              </p>
              <p className="text-gray-700">
                <span className="font-medium">WhatsApp:</span> +40740123456
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-3">
                <Link
                  href="https://wa.me/40740123456"
                  target="_blank"
                  className="w-10 h-10 bg-[#FF0066] rounded-full flex items-center justify-center text-white hover:bg-[#e6005c] transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <span className="text-sm text-gray-500 flex items-center">Chat pe WhatsApp</span>
              </div>
            </div>

            {/* Card 2: Send Message */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#e6f9ff] rounded-full flex items-center justify-center mb-4">
                <Mail className="h-5 w-5 text-[#33CCFF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Trimite mesaj</h3>
              <p className="text-gray-700 mb-1">
                <Link href="mailto:contact@parcare-aeroport.ro" className="hover:text-green-600 transition-colors">
                  contact@parcare-aeroport.ro
                </Link>
              </p>
              <p className="text-gray-700">
                <Link href="mailto:rezervari@parcare-aeroport.ro" className="hover:text-green-600 transition-colors">
                  rezervari@parcare-aeroport.ro
                </Link>
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Răspundem la emailuri în maxim 2 ore în timpul programului de lucru.
                </p>
              </div>
            </div>

            {/* Card 3: Find Us */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#e6f9ff] rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-5 w-5 text-[#33CCFF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ne găsești</h3>
              <p className="text-gray-700 mb-1">Strada Aeroportului 10, Otopeni</p>
              <p className="text-gray-700 mb-3">Jud. Ilfov, România</p>
              <p className="text-gray-700">
                <span className="font-medium">Program:</span> NON STOP
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-3">
                <Link
                  href="https://www.google.com/maps?q=Aeroportul+Otopeni"
                  target="_blank"
                  className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                >
                  <MapPin className="h-5 w-5" />
                </Link>
                <Link
                  href="https://www.waze.com/ul?ll=44.5675%2C26.0847&navigate=yes"
                  target="_blank"
                  className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white hover:bg-sky-600 transition-colors"
                >
                  <Navigation className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Card 4: Working Hours */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#e6f9ff] rounded-full flex items-center justify-center mb-4">
                <Clock className="h-5 w-5 text-[#33CCFF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Program</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Luni - Vineri:</span>
                  <span className="font-medium">24/24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sâmbătă:</span>
                  <span className="font-medium">24/24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duminică:</span>
                  <span className="font-medium">24/24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sărbători legale:</span>
                  <span className="font-medium">24/24</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Parcarea este deschisă non-stop, 365 de zile pe an.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
