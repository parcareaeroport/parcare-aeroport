import Stripe from "stripe"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createBookingWithFirestore } from "@/app/actions/booking-actions" // Folosim versiunea extinsă


// Inițializăm clientul Stripe cu cheia secretă
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-05-28.basil", // Versiune actualizată
})

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.log("Webhook received: payment_intent.succeeded", paymentIntent.id)

    // Extrage datele necesare pentru `createBooking` din metadata PaymentIntent-ului
    const bookingMetadata = paymentIntent.metadata

    if (
      !bookingMetadata ||
      !bookingMetadata.licensePlate ||
      !bookingMetadata.startDate ||
      !bookingMetadata.endDate
    ) {
      console.error("Webhook Error: Lipsesc datele necesare în metadata PaymentIntent-ului pentru a crea rezervarea.")
      return NextResponse.json({ success: false, error: "Lipsă metadata pentru rezervare" }, { status: 200 })
    }

    try {
      // Pregătim FormData pentru API-ul de parcare
      const formData = new FormData()
      formData.append("licensePlate", bookingMetadata.licensePlate)
      
      // Extragem data și ora din startDate și endDate (format: YYYY-MM-DDTHH:mm:00)
      const startDateParts = bookingMetadata.startDate.split('T')
      const endDateParts = bookingMetadata.endDate.split('T')
      
      formData.append("startDate", startDateParts[0]) // YYYY-MM-DD
      formData.append("startTime", startDateParts[1]?.slice(0, 5) || "08:00") // HH:mm
      formData.append("endDate", endDateParts[0]) // YYYY-MM-DD  
      formData.append("endTime", endDateParts[1]?.slice(0, 5) || "08:00") // HH:mm

      if (bookingMetadata.customerName) {
        formData.append("clientName", bookingMetadata.customerName)
      }

      // Calculăm zilele și suma din metadata sau din diferența de date
      const startDate = new Date(bookingMetadata.startDate)
      const endDate = new Date(bookingMetadata.endDate)
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1
      const amount = paymentIntent.amount / 100 // Stripe folosește cenți

      console.log("Webhook: Se încearcă crearea rezervării complete pentru PaymentIntent:", paymentIntent.id, {
        licensePlate: bookingMetadata.licensePlate,
        startDate: startDateParts[0],
        startTime: startDateParts[1]?.slice(0, 5),
        endDate: endDateParts[0], 
        endTime: endDateParts[1]?.slice(0, 5),
        days,
        amount,
        customerEmail: bookingMetadata.customerEmail
      })

      // Folosim noua funcție care salvează totul în Firestore
      const bookingResult = await createBookingWithFirestore(formData, {
        clientEmail: bookingMetadata.customerEmail,
        clientPhone: bookingMetadata.customerPhone || undefined,
        paymentIntentId: paymentIntent.id,
        paymentStatus: "paid",
        amount: amount,
        days: days,
        source: "webhook",
        // Date pentru facturare și adresă din metadata
        company: bookingMetadata.company || undefined,
        companyVAT: bookingMetadata.companyVAT || undefined,
        companyReg: bookingMetadata.companyReg || undefined,
        companyAddress: bookingMetadata.companyAddress || undefined,
        needInvoice: bookingMetadata.needInvoice ? bookingMetadata.needInvoice === 'true' : undefined,
        address: bookingMetadata.address || undefined,
        city: bookingMetadata.city || undefined,
        county: bookingMetadata.county || undefined,
        postalCode: bookingMetadata.postalCode || undefined,
        country: bookingMetadata.country || undefined,
        orderNotes: bookingMetadata.orderNotes || undefined
      })

      // Verificăm dacă au reușit ambele operațiuni
      const hasFirestoreSuccess = 'firestoreSuccess' in bookingResult ? bookingResult.firestoreSuccess : false
      const bookingNumber = 'bookingNumber' in bookingResult ? bookingResult.bookingNumber : null
      const firestoreId = 'firestoreId' in bookingResult ? bookingResult.firestoreId : null
      const firestoreError = 'firestoreError' in bookingResult ? bookingResult.firestoreError : null

      if (bookingResult.success && hasFirestoreSuccess) {
        console.log("Webhook: Rezervare completă creată cu succes!", {
          apiBookingNumber: bookingNumber,
          firestoreId: firestoreId,
          paymentIntentId: paymentIntent.id
                  })

        return NextResponse.json({ 
          success: true, 
          bookingNumber: bookingNumber,
          firestoreId: firestoreId
        }, { status: 200 })
        
      } else {
        console.error("Webhook Error: Rezervarea nu a reușit complet:", {
          apiSuccess: bookingResult.success,
          apiMessage: bookingResult.message,
          firestoreSuccess: hasFirestoreSuccess,
          firestoreError: firestoreError
        })
        
        return NextResponse.json({ 
          success: false, 
          error: `API: ${bookingResult.message}, Firestore: ${firestoreError || 'OK'}` 
        }, { status: 200 })
      }
      
    } catch (error: any) {
      console.error("Webhook Error: Eroare la apelarea createBookingWithFirestore:", error.message, "pentru PaymentIntent:", paymentIntent.id)
      
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 200 })
    }
  }
  
  // Alte tipuri de evenimente Stripe
  else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.log("Webhook received: payment_intent.payment_failed", paymentIntent.id, paymentIntent.last_payment_error?.message)
    // Gestionează eșecul plății (ex: notifică utilizatorul, anulează comanda etc.)
  } else {
    console.log(`Webhook unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
