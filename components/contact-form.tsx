"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2 } from "lucide-react"

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Trimite-ne un mesaj</h2>

          {isSubmitted ? (
            <div className="bg-[#e6f9ff] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#ccf5ff] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-[#33CCFF]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#0099cc]">Mesaj trimis cu succes!</h3>
              <p className="text-[#00b8e6] mb-6">
                Mulțumim pentru mesajul tău. Echipa noastră va reveni cu un răspuns în cel mai scurt timp posibil.
              </p>
              <Button onClick={() => setIsSubmitted(false)} className="gradient-bg hover:opacity-90 rounded-xl">
                Trimite alt mesaj
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nume complet *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-lg"
                    placeholder="Numele tău"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg"
                    placeholder="email@exemplu.com"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <Input id="phone" name="phone" type="tel" className="w-full rounded-lg" placeholder="07xx xxx xxx" />
              </div>

              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subiect *
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  className="w-full rounded-lg"
                  placeholder="Subiectul mesajului"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Mesaj *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  className="w-full rounded-lg min-h-[150px]"
                  placeholder="Scrie mesajul tău aici..."
                />
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="gradient-bg hover:opacity-90 rounded-xl px-8 py-3 h-auto text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Se trimite..." : "Trimite mesajul"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
