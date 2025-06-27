"use client"

import { AlertDescription } from "@/components/ui/alert"

import { AlertTitle } from "@/components/ui/alert"

import { Alert } from "@/components/ui/alert"

import { useState, useEffect, Suspense } from "react"
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  type Timestamp, // Import Timestamp
  increment,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar" // Shadcn Calendar
import { format as formatDateFn, parseISO } from "date-fns" // Renamed to avoid conflict
import { ro } from "date-fns/locale"
import { CalendarIcon, MoreHorizontal, Search, Eye, Loader2, AlertCircle, RefreshCw, Mail } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { cancelBooking as cancelParkingApiBooking, cleanupExpiredBookings, createManualBooking, sendManualBookingEmail } from "@/app/actions/booking-actions" // Acțiunea server pentru API parcare
import { recoverSpecificBooking } from "@/app/actions/booking-recovery" // Recovery pentru rezervări eșuate
import { TimePickerDemo } from "@/components/time-picker"
import { checkExistingReservationByLicensePlate } from "@/lib/booking-utils"
import { Clock, XCircle } from "lucide-react"

interface Booking {
  id: string // Firestore document ID
  licensePlate: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientTitle?: string
  startDate: string // YYYY-MM-DD
  startTime: string // HH:mm
  endDate: string // YYYY-MM-DD
  endTime: string // HH:mm
  
  // Date calculate
  durationMinutes: number
  days?: number
  amount?: number
  
  // Date pentru facturare (persoană juridică)
  company?: string
  companyVAT?: string // CUI/CIF
  companyReg?: string // Număr Registrul Comerțului
  companyAddress?: string
  needInvoice?: boolean
  orderNotes?: string
  
  // Date adresă personală
  address?: string
  city?: string
  county?: string
  postalCode?: string
  
  // Status și plată
  status: "confirmed_test" | "confirmed_paid" | "cancelled_by_admin" | "cancelled_by_api" | "api_error" | "expired" | string
  paymentStatus?: "paid" | "pending" | "refunded" | "n/a"
  paymentIntentId?: string
  
  // Date API externe
  apiBookingNumber?: string // Numărul de la API-ul de parcare
  apiSuccess?: boolean
  apiErrorCode?: string
  apiMessage?: string
  apiRequestPayload?: string
  apiResponseRaw?: string
  apiRequestTimestamp?: Timestamp
  
  // Metadata sistem
  source?: "webhook" | "test_mode" | "manual"
  createdAt: Timestamp // Firestore Timestamp
  lastUpdated?: Timestamp
  expiredAt?: Timestamp // Când a fost marcată ca expirată
  
  // Status email
  emailStatus?: "sent" | "failed"
  emailSentAt?: Timestamp
  lastManualEmailSent?: Timestamp
  manualEmailCount?: number
  lastEmailError?: string
}

