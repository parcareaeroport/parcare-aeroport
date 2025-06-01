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
import { collection, getDocs, query, orderBy, doc, getDoc, getCountFromServer, where, onSnapshot } from "firebase/firestore" // Importuri Firestore necesare
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

  // === ADĂUGĂM STARE PENTRU TIPUL DE CĂLĂTORIE ===
  const [tripType, setTripType] = useState<'dus-intors' | 'dus'>('dus-intors')

  // useEffect pentru a încărca setările sistemului și numărul de rezervări active
  useEffect(() => {
    let settingsLoaded = false;
    let statsLoaded = false;
    const checkLoaded = () => {
      if (settingsLoaded && statsLoaded) setIsLoadingSystemStatus(false);
    };
    const unsubSettings = onSnapshot(
      doc(db, "config", "reservationSettings"),
      (settingsSnap) => {
        const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
        setReservationSettings({
          maxTotalReservations: settingsData.maxTotalReservations ?? 0,
          reservationsEnabled: settingsData.reservationsEnabled ?? true,
        });
        settingsLoaded = true;
        checkLoaded();
      },
      (error) => {
        console.error("Error fetching reservation settings:", error);
        toast({
          title: "Eroare de sistem",
          description: "Nu s-au putut verifica setările pentru rezervări. Vă rugăm încercați mai târziu.",
          variant: "destructive",
        });
        setReservationSettings({ maxTotalReservations: 0, reservationsEnabled: false });
        settingsLoaded = true;
        checkLoaded();
      }
    );
    const unsubStats = onSnapshot(
      doc(db, "config", "reservationStats"),
      (statsSnap) => {
        const statsData = statsSnap.exists() ? statsSnap.data() : {};
        setActiveBookingsCount(statsData.activeBookingsCount ?? 0);
        statsLoaded = true;
        checkLoaded();
      },
      (error) => {
        console.error("Error fetching reservation stats:", error);
        setActiveBookingsCount(0);
        statsLoaded = true;
        checkLoaded();
      }
    );
    // NU mai apela setIsLoadingSystemStatus(false) aici!
    return () => {
      unsubSettings();
      unsubStats();
    };
  }, [])

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
  }, [])

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col gap-4 px-4 py-6 max-w-5xl mx-auto">
      {/* Selectare tip călătorie */}
      <div className="flex items-center gap-6 mb-2">
        <label className="flex items-center cursor-pointer text-pink-600 font-semibold text-base">
          <input
            type="radio"
            name="tripType"
            value="dus-intors"
            checked={tripType === 'dus-intors'}
            onChange={() => setTripType('dus-intors')}
            className="accent-pink-600 w-5 h-5 mr-2"
          />
          Dus-întors
        </label>
        <label className="flex items-center cursor-pointer text-gray-700 font-semibold text-base">
          <input
            type="radio"
            name="tripType"
            value="dus"
            checked={tripType === 'dus'}
            onChange={() => setTripType('dus')}
            className="accent-pink-600 w-5 h-5 mr-2"
          />
          Dus
        </label>
      </div>
      {/* Câmpuri formular */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Start Date */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label htmlFor="startDate" className="text-xs font-semibold text-gray-700 mb-1">Data intrare</label>
          <Input
            id="startDate"
            type="date"
            value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
            onChange={e => handleStartDateChange(new Date(e.target.value))}
            className="rounded-lg border-gray-200 text-base px-3 py-2 focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        {/* End Date */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label htmlFor="endDate" className="text-xs font-semibold text-gray-700 mb-1">Data ieșire</label>
          <Input
            id="endDate"
            type="date"
            value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
            onChange={e => handleEndDateChange(new Date(e.target.value))}
            className="rounded-lg border-gray-200 text-base px-3 py-2 focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        {/* Start Time */}
        <div className="flex flex-col flex-1 min-w-[100px]">
          <label htmlFor="startTime" className="text-xs font-semibold text-gray-700 mb-1">Ora intrare</label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="rounded-lg border-gray-200 text-base px-3 py-2 focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        {/* End Time */}
        <div className="flex flex-col flex-1 min-w-[100px]">
          <label htmlFor="endTime" className="text-xs font-semibold text-gray-700 mb-1">Ora ieșire</label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="rounded-lg border-gray-200 text-base px-3 py-2 focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        {/* License Plate */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label htmlFor="licensePlate" className="text-xs font-semibold text-gray-700 mb-1">Număr înmatriculare</label>
          <Input
            id="licensePlate"
            type="text"
            value={licensePlate}
            onChange={e => setLicensePlate(e.target.value.toUpperCase())}
            className="rounded-lg border-gray-200 text-base px-3 py-2 focus:ring-2 focus:ring-pink-500"
            placeholder="B 00 ABC"
            required
          />
        </div>
      </div>
      {/* Submit Button */}
      <div className="flex flex-col justify-end mt-2">
        <Button
          type="submit"
          className="h-14 w-full md:w-auto px-10 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-200"
          disabled={isSubmitting || !!dateError || isLoadingPrices || isLoadingSystemStatus}
        >
          <span className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            {isSubmitting || isLoadingSystemStatus ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{isLoadingSystemStatus ? "Verifică..." : "Procesează..."}</>
            ) : (
              "Continuă"
            )}
          </span>
        </Button>
      </div>
      {dateError && <div className="text-red-500 text-sm font-semibold mt-1 flex items-center"><XCircle className="mr-1 h-5 w-5" />{dateError}</div>}
    </form>
  )
}
