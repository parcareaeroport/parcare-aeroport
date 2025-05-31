/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { CalendarDays, ChevronRight, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

/* ---------- types & helpers ---------- */
interface PriceData extends DocumentData {
  days: number
  standardPrice: number
  discountPercentage: number
}

const initialPricePlaceholder = "N/A"
const formatPrice = (v: number, withStar = false) =>
  `${v.toFixed(2)} RON${withStar ? "*" : ""}`

/* ---------- component ---------- */
export default function PricingTableSection() {
  const { toast } = useToast()

  /* ----------- state ----------- */
  const [initialLoading, setInitialLoading] = useState(true) // doar prima încărcare
  const [selectedDayMobile, setSelectedDayMobile] =
    useState<string | undefined>(undefined)

  const [dayKeys, setDayKeys] = useState<string[]>([]) // ex. ["1","2","3"]
  const [pricesReduced, setPricesReduced] = useState<Record<string, string>>({})
  const [pricesStandard, setPricesStandard] = useState<Record<string, string>>({})

  /* ----------- Firestore listener (o singură dată) ----------- */
  useEffect(() => {
    const q = query(collection(db, "prices"), orderBy("days", "asc"))

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const reduced: Record<string, string> = {}
        const standard: Record<string, string> = {}
        const keys: string[] = []

        snap.forEach((d) => {
          const p = d.data() as PriceData
          const k = p.days.toString()
          keys.push(k)

          standard[k] = formatPrice(p.standardPrice)
          const final =
            p.standardPrice - (p.standardPrice * p.discountPercentage) / 100
          reduced[k] = formatPrice(final, p.discountPercentage > 0)
        })

        setDayKeys(keys)
        setPricesReduced(reduced)
        setPricesStandard(standard)
        setSelectedDayMobile((old) => old ?? keys[0]) // setează primul tab
        setInitialLoading(false)
      },
      (err) => {
        console.error("Firestore pricing error:", err)
        toast({
          title: "Eroare la preluarea prețurilor",
          description: "Nu s-au putut încărca tarifele.",
          variant: "destructive",
        })
        setInitialLoading(false)
      },
    )

    return unsub
  }, [])

  /* ----------- split zile în rânduri de max 4 pentru mobile ----------- */
  const rows = useMemo(() => {
    const tmp = [...dayKeys]
    const out: string[][] = []
    while (tmp.length) out.push(tmp.splice(0, 4))
    return out
  }, [dayKeys])

  const reducedReady = !!pricesReduced[selectedDayMobile!]
  const standardReady = !!pricesStandard[selectedDayMobile!]

  /* ======================== JSX ======================== */
  return (
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* ---------- HEADER ---------- */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            <span className="relative inline-block">
              Parcare&nbsp;– Otopeni
              <span className="absolute bottom-2 left-0 w-full h-3 bg-primary/20 -z-10 rounded-full" />
            </span>
          </h2>
          <p className="text-lg sm:text-xl mb-4 sm:mb-5">
            Parcare în Otopeni lângă aeroportul&nbsp;Henri&nbsp;Coandă
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-gray-600 text-xs sm:text-sm">
            {[
              "ASFALTATĂ",
              "Rezervare online",
              "securizată",
              "supraveghere video",
            ].map((tag) => (
              <span
                key={tag}
                className="bg-white px-2 sm:px-3 py-1 rounded-full shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* ---------- BANNER ---------- */}
          <div className="gradient-bg text-white p-4 sm:p-5 text-center">
            <p className="text-base sm:text-xl font-bold">
              Tarife&nbsp;REDUSE* Parcare&nbsp;Otopeni
            </p>
            <p className="text-xs sm:text-sm mt-1 opacity-90">
              * Prețurile promoționale sunt valabile pe perioada afișării pe
              site
            </p>
          </div>

          {/* ======================= MOBILE ======================= */}
          <div className="p-4 sm:p-6 md:hidden">
            <div className="flex items-center gap-4 mb-6 bg-primary/10 p-3 rounded-xl">
              <span className="text-xl font-bold text-primary">30%</span>
              <span className="text-primary font-medium text-sm">REDUCERE</span>
            </div>

            {dayKeys.length > 0 && (
              <Tabs
                value={selectedDayMobile}
                onValueChange={setSelectedDayMobile}
                className="w-full"
              >
                {rows.map((row, idx) => (
                  <TabsList
                    key={`row-${idx}`}
                    className="grid grid-cols-4 mb-6"
                  >
                    {row.map((day) => (
                      <TabsTrigger
                        key={`mob-${day}`}
                        value={day}
                        className="text-xs sm:text-sm"
                      >
                        <div className="flex flex-col items-center">
                          <CalendarDays className="h-4 w-4 mb-1 text-primary" />
                          <span>
                            {day} {day === "1" ? "ZI" : "ZILE"}
                          </span>
                        </div>
                      </TabsTrigger>
                    ))}
                    {/* umple col-urile rămase pt aliniere */}
                    {Array.from({ length: 4 - row.length }).map((_, i) => (
                      <div key={`empty-${idx}-${i}`} />
                    ))}
                  </TabsList>
                ))}

                <TabsContent value={selectedDayMobile!} className="mt-0">
                  <div className="space-y-4">
                    {/* REDUS & STANDARD cards */}
                    {[
                      {
                        label: "REDUS",
                        map: pricesReduced,
                        bg: "primary/10",
                        strike: false,
                        colorSpinner: "primary",
                      },
                      {
                        label: "STANDARD",
                        map: pricesStandard,
                        bg: "gray-100",
                        strike: true,
                        colorSpinner: "gray-400",
                      },
                    ].map(
                      (
                        { label, map, bg, strike, colorSpinner },
                        idx /* index pentru key */,
                      ) => {
                        const ready = !!map[selectedDayMobile!]
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between bg-${bg} p-4 rounded-xl`}
                          >
                            <span
                              className={`font-bold ${
                                label === "REDUS"
                                  ? "text-primary"
                                  : "text-gray-700"
                              }`}
                            >
                              {label}
                            </span>

                            {!ready ? (
                              <Loader2
                                className={`h-5 w-5 animate-spin text-${colorSpinner}`}
                              />
                            ) : (
                              <span
                                className={`font-medium text-lg ${
                                  strike ? "line-through text-gray-400" : ""
                                }`}
                              >
                                {map[selectedDayMobile!] ??
                                  initialPricePlaceholder}
                              </span>
                            )}
                          </div>
                        )
                      },
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <p className="mt-6 text-xs sm:text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
              * TVA&nbsp;19&nbsp;%. Reducerea de 30&nbsp;% se aplică începând cu
              a&nbsp;2-a zi de staționare.{" "}
              <Link
                href="/rezerva"
                className="text-primary hover:underline font-medium"
              >
                Vezi detalii și rezervă
              </Link>
            </p>

            <div className="mt-6 text-center">
              <Link
                href="/rezerva"
                className="inline-flex items-center gap-2 gradient-bg hover:opacity-90 text-white px-6 py-3 rounded-full shadow-md text-sm"
              >
                <span>Rezervă acum</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* ======================= DESKTOP ======================= */}
          <div className="hidden md:block p-8">
            <div className="flex items-center gap-4 mb-8 bg-primary/10 p-4 rounded-xl inline-block">
              <span className="text-2xl font-bold text-primary">30%</span>
              <span className="text-primary font-medium">REDUCERE</span>
            </div>

            {/* HEAD ROW */}
            <div
              className="grid gap-3 mb-6"
              style={{
                gridTemplateColumns: `120px repeat(${dayKeys.length}, minmax(80px,1fr))`,
              }}
            >
              <div />
              {dayKeys.map((d) => {
                const num = Number(d)
                return (
                  <div
                    key={`h-${d}`}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl shadow-sm"
                  >
                    <CalendarDays className="h-5 w-5 text-primary mb-1" />
                    <span className="text-sm font-medium">
                      {num} {num === 1 ? "ZI" : "ZILE"}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* REDUS ROW */}
            <div
              className="grid gap-3 mb-6"
              style={{
                gridTemplateColumns: `120px repeat(${dayKeys.length}, minmax(80px,1fr))`,
              }}
            >
              <div className="flex items-center justify-center bg-primary/10 p-4 rounded-xl">
                <span className="font-bold text-primary">REDUS</span>
              </div>
              {dayKeys.map((d) => (
                <div
                  key={`r-${d}`}
                  className="flex items-center justify-center border border-primary/20 p-4 rounded-xl hover:border-primary/50 transition-colors"
                >
                  {pricesReduced[d] ? (
                    <span className="font-medium">{pricesReduced[d]}</span>
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>
              ))}
            </div>

            {/* STANDARD ROW */}
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `120px repeat(${dayKeys.length}, minmax(80px,1fr))`,
              }}
            >
              <div className="flex items-center justify-center bg-gray-100 p-4 rounded-xl">
                <span className="font-bold">STANDARD</span>
              </div>
              {dayKeys.map((d) => (
                <div
                  key={`s-${d}`}
                  className="flex items-center justify-center border border-gray-200 p-4 rounded-xl"
                >
                  {pricesStandard[d] ? (
                    <span className="font-medium line-through text-gray-400">
                      {pricesStandard[d]}
                    </span>
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
                  )}
                </div>
              ))}
            </div>

            <p className="mt-8 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
              * TVA&nbsp;19&nbsp;%. Reducerea de 30&nbsp;% se aplică începând cu
              a&nbsp;2-a zi de staționare. Consultați tarifele exacte în pagina
              de&nbsp;
              <Link
                href="/rezerva"
                className="text-primary hover:underline font-medium"
              >
                rezervare parcare
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
