"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getStripe } from "@/lib/stripe" // Pentru a prelua instanța Stripe.js
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

interface ReservationData {
  licensePlate: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  days: number
  price: number
  formattedStartDate: string
  formattedEndDate: string
  clientName?: string // Adăugate din OrderPlacementForm
  clientEmail?: string
  clientPhone?: string
  clientTitle?: string
  apiBookingNumber?: string // De la API-ul de parcare, dacă e cazul
}

function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [status, setStatus] = useState<"loading" | "success" | "error" | "requires_action">("loading")
  const [message, setMessage] = useState("Se verifică statusul plății...")
  const [reservationDetails, setReservationDetails] = useState<ReservationData | null>(null)
  const [bookingNumber, setBookingNumber] = useState<string | null>(null) // Numărul de rezervare de la API-ul de parcare

  useEffect(() => {
    const clientSecret = searchParams.get("payment_intent_client_secret")
    const paymentIntentId = searchParams.get("payment_intent")
    const redirectStatus = searchParams.get("redirect_status")

    // Preluăm datele rezervării din sessionStorage - verificăm multiple surse
    let tempReservationData: ReservationData | null = null
    
    // Prima verificare: datele pentru confirmare (folosit pentru teste)
    const storedTestData = sessionStorage.getItem("reservationDataForConfirmation")
    if (storedTestData) {
      tempReservationData = JSON.parse(storedTestData) as ReservationData
      setReservationDetails(tempReservationData)
    } else {
      // A doua verificare: datele comenzii complete (folosit pentru plățile Stripe)
      const storedOrderData = sessionStorage.getItem("completeOrderData")
      if (storedOrderData) {
        const orderData = JSON.parse(storedOrderData)
        // Convertim datele comenzii în format ReservationData
        tempReservationData = {
          licensePlate: orderData.reservationData.licensePlate,
          startDate: orderData.reservationData.startDate,
          startTime: orderData.reservationData.startTime,
          endDate: orderData.reservationData.endDate,
          endTime: orderData.reservationData.endTime,
          days: orderData.reservationData.days,
          price: orderData.total,
          formattedStartDate: orderData.reservationData.formattedStartDate,
          formattedEndDate: orderData.reservationData.formattedEndDate,
          clientName: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`.trim(),
          clientEmail: orderData.customerInfo.email,
          clientPhone: orderData.customerInfo.phone,
        }
        setReservationDetails(tempReservationData)
      } else {
        // A treia verificare: rezultatul rezervării (folosit după plăți Stripe reușite)
        const storedBookingResult = sessionStorage.getItem("bookingResult")
        if (storedBookingResult) {
          const bookingResult = JSON.parse(storedBookingResult)
          // Convertim rezultatul rezervării în format ReservationData
          tempReservationData = {
            licensePlate: bookingResult.reservationData.licensePlate,
            startDate: bookingResult.reservationData.startDate,
            startTime: bookingResult.reservationData.startTime,
            endDate: bookingResult.reservationData.endDate,
            endTime: bookingResult.reservationData.endTime,
            days: bookingResult.reservationData.days,
            price: bookingResult.total,
            formattedStartDate: bookingResult.reservationData.formattedStartDate,
            formattedEndDate: bookingResult.reservationData.formattedEndDate,
            clientName: `${bookingResult.customerInfo.firstName} ${bookingResult.customerInfo.lastName}`.trim(),
            clientEmail: bookingResult.customerInfo.email,
            clientPhone: bookingResult.customerInfo.phone,
            apiBookingNumber: bookingResult.bookingNumber,
          }
          setReservationDetails(tempReservationData)
          // Setăm și numărul de rezervare dacă există
          if (bookingResult.bookingNumber) {
            setBookingNumber(bookingResult.bookingNumber)
          }
        } else {
          setMessage("Detaliile rezervării nu au fost găsite. Contactați suportul.")
          setStatus("error")
          return
        }
      }
    }

    // Preluăm numărul de rezervare de la API-ul de parcare, dacă a fost stocat
    const apiBookingNum = sessionStorage.getItem("apiBookingNumber")
    if (apiBookingNum) {
      setBookingNumber(apiBookingNum)
      if (tempReservationData) tempReservationData.apiBookingNumber = apiBookingNum
    }

    // Funcție asincronă pentru verificarea rezervării existente
    const checkExistingBooking = async (paymentIntentId: string, tempReservationData: ReservationData) => {
      try {
        console.log("Checking for existing booking processed by webhook...")
        
        // Verifică dacă există deja o rezervare cu acest paymentIntentId procesată de webhook
        const bookingsCollectionRef = collection(db, "bookings")
        const q = query(bookingsCollectionRef, where("paymentIntentId", "==", paymentIntentId))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          // Rezervarea există deja (salvată de webhook)
          const existingBooking = querySnapshot.docs[0].data()
          console.log("Found existing booking from webhook:", existingBooking.apiBookingNumber)
          
          setStatus("success")
          setMessage("Plata a fost efectuată cu succes! Rezervarea este confirmată. Veți primi un email de confirmare.")
          
          if (existingBooking.apiBookingNumber) {
            setBookingNumber(existingBooking.apiBookingNumber)
          }
          
          // Actualizăm datele de rezervare cu numărul real din API
          if (existingBooking.apiBookingNumber && tempReservationData) {
            tempReservationData.apiBookingNumber = existingBooking.apiBookingNumber
            setReservationDetails(tempReservationData)
          }
          
          toast({ title: "Rezervare confirmată", description: "Rezervarea a fost procesată cu succes de sistemul de plăți." })
          
          // Șterge datele din sessionStorage după procesare
          sessionStorage.removeItem("reservationDataForConfirmation")
          sessionStorage.removeItem("completeOrderData")
          sessionStorage.removeItem("bookingResult")
          sessionStorage.removeItem("apiBookingNumber")
          
          return true // Rezervarea a fost găsită și procesată
        } else {
          console.log("No existing booking found, might be processing delay...")
          // Poate că webhook-ul încă nu a procesat - dăm un timeout scurt și reîncercăm
          setTimeout(() => {
            window.location.reload() // Reîncarcă pagina pentru a verifica din nou
          }, 3000)
          
          setStatus("loading")
          setMessage("Se verifică statusul rezervării... Vă rugăm să așteptați.")
          return false // Rezervarea nu a fost găsită încă
        }
      } catch (firestoreError) {
        console.error("Error checking existing booking:", firestoreError)
        return false // Eroare - continuă cu fluxul normal
      }
    }

    if (!clientSecret || !paymentIntentId) {
      // Verificăm dacă este o confirmare de test (fără plată)
      const testBookingNumber = searchParams.get("bookingNumber") // Trimis de la OrderPlacementForm pentru test
      const testStatus = searchParams.get("status")

      if (testBookingNumber && testStatus === "success_test" && tempReservationData) {
        setStatus("success")
        setMessage(
          `Rezervarea de test (nr. ${testBookingNumber}) a fost înregistrată cu succes! Veți primi un email de confirmare.`,
        )
        setBookingNumber(testBookingNumber) // Setează numărul de rezervare pentru afișare
        return
      }

      // Dacă avem paymentIntentId dar nu clientSecret, verificăm dacă webhook-ul a procesat deja rezervarea
      if (paymentIntentId && !clientSecret && tempReservationData) {
        checkExistingBooking(paymentIntentId, tempReservationData)
        return
      }

      setMessage("Parametrii plății lipsesc. Tranzacție invalidă.")
      setStatus("error")
      return
    }

    const processPayment = async () => {
      const stripe = await getStripe()
      if (!stripe) {
        setMessage("Eroare la inițializarea Stripe.")
        setStatus("error")
        return
      }

      const { error, paymentIntent: retrievedPaymentIntent } = await stripe.retrievePaymentIntent(clientSecret)

      if (error) {
        setMessage(`Eroare la preluarea statusului plății: ${error.message}`)
        setStatus("error")
      } else if (retrievedPaymentIntent) {
        switch (retrievedPaymentIntent.status) {
          case "succeeded":
            setMessage(
              "Plata a fost efectuată cu succes! Rezervarea este confirmată. Veți primi un email de confirmare.",
            )
            setStatus("success")

            // Pentru plățile prin Stripe, webhook-ul ar trebui să se fi ocupat deja de salvarea rezervării
            // Totuși, verificăm și salvăm local dacă este necesar pentru urmărire
            if (tempReservationData) {
              try {
                // Verifică dacă există deja o rezervare cu acest paymentIntentId
                const bookingsCollectionRef = collection(db, "bookings")
                const q = query(bookingsCollectionRef, where("paymentIntentId", "==", paymentIntentId))
                const querySnapshot = await getDocs(q)

                if (querySnapshot.empty) {
                  // Doar dacă nu există deja (webhook-ul ar fi trebuit să o salveze)
                  console.log("Webhook nu a salvat rezervarea, salvez din pagina de confirmare...")
                  await addDoc(bookingsCollectionRef, {
                    ...tempReservationData,
                    paymentIntentId: paymentIntentId,
                    paymentStatus: "paid",
                    status: "confirmed_paid",
                    createdAt: serverTimestamp(),
                    source: "confirmation_page" // Indicăm sursa pentru debug
                  })
                  // OPTIMIZARE: Incrementez contorul de rezervări active
                  const statsDocRef = doc(db, "config", "reservationStats")
                  await updateDoc(statsDocRef, { activeBookingsCount: increment(1) })
                  toast({ title: "Rezervare salvată", description: "Detaliile rezervării au fost salvate în sistem." })
                } else {
                  // Rezervarea există deja (salvată de webhook)
                  const existingBooking = querySnapshot.docs[0].data()
                  if (existingBooking.apiBookingNumber) {
                    setBookingNumber(existingBooking.apiBookingNumber)
                  }
                  toast({ title: "Rezervare confirmată", description: "Rezervarea a fost procesată cu succes." })
                }
                
                // Șterge datele din sessionStorage după procesare
                sessionStorage.removeItem("reservationDataForConfirmation")
                sessionStorage.removeItem("completeOrderData")
                sessionStorage.removeItem("bookingResult")
                sessionStorage.removeItem("apiBookingNumber")
              } catch (firestoreError) {
                console.error("Error saving booking to Firestore from confirmation page:", firestoreError)
                // Pentru plățile Stripe, nu afișăm eroare critică dacă webhook-ul a funcționat
                toast({
                  title: "Plată confirmată",
                  description: "Plata a fost procesată cu succes. Rezervarea a fost înregistrată.",
                  variant: "default",
                })
              }
            }
            break
          case "processing":
            setMessage("Plata este în curs de procesare. Vă vom notifica când se finalizează.")
            setStatus("loading") // Sau un status specific "processing"
            break
          case "requires_payment_method":
            setMessage("Plata a eșuat. Vă rugăm să încercați o altă metodă de plată.")
            setStatus("error")
            router.push("/plasare-comanda?error=payment_failed") // Redirecționează înapoi la checkout
            break
          case "requires_action":
            setMessage("Este necesară o acțiune suplimentară pentru a finaliza plata.")
            setStatus("requires_action")
            break
          default:
            setMessage("Status neașteptat al plății.")
            setStatus("error")
            break
        }
      }
    }
    processPayment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, toast]) // Am adăugat toast la dependențe

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center">
      {status === "loading" && (
        <>
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
          <h1 className="text-3xl font-bold mb-2">Procesare...</h1>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="h-16 w-16 text-green-500 mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Confirmare Rezervare</h1>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-16 w-16 text-red-500 mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Eroare Tranzacție</h1>
        </>
      )}
      {status === "requires_action" && (
        <>
          <Loader2 className="h-16 w-16 text-amber-500 animate-spin mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Acțiune Necesară</h1>
        </>
      )}

      <p className="text-gray-600 text-lg mb-8 max-w-xl">{message}</p>

      {status === "success" && reservationDetails && (
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm w-full max-w-md mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Detalii Rezervare</h2>
          {bookingNumber && (
            <p className="mb-2">
              <strong>Număr Rezervare (Parcare):</strong> {bookingNumber}
            </p>
          )}
          <p className="mb-2">
            <strong>Număr Înmatriculare:</strong> {reservationDetails.licensePlate}
          </p>
          <p className="mb-2">
            <strong>Data Intrare:</strong> {reservationDetails.formattedStartDate} ora {reservationDetails.startTime}
          </p>
          <p className="mb-2">
            <strong>Data Ieșire:</strong> {reservationDetails.formattedEndDate} ora {reservationDetails.endTime}
          </p>
          <p className="mb-2">
            <strong>Total Zile:</strong> {reservationDetails.days}
          </p>
          <p className="font-bold text-lg">
            <strong>Total Plătit:</strong> {reservationDetails.price.toFixed(2)} LEI
          </p>
        </div>
      )}

      <div className="flex space-x-4">
        <Button asChild className="gradient-bg">
          <Link href="/">Pagina Principală</Link>
        </Button>
        {status === "error" && (
          <Button asChild variant="outline">
            <Link href="/plasare-comanda">Încearcă din nou</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

// Folosim Suspense pentru a gestiona parametrii de căutare
export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />{" "}
          <p className="ml-3 text-lg">Se încarcă detaliile confirmării...</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}
