"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function ReviewsSection() {
  const [activeSlide, setActiveSlide] = useState(0)

  const reviews = [
    {
      text: "Atât de ușor să găsești un loc de parcare potrivit înainte de călătorie. Elimină stresul de a găsi un loc când ajungi la aeroport.",
      author: "Andrei M.",
      date: "12 Mai 2023",
      rating: 5,
    },
    {
      text: "Totul a decurs conform planului în ceea ce privește comunicarea, indicațiile și programul... ca să fiu sincer, cu întârzierile zborurilor și o ofertă consistentă pentru un transfer cu autobuzul... parcarea a fost cea mai bună opțiune.",
      author: "Maria D.",
      date: "3 Aprilie 2023",
      rating: 3,
    },
    {
      text: "Liniște sufletească prin rezervarea cu ușurință în avans. Multe opțiuni și valoare rezonabilă pentru parcare. Cu siguranță voi folosi din nou.",
      author: "Ion P.",
      date: "27 Martie 2023",
      rating: 5,
    },
  ]

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === reviews.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))
  }

  return (
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-gray-800">
            Ce spun șoferii despre noi
          </h2>
          <p className="text-base sm:text-lg mb-2 text-gray-600">
            Parcare-Aeroport evaluat ca "excelent" pe site-ul independent de recenzii, Trustpilot.
          </p>
          <p className="text-base sm:text-lg mb-10 sm:mb-16 text-gray-600">
            Citiți recenzii reale de la clienți reali pe{" "}
            <a href="https://www.trustpilot.com" className="text-primary hover:underline transition-colors">
              www.trustpilot.com
            </a>
            .
          </p>

          {/* Trustpilot Rating */}
          <div className="mb-10 sm:mb-16 flex flex-col items-center">
            <p className="text-base sm:text-lg font-medium text-gray-700 mb-3">Trustpilot</p>

            <div className="flex mb-3">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-transform hover:scale-110 w-6 h-6 sm:w-8 sm:h-8"
                >
                  <rect width="28" height="28" fill="#00B67A" />
                  <path
                    d="M14 4L16.944 9.83688L23.4616 10.7451L18.7308 15.3331L19.8885 21.8149L14 18.77L8.11148 21.8149L9.26916 15.3331L4.53839 10.7451L11.056 9.83688L14 4Z"
                    fill="white"
                  />
                  {i === 4 && (
                    <>
                      <rect x="21" width="7" height="28" fill="#DCDCE6" />
                      <path d="M24.5 4L27.444 9.83688L34 10.7451V28H21V10.7451L27.5 9.83688L24.5 4Z" fill="#DCDCE6" />
                    </>
                  )}
                </svg>
              ))}
            </div>
            <div className="text-sm sm:text-base text-gray-700 font-medium">
              <div className="mb-1">TrustScore 4.5</div>
              <div>151,132 recenzii</div>
            </div>
          </div>

          {/* Mobile Reviews Slider */}
          <div className="md:hidden relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {reviews.map((review, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-white p-6 rounded-2xl shadow-lg text-left h-full">
                      <p className="text-sm font-medium text-primary mb-2">Trustpilot</p>
                      <div className="flex mb-4">
                        {[...Array(review.rating)].map((_, i) => (
                          <svg
                            key={i}
                            width="20"
                            height="20"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect width="18" height="18" fill="#00B67A" />
                            <path
                              d="M9 2L11.0206 6.21885L15.7553 6.90983L12.3776 10.1812L13.0412 14.8902L9 12.6L4.95883 14.8902L5.62236 10.1812L2.24472 6.90983L6.97937 6.21885L9 2Z"
                              fill="white"
                            />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 text-base sm:text-lg leading-relaxed">" {review.text} "</p>
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                          {review.author} • {review.date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    activeSlide === index ? "bg-primary" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
              aria-label="Previous review"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
              aria-label="Next review"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Desktop Reviews Grid - Hidden on Mobile */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-left transform hover:-translate-y-2 card-hover"
              >
                <p className="text-sm font-medium text-primary mb-2">Trustpilot</p>
                <div className="flex mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg
                      key={i}
                      width="20"
                      height="20"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="18" height="18" fill="#00B67A" />
                      <path
                        d="M9 2L11.0206 6.21885L15.7553 6.90983L12.3776 10.1812L13.0412 14.8902L9 12.6L4.95883 14.8902L5.62236 10.1812L2.24472 6.90983L6.97937 6.21885L9 2Z"
                        fill="white"
                      />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">" {review.text} "</p>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    {review.author} • {review.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
