"use server"

import { z } from "zod"
// Adăugăm Firestore pentru salvarea completă a datelor
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
// Importăm serviciile pentru QR și email
import { generateMultiparkQR } from "@/lib/qr-generator"
import { sendBookingConfirmationEmail } from "@/lib/email-service"

// Define validation schema for the form data
const bookingFormSchema = z.object({
  licensePlate: z.string().min(1, "Numărul de înmatriculare este obligatoriu"),
  startDate: z.string().min(1, "Data de intrare este obligatorie"),
  startTime: z.string().min(1, "Ora de intrare este obligatorie"),
  endDate: z.string().min(1, "Data de ieșire este obligatorie"),
  endTime: z.string().min(1, "Ora de ieșire este obligatorie"),
  clientName: z.string().nullable().optional(),
  clientTitle: z.string().nullable().optional(),
})

type BookingFormData = z.infer<typeof bookingFormSchema>

// Configuration for the API
const API_CONFIG = {
  url: process.env.PARKING_API_URL || "http://localhost:7001/MultiparkWeb_eServices/booking_submit",
  username: process.env.PARKING_API_USERNAME || "",
  password: process.env.PARKING_API_PASSWORD || "",
  multiparkId: process.env.PARKING_MULTIPARK_ID || "001#002", // Default value, should be configured in env
}

// Interfață pentru datele complete de rezervare
interface CompleteBookingData {
  // Date de bază
  licensePlate: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  numberOfPersons?: number
  clientTitle?: string
  
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
  country?: string
  
  // Date plată
  paymentIntentId?: string
  paymentStatus: "paid" | "n/a" | "pending" | "refunded"
  
  // Date API
  apiBookingNumber?: string
  apiSuccess: boolean
  apiErrorCode?: string
  apiMessage: string
  apiRequestPayload: string
  apiResponseRaw: string
  apiRequestTimestamp: any // serverTimestamp
  
  // Status intern
  status: "confirmed_paid" | "confirmed_test" | "api_error" | "cancelled_by_admin" | "cancelled_by_api"
  source: "webhook" | "test_mode" | "manual"
  
  // Metadata
  createdAt: any // serverTimestamp
  lastUpdated?: any
}

/**
 * Procesează generarea QR code-ului și trimiterea email-ului în background
 * Funcția rulează asincron fără să blocheze confirmarea rezervării
 */