function BookingsPageContent() {
  const { toast } = useToast()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [sendingEmailBookingId, setSendingEmailBookingId] = useState<string | null>(null)
  
  // State pentru adăugarea manuală de rezervări
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [isCreatingManual, setIsCreatingManual] = useState(false)
  const [manualLicensePlate, setManualLicensePlate] = useState("")
  const [manualStartDate, setManualStartDate] = useState<Date | undefined>(new Date())
  const [manualStartTime, setManualStartTime] = useState("08:30")
  const [manualEndDate, setManualEndDate] = useState<Date | undefined>(new Date())
  const [manualEndTime, setManualEndTime] = useState("18:30")
  const [manualClientName, setManualClientName] = useState("")
  const [manualClientPhone, setManualClientPhone] = useState("")
  const [manualClientEmail, setManualClientEmail] = useState("")
  const [manualNumberOfPersons, setManualNumberOfPersons] = useState("1")
  const [manualDuplicateError, setManualDuplicateError] = useState<string | null>(null)

  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      const bookingsCollectionRef = collection(db, "bookings")
      // TODO: Adaugă filtre mai complexe dacă e nevoie (ex: query by date range)
      const q = query(bookingsCollectionRef, orderBy("createdAt", "desc"))
      const data = await getDocs(q)
      const fetchedBookings: Booking[] = data.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Booking,
      )
      setBookings(fetchedBookings)
      setFilteredBookings(fetchedBookings) // Inițial, afișează toate
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast({ title: "Eroare", description: "Nu s-au putut încărca rezervările.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchBookings()
    } else if (!authLoading && !user) {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  useEffect(() => {
    let filtered = bookings
    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (b.licensePlate && b.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (b.clientName && b.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (b.clientEmail && b.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (b.apiBookingNumber && b.apiBookingNumber.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter)
    }
    if (dateFilter) {
      const filterDateStr = formatDateFn(dateFilter, "yyyy-MM-dd")
      filtered = filtered.filter((b) => b.startDate === filterDateStr || b.endDate === filterDateStr)
    }
    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, dateFilter])

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsViewDialogOpen(true)
  }

  const handleCancelBooking = async (booking: Booking) => {
    if (!booking.apiBookingNumber) {
      toast({
        title: "Eroare",
        description: "Această rezervare nu are un număr de la API-ul de parcare și nu poate fi anulată automat.",
        variant: "destructive",
      })
      return
    }
    setIsCancelling(true)
    try {
      const result = await cancelParkingApiBooking(booking.apiBookingNumber)
      if (result.success) {
        const bookingDocRef = doc(db, "bookings", booking.id)
        await updateDoc(bookingDocRef, {
          status: "cancelled_by_admin", // Sau un status mai specific
          apiMessage: result.message, // Salvează mesajul de la API
        })
        // OPTIMIZARE: Decrementez contorul de rezervări active
        const statsDocRef = doc(db, "config", "reservationStats")
        await updateDoc(statsDocRef, { activeBookingsCount: increment(-1) })
        toast({
          title: "Rezervare Anulată",
          description: `Rezervarea ${booking.apiBookingNumber} a fost anulată cu succes la API și actualizată local.`,
        })
        fetchBookings() // Reîncarcă lista
        if (isViewDialogOpen) setIsViewDialogOpen(false)
      } else {
        toast({
          title: "Eroare Anulare API",
          description: result.message || "Nu s-a putut anula rezervarea la API-ul de parcare.",
          variant: "destructive",
        })
        // Opțional: actualizează statusul local pentru a reflecta eroarea API
        const bookingDocRef = doc(db, "bookings", booking.id)
        await updateDoc(bookingDocRef, { status: "api_error_cancel", apiMessage: result.message })
        fetchBookings()
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Eroare Sistem",
        description: "A apărut o eroare la procesul de anulare.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleRecoverBooking = async (booking: Booking) => {
    if (booking.status !== "api_error" || booking.paymentStatus !== "paid") {
      toast({
        title: "Rezervarea nu poate fi recuperată",
        description: "Doar rezervările cu plata procesată și API eșuat pot fi recuperate.",
        variant: "destructive",
      })
      return
    }

    setIsRecovering(true)
    try {
      const result = await recoverSpecificBooking(booking.id)
      
      if (result.success) {
        toast({
          title: "Recovery Reușit",
          description: `Rezervarea a fost recuperată cu numărul ${result.bookingNumber}`,
        })
        
        fetchBookings() // Reîncarcă lista
        if (isViewDialogOpen) setIsViewDialogOpen(false)
        
      } else {
        toast({
          title: "Recovery Eșuat",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error recovering booking:", error)
      toast({
        title: "Eroare Recovery",
        description: "A apărut o eroare la procesul de recovery.",
        variant: "destructive",
      })
    } finally {
      setIsRecovering(false)
    }
  }

  const handleCleanupExpired = async () => {
    setIsCleaningUp(true)
    try {
      // Folosește funcția soft cleanup care e mai eficientă
      const { softCleanupExpiredBookings } = await import('@/lib/booking-utils')
      const expiredCount = await softCleanupExpiredBookings()
      
      if (expiredCount > 0) {
        toast({
          title: "Cleanup Finalizat",
          description: `Au fost marcate ${expiredCount} rezervări ca expirate și excluse din categoria activă.`,
        })
      } else {
        toast({
          title: "Cleanup Complet", 
          description: "Nu au fost găsite rezervări expirate de curățat.",
        })
      }
      
      // Reîncarcă lista
      fetchBookings()
      
    } catch (error) {
      console.error('Error during cleanup:', error)
      toast({
        title: "Eroare Cleanup",
        description: "A apărut o eroare la curățarea rezervărilor expirate.",
        variant: "destructive",
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    const uiProcessId = `UI_MANUAL_${Date.now()}`
    
    console.log(`🖥️ [${uiProcessId}] ===== MANUAL BOOKING UI PROCESS STARTED =====`)
    console.log(`🖥️ [${uiProcessId}] Timestamp: ${new Date().toISOString()}`)
    
    if (!user) {
      console.error(`❌ [${uiProcessId}] User not authenticated`)
      console.error(`❌ [${uiProcessId}] User object:`, user)
      
      toast({
        title: "Acces Neautorizat",
        description: "Trebuie să fiți autentificat pentru a adăuga rezervări.",
        variant: "destructive",
      })
      return
    }

    console.log(`✅ [${uiProcessId}] User authenticated:`)
    console.log(`✅ [${uiProcessId}]   User ID: ${user.uid}`)
    console.log(`✅ [${uiProcessId}]   User Email: ${user.email}`)
    console.log(`✅ [${uiProcessId}]   Is Admin: ${isAdmin}`)

    setIsCreatingManual(true)

    // VERIFICARE SUPRAPUNERE PERIOADA pentru același număr de înmatriculare
    try {
      console.log(`🔍 [${uiProcessId}] ===== CHECKING PERIOD OVERLAP =====`)
      console.log(`🔍 [${uiProcessId}] Form data to validate:`)
      console.log(`🔍 [${uiProcessId}]   License Plate: ${manualLicensePlate.toUpperCase()}`)
      console.log(`🔍 [${uiProcessId}]   Start Date: ${manualStartDate ? formatDateFn(manualStartDate, "yyyy-MM-dd") : 'NOT SET'}`)
      console.log(`🔍 [${uiProcessId}]   Start Time: ${manualStartTime}`)
      console.log(`🔍 [${uiProcessId}]   End Date: ${manualEndDate ? formatDateFn(manualEndDate, "yyyy-MM-dd") : 'NOT SET'}`)
      console.log(`🔍 [${uiProcessId}]   End Time: ${manualEndTime}`)
      console.log(`🔍 [${uiProcessId}]   Client Name: ${manualClientName || 'N/A'}`)
      console.log(`🔍 [${uiProcessId}]   Client Email: ${manualClientEmail || 'N/A'}`)
      console.log(`🔍 [${uiProcessId}]   Client Phone: ${manualClientPhone || 'N/A'}`)
      console.log(`🔍 [${uiProcessId}]   Number of Persons: ${manualNumberOfPersons}`)

      const overlapCheckStartTime = Date.now()

      const duplicateCheck = await checkExistingReservationByLicensePlate(
        manualLicensePlate,
        manualStartDate ? formatDateFn(manualStartDate, "yyyy-MM-dd") : '',
        manualEndDate ? formatDateFn(manualEndDate, "yyyy-MM-dd") : '',
        manualStartTime,
        manualEndTime
      )
      
      const overlapCheckDuration = Date.now() - overlapCheckStartTime
      console.log(`🔍 [${uiProcessId}] Overlap check completed in ${overlapCheckDuration}ms`)
      console.log(`🔍 [${uiProcessId}] Overlap result: ${duplicateCheck.exists ? 'CONFLICT FOUND' : 'NO CONFLICT'}`)
      
      if (duplicateCheck.exists && duplicateCheck.existingBooking) {
        const existing = duplicateCheck.existingBooking
        const existingPeriod = `${formatDateFn(new Date(existing.startDate), "d MMM yyyy", { locale: ro })} - ${formatDateFn(new Date(existing.endDate), "d MMM yyyy", { locale: ro })}`
        const newPeriod = `${manualStartDate ? formatDateFn(manualStartDate, "d MMM yyyy", { locale: ro }) : ''} - ${manualEndDate ? formatDateFn(manualEndDate, "d MMM yyyy", { locale: ro }) : ''}`
        
        console.log(`⚠️ [${uiProcessId}] ===== PERIOD OVERLAP DETECTED =====`)
        console.log(`⚠️ [${uiProcessId}] Existing booking details:`)
        console.log(`⚠️ [${uiProcessId}]   ID: ${existing.id}`)
        console.log(`⚠️ [${uiProcessId}]   Period: ${existing.startDate} ${existing.startTime} - ${existing.endDate} ${existing.endTime}`)
        console.log(`⚠️ [${uiProcessId}]   Status: ${existing.status}`)
        console.log(`⚠️ [${uiProcessId}]   Booking Number: ${existing.apiBookingNumber || 'N/A'}`)
        console.log(`⚠️ [${uiProcessId}] New booking period: ${manualStartDate ? formatDateFn(manualStartDate, "yyyy-MM-dd") : ''} ${manualStartTime} - ${manualEndDate ? formatDateFn(manualEndDate, "yyyy-MM-dd") : ''} ${manualEndTime}`)

        // Setează mesajul de eroare persistent pe formular
        const errorMessage = `Perioada ${newPeriod} se suprapune cu rezervarea existentă pentru ${manualLicensePlate.toUpperCase()} din ${existingPeriod}${existing.apiBookingNumber ? ` (Rezervare #${existing.apiBookingNumber})` : ''}`
        setManualDuplicateError(errorMessage)

        console.log(`🚨 [${uiProcessId}] Blocking manual booking due to overlap`)
        console.log(`🚨 [${uiProcessId}] Error message: ${errorMessage}`)

        toast({
          title: "Perioadă Suprapusă",
          description: "Perioada selectată se suprapune cu o rezervare existentă pentru acest număr de înmatriculare.",
          variant: "destructive",
          duration: 5000,
        })
        
        setIsCreatingManual(false)
        return
      } else {
        console.log(`✅ [${uiProcessId}] No period overlap found - can proceed`)
        // Golește mesajul de eroare dacă nu există suprapunere
        setManualDuplicateError(null)
      }
      
    } catch (error) {
      console.error(`❌ [${uiProcessId}] ===== OVERLAP CHECK ERROR =====`)
      console.error(`❌ [${uiProcessId}] Error Type: ${error instanceof Error ? error.constructor.name : typeof error}`)
      console.error(`❌ [${uiProcessId}] Error Message: ${error instanceof Error ? error.message : String(error)}`)
      console.error(`❌ [${uiProcessId}] Error Stack:`, error instanceof Error ? error.stack : 'N/A')
      
      // În caz de eroare, afișăm un warning dar permitem continuarea
      toast({
        title: "Avertisment",
        description: "Nu s-a putut verifica dacă există suprapuneri cu rezervări existente. Dacă aveți deja o rezervare în această perioadă, vă rugăm să nu continuați.",
        duration: 5000,
      })
    }

    try {
      console.log(`🏗️ [${uiProcessId}] ===== PREPARING FORM DATA =====`)
      
      const formData = new FormData()
      formData.append('licensePlate', manualLicensePlate)
      formData.append('startDate', manualStartDate ? formatDateFn(manualStartDate, "yyyy-MM-dd") : '')
      formData.append('startTime', manualStartTime)
      formData.append('endDate', manualEndDate ? formatDateFn(manualEndDate, "yyyy-MM-dd") : '')
      formData.append('endTime', manualEndTime)
      formData.append('clientName', manualClientName)
      formData.append('clientPhone', manualClientPhone)
      formData.append('clientEmail', manualClientEmail)
      formData.append('numberOfPersons', manualNumberOfPersons)

      console.log(`🏗️ [${uiProcessId}] FormData prepared with all fields`)
      console.log(`🏗️ [${uiProcessId}] Calling createManualBooking server action...`)
      
      const createStartTime = Date.now()
      const result = await createManualBooking(formData)
      const createDuration = Date.now() - createStartTime

      console.log(`🏗️ [${uiProcessId}] Server action completed in ${createDuration}ms`)
      console.log(`🏗️ [${uiProcessId}] Result success: ${result.success}`)
      console.log(`🏗️ [${uiProcessId}] Result message: ${result.message}`)

      if (result.success) {
        console.log(`✅ [${uiProcessId}] ===== MANUAL BOOKING CREATED SUCCESSFULLY =====`)
        console.log(`✅ [${uiProcessId}] Booking ID: ${(result as any).bookingId || 'N/A'}`)
        console.log(`✅ [${uiProcessId}] API Booking Number: ${(result as any).apiBookingNumber || 'N/A'}`)
        console.log(`✅ [${uiProcessId}] Success message: ${result.message}`)

        toast({
          title: "Rezervare Adăugată",
          description: result.message,
        })

        console.log(`🧹 [${uiProcessId}] Resetting form fields...`)

        // Resetează formularul
        setManualLicensePlate("")
        setManualStartDate(new Date())
        setManualStartTime("08:30")
        setManualEndDate(new Date())
        setManualEndTime("18:30")
        setManualClientName("")
        setManualClientPhone("")
        setManualClientEmail("")
        setManualNumberOfPersons("1")
        setManualDuplicateError(null)
        setIsManualDialogOpen(false)

        console.log(`🔄 [${uiProcessId}] Refreshing bookings list...`)

        // Reîncarcă lista
        await fetchBookings()
        
        console.log(`🎉 [${uiProcessId}] Manual booking process completed successfully`)
        console.log(`🎉 [${uiProcessId}] Total UI duration: ${Date.now() - (Date.now() - createDuration)}ms`)
      } else {
        console.error(`❌ [${uiProcessId}] ===== MANUAL BOOKING FAILED =====`)
        console.error(`❌ [${uiProcessId}] Error message: ${result.message}`)
        console.error(`❌ [${uiProcessId}] Server duration: ${createDuration}ms`)

        toast({
          title: "Eroare",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`❌ [${uiProcessId}] ===== UI CRITICAL ERROR =====`)
      console.error(`❌ [${uiProcessId}] Error Type: ${error instanceof Error ? error.constructor.name : typeof error}`)
      console.error(`❌ [${uiProcessId}] Error Message: ${error instanceof Error ? error.message : String(error)}`)
      console.error(`❌ [${uiProcessId}] Error Stack:`, error instanceof Error ? error.stack : 'N/A')
      console.error(`❌ [${uiProcessId}] Form state:`, {
        licensePlate: manualLicensePlate,
        startDate: manualStartDate ? formatDateFn(manualStartDate, "yyyy-MM-dd") : null,
        startTime: manualStartTime,
        endDate: manualEndDate ? formatDateFn(manualEndDate, "yyyy-MM-dd") : null,
        endTime: manualEndTime,
        clientName: manualClientName,
        clientEmail: manualClientEmail
      })
      
      toast({
        title: "Eroare",
        description: "A apărut o eroare la crearea rezervării.",
        variant: "destructive",
      })
    } finally {
      console.log(`🏁 [${uiProcessId}] UI process ended, resetting loading state`)
      setIsCreatingManual(false)
    }
  }

  const handleSendEmail = async (booking: Booking) => {
    if (!booking.clientEmail) {
      toast({
        title: "Eroare",
        description: "Această rezervare nu are email-ul clientului.",
        variant: "destructive",
      })
      return
    }

    if (!booking.apiBookingNumber) {
      toast({
        title: "Eroare", 
        description: "Această rezervare nu are număr de la API-ul de parcare și nu se poate genera QR code.",
        variant: "destructive",
      })
      return
    }

    setIsSendingEmail(true)
    setSendingEmailBookingId(booking.id)
    
    try {
      const result = await sendManualBookingEmail(booking.id)
      
      if (result.success) {
        toast({
          title: "Email trimis",
          description: result.message,
          variant: "default",
        })
        // Refresh lista pentru a vedea statusul email-ului actualizat
        await fetchBookings()
      } else {
        toast({
          title: "Eroare la trimiterea email-ului",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Send email error:", error)
      toast({ 
        title: "Eroare", 
        description: "Eroare la trimiterea email-ului. Încercați din nou.", 
        variant: "destructive" 
      })
    } finally {
      setIsSendingEmail(false)
      setSendingEmailBookingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed_paid":
        return <Badge className="bg-green-100 text-green-800">Confirmat (Plătit)</Badge>
      case "confirmed_test":
        return <Badge className="bg-blue-100 text-blue-800">Confirmat (Test)</Badge>
      case "cancelled_by_admin":
        return <Badge className="bg-red-100 text-red-800">Anulat (Admin)</Badge>
      case "cancelled_by_api":
        return <Badge className="bg-red-100 text-red-800">Anulat (API)</Badge>
      case "api_error":
        return <Badge className="bg-orange-100 text-orange-800">Eroare API</Badge>
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800">Expirat</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return <Badge className="bg-gray-500">N/A</Badge>
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Plătită</Badge>
      case "pending":
        return <Badge className="bg-amber-500">În așteptare</Badge>
      case "refunded":
        return <Badge className="bg-blue-500">Rambursată</Badge>
      case "n/a":
        return <Badge className="bg-gray-400">N/A (Test)</Badge>
      default:
        return <Badge className="bg-gray-500">{status}</Badge>
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Se încarcă rezervările...</p>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="text-center p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acces Neautorizat</AlertTitle>
          <AlertDescription>
            Trebuie să fiți autentificat ca administrator pentru a accesa această pagină.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Gestionare Rezervări</h1>
        <div className="flex gap-2">
          {user && (
            <Button 
              onClick={() => setIsManualDialogOpen(true)}
              variant="default"
              size="sm"
            >
              + Adaugă Manual
            </Button>
          )}
          <Button onClick={fetchBookings} disabled={isLoading} size="sm">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Reîncarcă
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
            Toate
          </TabsTrigger>
          <TabsTrigger value="confirmed_paid" onClick={() => setStatusFilter("confirmed_paid")}>
            Confirmate (Plătit)
          </TabsTrigger>
          <TabsTrigger value="confirmed_test" onClick={() => setStatusFilter("confirmed_test")}>
            Confirmate (Test)
          </TabsTrigger>
          <TabsTrigger value="cancelled_by_admin" onClick={() => setStatusFilter("cancelled_by_admin")}>
            Anulate
          </TabsTrigger>
          <TabsTrigger value="expired" onClick={() => setStatusFilter("expired")}>
            Expirate
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-auto flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Caută ID, Nr. Înmat., Client, API Nr..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto hover:text-white">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? formatDateFn(dateFilter, "PPP", { locale: ro }) : "Filtrează după dată"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} />
              </PopoverContent>
            </Popover>
            {(searchTerm || statusFilter !== "all" || dateFilter) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setDateFilter(undefined)
                }}
                className="hover:text-white"
              >
                Resetează
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista Rezervărilor</CardTitle>
            <CardDescription>Vizualizează și gestionează rezervările.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr. API</TableHead>
                  <TableHead>Nr. Înmatriculare</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Perioada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plată</TableHead>
                  <TableHead>Creată la</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nu s-au găsit rezervări.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.apiBookingNumber || booking.id.substring(0, 6)}
                      </TableCell>
                      <TableCell>{booking.licensePlate}</TableCell>
                      <TableCell>{booking.clientName || "N/A"}</TableCell>
                      <TableCell>
                        {formatDateFn(parseISO(booking.startDate), "dd MMM", { locale: ro })} {booking.startTime} -{" "}
                        {formatDateFn(parseISO(booking.endDate), "dd MMM", { locale: ro })} {booking.endTime}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(booking.paymentStatus)}</TableCell>
                      <TableCell>
                        {booking.createdAt
                          ? formatDateFn(booking.createdAt.toDate(), "dd MMM yyyy, HH:mm", { locale: ro })
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleViewBooking(booking)}
                              className="hover:text-white focus:text-white"
                            >
                              <Eye className="mr-2 h-4 w-4" /> Vizualizează
                            </DropdownMenuItem>
                            
                            {/* Buton pentru trimiterea email-ului cu QR code */}
                            {booking.clientEmail && booking.apiBookingNumber && (
                              <DropdownMenuItem
                                onClick={() => handleSendEmail(booking)}
                                disabled={isSendingEmail}
                                className="text-blue-600 focus:text-white focus:bg-blue-600 hover:text-white hover:bg-blue-600"
                              >
                                {isSendingEmail && sendingEmailBookingId === booking.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="mr-2 h-4 w-4" />
                                )}
                                Trimite Email cu QR
                              </DropdownMenuItem>
                            )}
                            {booking.status === "api_error" && booking.paymentStatus === "paid" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleRecoverBooking(booking)}
                                  className="text-blue-600 focus:text-white focus:bg-blue-600 hover:text-white hover:bg-blue-600"
                                  disabled={isRecovering}
                                >
                                  {isRecovering && selectedBooking?.id === booking.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Recuperează Rezervarea
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {isAdmin &&
                              booking.status !== "cancelled_by_admin" &&
                              booking.status !== "cancelled_by_api" &&
                              booking.apiBookingNumber && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleCancelBooking(booking)}
                                    disabled={isCancelling}
                                    className="text-red-600 hover:text-white hover:bg-red-600 focus:text-white focus:bg-red-600"
                                  >
                                    {isCancelling && selectedBooking?.id === booking.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Anulează (API)
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalii Rezervare</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-gray-800">Informații Rezervare</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>ID Firestore:</strong> {selectedBooking.id}
                  </p>
                  <p>
                    <strong>Nr. Rez. API Parcare:</strong> {selectedBooking.apiBookingNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Status Intern:</strong> {getStatusBadge(selectedBooking.status)}
                  </p>
                  <p>
                    <strong>Nr. Înmatriculare:</strong> {selectedBooking.licensePlate}
                  </p>
                  <p>
                    <strong>Data Intrare:</strong>{" "}
                    {formatDateFn(parseISO(selectedBooking.startDate), "dd MMM yyyy", { locale: ro })}, Ora:{" "}
                    {selectedBooking.startTime}
                  </p>
                  <p>
                    <strong>Data Ieșire:</strong>{" "}
                    {formatDateFn(parseISO(selectedBooking.endDate), "dd MMM yyyy", { locale: ro })}, Ora:{" "}
                    {selectedBooking.endTime}
                  </p>
                  <p>
                    <strong>Creată la:</strong>{" "}
                    {selectedBooking.createdAt
                      ? formatDateFn(selectedBooking.createdAt.toDate(), "dd MMM yyyy, HH:mm:ss", { locale: ro })
                      : "N/A"}
                  </p>
                  {selectedBooking.apiMessage && (
                    <p>
                      <strong>Mesaj API:</strong> {selectedBooking.apiMessage}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-gray-800">Informații Client</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Nume:</strong> {selectedBooking.clientName || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedBooking.clientEmail || "N/A"}
                  </p>
                  <p>
                    <strong>Telefon:</strong> {selectedBooking.clientPhone || "N/A"}
                  </p>
                  {selectedBooking.address && (
                    <p>
                      <strong>Adresă:</strong> {selectedBooking.address}
                    </p>
                  )}
                  {(selectedBooking.city || selectedBooking.county || selectedBooking.postalCode) && (
                    <p>
                      <strong>Localitate:</strong> {[selectedBooking.city, selectedBooking.county, selectedBooking.postalCode].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                
                {selectedBooking.needInvoice && (
                  <>
                    <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800">Date Facturare</h3>
                    <div className="space-y-1 text-sm">
                      {selectedBooking.company && (
                        <p>
                          <strong>Denumire firmă:</strong> {selectedBooking.company}
                        </p>
                      )}
                      {selectedBooking.companyVAT && (
                        <p>
                          <strong>CUI/CIF:</strong> {selectedBooking.companyVAT}
                        </p>
                      )}
                      {selectedBooking.companyReg && (
                        <p>
                          <strong>Nr. Reg. Comerțului:</strong> {selectedBooking.companyReg}
                        </p>
                      )}
                      {selectedBooking.companyAddress && (
                        <p>
                          <strong>Adresa firmei:</strong> {selectedBooking.companyAddress}
                        </p>
                      )}
                    </div>
                  </>
                )}
                
                <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800">Informații Plată</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Status Plată:</strong> {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                  </p>
                  <p>
                    <strong>Sumă:</strong> {selectedBooking.amount ? `${selectedBooking.amount.toFixed(2)} RON` : "N/A"}
                  </p>
                  <p>
                    <strong>ID Tranzacție Stripe:</strong> {selectedBooking.paymentIntentId || "N/A"}
                  </p>
                  {selectedBooking.orderNotes && (
                    <p>
                      <strong>Observații:</strong> {selectedBooking.orderNotes}
                    </p>
                  )}
                </div>
                
                <h3 className="text-lg font-medium mt-4 mb-2 text-gray-800">Status Email & QR</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Email Client:</strong> {selectedBooking.clientEmail || "N/A"}
                  </p>
                  <p>
                    <strong>QR Code Disponibil:</strong> {selectedBooking.apiBookingNumber ? "✅ Da" : "❌ Nu (lipsește nr. rezervare API)"}
                  </p>
                  {selectedBooking.apiBookingNumber && (
                    <p>
                      <strong>QR Code:</strong> MPK_RES={selectedBooking.apiBookingNumber.padStart(6, '0')}
                    </p>
                  )}
                  <p>
                    <strong>Status Email:</strong> {selectedBooking.emailStatus ? 
                      (selectedBooking.emailStatus === "sent" ? 
                        <span className="text-green-600">✅ Trimis</span> : 
                        <span className="text-red-600">❌ Eșuat</span>
                      ) : 
                      <span className="text-gray-500">-</span>
                    }
                  </p>
                  {selectedBooking.emailSentAt && (
                    <p>
                      <strong>Email trimis la:</strong> {formatDateFn(selectedBooking.emailSentAt.toDate(), "dd MMM yyyy, HH:mm", { locale: ro })}
                    </p>
                  )}
                  {selectedBooking.manualEmailCount && selectedBooking.manualEmailCount > 0 && (
                    <p>
                      <strong>Email-uri manuale trimise:</strong> {selectedBooking.manualEmailCount}
                    </p>
                  )}
                  {selectedBooking.lastEmailError && (
                    <p>
                      <strong>Ultima eroare email:</strong> <span className="text-red-600 text-xs">{selectedBooking.lastEmailError}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {/* Buton pentru trimiterea email-ului din dialog */}
            {selectedBooking && selectedBooking.clientEmail && selectedBooking.apiBookingNumber && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewDialogOpen(false)
                  handleSendEmail(selectedBooking)
                }}
                disabled={isSendingEmail}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                {isSendingEmail && sendingEmailBookingId === selectedBooking.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Trimite Email cu QR
              </Button>
            )}
            
            {isAdmin &&
              selectedBooking &&
              selectedBooking.status !== "cancelled_by_admin" &&
              selectedBooking.status !== "cancelled_by_api" &&
              selectedBooking.apiBookingNumber && (
                <Button
                  variant="destructive"
                  onClick={() => handleCancelBooking(selectedBooking)}
                  disabled={isCancelling}
                >
                  {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Anulează Rezervarea (API)
                </Button>
              )}
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pentru adăugarea manuală de rezervări */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adaugă Rezervare Manual</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateManualBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Număr Înmatriculare *</label>
                <Input
                  value={manualLicensePlate}
                  onChange={(e) => {
                    setManualLicensePlate(e.target.value.toUpperCase())
                    // Golește eroarea când utilizatorul schimbă numărul
                    setManualDuplicateError(null)
                  }}
                  placeholder="Ex: DB99SDF"
                  className={manualDuplicateError ? "border-red-500" : ""}
                  required
                />
                {manualDuplicateError && (
                  <div className="text-red-500 text-sm font-semibold mt-1 flex items-center">
                    <XCircle className="mr-1 h-4 w-4" />
                    {manualDuplicateError}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Număr Persoane</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={manualNumberOfPersons}
                  onChange={(e) => setManualNumberOfPersons(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Intrare *</label>
                <Input
                  type="date"
                  value={manualStartDate ? formatDateFn(manualStartDate, "yyyy-MM-dd") : ''}
                  onChange={(e) => setManualStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ora Intrare *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal h-10 border border-gray-200 bg-transparent hover:border-[#ff0066] focus:border-[#ff0066] focus:ring-2 focus:ring-[#ff0066]/20 hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900" 
                      type="button"
                    >
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      {manualStartTime}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Oră intrare</label>
                      <TimePickerDemo value={manualStartTime} onChange={setManualStartTime} />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Ieșire *</label>
                <Input
                  type="date"
                  value={manualEndDate ? formatDateFn(manualEndDate, "yyyy-MM-dd") : ''}
                  onChange={(e) => setManualEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ora Ieșire *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal h-10 border border-gray-200 bg-transparent hover:border-[#ff0066] focus:border-[#ff0066] focus:ring-2 focus:ring-[#ff0066]/20 hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900" 
                      type="button"
                    >
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      {manualEndTime}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Oră ieșire</label>
                      <TimePickerDemo value={manualEndTime} onChange={setManualEndTime} />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nume Client</label>
                <Input
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  placeholder="Ex: Ion Popescu"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon Client</label>
                <Input
                  value={manualClientPhone}
                  onChange={(e) => setManualClientPhone(e.target.value)}
                  placeholder="Ex: 0721123456"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Email Client</label>
                <Input
                  type="email"
                  value={manualClientEmail}
                  onChange={(e) => setManualClientEmail(e.target.value)}
                  placeholder="Ex: client@email.com"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                Anulează
              </Button>
              <Button type="submit" disabled={isCreatingManual}>
                {isCreatingManual ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se procesează...
                  </>
                ) : (
                  'Creează Rezervarea'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BookingsPage() {
  return (
    // Suspense este util dacă ai operațiuni asincrone la nivel superior sau parametri de căutare
    // Pentru moment, logica de încărcare este în BookingsPageContent
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Se încarcă pagina...</p>
        </div>
      }
    >
      <BookingsPageContent />
    </Suspense>
  )
}
