"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Mail, Phone, User, Calendar, Car, Hash, CalendarIcon, Clock } from "lucide-react"
import { format, addDays } from "date-fns"
import { ro } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { TimePickerDemo } from "@/components/time-picker"

export default function CancellationForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
  }>({ type: null, message: "" })
  
  // Debug toast function
  console.log("🔧 CLIENT: CancellationForm component loaded")
  console.log("🔧 CLIENT: useToast hook:", typeof toast === 'function' ? "✅ Available" : "❌ Not available")
  
  // Test toast on component mount (only once for 5 seconds)
  useEffect(() => {
    const testToast = () => {
      console.log("🧪 CLIENT: Testing toast notification...")
      toast({
        title: "Test Toast",
        description: "Dacă vezi acest mesaj, toast-ul funcționează!",
        variant: "default",
      })
      console.log("🧪 CLIENT: Test toast triggered")
    }
    
    // Trigger test toast after 2 seconds
    const timer = setTimeout(testToast, 2000)
    
    // Cleanup timer
    return () => clearTimeout(timer)
  }, [toast])
  
  // Form data
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [bookingNumber, setBookingNumber] = useState("")
  const [licensePlate, setLicensePlate] = useState("")
  
  // Reservation period data
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 1))
  const [startTime, setStartTime] = useState("08:30")
  const [endTime, setEndTime] = useState("18:00")
  const [openCalendar, setOpenCalendar] = useState<"start" | "end" | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🔥 CLIENT: Form submission started")
    setIsSubmitting(true)

    // Clear any previous status
    setStatusMessage({ type: null, message: "" })

    // Validare câmpuri
    if (!firstName || !lastName || !phone || !email || !bookingNumber || !licensePlate || !startDate || !endDate) {
      console.log("❌ CLIENT: Validation failed - missing required fields")
      console.log("   - firstName:", firstName)
      console.log("   - lastName:", lastName)
      console.log("   - phone:", phone)
      console.log("   - email:", email)
      console.log("   - bookingNumber:", bookingNumber)
      console.log("   - licensePlate:", licensePlate)
      console.log("   - startDate:", startDate)
      console.log("   - endDate:", endDate)
      
      const errorMsg = "Vă rugăm să completați toate câmpurile obligatorii."
      setStatusMessage({ type: 'error', message: errorMsg })
      
      toast({
        title: "Eroare",
        description: errorMsg,
        variant: "destructive",
      })
      console.log("🔔 CLIENT: Error toast triggered")
      setIsSubmitting(false)
      return
    }

    // Formatează perioada rezervării
    const formattedStartDate = format(startDate, "d MMMM yyyy", { locale: ro })
    const formattedEndDate = format(endDate, "d MMMM yyyy", { locale: ro })
    const reservationPeriod = `${formattedStartDate}, ${startTime} - ${formattedEndDate}, ${endTime}`

    console.log("✅ CLIENT: Validation passed, preparing data")
    console.log("   - Formatted period:", reservationPeriod)
    console.log("   - Client:", firstName, lastName)
    console.log("   - Booking:", bookingNumber)
    console.log("   - License plate:", licensePlate)

    try {
      console.log("📤 CLIENT: Sending request to API...")
      const response = await fetch("/api/send-cancellation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          bookingNumber,
          licensePlate,
          reservationPeriod,
          startDate: format(startDate, "yyyy-MM-dd"),
          startTime,
          endDate: format(endDate, "yyyy-MM-dd"),
          endTime,
        }),
      })

      console.log("📥 CLIENT: Response received")
      console.log("   - Status:", response.status)
      console.log("   - Status text:", response.statusText)
      console.log("   - OK:", response.ok)

      if (response.ok) {
        const responseData = await response.json()
        console.log("✅ CLIENT: Success response:", responseData)
        
        const successMsg = "✅ Cererea de anulare a fost trimisă cu succes! Vă vom contacta în cel mai scurt timp pentru confirmarea anulării."
        setStatusMessage({ type: 'success', message: successMsg })
        
        console.log("🔔 CLIENT: Triggering success toast")
        toast({
          title: "Cererea de anulare a fost trimisă",
          description: "Vă vom contacta în cel mai scurt timp pentru confirmarea anulării.",
          variant: "default",
        })
        
        console.log("🔄 CLIENT: Resetting form")
        // Reset form
        setFirstName("")
        setLastName("")
        setPhone("")
        setEmail("")
        setBookingNumber("")
        setLicensePlate("")
        setStartDate(new Date())
        setEndDate(addDays(new Date(), 1))
        setStartTime("08:30")
        setEndTime("18:00")
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setStatusMessage({ type: null, message: "" })
          console.log("✅ CLIENT: Success message cleared after timeout")
        }, 5000)
        
        console.log("✅ CLIENT: Form reset completed")
      } else {
        const errorData = await response.json()
        console.log("❌ CLIENT: Error response:", errorData)
        throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("❌ CLIENT: Catch block triggered")
      console.error("   - Error:", error)
      console.error("   - Error message:", error instanceof Error ? error.message : 'Unknown error')
      
      const errorMsg = "❌ Nu s-a putut trimite cererea. Vă rugăm încercați din nou sau contactați-ne telefonic."
      setStatusMessage({ type: 'error', message: errorMsg })
      
      console.log("🔔 CLIENT: Triggering error toast")
      toast({
        title: "Eroare",
        description: "Nu s-a putut trimite cererea. Vă rugăm încercați din nou.",
        variant: "destructive",
      })
    } finally {
      console.log("🏁 CLIENT: Form submission completed")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Message Display */}
      {statusMessage.type && (
        <div className={`rounded-lg p-4 text-sm font-medium ${
          statusMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : statusMessage.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-800'
            : statusMessage.type === 'info'
            ? 'bg-blue-50 border border-blue-200 text-blue-800'
            : ''
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <span>✅</span>}
            {statusMessage.type === 'error' && <span>❌</span>}
            {statusMessage.type === 'info' && <span>ℹ️</span>}
            <span>{statusMessage.message}</span>
          </div>
        </div>
      )}

      {/* Nume și Prenume */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            Prenume
          </Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prenumele dvs."
            required
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            Nume
          </Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Numele dvs."
            required
            className="h-12"
          />
        </div>
      </div>

      {/* Telefon și Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            Telefon
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xx xxx xxx"
            required
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplu.com"
            required
            className="h-12"
          />
        </div>
      </div>

      {/* Număr rezervare și Număr înmatriculare */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bookingNumber" className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-500" />
            Număr rezervare
          </Label>
          <Input
            id="bookingNumber"
            type="text"
            value={bookingNumber}
            onChange={(e) => setBookingNumber(e.target.value)}
            placeholder="Ex: 000123"
            required
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="licensePlate" className="flex items-center gap-2">
            <Car className="h-4 w-4 text-gray-500" />
            Număr înmatriculare
          </Label>
          <Input
            id="licensePlate"
            type="text"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
            placeholder="Ex: DB99SDF"
            required
            className="h-12"
          />
        </div>
      </div>

      {/* Perioada rezervării */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Calendar className="h-4 w-4 text-gray-500" />
          Perioada rezervării
        </Label>
        
        {/* Data și ora intrare */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Data intrare</Label>
            <Popover open={openCalendar === "start"} onOpenChange={open => setOpenCalendar(open ? "start" : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left font-normal h-12 border border-gray-200 bg-transparent hover:border-[#ee7f1a] focus:border-[#ee7f1a] focus:ring-2 focus:ring-[#ee7f1a]/20 hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900"
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
                  onSelect={date => setStartDate(date || new Date())}
                  disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Ora intrare</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left font-normal h-12 border border-gray-200 bg-transparent hover:border-[#ee7f1a] focus:border-[#ee7f1a] focus:ring-2 focus:ring-[#ee7f1a]/20 hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900"
                  type="button"
                >
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  {startTime}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-2">
                  <Label>Oră intrare</Label>
                  <TimePickerDemo value={startTime} onChange={setStartTime} />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Data și ora ieșire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Data ieșire</Label>
            <Popover open={openCalendar === "end"} onOpenChange={open => setOpenCalendar(open ? "end" : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left font-normal h-12 border border-gray-200 bg-transparent hover:border-[#ee7f1a] focus:border-[#ee7f1a] focus:ring-2 focus:ring-[#ee7f1a]/20 hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900"
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
                  onSelect={date => setEndDate(date || new Date())}
                  disabled={date => date < (startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : new Date(new Date().setHours(0, 0, 0, 0)))}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Ora ieșire</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left font-normal h-12 border border-gray-200 bg-transparent hover:border-[#ee7f1a] focus:border-[#ee7f1a] focus:ring-2 focus:ring-[#ee7f1a]/20 hover:bg-transparent focus:bg-transparent text-gray-900 hover:text-gray-900"
                  type="button"
                >
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  {endTime}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-2">
                  <Label>Oră ieșire</Label>
                  <TimePickerDemo value={endTime} onChange={setEndTime} />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

   

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 bg-[#ee7f1a] hover:bg-[#d67016] text-white font-medium text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Se trimite cererea...
          </>
        ) : (
          "Trimite cererea de anulare"
        )}
      </Button>

      {/* Info suplimentară */}
    
    </form>
  )
} 