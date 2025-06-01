"use client"

import { useEffect } from "react"
import Header from "@/components/header"
import HeroSection from "@/components/hero-section"
import HowItWorksSection from "@/components/how-it-works-section"
import WhyChooseSection from "@/components/why-choose-section"
import PricingTableSection from "@/components/pricing-table-section"
import FacilitiesSection from "@/components/facilities-section"
import SeoTextSection from "@/components/seo-text-section"
import VideoSection from "@/components/video-section"
import ReviewsSection from "@/components/reviews-section"
import Footer from "@/components/footer"
import Script from "next/script"

export default function Home() {
  // Implementare pentru a îmbunătăți Core Web Vitals
  useEffect(() => {
    // Preload important images
    const preloadImages = () => {
      const imageUrls = ["/placeholder.svg?key=modern-parking-lot", "/placeholder.svg?key=airport-night-view-modern"]

      imageUrls.forEach((url) => {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "image"
        link.href = url
        document.head.appendChild(link)
      })
    }

    preloadImages()
  }, [])

  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <PricingTableSection />
      <HowItWorksSection />
      <WhyChooseSection />
      <FacilitiesSection />
      <SeoTextSection />
      <VideoSection />
      <ReviewsSection />
      <Footer />

      {/* Schema.org structured data pentru LocalBusiness */}
      <Script id="schema-parking" type="application/ld+json" strategy="afterInteractive">
        {`
          {
            "@context": "https://schema.org",
            "@type": "ParkingFacility",
            "name": "Parcare-Aeroport Otopeni",
            "image": "https://parcare-aeroport.ro/images/parking-lot.jpg",
            "url": "https://parcare-aeroport.ro",
            "telephone": "+40740123456",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Strada Aeroportului 10",
              "addressLocality": "Otopeni",
              "addressRegion": "Ilfov",
              "postalCode": "075100",
              "addressCountry": "RO"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 44.5675,
              "longitude": 26.0847
            },
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
              ],
              "opens": "00:00",
              "closes": "23:59"
            },
            "priceRange": "$$",
            "description": "Parcare sigură lângă Aeroportul Otopeni, cu supraveghere 24/7 și transfer gratuit la terminal.",
            "amenityFeature": [
              {
                "@type": "LocationFeatureSpecification",
                "name": "Supraveghere video",
                "value": true
              },
              {
                "@type": "LocationFeatureSpecification",
                "name": "Transfer gratuit la aeroport",
                "value": true
              },
              {
                "@type": "LocationFeatureSpecification",
                "name": "Parcare asfaltată",
                "value": true
              },
              {
                "@type": "LocationFeatureSpecification",
                "name": "Pază 24/7",
                "value": true
              }
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.5",
              "reviewCount": "151132"
            }
          }
        `}
      </Script>

      {/* Schema.org pentru FAQPage */}
      <Script id="schema-faq" type="application/ld+json" strategy="afterInteractive">
        {`
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Cum pot rezerva un loc de parcare?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Rezervarea unui loc de parcare este simplă. Accesați site-ul nostru, introduceți datele de sosire și plecare, selectați tipul de parcare dorit și urmați pașii pentru finalizarea plății. Veți primi o confirmare pe email cu toate detaliile necesare."
                }
              },
              {
                "@type": "Question",
                "name": "Ce se întâmplă dacă întârzii la ora rezervată?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Locul de parcare vă este rezervat pentru întreaga perioadă specificată în rezervare. Dacă ajungeți mai târziu decât ora specificată, locul vă rămâne rezervat, dar nu se oferă reduceri sau rambursări pentru timpul neutilizat."
                }
              },
              {
                "@type": "Question",
                "name": "Există serviciu de transfer către aeroport?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Da, oferim un serviciu gratuit de transfer către și de la Aeroportul Otopeni. Transferul funcționează 24/7 și durează aproximativ 4 minute. După ce parcați mașina, vă rugăm să vă prezentați la punctul de întâlnire marcat, iar șoferul nostru vă va prelua în cel mai scurt timp."
                }
              }
            ]
          }
        `}
      </Script>
    </main>
  )
}
