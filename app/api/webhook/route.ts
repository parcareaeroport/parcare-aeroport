import Stripe from "stripe"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createBooking } from "@/app/actions/booking-actions" // Asigură-te că importul este corect

// Inițializăm clientul Stripe cu cheia secretă
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16", // Asigură-te că versiunea API este consistentă
})

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

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
    // Aceste date ar fi trebuit adăugate în metadata la crearea PaymentIntent-ului
    const bookingMetadata = paymentIntent.metadata

    if (
      !bookingMetadata ||
      !bookingMetadata.licensePlate ||
      !bookingMetadata.startDate ||
      !bookingMetadata.startTime ||
      !bookingMetadata.endDate ||
      !bookingMetadata.endTime
    ) {
      console.error("Webhook Error: Lipsesc datele necesare în metadata PaymentIntent-ului pentru a crea rezervarea.")
      // Poți returna un status 200 pentru a confirma primirea webhook-ului către Stripe,
      // dar loghează eroarea pentru investigații.
      return NextResponse.json({ success: false, error: "Lipsă metadata pentru rezervare" }, { status: 200 })
    }

    try {
      const formData = new FormData()
      formData.append("licensePlate", bookingMetadata.licensePlate)
      formData.append("startDate", bookingMetadata.startDate) // Format YYYY-MM-DD
      formData.append("startTime", bookingMetadata.startTime) // Format HH:mm
      formData.append("endDate", bookingMetadata.endDate)
      formData.append("endTime", bookingMetadata.endTime)

      if (bookingMetadata.clientName) {
        formData.append("clientName", bookingMetadata.clientName)
      }
      // Adaugă clientTitle dacă este în metadata și necesar

      console.log(
        "Webhook: Se încearcă crearea rezervării pentru PaymentIntent:",
        paymentIntent.id,
        "cu datele:",
        Object.fromEntries(formData),
      )

      const bookingApiResult = await createBooking(formData)

      if (bookingApiResult.success) {
        console.log(
          "Webhook: Rezervare creată cu succes prin API parcare:",
          bookingApiResult.bookingNumber,
          "pentru PaymentIntent:",
          paymentIntent.id,
        )
        // Aici ai putea actualiza o bază de date locală cu numărul de rezervare de la API-ul de parcare
        // și cu ID-ul tranzacției Stripe.
        // De exemplu: await updateOrderWithBookingNumber(bookingMetadata.orderId, bookingApiResult.bookingNumber, paymentIntent.id);
      } else {
        console.error(
          "Webhook Error: API-ul de parcare a returnat eroare:",
          bookingApiResult.message,
          "pentru PaymentIntent:",
          paymentIntent.id,
        )
        // Gestionează eroarea - poate reîncercare, notificare admin etc.
      }
    } catch (error: any) {
      console.error(
        "Webhook Error: Eroare la apelarea createBooking:",
        error.message,
        "pentru PaymentIntent:",
        paymentIntent.id,
      )
      // Gestionează eroarea
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.log(
      "Webhook received: payment_intent.payment_failed",
      paymentIntent.id,
      paymentIntent.last_payment_error?.message,
    )
    // Gestionează eșecul plății (ex: notifică utilizatorul, anulează comanda etc.)
  } else {
    console.log(`Webhook unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