async function processQRAndEmailAsync(
  bookingData: CompleteBookingData, 
  initialDebugLogs: string[]
): Promise<void> {
  const backgroundLogs: string[] = [...initialDebugLogs]
  const processId = `BGEMAIL_${bookingData.apiBookingNumber}_${Date.now()}`
  
  try {
    console.log(`🔄 [${processId}] ===== BACKGROUND EMAIL PROCESSING STARTED =====`)
    console.log(`🔄 [${processId}] Booking Number: ${bookingData.apiBookingNumber}`)
    console.log(`🔄 [${processId}] Client Email: ${bookingData.clientEmail}`)
    console.log(`🔄 [${processId}] License Plate: ${bookingData.licensePlate}`)
    console.log(`🔄 [${processId}] Source: ${bookingData.source}`)
    console.log(`🔄 [${processId}] Status: ${bookingData.status}`)
    console.log(`🔄 [${processId}] Payment Status: ${bookingData.paymentStatus}`)
    console.log(`🔄 [${processId}] Amount: ${bookingData.amount} RON`)
    console.log(`🔄 [${processId}] Start Time: ${new Date().toISOString()}`)
    
    // Generează QR code-ul pentru Multipark
    backgroundLogs.push(`🔲 Generating QR code: MPK_RES=${bookingData.apiBookingNumber?.padStart(6, '0')}`)
    console.log(`🔲 [${processId}] Generating QR code: MPK_RES=${bookingData.apiBookingNumber?.padStart(6, '0')}`)
    
    const qrStartTime = Date.now()
    const qrCodeDataUrl = await generateMultiparkQR(bookingData.apiBookingNumber!)
    const qrDuration = Date.now() - qrStartTime
    
    backgroundLogs.push(`✅ QR code generated successfully`)
    console.log(`✅ [${processId}] QR code generated successfully in ${qrDuration}ms`)
    console.log(`✅ [${processId}] QR Data URL length: ${qrCodeDataUrl.length} chars`)
    
    // Pregătește datele pentru email
    const emailData = {
      clientName: bookingData.clientName || 'Client',
      clientEmail: bookingData.clientEmail!,
      clientPhone: bookingData.clientPhone,
      licensePlate: bookingData.licensePlate,
      startDate: bookingData.startDate,
      startTime: bookingData.startTime,
      endDate: bookingData.endDate,
      endTime: bookingData.endTime,
      days: bookingData.days || 1,
      amount: bookingData.amount || 0,
      bookingNumber: bookingData.apiBookingNumber!,
      status: bookingData.status,
      source: bookingData.source,
      createdAt: new Date()
    }
    
    backgroundLogs.push(`📧 Email data prepared for ${emailData.clientEmail}`)
    console.log(`📧 [${processId}] Email data prepared:`)
    console.log(`📧 [${processId}]   Client: ${emailData.clientName}`)
    console.log(`📧 [${processId}]   Email: ${emailData.clientEmail}`)
    console.log(`📧 [${processId}]   Phone: ${emailData.clientPhone || 'N/A'}`)
    console.log(`📧 [${processId}]   Booking: ${emailData.bookingNumber}`)
    console.log(`📧 [${processId}]   Amount: ${emailData.amount} RON`)
    console.log(`📧 [${processId}]   Days: ${emailData.days}`)
    console.log(`📧 [${processId}]   Source: ${emailData.source}`)
    console.log(`📧 [${processId}]   Status: ${emailData.status}`)
    
    // Trimite email-ul de confirmare
    backgroundLogs.push(`📧 Sending confirmation email to ${bookingData.clientEmail}`)
    console.log(`📧 [${processId}] Starting email send process...`)
    console.log(`📧 [${processId}] Target email: ${bookingData.clientEmail}`)
    console.log(`📧 [${processId}] Email send timestamp: ${new Date().toISOString()}`)
    
    const emailStartTime = Date.now()
    const emailResult = await sendBookingConfirmationEmail(emailData)
    const emailDuration = Date.now() - emailStartTime
    
    console.log(`📧 [${processId}] Email send attempt completed in ${emailDuration}ms`)
    console.log(`📧 [${processId}] Email result success: ${emailResult.success}`)
    
    if (emailResult.success) {
      backgroundLogs.push(`✅ Confirmation email sent successfully`)
      console.log(`✅ [${processId}] ===== EMAIL SENT SUCCESSFULLY =====`)
      console.log(`✅ [${processId}] Email delivered to: ${bookingData.clientEmail}`)
      console.log(`✅ [${processId}] Booking number: ${bookingData.apiBookingNumber}`)
      console.log(`✅ [${processId}] Total duration: ${emailDuration}ms`)
      console.log(`✅ [${processId}] Success timestamp: ${new Date().toISOString()}`)
      
      // Opțional: Actualizează statusul în Firestore pentru tracking
      try {
        console.log(`📊 [${processId}] Updating Firestore with email success status...`)
        
        // Găsește documentul rezervării și actualizează statusul email-ului
        const bookingsRef = collection(db, "bookings")
        const q = query(bookingsRef, 
          where("apiBookingNumber", "==", bookingData.apiBookingNumber),
          where("source", "==", bookingData.source)
        )
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const bookingDoc = querySnapshot.docs[0]
          await updateDoc(doc(db, "bookings", bookingDoc.id), {
            emailSentAt: serverTimestamp(),
            emailStatus: "sent",
            qrCodeGenerated: true,
            emailSendDuration: emailDuration,
            lastUpdated: serverTimestamp()
          })
          console.log(`📊 [${processId}] Firestore updated successfully with email status`)
          console.log(`📊 [${processId}] Document ID: ${bookingDoc.id}`)
        } else {
          console.warn(`⚠️ [${processId}] Booking document not found in Firestore for update`)
          console.warn(`⚠️ [${processId}] Search criteria: apiBookingNumber=${bookingData.apiBookingNumber}, source=${bookingData.source}`)
        }
      } catch (firestoreError) {
        console.error(`⚠️ [${processId}] Failed to update email status in Firestore:`, firestoreError)
        console.error(`⚠️ [${processId}] Firestore error details:`, {
          message: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
          apiBookingNumber: bookingData.apiBookingNumber,
          source: bookingData.source
        })
        // Nu eșuăm procesul de email din cauza erorii Firestore
      }
      
    } else {
      backgroundLogs.push(`⚠️ Email failed: ${emailResult.error}`)
      console.error(`❌ [${processId}] ===== EMAIL SEND FAILED =====`)
      console.error(`❌ [${processId}] Error message: ${emailResult.error}`)
      console.error(`❌ [${processId}] Target email: ${bookingData.clientEmail}`)
      console.error(`❌ [${processId}] Booking number: ${bookingData.apiBookingNumber}`)
      console.error(`❌ [${processId}] Attempt duration: ${emailDuration}ms`)
      console.error(`❌ [${processId}] Failed timestamp: ${new Date().toISOString()}`)
      console.error(`❌ [${processId}] Email data:`, {
        clientName: emailData.clientName,
        clientEmail: emailData.clientEmail,
        bookingNumber: emailData.bookingNumber,
        amount: emailData.amount,
        source: emailData.source,
        status: emailData.status
      })
      
      // Opțional: Actualizează statusul de eșec în Firestore pentru retry later
      try {
        console.log(`📊 [${processId}] Updating Firestore with email failure status...`)
        
        const bookingsRef = collection(db, "bookings")
        const q = query(bookingsRef, 
          where("apiBookingNumber", "==", bookingData.apiBookingNumber),
          where("source", "==", bookingData.source)
        )
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const bookingDoc = querySnapshot.docs[0]
          await updateDoc(doc(db, "bookings", bookingDoc.id), {
            emailStatus: "failed",
            emailError: emailResult.error,
            emailFailedAt: serverTimestamp(),
            emailSendDuration: emailDuration,
            qrCodeGenerated: true, // QR a reușit
            lastUpdated: serverTimestamp()
          })
          console.log(`📊 [${processId}] Firestore updated with email failure status`)
          console.log(`📊 [${processId}] Document ID: ${bookingDoc.id}`)
        } else {
          console.warn(`⚠️ [${processId}] Booking document not found for failure update`)
        }
      } catch (firestoreError) {
        console.error(`⚠️ [${processId}] Failed to update email failure status in Firestore:`, firestoreError)
      }
    }
    
    const totalDuration = Date.now() - (Date.now() - emailDuration - qrDuration)
    console.log(`🏁 [${processId}] Background processing completed`)
    console.log(`🏁 [${processId}] Total process duration: ${totalDuration}ms`)
    console.log(`🏁 [${processId}] QR generation: ${qrDuration}ms`)
    console.log(`🏁 [${processId}] Email sending: ${emailDuration}ms`)
    console.log(`🏁 [${processId}] Final status: ${emailResult.success ? 'SUCCESS' : 'FAILED'}`)
    console.log(`🏁 [${processId}] End timestamp: ${new Date().toISOString()}`)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    backgroundLogs.push(`❌ QR/Email background error: ${errorMessage}`)
    
    console.error(`❌ [${processId}] ===== BACKGROUND PROCESSING FAILED =====`)
    console.error(`❌ [${processId}] Error Type: ${error instanceof Error ? error.constructor.name : typeof error}`)
    console.error(`❌ [${processId}] Error Message: ${errorMessage}`)
    console.error(`❌ [${processId}] Error Stack:`, error instanceof Error ? error.stack : 'N/A')
    console.error(`❌ [${processId}] Booking Number: ${bookingData.apiBookingNumber}`)
    console.error(`❌ [${processId}] Client Email: ${bookingData.clientEmail}`)
    console.error(`❌ [${processId}] Source: ${bookingData.source}`)
    console.error(`❌ [${processId}] Failed timestamp: ${new Date().toISOString()}`)
    
    throw error // Re-throw pentru catch-ul din funcția principală
  }
}

