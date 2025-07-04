"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

type FAQItem = {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "Cât costă parcarea la aeroport?",
    answer: "Prețurile diferă în funcție de durata parcării. Pentru o zi, tariful este de 50 lei, iar pentru perioade mai lungi oferim reduceri progresive. Verifică tabelul nostru de prețuri pentru tarife complete."
  },
  {
    question: "Ce servicii includ tarifele?",
    answer: "Toate tarifele includ: parcare asigurată în spațiu privat, transfer gratuit la/de la aeroport, supraveghere video non-stop, și asistență 24/7. Nu există costuri ascunse."
  },
  {
    question: "Cât durează transferul la aeroport?",
    answer: "Transferul durează aproximativ 5-10 minute, în funcție de trafic. Microbuzurile noastre moderne circulă din 15 în 15 minute în orele de vârf și la cerere în restul timpului."
  },
  {
    question: "Pot anula rezervarea?",
    answer: "Da, poți anula rezervarea gratuit cu minimum 24 ore înainte de data sosirii. Pentru anulări în ultimul moment, se poate aplica o taxă de procesare."
  },
  {
    question: "Este parcarea securizată?",
    answer: "Da, parcarea este 100% securizată cu garduri perimetrale, supraveghere video non-stop, și personal de pază. Toate mașinile sunt asigurate în timpul parcării."
  },
  {
    question: "Unde se află parcarea?",
    answer: "Parcarea se află la doar 5 minute de Aeroportul Henri Coandă (Otopeni), cu acces ușor prin DN1. Vei primi locația exactă prin GPS după confirmarea rezervării."
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-3xl font-bold mb-8 md:mb-10 text-center text-primary tracking-normal">Întrebări frecvente</h2>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                <button
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <h3 className="text-lg md:text-base font-medium text-gray-900">{item.question}</h3>
                  <span className="ml-6 flex-shrink-0 text-primary">
                    {openIndex === index ? <Minus className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                  </span>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-6 md:p-8 pt-0 md:pt-0">
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
