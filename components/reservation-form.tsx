"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, Clock, Loader2, AlertTriangle, XCircle } from "lucide-react" // Adăugăm iconițe noi
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { format, addDays, isBefore, isEqual } from "date-fns"
import { ro } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { TimePickerDemo } from "@/components/time-picker"
import { Label } from "@/components/ui/label"
import { collection, getDocs, query, orderBy, doc, getDoc, getCountFromServer, where } from "firebase/firestore" // Importuri Firestore necesare
import { db } from "@/lib/firebase"

interface PriceTier {
  id: string
  days: number
  standardPrice: number
  discountPercentage: number
}

interface ReservationSettings {
  maxTotalReservations: number
  reservationsEnabled: boolean
}

export default function ReservationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 1))
  const [startTime, setStartTime] = useState("08:30")
  const [endTime, setEndTime] = useState("08:30")
  const [licensePlate, setLicensePlate] = useState("")
  const [dateError, setDateError] = useState<string | null>(null)
  const [openCalendar, setOpenCalendar] = useState<"start" | "end" | null>(null)
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([])
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  // Stări noi pentru setările sistemului și rezervările active
  const [reservationSettings, setReservationSettings] = useState<ReservationSettings | null>(null)
  const [activeBookingsCount, setActiveBookingsCount] = useState<number | null>(null)
  const [isLoadingSystemStatus, setIsLoadingSystemStatus] = useState(true)

  // useEffect pentru a încărca setările sistemului și numărul de rezervări active
  useEffect(() => {
    const fetchSystemStatus = async () => {
      setIsLoadingSystemStatus(true)
      try {
        // Fetch reservation settings (limit & enabled status)
        const settingsDocRef = doc(db, "config", "reservationSettings")
        const settingsSnap = await getDoc(settingsDocRef)
        const settingsData = settingsSnap.exists() ? settingsSnap.data() : {} // Obiect gol dacă nu există

        setReservationSettings({
          maxTotalReservations: settingsData.maxTotalReservations ?? 0, // Implicit 0 dacă lipsește
          reservationsEnabled: settingsData.reservationsEnabled ?? true, // Implicit true dacă lipsește
        })

        // Fetch active bookings count
        const bookingsColRef = collection(db, "bookings")
        // Presupunem că rezervările active nu au status 'cancelled' sau 'completed'
        // Ajustați condiția 'where' conform logicii dvs. de business pentru rezervări active
        const q = query(bookingsColRef, where("status", "!=", "cancelled"))
        const countSnap = await getCountFromServer(q)
        setActiveBookingsCount(countSnap.data().count)
      } catch (error) {
        console.error("Error fetching system status:", error)
        toast({
          title: "Eroare de sistem",
          description: "Nu s-au putut verifica setările pentru rezervări. Vă rugăm încercați mai târziu.",
          variant: "destructive",
        })
        // Fallback: considerăm rezervările oprite și limita 0 în caz de eroare
        setReservationSettings({ maxTotalReservations: 0, reservationsEnabled: false })
        setActiveBookingsCount(0)
      } finally {
        setIsLoadingSystemStatus(false)
      }
    }
    fetchSystemStatus()
  }, [toast])

  const getCombinedDateTime = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours, minutes, 0, 0)
    return newDate
  }

  const calculateDaysAndDuration = () => {
    if (!startDate || !endDate || !startTime || !endTime) return { days: 0, durationMinutes: 0 }

    const startDateTime = getCombinedDateTime(startDate, startTime)
    const endDateTime = getCombinedDateTime(endDate, endTime)

    if (endDateTime <= startDateTime) {
      return { days: 0, durationMinutes: 0 }
    }

    const diffMs = endDateTime.getTime() - startDateTime.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const durationMinutes = Math.round(diffMs / (1000 * 60))
    return { days: diffDays || 1, durationMinutes }
  }

  const { days: calculatedDays } = calculateDaysAndDuration()

  const calculatePrice = () => {
    const { days } = calculateDaysAndDuration()
    if (days === 0 || priceTiers.length === 0) return 0

    const bestMatch = priceTiers.find((tier) => tier.days === days)

    if (bestMatch) {
      const finalPrice = bestMatch.standardPrice * (1 - bestMatch.discountPercentage / 100)
      return finalPrice
    } else {
      const oneDayPriceTier = priceTiers.find((tier) => tier.days === 1)
      if (oneDayPriceTier) {
        const finalPricePerDay = oneDayPriceTier.standardPrice * (1 - oneDayPriceTier.discountPercentage / 100)
        return finalPricePerDay * days
      }
      return days * 50 // Fallback
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    if (date && endDate && (isBefore(endDate, date) || isEqual(endDate, date))) {
      setEndDate(addDays(date, 1))
    }
    setTimeout(() => setOpenCalendar(null), 100)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    setTimeout(() => setOpenCalendar(null), 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!startDate || !endDate || !startTime || !endTime || !licensePlate) {
      toast({
        title: "Eroare",
        description: "Vă rugăm să completați toate câmpurile obligatorii.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const startDateTime = getCombinedDateTime(startDate, startTime)
    const endDateTime = getCombinedDateTime(endDate, endTime)

    if (endDateTime <= startDateTime) {
      setDateError("Data și ora de ieșire trebuie să fie după data și ora de intrare.")
      toast({
        title: "Eroare de validare",
        description: "Data și ora de ieșire trebuie să fie după data și ora de intrare.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }
    setDateError(null)

    // Verificări noi pentru statusul sistemului și limita de rezervări
    if (isLoadingSystemStatus) {
      toast({
        title: "Verificare în curs",
        description: "Se verifică disponibilitatea sistemului de rezervări...",
      })
      setIsSubmitting(false)
      return
    }

    if (!reservationSettings?.reservationsEnabled) {
      toast({
        title: "Rezervări Oprite",
        description: (
          <div className="flex items-center">
            <XCircle className="mr-2 h-5 w-5 text-red-400" />
            Ne pare rău, sistemul de rezervări este momentan oprit. Vă rugăm încercați mai târziu.
          </div>
        ),
        variant: "destructive",
        duration: 7000,
      })
      setIsSubmitting(false)
      return
    }

    if (
      reservationSettings &&
      activeBookingsCount !== null &&
      reservationSettings.maxTotalReservations > 0 && // Verificăm dacă limita e setată
      activeBookingsCount >= reservationSettings.maxTotalReservations
    ) {
      toast({
        title: "Limită Atinsă",
        description: (
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-400" />
            Ne pare rău, s-a atins numărul maxim de rezervări disponibile. Vă rugăm încercați mai târziu.
          </div>
        ),
        variant: "destructive",
        duration: 7000,
      })
      setIsSubmitting(false)
      return
    }
    // Sfârșit verificări noi

    try {
      const { days, durationMinutes } = calculateDaysAndDuration()
      const price = calculatePrice()

      if (priceTiers.length === 0 && !isLoadingPrices) {
        toast({
          title: "Eroare prețuri",
          description: "Prețurile nu sunt disponibile momentan. Vă rugăm încercați mai târziu.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const priceDetailsMatch = priceTiers.find((p) => p.days === days)
      const oneDayPriceTierMatch = priceTiers.find((p) => p.days === 1)

      let priceDetailsPayload: any = {
        calculatedAtBooking: true,
        isFallback: true,
        daysTier: days,
        standardPriceTier: 50,
        discountPercentageTier: 0,
      }

      if (priceDetailsMatch) {
        priceDetailsPayload = {
          daysTier: priceDetailsMatch.days,
          standardPriceTier: priceDetailsMatch.standardPrice,
          discountPercentageTier: priceDetailsMatch.discountPercentage,
          calculatedAtBooking: true,
          isFallback: false,
        }
      } else if (oneDayPriceTierMatch) {
        priceDetailsPayload = {
          daysTier: oneDayPriceTierMatch.days,
          standardPriceTier: oneDayPriceTierMatch.standardPrice,
          discountPercentageTier: oneDayPriceTierMatch.discountPercentage,
          calculatedAtBooking: true,
          isFallback: true,
        }
      }

      const reservationDetails = {
        licensePlate,
        startDate: format(startDate, "yyyy-MM-dd"),
        startTime,
        endDate: format(endDate, "yyyy-MM-dd"),
        endTime,
        days,
        durationMinutes,
        price,
        formattedStartDate: format(startDate, "d MMMM yyyy", { locale: ro }),
        formattedEndDate: format(endDate, "d MMMM yyyy", { locale: ro }),
        priceDetails: priceDetailsPayload,
      }

      sessionStorage.setItem("reservationData", JSON.stringify(reservationDetails))
      router.push("/plasare-comanda")
    } catch (error) {
      console.error("Error preparing reservation data:", error)
      toast({
        title: "Eroare",
        description: "A apărut o eroare la pregătirea datelor pentru rezervare.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate && startTime && endTime) {
      validateDates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, startTime, endTime])

  const validateDates = () => {
    if (startDate && endDate && startTime && endTime) {
      const start = getCombinedDateTime(startDate, startTime)
      const end = getCombinedDateTime(endDate, endTime)
      if (end <= start) {
        setDateError("Data și ora de ieșire trebuie să fie după data și ora de intrare.")
        return false
      } else {
        setDateError(null)
        return true
      }
    }
    return true
  }

  useEffect(() => {
    const fetchPriceTiers = async () => {
      setIsLoadingPrices(true)
      try {
        const pricesCollectionRef = collection(db, "prices")
        const q = query(pricesCollectionRef, orderBy("days"))
        const data = await getDocs(q)
        const fetchedTiers: PriceTier[] = data.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as PriceTier,
        )
        setPriceTiers(fetchedTiers)
        if (fetchedTiers.length === 0) {
          toast({
            title: "Atenție",
            description: "Nu sunt definite prețuri în sistem. Se va folosi un preț de fallback.",
            variant: "default",
          })
        }
      } catch (error) {
        console.error("Error fetching price tiers:", error)
        toast({
          title: "Eroare",
          description: "Nu s-au putut încărca prețurile pentru calcul.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingPrices(false)
      }
    }
    fetchPriceTiers()
  }, [toast]) // Adăugat toast la dependențe dacă nu era deja

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
          <Button className="gradient-bg rounded-full text-xs sm:text-sm px-3 sm:px-5 py-2 h-auto shadow-md">
            Rezervare
          </Button>
          <Button
            variant="outline"
            className="rounded-full text-xs sm:text-sm px-3 sm:px-5 py-2 h-auto border-primary/30 text-primary"
            type="button"
          >
            Parcare Otopeni
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 md:mb-6">
          <Button className="gradient-bg font-bold text-xs sm:text-sm py-2 h-auto rounded-xl shadow-md">
            INTRARE*
          </Button>
          <Button className="gradient-bg font-bold text-xs sm:text-sm py-2 h-auto rounded-xl shadow-md">IEȘIRE*</Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="relative">
            <Popover
              open={openCalendar === "start"}
              onOpenChange={(open) => (open ? setOpenCalendar("start") : setOpenCalendar(null))}
            >
              <PopoverTrigger asChild>
                <div
                  className={`bg-white rounded-xl border ${dateError ? "border-red-300" : "border-gray-200"} overflow-hidden flex items-center transition-all hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 cursor-pointer`}
                >
                  <Input
                    type="text"
                    readOnly
                    value={startDate ? format(startDate, "d MMMM", { locale: ro }) : ""}
                    placeholder="Data intrare"
                    className="border-0 rounded-xl pl-2 sm:pl-4 pr-8 sm:pr-10 py-2 h-auto text-xs sm:text-sm focus-visible:ring-0 cursor-pointer"
                  />
                  <CalendarIcon className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  fromDate={new Date()}
                  className="custom-calendar"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="relative">
            <Popover
              open={openCalendar === "end"}
              onOpenChange={(open) => (open ? setOpenCalendar("end") : setOpenCalendar(null))}
            >
              <PopoverTrigger asChild>
                <div
                  className={`bg-white rounded-xl border ${dateError ? "border-red-300" : "border-gray-200"} overflow-hidden flex items-center transition-all hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 cursor-pointer`}
                >
                  <Input
                    type="text"
                    readOnly
                    value={endDate ? format(endDate, "d MMMM", { locale: ro }) : ""}
                    placeholder="Data ieșire"
                    className="border-0 rounded-xl pl-2 sm:pl-4 pr-8 sm:pr-10 py-2 h-auto text-xs sm:text-sm focus-visible:ring-0 cursor-pointer"
                  />
                  <CalendarIcon className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                  disabled={(date) => (startDate ? date < startDate : date < new Date(new Date().setHours(0, 0, 0, 0)))}
                  fromDate={startDate || new Date()}
                  className="custom-calendar"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 md:mb-6">
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className={`bg-white rounded-xl border ${dateError ? "border-red-300" : "border-gray-200"} overflow-hidden flex items-center transition-all hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 cursor-pointer`}
                >
                  <Input
                    type="text"
                    readOnly
                    value={startTime}
                    placeholder="Ora intrare"
                    className="border-0 rounded-xl pl-2 sm:pl-4 pr-8 sm:pr-10 py-2 h-auto text-xs sm:text-sm focus-visible:ring-0 cursor-pointer"
                  />
                  <Clock className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-2">
                  <Label>Ora intrare</Label>
                  <TimePickerDemo value={startTime} onChange={setStartTime} />
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className={`bg-white rounded-xl border ${dateError ? "border-red-300" : "border-gray-200"} overflow-hidden flex items-center transition-all hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 cursor-pointer`}
                >
                  <Input
                    type="text"
                    readOnly
                    value={endTime}
                    placeholder="Ora ieșire"
                    className="border-0 rounded-xl pl-2 sm:pl-4 pr-8 sm:pr-10 py-2 h-auto text-xs sm:text-sm focus-visible:ring-0 cursor-pointer"
                  />
                  <Clock className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-2">
                  <Label>Ora ieșire</Label>
                  <TimePickerDemo value={endTime} onChange={setEndTime} />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {dateError && (
          <div className="text-red-500 text-xs sm:text-sm mb-4 p-2 bg-red-50 rounded-lg border border-red-100">
            <span className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {dateError}
            </span>
          </div>
        )}

        <div className="flex gap-2 sm:gap-4 mb-4 md:mb-6">
          <div className="flex-grow">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
              <Input
                type="text"
                placeholder="Număr înmatriculare"
                className="border-0 rounded-xl py-2 h-auto text-xs sm:text-sm focus-visible:ring-0"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>
          <div className="w-auto">
            <Button
              className="gradient-bg hover:opacity-90 rounded-xl h-full px-4 sm:px-8 shadow-md text-xs sm:text-sm"
              type="submit"
              disabled={
                isSubmitting ||
                !!dateError ||
                !startDate ||
                !endDate ||
                !startTime ||
                !endTime ||
                !licensePlate ||
                isLoadingPrices ||
                isLoadingSystemStatus // Adăugăm isLoadingSystemStatus la condițiile de dezactivare
              }
            >
              {isSubmitting || isLoadingSystemStatus ? ( // Afișăm loader și dacă se încarcă statusul sistemului
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLoadingSystemStatus ? "Verifică..." : "Procesează..."}
                </>
              ) : (
                "Continuă"
              )}
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
          <p className="font-medium text-gray-600 text-xs sm:text-sm">ZILE REZERVATE: {calculatedDays}</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            TOTAL:{" "}
            {isLoadingPrices ? (
              <Loader2 className="inline h-6 w-6 animate-spin" />
            ) : (
              `${calculatePrice().toFixed(2)} LEI`
            )}
          </p>
        </div>

        <p className="text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4 text-center">
          ACCESUL în parcarea Otopeni la INTRARE se face cu maxim 2 ORE înaintea orei de start!
        </p>
      </form>
    </div>
  )
}