/**
 * Funcție centralizată pentru salvarea completă a rezervării în Firestore
 */
async function saveCompleteBookingToFirestore(bookingData: CompleteBookingData): Promise<{ success: boolean, firestoreId?: string, error?: string }> {
  try {
    console.log("💾 Saving booking to Firestore:", {
      licensePlate: bookingData.licensePlate,
      status: bookingData.status,
      apiSuccess: bookingData.apiSuccess,
      amount: bookingData.amount
    })
    
    // Filtrează câmpurile undefined pentru a fi compatibil cu Firestore
    const cleanedData = Object.fromEntries(
      Object.entries({
        ...bookingData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      }).filter(([_, value]) => value !== undefined)
    )
    
    const docRef = await addDoc(collection(db, "bookings"), cleanedData)
    console.log("✅ Booking saved with ID:", docRef.id)
    
    // Incrementează contorul de rezervări active doar dacă rezervarea a reușit
    if (bookingData.apiSuccess) {
      try {
        const statsDocRef = doc(db, "config", "reservationStats")
        
        // Verifică dacă documentul există
        const statsDoc = await getDoc(statsDocRef)
        
        if (!statsDoc.exists()) {
          // Creează documentul cu valori inițiale
          await setDoc(statsDocRef, {
            activeBookingsCount: 1,
            totalBookingsCount: 1,
            lastUpdated: serverTimestamp(),
            createdAt: serverTimestamp()
          })
          console.log("📊 Created reservationStats document with initial values")
        } else {
          // Documentul există, îl actualizăm
          await updateDoc(statsDocRef, { 
            activeBookingsCount: increment(1),
            totalBookingsCount: increment(1),
            lastUpdated: serverTimestamp()
          })
          console.log("📊 Updated reservationStats - incremented counters")
        }
      } catch (statsError) {
        console.error("⚠️ Stats update failed (non-critical):", statsError)
        // Nu eșuează salvarea booking-ului din cauza erorii de stats
      }
    }
    
    return { success: true, firestoreId: docRef.id }
  } catch (error) {
    console.error("❌ Firestore save error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Eroare necunoscută" }
  }
}

/**
 * Funcție pentru retry email-uri eșuate (poate fi apelată din admin dashboard)
 */
export async function retryFailedEmails(bookingId?: string): Promise<{ success: boolean, processed: number, errors: string[] }> {
  const errors: string[] = []
  let processed = 0
  
  try {
    const bookingsRef = collection(db, "bookings")
    let q
    
    if (bookingId) {
      // Retry pentru o rezervare specifică
      q = query(bookingsRef, where("__name__", "==", bookingId))
    } else {
      // Retry pentru toate email-urile eșuate din ultimele 24 ore
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      q = query(bookingsRef, 
        where("emailStatus", "==", "failed"),
        where("createdAt", ">=", yesterday)
      )
    }
    
    const querySnapshot = await getDocs(q)
    
    for (const docSnapshot of querySnapshot.docs) {
      const bookingData = docSnapshot.data() as CompleteBookingData
      
      if (bookingData.apiBookingNumber && bookingData.clientEmail) {
        try {
          console.log(`🔄 Retrying email for booking ${bookingData.apiBookingNumber}`)
          
          const emailData = {
            clientName: bookingData.clientName || 'Client',
            clientEmail: bookingData.clientEmail,
            clientPhone: bookingData.clientPhone,
            licensePlate: bookingData.licensePlate,
            startDate: bookingData.startDate,
            startTime: bookingData.startTime,
            endDate: bookingData.endDate,
            endTime: bookingData.endTime,
            days: bookingData.days || 1,
            amount: bookingData.amount || 0,
            bookingNumber: bookingData.apiBookingNumber,
            status: bookingData.status,
            source: bookingData.source,
            createdAt: bookingData.createdAt?.toDate() || new Date()
          }
          
          const emailResult = await sendBookingConfirmationEmail(emailData)
          
          if (emailResult.success) {
            await updateDoc(doc(db, "bookings", docSnapshot.id), {
              emailSentAt: serverTimestamp(),
              emailStatus: "sent",
              emailRetryCount: increment(1),
              lastUpdated: serverTimestamp()
            })
            console.log(`✅ Email retry successful for booking ${bookingData.apiBookingNumber}`)
            processed++
          } else {
            await updateDoc(doc(db, "bookings", docSnapshot.id), {
              emailRetryCount: increment(1),
              lastEmailError: emailResult.error,
              lastUpdated: serverTimestamp()
            })
            errors.push(`Booking ${bookingData.apiBookingNumber}: ${emailResult.error}`)
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          errors.push(`Booking ${bookingData.apiBookingNumber}: ${errorMessage}`)
        }
      }
    }
    
    return { success: true, processed, errors }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, processed, errors: [errorMessage] }
  }
}

