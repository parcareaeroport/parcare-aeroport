"use client"

import type React from "react"

import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"

// This is a placeholder component.  Replace with actual implementation.
// This component should handle the order placement form and logic.

interface OrderPlacementFormProps {
  reservationData: any // Replace 'any' with the actual type of reservationData
  formData: FormData // Replace 'any' with the actual type of formData
  createBooking: any // Replace 'any' with the actual type of createBooking function
  router: any // Replace 'any' with the actual type of router
  toast: any // Replace 'any' with the actual type of toast function
}

const OrderPlacementForm: React.FC<OrderPlacementFormProps> = ({
  reservationData,
  formData,
  createBooking,
  router,
  toast,
}) => {
  const handleDirectBooking = async () => {
    const result = await createBooking(reservationData)

    if (result.success && result.bookingNumber) {
      sessionStorage.setItem("bookingNumber", result.bookingNumber)
      sessionStorage.setItem("paymentRequired", "false")
      router.push("/booking-confirmation")

      // Salvează în Firestore
      try {
        const bookingsCollectionRef = collection(db, "bookings")
        await addDoc(bookingsCollectionRef, {
          ...reservationData, // Datele din sessionStorage
          clientName: formData.get("clientName"),
          clientEmail: formData.get("clientEmail"),
          clientPhone: formData.get("clientPhone"),
          clientTitle: formData.get("clientTitle"),
          paymentMethod: "test_no_payment",
          paymentStatus: "n/a",
          apiBookingNumber: result.bookingNumber, // Numărul de rezervare de la API-ul de parcare
          apiResponseMessage: result.message,
          status: "confirmed_test", // Un status intern
          createdAt: serverTimestamp(),
        })
        // OPTIMIZARE: Incrementez contorul de rezervări active
        const statsDocRef = doc(db, "config", "reservationStats")
        await updateDoc(statsDocRef, { activeBookingsCount: increment(1) })
        toast({
          title: "Rezervare salvată local",
          description: "Detaliile rezervării au fost salvate și în sistemul nostru.",
        })
      } catch (firestoreError) {
        console.error("Error saving booking to Firestore:", firestoreError)
        toast({
          title: "Eroare Firestore",
          description: "Rezervarea a fost trimisă la parcare, dar nu s-a putut salva local.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Eroare la rezervare",
        description: result.message || "A apărut o eroare necunoscută.",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <button onClick={handleDirectBooking}>Book Now (No Payment)</button>
    </div>
  )
}

export default OrderPlacementForm
