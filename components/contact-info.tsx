import Link from "next/link"
import { Phone, Mail, MapPin, Clock, Navigation, MessageSquare, Instagram, Facebook } from "lucide-react"

export default function ContactInfo() {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Telefon și WhatsApp */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#e6f9ff] rounded-full flex items-center justify-center mb-4">
                <Phone className="h-5 w-5 text-[#33CCFF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Telefon & WhatsApp</h3>
              <p className="text-gray-700 mb-1">
                <span className="font-medium">Telefon & WhatsApp:</span> <a href="tel:+40734292818" className="hover:text-primary font-semibold">+40 734 292 818</a>
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-3">
                <a
                  href="tel:+40734292818"
                  className="w-10 h-10 bg-[#FF0066] rounded-full flex items-center justify-center text-white hover:bg-[#e6005c] transition-colors"
                  aria-label="Sună acum"
                >
                  <Phone className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/40734292818"
                  target="_blank"
                  className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageSquare className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Card 2: Email */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#e6f9ff] rounded-full flex items-center justify-center mb-4">
                <Mail className="h-5 w-5 text-[#33CCFF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Email</h3>
              <p className="text-gray-700 mb-1">
                <a href="mailto:contact.parcareaeroport@gmail.com" className="hover:text-primary font-semibold">
                  contact.parcareaeroport@gmail.com
                </a>
              </p>
            </div>

            {/* Card 3: Social */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#e6f9ff] rounded-full flex items-center justify-center mb-4">
                <Instagram className="h-5 w-5 text-[#33CCFF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Social</h3>
              <div className="flex flex-col gap-2">
                <a href="https://www.tiktok.com/@parcare_aeroport?_t=ZN-8wmzQZdnbra&_r=1" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary font-medium">TikTok</a>
                <a href="https://www.instagram.com/parcare_aeroport?igsh=MXV5d2d2M3NibHh0Yg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary font-medium">Instagram</a>
                <a href="https://www.facebook.com/share/1EYNt8Zp19/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary font-medium">Facebook</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