export async function createBooking(formData: FormData) {
  try {
    // Parse and validate form data
    const rawData = {
      licensePlate: formData.get("licensePlate") as string,
      startDate: formData.get("startDate") as string,
      startTime: formData.get("startTime") as string,
      endDate: formData.get("endDate") as string,
      endTime: formData.get("endTime") as string,
      clientName: (formData.get("clientName") as string) || "",
      clientTitle: (formData.get("clientTitle") as string) || "",
    }

    const validatedData = bookingFormSchema.parse(rawData)

    // Calculate duration in minutes
    const startDateTime = new Date(`${validatedData.startDate}T${validatedData.startTime}:00`)
    const endDateTime = new Date(`${validatedData.endDate}T${validatedData.endTime}:00`)
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))

    if (durationMinutes <= 0) {
      return { success: false, message: "Perioada de rezervare trebuie să fie pozitivă" }
    }

    // Generate a random 6-digit booking number
    const bookingNumber = Math.floor(100000 + Math.random() * 900000).toString()

    // Format the start date in the required format: YYYY/MM/DD HH:mm:SS
    const formattedStartDate = startDateTime
      .toISOString()
      .replace(/T/, " ")
      .replace(/-/g, "/")
      .replace(/\.\d+Z$/, "")

    // Create XML payload according to API documentation
    const xmlPayload = `
      <WSRequestBookingSubmitV1>
        <MultiparkId>${API_CONFIG.multiparkId}</MultiparkId>
        <OperationType>N</OperationType>
        <BookingNumber>${bookingNumber}</BookingNumber>
        <LicensePlate>${validatedData.licensePlate}</LicensePlate>
        <StartDate>${formattedStartDate}</StartDate>
        <Duration>${durationMinutes}</Duration>
        ${validatedData.clientTitle ? `<ClientTitle>${validatedData.clientTitle}</ClientTitle>` : ""}
        ${validatedData.clientName ? `<ClientName>${validatedData.clientName}</ClientName>` : ""}
        <AccessMode>0</AccessMode>
      </WSRequestBookingSubmitV1>
    `.trim()

    // Create Basic Auth header
    const authHeader = `Basic ${Buffer.from(`${API_CONFIG.username}:${API_CONFIG.password}`).toString("base64")}`

    // Make API request with extended timeout (45 seconds for webhook compatibility)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 secunde timeout

    let response: Response
    try {
      response = await fetch(API_CONFIG.url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "text/xml",
        },
        body: xmlPayload,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("API Fetch Error:", fetchError)
      throw fetchError
    }

    // Parse XML response
    const responseText = await response.text()

    // Simple XML parsing - in production, use a proper XML parser
    const errorCodeMatch = responseText.match(/<ErrorCode>(\d+)<\/ErrorCode>/)
    const messageMatch = responseText.match(/<Message>(.+?)<\/Message>/)

    const errorCode = errorCodeMatch ? errorCodeMatch[1] : null
    const message = messageMatch ? messageMatch[1] : "Răspuns necunoscut de la server"
    const isSuccess = errorCode === "1"

    // Returnăm rezultatul standard PLUS salvăm totul în Firestore
    const result = {
      success: isSuccess,
      message: isSuccess ? "Rezervarea a fost creată cu succes!" : `Eroare: ${message}`,
      bookingNumber: isSuccess ? bookingNumber : null,
      // Date suplimentare pentru debugging
      apiErrorCode: errorCode,
      apiResponse: responseText,
      apiPayload: xmlPayload,
      httpStatus: response.status
    }

    return result

  } catch (error) {
    console.error("Booking error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Validare eșuată: ${error.errors.map((e) => e.message).join(", ")}`,
      }
    }
    return {
      success: false,
      message: "A apărut o eroare la procesarea rezervării. Vă rugăm să încercați din nou.",
    }
  }
}

/**
 * Versiune extinsă a createBooking care salvează totul în Firestore
 * Folosită pentru cazurile când avem toate datele disponibile (webhook, test mode)
 */
