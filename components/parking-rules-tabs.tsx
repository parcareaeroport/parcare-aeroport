"use client"

import { useState } from "react"
import Image from "next/image"
import { Car, Clock, CreditCard, CheckCircle } from "lucide-react"

export default function ParkingRulesTabs() {
  const [activeTab, setActiveTab] = useState<"sosire" | "plecare">("sosire")

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="flex justify-center mb-12">
            <div className="grid grid-cols-2 w-full max-w-md bg-white rounded-lg overflow-hidden shadow-sm">
              <button
                className={`py-4 px-6 font-medium text-center transition-colors ${
                  activeTab === "sosire"
                    ? "bg-blue-50 text-primary border-b-2 border-primary"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("sosire")}
              >
                La sosire
              </button>
              <button
                className={`py-4 px-6 font-medium text-center transition-colors ${
                  activeTab === "plecare"
                    ? "bg-blue-50 text-primary border-b-2 border-primary"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("plecare")}
              >
                La plecare
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left side - Image */}
            <div className="order-2 md:order-1">
              <div className="relative">
                <div className="rounded-xl overflow-hidden border-8 border-gray-100 shadow-xl w-full max-w-md mx-auto">
                  <Image
                    src={
                      activeTab === "sosire"
                        ? "/parcare_langa_aeroportul_otopeni_intrare.jpg"
                        : "/parcare_langa_aeroportul_otopeni_iesire.jpg"
                    }
                    alt={activeTab === "sosire" ? "Mașină la sosire în parcare" : "Mașină la plecare din parcare"}
                    width={500}
                    height={500}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* Right side - Content */}
            <div className="order-1 md:order-2">
              <h2 className="text-5xl md:text-3xl font-bold mb-6 text-primary tracking-normal">
                {activeTab === "sosire" ? "Cum funcționează la sosire" : "Cum funcționează la plecare"}
              </h2>
              <p className="text-gray-600 mb-8">
                {activeTab === "sosire"
                  ? "Procesul de parcare este simplu și eficient. Urmați acești pași pentru o experiență fără probleme la sosirea în parcarea noastră."
                  : "Ieșirea din parcare este la fel de simplă ca intrarea. Urmați acești pași pentru a părăsi parcarea noastră rapid și fără probleme."}
              </p>

              <div className="space-y-6">
                {activeTab === "sosire" ? (
                  <>
                    {/* Arrival Steps */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        <CreditCard className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1 text-waze-blue">1. Prezentați confirmarea rezervării</h3>
                        <p className="text-gray-600 text-sm">
                          La bariera de intrare, prezentați codul QR primit pe email sau introduceți codul de rezervare.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        <Car className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1 text-waze-blue">2. Parcați în zona desemnată</h3>
                        <p className="text-gray-600 text-sm">
                        La intrare în parcare veți fi întâmpinat de un operator care vă va ghida în toate demersurile privind parcarea în siguranță a autovehiculului dumneavoastră.
                        </p>
                      </div>
                    </div>

    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1 text-waze-blue">3. Veți fi transferat la terminalul aeroportului Henri Coandă</h3>
                        <p className="text-gray-600 text-sm">
                          Dacă aveți nevoie de transfer către aeroport, prezentați-vă la punctul de întâlnire marcat.
                          Serviciul este gratuit și disponibil 24/7.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Departure Steps */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        <Car className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1 text-waze-blue">1. Pregătiți-vă pentru plecare</h3>
                        <p className="text-gray-600 text-sm">
                          Verificați că nu ați uitat nimic în parcare și că aveți toate documentele necesare.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        <CreditCard className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1 text-waze-blue">2. Verificați plata</h3>
                        <p className="text-gray-600 text-sm">
                          Dacă ați depășit perioada rezervată inițial, efectuați plata suplimentară la automatul de
                          plată sau online.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        <Clock className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1 text-waze-blue">3. Respectați timpul de ieșire</h3>
                        <p className="text-gray-600 text-sm">
                          Aveți la dispoziție 15 minute pentru a părăsi parcarea după efectuarea plății suplimentare.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1 text-waze-blue">4. Ieșiți prin bariera automată</h3>
                        <p className="text-gray-600 text-sm">
                          Sistemul va recunoaște automat numărul de înmatriculare sau puteți scana codul QR. Bariera se
                          va ridica automat.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-5xl md:text-3xl font-bold mb-6 text-primary tracking-normal">
                Programul Nostru
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Program Transfer</h3>
                  <p className="text-gray-600 text-sm">
                    Transferul funcționează 24/7, cu plecări frecvente către și de la aeroport. În perioada 05:00-23:00 avem plecări programate la fiecare 15 minute.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Asistență Clienți</h3>
                  <p className="text-gray-600 text-sm">
                    Echipa noastră de asistență este disponibilă 24/7 pentru orice întrebări sau probleme. Puteți să ne contactați oricând la numerele afișate pe site.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Securitate</h3>
                  <p className="text-gray-600 text-sm">
                    Parcarea este monitorizată video 24/7, cu personal de securitate prezent permanent. Toate vehiculele sunt asigurate pe perioada parcării.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Condiții Speciale</h3>
                  <p className="text-gray-600 text-sm">
                    Pentru rezervări de peste 30 de zile, vă rugăm să ne contactați pentru condiții speciale. Oferim reduceri suplimentare pentru parcări pe termen lung.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Acces Vehicule</h3>
                  <p className="text-gray-600 text-sm">
                    Parcarea acceptă toate tipurile de vehicule: autoturisme, SUV-uri, van-uri și vehicule comerciale ușoare. Pentru vehicule de mari dimensiuni, vă rugăm să ne anunțați în avans.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Modificări Rezervare</h3>
                  <p className="text-gray-600 text-sm">
                    Modificările de rezervare se pot face online cu până la 2 ore înainte de sosire. Pentru modificări în ultimul moment, vă rugăm să ne contactați telefonic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
