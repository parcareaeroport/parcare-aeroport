"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, Clock, Loader2, AlertTriangle, XCircle, MapPin, Navigation } from "lucide-react" // Adăugăm iconițe noi
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
import { checkAvailability, checkExistingReservationByLicensePlate } from "@/lib/booking-utils" // Import pentru verificarea disponibilității și duplicatelor

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
  const [startTime, setStartTime] = useState("00:00")
  const [endTime, setEndTime] = useState("00:00")
  const [licensePlate, setLicensePlate] = useState("")
  const [dateError, setDateError] = useState<string | null>(null)
  const [timeError, setTimeError] = useState<string | null>(null)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)
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
    // Golește erorile când utilizatorul schimbă datele
    setDuplicateError(null)
    setTimeError(null)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    setTimeout(() => setOpenCalendar(null), 100)
    // Golește erorile când utilizatorul schimbă datele
    setDuplicateError(null)
    setTimeError(null)
  }

  const handleStartTimeChange = (time: string) => {
    setStartTime(time)
    setTimeError(null)
  }

  const handleEndTimeChange = (time: string) => {
    setEndTime(time)
    setTimeError(null)
  }

  // Funcție pentru formatarea numărului de înmatriculare
  const formatLicensePlate = (input: string) => {
    // Elimină spațiile și liniuțele și convertește la uppercase
    return input.replace(/[\s-]/g, '').toUpperCase()
  }

  // Handler pentru schimbarea numărului de înmatriculare
  const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicensePlate(e.target.value)
    setLicensePlate(formatted)
    // Golește erorile când utilizatorul schimbă numărul
    setDuplicateError(null)
    setTimeError(null)
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

    // Validare pentru ore - nu permite 00:00
    if (startTime === "00:00" || endTime === "00:00") {
      setTimeError("VĂ RUGĂM SĂ INDICAȚI ORA DE SOSIRE / PLECARE!")
      toast({
        title: "Eroare de validare",
        description: "Vă rugăm să indicați ora de sosire și plecare.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }
    setTimeError(null)

    const startDateTime = getCombinedDateTime(startDate, startTime)
    const endDateTime = getCombinedDateTime(endDate, endTime)

    if (endDateTime <= startDateTime) {
      setDateError("Dată și oră de ieșire trebuie să fie după Dată și oră de intrare.")
      toast({
        title: "Eroare de validare",
        description: "Dată și oră de ieșire trebuie să fie după Dată și oră de intrare.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }
    setDateError(null)

    // VERIFICARE NOUĂ: Verifică dacă există suprapunere cu rezervări existente pentru același număr de înmatriculare
    try {
      console.log('🔍 VERIFICARE SUPRAPUNERE PERIOADA - Înainte de continuare', {
        licensePlate: licensePlate.toUpperCase(),
        newPeriod: `${format(startDate, "yyyy-MM-dd")} ${startTime} - ${format(endDate, "yyyy-MM-dd")} ${endTime}`,
        timestamp: new Date().toISOString()
      })

      const duplicateCheck = await checkExistingReservationByLicensePlate(
        licensePlate,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
        startTime,
        endTime
      )
      
      if (duplicateCheck.exists && duplicateCheck.existingBooking) {
        const existing = duplicateCheck.existingBooking
        const existingPeriod = `${format(new Date(existing.startDate), "d MMM yyyy", { locale: ro })} - ${format(new Date(existing.endDate), "d MMM yyyy", { locale: ro })}`
        const newPeriod = `${format(startDate, "d MMM yyyy", { locale: ro })} - ${format(endDate, "d MMM yyyy", { locale: ro })}`
        
        console.log('⚠️ SUPRAPUNERE PERIOADA GĂSITĂ - Blochează continuarea:', {
          existingId: existing.id,
          existingPeriod: `${existing.startDate} ${existing.startTime} - ${existing.endDate} ${existing.endTime}`,
          newPeriod: `${format(startDate, "yyyy-MM-dd")} ${startTime} - ${format(endDate, "yyyy-MM-dd")} ${endTime}`,
          existingStatus: existing.status,
          existingBookingNumber: existing.apiBookingNumber
        })

        // Setează mesajul de eroare persistent pe formular
        const errorMessage = `Perioada ${newPeriod} se suprapune cu rezervarea existentă pentru ${licensePlate.toUpperCase()} din ${existingPeriod}${existing.apiBookingNumber ? ` (Rezervare #${existing.apiBookingNumber})` : ''}`
        setDuplicateError(errorMessage)

        toast({
          title: "Perioadă Suprapusă",
          description: "Perioada selectată se suprapune cu o rezervare existentă pentru acest număr de înmatriculare.",
          variant: "destructive",
          duration: 5000,
        })
        
        setIsSubmitting(false)
        return
      } else {
        console.log('✅ NU EXISTĂ SUPRAPUNERE - Poate continua')
        // Golește mesajul de eroare dacă nu există suprapunere
        setDuplicateError(null)
      }
      
    } catch (error) {
      console.error("❌ EROARE la verificarea suprapunerii:", error)
      // În caz de eroare, afișăm un warning dar permitem continuarea
      toast({
        title: "Avertisment",
        description: "Nu s-a putut verifica dacă există suprapuneri cu rezervări existente. Dacă aveți deja o rezervare în această perioadă, vă rugăm să nu continuați.",
        duration: 5000,
      })
    }

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
        title: "Limită Atinsă Global",
        description: (
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-400" />
            Ne pare rău, s-a atins numărul maxim global de rezervări disponibile. Vă rugăm încercați mai târziu.
          </div>
        ),
        variant: "destructive",
        duration: 7000,
      })
      setIsSubmitting(false)
      return
    }

    // VERIFICARE NOUĂ: Disponibilitate pentru perioada specifică selectată
    if (reservationSettings?.maxTotalReservations && reservationSettings.maxTotalReservations > 0) {
      try {
        console.log('🚀 ÎNCEPERE VERIFICARE DISPONIBILITATE - Butón "Continuă" apăsat', {
          timestamp: new Date().toISOString(),
          userInput: {
            startDate: format(startDate, "yyyy-MM-dd"),
            startTime,
            endDate: format(endDate, "yyyy-MM-dd"), 
            endTime,
            licensePlate,
            calculatedDays: calculateDaysAndDuration().days
          },
          systemSettings: {
            maxTotalReservations: reservationSettings.maxTotalReservations,
            reservationsEnabled: reservationSettings.reservationsEnabled,
            currentActiveBookings: activeBookingsCount
          }
        })

        const availabilityCheck = await checkAvailability(
          format(startDate, "yyyy-MM-dd"),
          startTime,
          format(endDate, "yyyy-MM-dd"),
          endTime
        )

        console.log('📊 REZULTAT VERIFICARE DISPONIBILITATE:', {
          period: `${format(startDate, "d MMM", { locale: ro })} - ${format(endDate, "d MMM", { locale: ro })}`,
          conflictingBookings: availabilityCheck.conflictingBookings,
          totalSpots: availabilityCheck.totalSpots,
          maxBookingsInPeriod: availabilityCheck.maxBookingsInPeriod,
          available: availabilityCheck.available,
          wouldExceedAfterAdding: (availabilityCheck.conflictingBookings + 1) > reservationSettings.maxTotalReservations,
          occupancyRate: `${(availabilityCheck.conflictingBookings / availabilityCheck.totalSpots * 100).toFixed(1)}%`,
          spotsRemaining: availabilityCheck.totalSpots - availabilityCheck.conflictingBookings
        })

        // Verifică dacă adăugarea acestei rezervări ar depăși limita pentru perioada selectată
        const wouldExceedLimit = (availabilityCheck.conflictingBookings + 1) > reservationSettings.maxTotalReservations

        console.log('🧮 CALCUL LIMITĂ:', {
          conflictingBookings: availabilityCheck.conflictingBookings,
          maxTotalReservations: reservationSettings.maxTotalReservations,
          afterAddingThis: availabilityCheck.conflictingBookings + 1,
          wouldExceedLimit,
          decision: wouldExceedLimit ? '❌ REZERVARE BLOCATĂ - Limită depășită' : '✅ REZERVARE PERMISĂ'
        })

        if (wouldExceedLimit) {
          const availableSpots = reservationSettings.maxTotalReservations - availabilityCheck.conflictingBookings
          toast({
            title: "Perioada Indisponibilă",
            description: (
              <div className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-400" />
                Pentru perioada selectată ({format(startDate, "d MMM", { locale: ro })} - {format(endDate, "d MMM", { locale: ro })}) sunt disponibile doar {availableSpots} locuri. Vă rugăm să alegeți o altă perioadă.
              </div>
            ),
            variant: "destructive",
            duration: 8000,
          })
          setIsSubmitting(false)
          return
        }

        // Informare utilizator despre disponibilitate
        if (availabilityCheck.conflictingBookings > 0) {
          const remainingSpots = reservationSettings.maxTotalReservations - availabilityCheck.conflictingBookings - 1
          console.log('ℹ️ INFORMARE UTILIZATOR:', {
            conflictingBookings: availabilityCheck.conflictingBookings,
            remainingSpots,
            message: `Rezervarea este posibilă. În perioada selectată mai sunt ${remainingSpots} locuri libere.`
          })
          toast({
            title: "Loc Disponibil",
            description: `Rezervarea este posibilă. În perioada selectată mai sunt ${remainingSpots} locuri libere.`,
            duration: 3000,
          })
        } else {
          console.log('✨ PERIOADA LIBERĂ:', {
            message: 'Nicio rezervare existentă în perioada selectată - disponibilitate completă',
            totalSpots: reservationSettings.maxTotalReservations
          })
        }

      } catch (error) {
        console.error("❌ EROARE CRITICĂ în verificarea disponibilității:", {
          error: error,
          errorMessage: error instanceof Error ? error.message : 'Eroare necunoscută',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          userInput: {
            startDate: format(startDate, "yyyy-MM-dd"),
            startTime,
            endDate: format(endDate, "yyyy-MM-dd"),
            endTime,
            licensePlate
          }
        })
        toast({
          title: "Eroare Verificare",
          description: "Nu s-a putut verifica disponibilitatea pentru perioada selectată. Vă rugăm încercați din nou.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
    }
    // Sfârșit verificări noi
    
    console.log('🎉 VERIFICĂRI DISPONIBILITATE FINALIZATE CU SUCCES - Continuă la procesarea rezervării')

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
        setDateError("Dată și oră de ieșire trebuie să fie după Dată și oră de intrare.")
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
        {/* Entry Section - Dată și oră Intrare */}
        <div className="flex flex-col flex-1 mb-2 md:mb-0">
          {/* Header pentru Dată și oră Intrare */}
          <div className="flex w-full bg-waze-blue text-white px-3 py-2 rounded-md border border-waze-blue mb-2 justify-center">
            <span className="text-sm font-semibold tracking-wider">Dată și oră Intrare</span>
          </div>
          
          {/* Container pentru inputurile de intrare */}
          <div className="flex flex-row gap-3 w-full">
            {/* Start Date */}
            <div className="flex flex-col flex-2 min-w-0">
              <Popover open={openCalendar === "start"} onOpenChange={open => setOpenCalendar(open ? "start" : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left font-normal h-10 border border-gray-200 bg-transparent hover:border-[#ff0066] focus:border-[#ff0066] focus:ring-2 focus:ring-[#ff0066]/20 hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900"
                    type="button"
                    onClick={() => setOpenCalendar("start")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ro }) : "Selectează data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate || new Date()}
                    onSelect={date => handleStartDateChange(date || new Date())}
                    disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* Start Time */}
            <div className="flex flex-col flex-1 min-w-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-left font-normal h-10 border bg-transparent hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900 ${
                      timeError 
                        ? "border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                        : "border-gray-200 hover:border-[#ff0066] focus:border-[#ff0066] focus:ring-2 focus:ring-[#ff0066]/20"
                    }`}
                    type="button"
                  >
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    {startTime}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-2">
                    <Label>Oră intrare</Label>
                    <TimePickerDemo value={startTime} onChange={handleStartTimeChange} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Exit Section - Dată și oră Ieșire */}
        <div className="flex flex-col flex-1 mb-2 md:mb-0">
          {/* Header pentru Dată și oră Ieșire */}
          <div className="flex w-full bg-waze-blue text-white px-3 py-2 rounded-md border border-waze-blue mb-2 justify-center">
            <span className="text-sm font-semibold tracking-wider">Dată și oră Ieșire</span>
          </div>
          
          {/* Container pentru inputurile de ieșire */}
          <div className="flex flex-row gap-3 w-full">
            {/* End Date */}
            <div className="flex flex-col flex-2 min-w-0">
              <Popover open={openCalendar === "end"} onOpenChange={open => setOpenCalendar(open ? "end" : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left font-normal h-10 border border-gray-200 bg-transparent hover:border-[#ff0066] focus:border-[#ff0066] focus:ring-2 focus:ring-[#ff0066]/20 hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900"
                    type="button"
                    onClick={() => setOpenCalendar("end")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ro }) : "Selectează data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate || new Date()}
                    onSelect={date => handleEndDateChange(date || new Date())}
                    disabled={date => date < (startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : new Date(new Date().setHours(0, 0, 0, 0)))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* End Time */}
            <div className="flex flex-col flex-1 min-w-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-left font-normal h-10 border bg-transparent hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900 ${
                      timeError 
                        ? "border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                        : "border-gray-200 hover:border-[#ff0066] focus:border-[#ff0066] focus:ring-2 focus:ring-[#ff0066]/20"
                    }`}
                    type="button"
                  >
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    {endTime}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-2">
                    <Label>Oră ieșire</Label>
                    <TimePickerDemo value={endTime} onChange={handleEndTimeChange} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* License Plate Section */}
        <div className="flex flex-col flex-1 mb-2 md:mb-0">
          {/* Header pentru Număr înmatriculare */}
          <div className="flex w-full text-white px-3 py-2 rounded-md bg-waze-blue   border border-waze-blue mb-2 justify-center">
            <span className="text-sm font-semibold tracking-wider">Număr înmatriculare</span>
          </div>
          
          <div className="flex flex-col">
            <Input
              id="licensePlate"
              type="text"
              value={licensePlate}
              onChange={handleLicensePlateChange}
              className={`rounded-lg border-gray-200 text-base px-3 py-2 hover:border-[#ff0066] focus:border-[#ff0066] focus:ring-2 focus:ring-[#ff0066]/20 focus:outline-none h-10 ${duplicateError ? "border-red-500" : ""}`}
              placeholder="Ex: DB99SDF"
              required
            />
            {duplicateError && (
              <div className="text-red-500 text-sm font-semibold mt-1 flex items-center">
                <XCircle className="mr-1 h-5 w-5" />
                {duplicateError}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button Section */}
        <div className="flex flex-col flex-1 mb-2 md:mb-0">
          {/* Header invizibil pentru aliniament cu inputurile - doar pe desktop */}
          <div className="hidden md:flex w-full px-3 py-2 rounded-md mb-2 justify-center opacity-0 pointer-events-none">
            <span className="text-sm font-semibold tracking-wider">Placeholder</span>
          </div>
          
          <Button
            type="submit"
            className="h-10 w-full px-6 rounded-md bg-[#ff0066] hover:bg-[#e6005c] text-white font-bold text-base md:text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all duration-200 tracking-widest"
            disabled={isSubmitting || !!dateError || isLoadingPrices || isLoadingSystemStatus}
          >
            {isSubmitting || isLoadingSystemStatus ? (
              <><Loader2 className="mr-1 h-4 w-4 animate-spin" />{isLoadingSystemStatus ? "Verifică..." : "Procesează..."}</>
            ) : (
              <>
                Rezervă
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Afișare preț calculat */}
      {calculatedDays > 0 && !isLoadingPrices && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Perioada și interval */}
            <div className="flex flex-col">
        
              <span className="text-lg font-medium text-gray-600">
                Perioada: {calculatedDays} {calculatedDays === 1 ? 'zi' : 'zile'}
              </span>
              <span className="text-lg text-gray-500">
                {startDate && endDate ? 
                  `${format(startDate, "d MMM", { locale: ro })} - ${format(endDate, "d MMM", { locale: ro })}` 
                  : ''
                }
              </span>
              <div className="flex items-center gap-1 text-sm text-orange-600 font-medium">
                <AlertTriangle className="w-3 h-3" />
                Acces cu max 2h înainte
              </div>
            </div>
            
            {/* Acces și butoane locație */}
            <div className="flex flex-col gap-2">
          
              <div className="flex gap-10 w-full">
                <a
                  href="https://maps.app.goo.gl/GhoVMNWvst6BamHx5?g_st=aw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-[#ff0066] hover:bg-[#e6005c] text-white px-4 py-2 md:px-6 md:py-3 rounded-md text-sm font-bold tracking-widest transition-all duration-200"
                  title="Deschide în Google Maps"
                >
                  <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                  Maps
                </a>
                <a
                  href="https://waze.com/ul?ll=44.575660,26.069918&navigate=yes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-[#0099ff] hover:bg-[#007acc] text-white px-4 py-2 md:px-6 md:py-3 rounded-md text-sm font-bold tracking-widest transition-all duration-200"
                  title="Deschide în Waze"
                >
                  <Navigation className="w-3 h-3 md:w-4 md:h-4" />
                  Waze
                </a>
              </div>
            </div>
            
            {/* Preț */}
            <div className="text-left md:text-right">
              <div className="text-xl font-bold text-primary">
                {calculatePrice().toFixed(2)} LEI
              </div>
              <div className="text-sm text-gray-500">Preț total</div>
            </div>
          </div>
        </div>
      )}

      {timeError && <div className="text-red-500 text-sm font-semibold mt-1 flex items-center"><XCircle className="mr-1 h-5 w-5" />{timeError}</div>}
      {dateError && <div className="text-red-500 text-sm font-semibold mt-1 flex items-center"><XCircle className="mr-1 h-5 w-5" />{dateError}</div>}
    </form>
  )
}