export async function createBookingWithFirestore(
  formData: FormData, 
  additionalData?: {
    clientEmail?: string
    clientPhone?: string
    numberOfPersons?: number
    paymentIntentId?: string
    paymentStatus?: "paid" | "n/a"
    amount?: number
    days?: number
    source?: "webhook" | "test_mode" | "manual"
    // Date pentru facturare și adresă
    company?: string
    companyVAT?: string
    companyReg?: string
    companyAddress?: string
    needInvoice?: boolean
    address?: string
    city?: string
    county?: string
    postalCode?: string
    country?: string
    orderNotes?: string
  }
) {
  const debugLogs: string[] = []
  
  try {
    debugLogs.push(`🚀 Starting booking process for ${formData.get("licensePlate")} (${additionalData?.source || "manual"})`)
    
    // Apelează API-ul standard
    const apiResult = await createBooking(formData)
    debugLogs.push(`📞 API: ${apiResult.success ? "SUCCESS" : "FAILED"} - ${apiResult.message}`)
    
    // Verifică că amount-ul este corect calculat
    if (additionalData?.amount) {
      debugLogs.push(`💰 Amount: ${additionalData.amount} RON for ${additionalData.days || 1} day(s)`)
      
      // Validare suplimentară pentru consistența prețului
      if (additionalData.days && additionalData.amount > 0) {
        const pricePerDay = additionalData.amount / additionalData.days
        if (pricePerDay < 10 || pricePerDay > 200) {
          debugLogs.push(`⚠️ Unusual price per day: ${pricePerDay.toFixed(2)} RON`)
        }
      }
    }
    
    // Pregătește datele complete pentru Firestore
    const completeBookingData: CompleteBookingData = {
      // Date de bază din formData
      licensePlate: formData.get("licensePlate") as string,
      startDate: formData.get("startDate") as string,
      startTime: formData.get("startTime") as string,
      endDate: formData.get("endDate") as string,
      endTime: formData.get("endTime") as string,
      clientName: formData.get("clientName") as string || "",
      clientTitle: formData.get("clientTitle") as string || "",
      
      // Date suplimentare
      clientEmail: additionalData?.clientEmail,
      clientPhone: additionalData?.clientPhone,
      numberOfPersons: additionalData?.numberOfPersons,
      
      // Date calculate
      durationMinutes: Math.round(
        (new Date(`${formData.get("endDate")}T${formData.get("endTime")}:00`).getTime() - 
         new Date(`${formData.get("startDate")}T${formData.get("startTime")}:00`).getTime()) / (1000 * 60)
      ),
      days: additionalData?.days,
      amount: additionalData?.amount,
      
      // Date plată
      paymentIntentId: additionalData?.paymentIntentId,
      paymentStatus: additionalData?.paymentStatus || "n/a",
      
      // Date API - safe access
      apiBookingNumber: (apiResult as any).bookingNumber || undefined,
      apiSuccess: apiResult.success,
      apiErrorCode: (apiResult as any).apiErrorCode || undefined,
      apiMessage: apiResult.message,
      apiRequestPayload: (apiResult as any).apiPayload || "",
      apiResponseRaw: (apiResult as any).apiResponse || "",
      apiRequestTimestamp: serverTimestamp(),
      
      // Status intern
      status: apiResult.success 
        ? (additionalData?.paymentStatus === "paid" ? "confirmed_paid" : "confirmed_test")
        : "api_error",
      source: additionalData?.source || "manual",
      
      // Metadata
      createdAt: serverTimestamp()
    }
    
    // Adăugăm datele pentru facturare și adresă
    if (additionalData) {
      completeBookingData.company = additionalData.company
      completeBookingData.companyVAT = additionalData.companyVAT
      completeBookingData.companyReg = additionalData.companyReg
      completeBookingData.companyAddress = additionalData.companyAddress
      completeBookingData.needInvoice = additionalData.needInvoice
      completeBookingData.orderNotes = additionalData.orderNotes
      completeBookingData.address = additionalData.address
      completeBookingData.city = additionalData.city
      completeBookingData.county = additionalData.county
      completeBookingData.postalCode = additionalData.postalCode
      completeBookingData.country = additionalData.country
    }
    
    if (apiResult.success) {
      debugLogs.push(`🎟️ Booking number: ${completeBookingData.apiBookingNumber}`)
    }
    debugLogs.push(`📊 Status: ${completeBookingData.status}`)
    
    // Salvează în Firestore
    const firestoreResult = await saveCompleteBookingToFirestore(completeBookingData)
    
    if (firestoreResult.success) {
      debugLogs.push(`✅ Saved to Firestore: ${firestoreResult.firestoreId}`)
      
      // Dacă rezervarea a reușit și avem un booking number, generează QR și trimite email
      if (apiResult.success && completeBookingData.apiBookingNumber && completeBookingData.clientEmail) {
        debugLogs.push(`📧 Starting background QR code and email processing for booking ${completeBookingData.apiBookingNumber}`)
        debugLogs.push(`📧 Email will be sent to: ${completeBookingData.clientEmail}`)
        
        // ⚡ FIRE-AND-FORGET: Procesează QR și email în background fără să blocheze rezervarea
        processQRAndEmailAsync(completeBookingData, debugLogs).catch(error => {
          console.error(`❌ Background QR/Email processing failed for booking ${completeBookingData.apiBookingNumber}:`, error)
        })
        
        debugLogs.push(`⚡ QR/Email processing started in background - reservation confirmed immediately`)
        
      } else {
        if (!completeBookingData.clientEmail) {
          debugLogs.push(`⚠️ No email provided, skipping email notification`)
        }
        if (!completeBookingData.apiBookingNumber) {
          debugLogs.push(`⚠️ No booking number, skipping QR generation`)
        }
        if (!apiResult.success) {
          debugLogs.push(`⚠️ API failed, skipping QR/email generation`)
        }
      }

      console.log("✅ Rezervare confirmată:", firestoreResult.firestoreId)
      
      // Generează factură OBLIO automată pentru TOATE rezervările plătite ȘI în test mode
      if (additionalData?.paymentStatus === 'paid' || additionalData?.source === 'webhook' || additionalData?.source === 'test_mode') {
        try {
          const { generateOblioInvoice } = await import('@/lib/oblio-integration')
          
          const oblioInvoiceData = {
            bookingId: completeBookingData.apiBookingNumber!,
            clientName: completeBookingData.clientName || 'Client Site Parcări',
            clientEmail: additionalData.clientEmail || '',
            clientPhone: additionalData.clientPhone,
            licensePlate: completeBookingData.licensePlate,
            startDate: completeBookingData.startDate,
            endDate: completeBookingData.endDate,
            location: 'Site Parcări', // Ai putea să îl faci dinamic
            parkingSpot: completeBookingData.apiBookingNumber || '',
            totalCost: additionalData.amount || 0,
            billingType: (additionalData.company ? 'corporate' : 'individual') as 'corporate' | 'individual',
            company: additionalData.company,
            companyVAT: additionalData.companyVAT,
            companyReg: additionalData.companyReg,
            companyAddress: additionalData.companyAddress,
            // Date adresă client individual pentru ANAF
            clientAddress: additionalData.address,
            clientCity: additionalData.city,
            clientCounty: additionalData.county,
            clientCountry: additionalData.country,
          }

          const invoiceResult = await generateOblioInvoice(oblioInvoiceData)
          
          if (invoiceResult.success) {
            console.log('✅ Factură Oblio generată cu succes:', invoiceResult.invoiceNumber, '- Link:', invoiceResult.invoiceUrl)
          } else {
            console.error('❌ Eroare la generarea facturii Oblio:', invoiceResult.error)
          }
        } catch (error) {
          console.error('❌ Eroare critică la generarea facturii Oblio:', error)
          // Nu oprim procesul pentru erori la facturare
        }
      } else {
        console.log("ℹ️ Factură Oblio nu se generează - rezervare fără plată")
      }

      return {
        firestoreId: firestoreResult.firestoreId,
        firestoreSuccess: true,
        firestoreError: undefined,
        debugLogs,
        success: true,
        message: `Rezervare confirmată cu numărul ${completeBookingData.apiBookingNumber}`,
        bookingNumber: completeBookingData.apiBookingNumber,
        reservationData: completeBookingData,
        qrData: `MPK_RES=${completeBookingData.apiBookingNumber}`,
        bookingDetails: {
          bookingNumber: completeBookingData.apiBookingNumber,
          licensePlate: completeBookingData.licensePlate,
          startDateTime: `${completeBookingData.startDate} ${completeBookingData.startTime}`,
          endDateTime: `${completeBookingData.endDate} ${completeBookingData.endTime}`,
          customerName: completeBookingData.clientName || 'N/A',
          customerEmail: additionalData?.clientEmail || '',
          amount: additionalData?.amount || 0,
          paymentStatus: additionalData?.paymentStatus || 'n/a'
        }
      }
    } else {
      debugLogs.push(`❌ Firestore failed: ${firestoreResult.error}`)
      return {
        firestoreId: undefined,
        firestoreSuccess: false,
        firestoreError: firestoreResult.error,
        debugLogs,
        success: false,
        message: `Eroare la salvarea în Firestore: ${firestoreResult.error}`,
        bookingNumber: null,
        reservationData: null,
        qrData: null,
        bookingDetails: null
      }
    }
    
  } catch (error) {
    debugLogs.push(`💥 Exception: ${error instanceof Error ? error.message : String(error)}`)
    console.error("Error in createBookingWithFirestore:", error)
    return {
      firestoreId: undefined,
      firestoreSuccess: false,
      firestoreError: error instanceof Error ? error.message : "Eroare necunoscută",
      debugLogs,
      success: false,
      message: "Eroare la procesarea rezervării complete",
      bookingNumber: null,
      reservationData: null,
      qrData: null,
      bookingDetails: null
    }
  }
}

