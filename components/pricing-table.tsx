/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Info,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

/* ---------------- types & helpers ---------------- */
interface PriceDataFirestore extends DocumentData {
  days: number
  standardPrice: number
  discountPercentage: number
}

interface PriceRow {
  id: string
  days: number
  standardPrice: number
  discountPercentage: number
  discountValue: number
  finalPrice: number
  discountNote: string
}

const fmt = new Intl.NumberFormat("ro-RO", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/* ---------------- component ---------------- */
export default function PricingTable() {
  const { toast } = useToast()

  /* ---------- state ---------- */
  const [initialLoading, setInitialLoading] = useState(true)
  const [rows, setRows] = useState<PriceRow[]>([])
  const [page, setPage] = useState(0)
  const perPage = 10

  /* ---------- firestore listener ---------- */
  useEffect(() => {
    const q = query(collection(db, "prices"), orderBy("days", "asc"))

    const unsub = onSnapshot(
      q,
      (snap) => {
        const parsed: PriceRow[] = snap.docs.map((d) => {
          const p = d.data() as Omit<PriceDataFirestore, "id">
          const s = Number(p.standardPrice) || 0
          const pct = Number(p.discountPercentage) || 0
          const disc = s * (pct / 100)
          const final = s - disc

          return {
            id: d.id,
            days: p.days,
            standardPrice: s,
            discountPercentage: pct,
            discountValue: disc,
            finalPrice: final,
            discountNote:
              pct > 0
                ? `${fmt.format(disc)} RON (${pct}%)`
                : "Fără reducere",
          }
        })

        setRows(parsed)
        setPage(0)
        setInitialLoading(false)
      },
      (err) => {
        console.error("pricing table:", err)
        toast({
          title: "Eroare la încărcarea prețurilor",
          description: "Nu s-au putut prelua prețurile din baza de date.",
          variant: "destructive",
        })
        setInitialLoading(false)
      },
    )

    return unsub
  }, [])

  /* ---------- pagination ---------- */
  const totalPages = Math.ceil(rows.length / perPage)
  const visibleRows = useMemo(
    () => rows.slice(page * perPage, page * perPage + perPage),
    [rows, page],
  )

  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), [])
  const next = useCallback(
    () => setPage((p) => Math.min(totalPages - 1, p + 1)),
    [totalPages],
  )

  /* ======================= JSX ======================= */
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-waze-pink">
            Parcare Otopeni preț (prețuri per număr de zile)
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            Prețurile sunt actualizate dinamic. Verificați întotdeauna prețul
            final în pagina de rezervare.
          </p>

          {/* ---------------- table shell ---------------- */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* header */}
            <div className="grid grid-cols-4 bg-waze-blue text-white">
              {[
                ["NR. ZILE", ""],
                ["TARIF STANDARD ZILE STAȚIONARE [CU TVA]", "[RON]"],
                ["REDUCERE APLICATĂ", "[RON] (% stabilit)"],
                ["TOTAL RON CU REDUCERE ȘI TVA", "[RON]"],
              ].map(([t, sub], i) => (
                <div
                  key={i}
                  className={`p-4 sm:p-6 text-center font-bold ${
                    i < 3 && "border-r border-white/20"
                  }`}
                >
                  <div className="text-sm sm:text-base">{t}</div>
                  {sub && <div className="text-xs mt-1">{sub}</div>}
                </div>
              ))}
            </div>

            {/* body */}
            <div className="divide-y divide-gray-200">
              {initialLoading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <PlaceholderRow key={i} />
                ))
              ) : rows.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nu sunt prețuri definite în baza de date.
                </div>
              ) : visibleRows.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nu există prețuri pe această pagină.
                </div>
              ) : (
                visibleRows.map((r, idx) => (
                  <div
                    key={r.id}
                    className={`grid grid-cols-4 ${
                      idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-waze-blue/5 transition-colors`}
                  >
                    <Cell>{r.days}</Cell>
                    <Cell>{fmt.format(r.standardPrice)}</Cell>
                    <Cell>
                      <span
                        className={`${
                          r.discountPercentage > 0 ? "text-waze-pink" : ""
                        } font-medium`}
                      >
                        {r.discountNote}
                      </span>
                    </Cell>
                    <Cell bold className="text-waze-blue">
                      {fmt.format(r.finalPrice)}
                    </Cell>
                  </div>
                ))
              )}
            </div>

            {/* pagination */}
            {rows.length > 0 && (
              <div className="bg-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prev}
                    disabled={page === 0 || initialLoading}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={next}
                    disabled={page >= totalPages - 1 || initialLoading}
                    className="h-8 px-2"
                  >
                    Următor
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="text-sm text-gray-500">
                  Pagina {totalPages ? page + 1 : 0} din {totalPages}
                  {totalPages > 0 && (
                    <>
                      {" "}
                      • Intrări {page * perPage + 1}-
                      {Math.min((page + 1) * perPage, rows.length)} din{" "}
                      {rows.length}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* footnote + CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Info className="h-5 w-5 text-waze-blue flex-shrink-0 mt-0.5" />
              <p>
                Prețurile includ TVA. Reducerile sunt aplicate conform setărilor
                și pot varia.
              </p>
            </div>

            <Link href="/rezerva">
              <Button className="bg-[#ff0066] hover:bg-[#e6005c] rounded-full px-8 py-4 h-auto shadow-md hover:shadow-lg flex items-center gap-2 text-white font-medium transition-all duration-200 hover:scale-105">
                <Calendar className="h-5 w-5" />
                <span>REZERVĂ ACUM</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- tiny helpers ---------------- */
const PlaceholderRow = () => (
  <div className="grid grid-cols-4 bg-white h-[69px]">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className={`p-4 sm:p-6 flex items-center justify-center ${
          i < 3 && "border-r border-gray-200"
        }`}
      >
        <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
      </div>
    ))}
  </div>
)

function Cell({
  children,
  bold = false,
  className = "",
}: {
  children: React.ReactNode
  bold?: boolean
  className?: string
}) {
  return (
    <div
      className={`p-4 sm:p-6 text-center border-gray-200 ${
        bold ? "font-bold" : "font-medium"
      } ${className} ${className.includes("border-r") ? "" : "border-r"}`}
    >
      {children}
    </div>
  )
}
