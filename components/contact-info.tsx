"use client"

import Link from "next/link"
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContactInfo() {
  const contactCards = [
    {
      title: "Telefon",
      items: [
        { label: "Rezervări și informații", value: "+40 734 292 818" },
        { label: "Urgențe și asistență", value: "+40 734 292 818" },
      ],
    },
    {
      title: "Email",
      items: [
        { label: "Rezervări", value: "contact.parcareaeroport@gmail.com" },
        { label: "Support", value: "contact.parcareaeroport@gmail.com" },
      ],
    },
    {
      title: "Program",
      items: [
        { label: "Luni - Vineri", value: "06:00 - 22:00" },
        { label: "Sâmbătă - Duminică", value: "08:00 - 20:00" },
      ],
    },
    {
      title: "Locație",
      items: [
        { label: "Adresa", value: "Șoseaua București-Ploiești 42A" },
        { label: "Localitate", value: "Otopeni, Ilfov" },
      ],
    },
  ]

  const handleCallClick = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`
  }

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  const handleLocationClick = () => {
    const address = "Șoseaua București-Ploiești 42A, Otopeni, Ilfov"
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    window.open(googleMapsUrl, '_blank')
  }

  const isClickable = (title: string) => {
    return title === "Telefon" || title === "Email" || title === "Locație"
  }

  const handleItemClick = (title: string, value: string) => {
    if (title === "Telefon") {
      handleCallClick(value)
    } else if (title === "Email") {
      handleEmailClick(value)
    } else if (title === "Locație") {
      handleLocationClick()
    }
  }

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {contactCards.map((card, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-lg p-6 md:p-8 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4 mx-auto">
                {card.title === "Telefon" && <PhoneIcon />}
                {card.title === "Email" && <EmailIcon />}
                {card.title === "Program" && <ClockIcon />}
                {card.title === "Locație" && <LocationIcon />}
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">{card.title}</h3>

                <div className="space-y-2 mb-4 flex-grow">
                {card.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="text-center">
                    <p className="text-sm text-slate-600 mb-1">{item.label}</p>
                    <p 
                      className={`text-sm font-medium ${
                        isClickable(card.title) 
                          ? 'text-primary cursor-pointer hover:text-primary/80' 
                          : 'text-slate-800'
                      }`}
                      onClick={() => isClickable(card.title) ? handleItemClick(card.title, item.value) : undefined}
                    >
                          {item.value}
                    </p>
                </div>
                  ))}
                </div>
              
              {isClickable(card.title) && (
                <button
                  onClick={() => {
                    if (card.title === "Telefon") {
                      handleCallClick(card.items[0].value)
                    } else if (card.title === "Email") {
                      handleEmailClick(card.items[0].value)
                    } else if (card.title === "Locație") {
                      handleLocationClick()
                    }
                  }}
                  className="bg-[#ff0066] hover:bg-[#e6005c] text-white px-4 py-3 rounded-md transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  {card.title === "Telefon" && "Sună acum"}
                  {card.title === "Email" && "Trimite email"}
                  {card.title === "Locație" && "Vezi pe hartă"}
                </button>
                )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Icon components
const PhoneIcon = () => (
  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const EmailIcon = () => (
  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LocationIcon = () => (
  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