export async function cancelBooking(bookingNumber: string) {
  try {
    // Create XML payload for cancellation
    const xmlPayload = `
      <WSRequestBookingSubmitV1>
        <MultiparkId>${API_CONFIG.multiparkId}</MultiparkId>
        <OperationType>D</OperationType>
        <BookingNumber>${bookingNumber}</BookingNumber>
      </WSRequestBookingSubmitV1>
    `.trim()

    // Create Basic Auth header
    const authHeader = `Basic ${Buffer.from(`${API_CONFIG.username}:${API_CONFIG.password}`).toString("base64")}`

    // Make API request with extended timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 secunde timeout

    let response: Response
    try {
      response = await fetch(API_CONFIG.url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "text/xml",
        },
        body: xmlPayload,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          success: false,
          message: `Eroare de server: ${response.status} ${response.statusText}`,
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("API Cancel Fetch Error:", fetchError)
      throw fetchError
    }

    // Parse XML response
    const responseText = await response.text()

    // Simple XML parsing
    const errorCodeMatch = responseText.match(/<ErrorCode>(\d+)<\/ErrorCode>/)
    const messageMatch = responseText.match(/<Message>(.+?)<\/Message>/)

    const errorCode = errorCodeMatch ? errorCodeMatch[1] : null
    const message = messageMatch ? messageMatch[1] : "Răspuns necunoscut de la server"

    if (errorCode === "1") {
      // Success code according to documentation
      return {
        success: true,
        message: "Rezervarea a fost anulată cu succes!",
      }
    } else {
      return {
        success: false,
        message: `Eroare: ${message}`,
      }
    }
  } catch (error) {
    console.error("Cancellation error:", error)
    return {
      success: false,
      message: "A apărut o eroare la anularea rezervării. Vă rugăm să încercați din nou.",
    }
  }
}

/**
 * Funcție publică pentru curățarea rezervărilor expirate
 * Poate fi apelată manual sau programatic din alte părți ale aplicației
 */
export async function cleanupExpiredBookings(): Promise<{ cleanedCount: number, errors: string[] }> {
  const errors: string[] = []
  let cleanedCount = 0
  
  try {
    const now = new Date()
    const currentDateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    
    console.log('🧹 Starting cleanup of expired bookings at:', currentDateStr)
    
    const bookingsRef = collection(db, 'bookings')
    
    // Query pentru rezervările care ar trebui să fie active dar poate au expirat
    const potentiallyExpiredQuery = query(
      bookingsRef,
      where('status', 'in', ['confirmed_paid', 'confirmed_test', 'confirmed', 'paid']),
      where('endDate', '<=', currentDateStr) // Toate rezervările care se termină astăzi sau în trecut
    )
    
    const snapshot = await getDocs(potentiallyExpiredQuery)
    const expiredBookings = []
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const booking = docSnapshot.data()
        const endDateTime = new Date(`${booking.endDate}T${booking.endTime}:00`)
        
        if (endDateTime <= now) {
          // Marchează rezervarea ca expirată
          await updateDoc(docSnapshot.ref, {
            status: 'expired',
            expiredAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          })
          
          expiredBookings.push({
            id: docSnapshot.id,
            licensePlate: booking.licensePlate,
            endDate: booking.endDate,
            endTime: booking.endTime
          })
          
          cleanedCount++
          console.log('⏰ Marked booking as expired:', {
            id: docSnapshot.id,
            licensePlate: booking.licensePlate,
            endDate: booking.endDate,
            endTime: booking.endTime
          })
        }
      } catch (error) {
        const errorMessage = `Failed to update booking ${docSnapshot.id}: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMessage)
        console.error('❌ Error updating individual booking:', errorMessage)
      }
    }
    
    if (cleanedCount > 0) {
      try {
        // Actualizează statisticile - scade numărul de rezervări active
        const statsDocRef = doc(db, "config", "reservationStats")
        await updateDoc(statsDocRef, {
          activeBookingsCount: increment(-cleanedCount),
          lastUpdated: serverTimestamp()
        })
        console.log(`✅ Updated stats: decreased active count by ${cleanedCount}`)
      } catch (error) {
        const errorMessage = `Failed to update reservation stats: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMessage)
        console.error('❌ Error updating stats:', errorMessage)
      }
    }
    
    console.log(`🧹 Cleanup completed: ${cleanedCount} bookings marked as expired, ${errors.length} errors`)
    
    return { cleanedCount, errors }
    
  } catch (error) {
    const errorMessage = `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`
    errors.push(errorMessage)
    console.error('❌ Critical error during cleanup:', errorMessage)
    return { cleanedCount: 0, errors }
  }
}

