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
        toast({
          title: "Eroare de sistem",
          description: "Nu s-au putut încărca statisticile rezervărilor. Funcționalitatea poate fi limitată.",
          variant: "destructive",
        });
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
      toast({
        title: "Rezervare pregătită",
        description: "Datele au fost salvate cu succes. Veți fi redirectat pentru finalizarea comenzii.",
        variant: "default",
      })
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
    <form onSubmit={handleSubmit} className="w-full bg-white rounded-2xl flex flex-col gap-3 px-4 py-4 max-w-full mx-auto" style={{maxWidth: '1200px'}}>
      {/* Câmpuri formular */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        {/* Start Date */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label className="text-xs font-semibold text-gray-700 mb-1">Data intrare</label>
          <Popover open={openCalendar === "start"} onOpenChange={open => setOpenCalendar(open ? "start" : null)}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-10"
                type="button"
                onClick={() => setOpenCalendar("start")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: ro }) : "Selectează data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate || new Date()}
                onSelect={date => handleStartDateChange(date || new Date())}
                initialFocus
                disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* End Date */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label className="text-xs font-semibold text-gray-700 mb-1">Data ieșire</label>
          <Popover open={openCalendar === "end"} onOpenChange={open => setOpenCalendar(open ? "end" : null)}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-10"
                type="button"
                onClick={() => setOpenCalendar("end")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: ro }) : "Selectează data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate || new Date()}
                onSelect={date => handleEndDateChange(date || new Date())}
                initialFocus
                disabled={date => date < (startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : new Date(new Date().setHours(0, 0, 0, 0)))}
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* Start Time */}
        <div className="flex flex-col flex-1 min-w-[100px]">
          <label className="text-xs font-semibold text-gray-700 mb-1">Ora intrare</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-10"
                type="button"
              >
                <Clock className="mr-2 h-4 w-4" />
                {startTime}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-2">
                <Label>Ora Intrare</Label>
                <TimePickerDemo value={startTime} onChange={setStartTime} />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {/* End Time */}
        <div className="flex flex-col flex-1 min-w-[100px]">
          <label className="text-xs font-semibold text-gray-700 mb-1">Ora ieșire</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-10"
                type="button"
              >
                <Clock className="mr-2 h-4 w-4" />
                {endTime}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-2">
                <Label>Ora Ieșire</Label>
                <TimePickerDemo value={endTime} onChange={setEndTime} />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {/* License Plate */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label htmlFor="licensePlate" className="text-xs font-semibold text-gray-700 mb-1">Număr înmatriculare</label>
          <Input
            id="licensePlate"
            type="text"
            value={licensePlate}
            onChange={e => setLicensePlate(e.target.value.toUpperCase())}
            className="rounded-lg border-gray-200 text-base px-3 py-2 focus:ring-2 focus:ring-[#ff0066] h-10"
            placeholder="B 00 ABC"
            required
          />
      </div>
      {/* Submit Button */}
        <div className="flex flex-col justify-end min-w-[120px]">
          <label className="text-xs font-semibold text-gray-700 mb-1 opacity-0">Acțiune</label>
        <Button
          type="submit"
            className="h-10 w-full px-6 rounded-md bg-[#ff0066] hover:bg-[#e6005c] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all duration-200"
          disabled={isSubmitting || !!dateError || isLoadingPrices || isLoadingSystemStatus}
        >
            {isSubmitting || isLoadingSystemStatus ? (
              <><Loader2 className="mr-1 h-4 w-4 animate-spin" />{isLoadingSystemStatus ? "Verifică..." : "Procesează..."}</>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Continuă
              </>
            )}
        </Button>
        </div>
      </div>
      
      {/* Afișare preț calculat */}
      {calculatedDays > 0 && !isLoadingPrices && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">
                Perioada: {calculatedDays} {calculatedDays === 1 ? 'zi' : 'zile'}
              </span>
              <span className="text-xs text-gray-500">
                {startDate && endDate ? 
                  `${format(startDate, "d MMM", { locale: ro })} - ${format(endDate, "d MMM", { locale: ro })}` 
                  : ''
                }
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
              <AlertTriangle className="w-3 h-3" />
              Acces cu max 2h înainte
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary">
                {calculatePrice().toFixed(2)} LEI
              </div>
              <div className="text-xs text-gray-500">Preț total</div>
            </div>
          </div>
        </div>
      )}

      {dateError && <div className="text-red-500 text-sm font-semibold mt-1 flex items-center"><XCircle className="mr-1 h-5 w-5" />{dateError}</div>}
    </form>
  )
}
