"use client"
import { Button } from "@/components/ui/button"
import HowItWorksToggle from "@/components/how-it-works-toggle"

export default function HowItWorksSection() {
  return (
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 md:mb-12 text-center">
            <span className="relative inline-block">
            Pași de urmat, la sosirea si plecarea din unitate
              <span className="absolute bottom-2 left-0 w-full h-3 bg-yellow-200 -z-10 rounded-full"></span>
            </span>
          </h2>

          <HowItWorksToggle />

          <div className="mt-10 md:mt-12 text-center">
            <Button className="gradient-bg hover:opacity-90 text-base sm:text-lg px-6 sm:px-10 py-4 sm:py-6 h-auto rounded-full shadow-lg">
              Rezervă locul tău acum
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