/**
 * Adaugă o rezervare manual de către admin (fără plată)
 * Această funcție va crea rezervarea în Firestore și o va trimite la API-ul de parcare
 */
export async function createManualBooking(formData: FormData) {
  try {
    // Extrage datele din FormData
    const licensePlate = formData.get('licensePlate') as string
    const startDate = formData.get('startDate') as string
    const startTime = formData.get('startTime') as string
    const endDate = formData.get('endDate') as string
    const endTime = formData.get('endTime') as string
    const clientName = formData.get('clientName') as string || ''
    const clientPhone = formData.get('clientPhone') as string || ''
    const clientEmail = formData.get('clientEmail') as string || ''
    const numberOfPersons = parseInt(formData.get('numberOfPersons') as string) || 1

    console.log('🔧 ADĂUGARE MANUALĂ REZERVARE - Date primite:', {
      licensePlate,
      period: `${startDate} ${startTime} - ${endDate} ${endTime}`,
      client: { name: clientName, phone: clientPhone, email: clientEmail },
      numberOfPersons
    })

    // Validări de bază
    if (!licensePlate || !startDate || !startTime || !endDate || !endTime) {
      return {
        success: false,
        message: 'Toate câmpurile obligatorii trebuie completate'
      }
    }

    // Calculează durata în minute
    const startDateTime = new Date(`${startDate}T${startTime}:00`)
    const endDateTime = new Date(`${endDate}T${endTime}:00`)
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))

    if (durationMinutes <= 0) {
      return {
        success: false,
        message: 'Data și ora de ieșire trebuie să fie după data și ora de intrare'
      }
    }

    // Calculează numărul de zile
    const days = Math.ceil(durationMinutes / (24 * 60))

    // Generare număr de rezervare aleatoriu
    const bookingNumber = Math.floor(100000 + Math.random() * 900000).toString()

    // 1. CREEAZĂ REZERVAREA ÎN FIRESTORE MAI ÎNTÂI
    const bookingData = {
      licensePlate: licensePlate.toUpperCase(),
      clientName,
      clientEmail,
      clientPhone,
      startDate,
      startTime,
      endDate,
      endTime,
      durationMinutes,
      days,
      amount: 0, // Fără cost - adăugată manual de operator
      status: 'confirmed_paid', // Status pentru rezervări reale manuale
      paymentStatus: 'paid', // Considerată plătită (adăugată de operator)
      source: 'manual',
      numberOfPersons,
      apiSuccess: false, // Se va actualiza după apelul API
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
      // Câmpurile API se vor adăuga după apelul API
    }

    // Salvează în Firestore
    const bookingsRef = collection(db, 'bookings')
    const bookingDocRef = await addDoc(bookingsRef, bookingData)

    console.log('✅ Rezervare salvată în Firestore:', bookingDocRef.id)

    // 2. TRIMITE LA API-UL DE PARCARE
    try {
      // Formatare dată pentru API: YYYY/MM/DD HH:mm:SS
      const formattedStartDate = startDateTime
        .toISOString()
        .replace(/T/, " ")
        .replace(/-/g, "/")
        .replace(/\.\d+Z$/, "")

      // Creare payload XML pentru API
      const xmlPayload = `
        <WSRequestBookingSubmitV1>
          <MultiparkId>${process.env.PARKING_MULTIPARK_ID || "001#001"}</MultiparkId>
          <OperationType>N</OperationType>
          <BookingNumber>${bookingNumber}</BookingNumber>
          <LicensePlate>${licensePlate.toUpperCase()}</LicensePlate>
          <StartDate>${formattedStartDate}</StartDate>
          <Duration>${durationMinutes}</Duration>
          ${clientName ? `<ClientName>${clientName}</ClientName>` : ""}
          <AccessMode>0</AccessMode>
        </WSRequestBookingSubmitV1>
      `.trim()

      // Creare header Basic Auth
      const authHeader = `Basic ${Buffer.from(`${process.env.PARKING_API_USERNAME || "MWBooking"}:${process.env.PARKING_API_PASSWORD || "AUTOPENI2025"}`).toString("base64")}`

      console.log('📡 Trimitere la API parcare:', {
        url: process.env.PARKING_API_URL,
        bookingNumber,
        licensePlate: licensePlate.toUpperCase(),
        payload: xmlPayload
      })

      // Apel API cu timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(process.env.PARKING_API_URL || "http://89.45.23.61:7001/MultiparkWeb_eServices/booking_submit", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "text/xml",
        },
        body: xmlPayload,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const responseText = await response.text()

      console.log('📡 Răspuns de la API parcare:', {
        status: response.status,
        body: responseText
      })

      // Parsare răspuns XML
      const errorCodeMatch = responseText.match(/<ErrorCode>(\d+)<\/ErrorCode>/)
      const messageMatch = responseText.match(/<Message>(.+?)<\/Message>/)

      const errorCode = errorCodeMatch ? errorCodeMatch[1] : null
      const apiMessage = messageMatch ? messageMatch[1] : "Răspuns necunoscut de la server"
      const apiSuccess = errorCode === "1"

             // 3. ACTUALIZEAZĂ REZERVAREA CU REZULTATUL API
       const updateData: any = {
         apiSuccess,
         apiErrorCode: errorCode,
         apiMessage,
         apiRequestPayload: xmlPayload,
         apiResponseRaw: responseText,
         apiRequestTimestamp: serverTimestamp(),
         lastUpdated: serverTimestamp(),
         status: apiSuccess ? 'confirmed_paid' : 'api_error'
       }

       // Adaugă apiBookingNumber doar dacă API-ul a fost succes
       if (apiSuccess) {
         updateData.apiBookingNumber = bookingNumber
       }

       await updateDoc(bookingDocRef, updateData)

      if (apiSuccess) {
        // 4. ACTUALIZEAZĂ STATISTICILE
        const statsDocRef = doc(db, "config", "reservationStats")
        await updateDoc(statsDocRef, {
          activeBookingsCount: increment(1),
          lastUpdated: serverTimestamp()
        })

        console.log('🎉 REZERVARE MANUALĂ COMPLETĂ:', {
          firestoreId: bookingDocRef.id,
          apiBookingNumber: bookingNumber,
          status: 'confirmed_paid'
        })

        return {
          success: true,
          message: `Rezervarea a fost creată cu succes! Număr rezervare: ${bookingNumber}`,
          bookingId: bookingDocRef.id,
          apiBookingNumber: bookingNumber
        }
      } else {
        console.log('⚠️ API EȘUAT dar rezervarea este salvată în Firestore:', {
          firestoreId: bookingDocRef.id,
          apiError: apiMessage
        })

        return {
          success: true,
          message: `Rezervarea a fost salvată local dar API-ul a eșuat: ${apiMessage}. ID: ${bookingDocRef.id}`,
          bookingId: bookingDocRef.id,
          apiError: apiMessage
        }
      }

    } catch (apiError) {
      console.error('❌ EROARE API:', apiError)

             // Actualizează rezervarea cu eroarea API
       await updateDoc(bookingDocRef, {
         apiSuccess: false,
         apiMessage: apiError instanceof Error ? apiError.message : 'Eroare necunoscută API',
         lastUpdated: serverTimestamp(),
         status: 'api_error'
       })

      return {
        success: true,
        message: `Rezervarea a fost salvată local dar a eșuat trimiterea la API. ID: ${bookingDocRef.id}`,
        bookingId: bookingDocRef.id,
        apiError: apiError instanceof Error ? apiError.message : 'Eroare necunoscută API'
      }
    }

  } catch (error) {
    console.error('❌ EROARE CRITICĂ la adăugarea manuală:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Eroare necunoscută la procesarea rezervării'
    }
  }
}

