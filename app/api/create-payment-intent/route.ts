import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Inițializăm clientul Stripe cu cheia secretă
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: NextRequest) {
  try {
    // Verificăm dacă avem cheia Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { amount, bookingData, customerInfo, orderId } = body

    // Validăm datele primite
    if (!amount || !bookingData || !customerInfo || !orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Creăm un obiect de plată în Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe folosește cenți/bani, nu lei/euro
      currency: "ron",
      payment_method_types: ["card"], // Specificați explicit 'card'
      metadata: {
        orderId,
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerEmail: customerInfo.email,
        licensePlate: bookingData.licensePlate,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
      },
    })

    // Returnăm client_secret pentru a putea finaliza plata pe client
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// Adaugă și alte metode pentru a evita eroarea INVALID_REQUEST_METHOD
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