/**
 * Trimite manual email cu QR code pentru o rezervare existentă
 */
export async function sendManualBookingEmail(bookingId: string): Promise<{ success: boolean, message: string, error?: string }> {
  try {
    console.log(`📧 Manual email request for booking ID: ${bookingId}`)
    
    // Găsește rezervarea în Firestore
    const bookingDoc = await getDoc(doc(db, "bookings", bookingId))
    
    if (!bookingDoc.exists()) {
      return {
        success: false,
        message: "Rezervarea nu a fost găsită",
        error: "Booking not found"
      }
    }
    
    const bookingData = bookingDoc.data() as CompleteBookingData
    
    // Verifică dacă rezervarea are toate datele necesare pentru email
    if (!bookingData.clientEmail) {
      return {
        success: false,
        message: "Email-ul clientului lipsește din rezervare",
        error: "Client email missing"
      }
    }
    
    if (!bookingData.apiBookingNumber) {
      return {
        success: false,
        message: "Numărul de rezervare API lipsește - nu se poate genera QR code",
        error: "API booking number missing"
      }
    }
    
    // Pregătește datele pentru email
    const emailData = {
      clientName: bookingData.clientName || 'Client',
      clientEmail: bookingData.clientEmail,
      clientPhone: bookingData.clientPhone,
      licensePlate: bookingData.licensePlate,
      startDate: bookingData.startDate,
      startTime: bookingData.startTime,
      endDate: bookingData.endDate,
      endTime: bookingData.endTime,
      days: bookingData.days || 1,
      amount: bookingData.amount || 0,
      bookingNumber: bookingData.apiBookingNumber,
      status: bookingData.status,
      source: bookingData.source || 'manual',
      createdAt: bookingData.createdAt?.toDate() || new Date()
    }
    
    console.log(`📧 Sending manual email to ${emailData.clientEmail} for booking ${emailData.bookingNumber}`)
    
    // Trimite email-ul
    const emailResult = await sendBookingConfirmationEmail(emailData)
    
    if (emailResult.success) {
      // Actualizează statusul în Firestore cu informații despre email-ul manual
      await updateDoc(doc(db, "bookings", bookingId), {
        emailSentAt: serverTimestamp(),
        emailStatus: "sent",
        lastManualEmailSent: serverTimestamp(),
        manualEmailCount: increment(1),
        lastUpdated: serverTimestamp()
      })
      
      console.log(`✅ Manual email sent successfully to ${emailData.clientEmail} for booking ${emailData.bookingNumber}`)
      
      return {
        success: true,
        message: `Email trimis cu succes către ${emailData.clientEmail}`
      }
    } else {
      // Marchează eșecul în Firestore
      await updateDoc(doc(db, "bookings", bookingId), {
        emailStatus: "failed",
        lastEmailError: emailResult.error,
        lastManualEmailAttempt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      })
      
      console.error(`❌ Manual email failed for booking ${emailData.bookingNumber}:`, emailResult.error)
      
      return {
        success: false,
        message: `Eroare la trimiterea email-ului: ${emailResult.error}`,
        error: emailResult.error
      }
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`❌ Manual email function error for booking ${bookingId}:`, errorMessage)
    
    return {
      success: false,
      message: `Eroare la procesarea cererii: ${errorMessage}`,
      error: errorMessage
    }
  }
}
