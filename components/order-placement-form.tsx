"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Info, TestTube } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { createBooking } from "@/app/actions/booking-actions"

// Inițializăm Stripe cu cheia publică
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

// Componenta de formular de plată Stripe
function CheckoutForm({
  clientSecret,
  orderData,
  onSuccess,
}: {
  clientSecret: string
  orderData: any
  onSuccess: (paymentIntentId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      // Confirmăm plata
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-callback`,
        },
        redirect: "if_required",
      })

      if (error) {
        toast({
          title: "Eroare la procesarea plății",
          description: error.message || "A apărut o eroare. Vă rugăm să încercați din nou.",
          variant: "destructive",
        })
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Plata a reușit, apelăm callback-ul de succes
        onSuccess(paymentIntent.id)
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare neașteptată.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      <Button
        type="submit"
        className="w-full gradient-bg hover:opacity-90 py-6 text-base font-medium rounded-xl"
        disabled={isLoading || !stripe || !elements}
      >
        {isLoading ? "Se procesează..." : "Plătește acum"}
      </Button>
    </form>
  )
}

export default function OrderPlacementForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  
  // Test mode toggle
  const [isTestMode, setIsTestMode] = useState(false)

  // Detalii client
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [county, setCounty] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [company, setCompany] = useState("")
  const [companyVAT, setCompanyVAT] = useState("")
  const [companyReg, setCompanyReg] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [orderNotes, setOrderNotes] = useState("")
  const [needInvoice, setNeedInvoice] = useState(false)

  // Reservation data state
  const [reservationData, setReservationData] = useState<any>(null)
  const [orderData, setOrderData] = useState<any>(null)

  // Load reservation data from sessionStorage
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem("reservationData")
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        setReservationData(parsedData)
      } else {
        toast({
          title: "Eroare",
          description: "Nu s-au găsit date pentru rezervare. Vă rugăm să completați formularul de rezervare.",
          variant: "destructive",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Error parsing reservation data:", error)
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca datele rezervării. Vă rugăm să încercați din nou.",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [router, toast])

  // Calculate discount and total
  const calculateDiscount = () => {
    if (!reservationData) return 0
    return reservationData.days > 1 ? reservationData.price * 0.3 : 0
  }

  const calculateTotal = () => {
    if (!reservationData) return 0
    return reservationData.price - calculateDiscount()
  }

  // Test mode booking function
  const handleTestBooking = async () => {
    if (!reservationData) {
      toast({
        title: "Eroare",
        description: "Datele rezervării lipsesc.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Pregătim FormData pentru API-ul direct
      const formData = new FormData()
      formData.append("licensePlate", reservationData.licensePlate)
      formData.append("startDate", reservationData.startDate)
      formData.append("startTime", reservationData.startTime)
      formData.append("endDate", reservationData.endDate)
      formData.append("endTime", reservationData.endTime)
      formData.append("clientName", `${firstName} ${lastName}`.trim())
      if (firstName) formData.append("clientTitle", firstName)

      console.log("Test Mode - Apelăm direct createBooking cu datele:", {
        licensePlate: reservationData.licensePlate,
        startDate: reservationData.startDate,
        startTime: reservationData.startTime,
        endDate: reservationData.endDate,
        endTime: reservationData.endTime,
        clientName: `${firstName} ${lastName}`.trim(),
      })

      // Apelează direct API-ul de rezervare
      const result = await createBooking(formData)

      if (result.success && result.bookingNumber) {
        toast({
          title: "Succes!",
          description: `Rezervarea de test ${result.bookingNumber} a fost creată cu succes!`,
          variant: "default",
        })

        // Salvează pentru pagina de confirmare
        sessionStorage.setItem("bookingNumber", result.bookingNumber)
        sessionStorage.setItem("reservationDataForConfirmation", JSON.stringify({
          ...reservationData,
          clientName: `${firstName} ${lastName}`.trim(),
          clientEmail: email,
          clientPhone: phone,
          apiBookingNumber: result.bookingNumber,
        }))

        // Redirectează la pagina de confirmare cu parametrii de test
        router.push(`/confirmare?bookingNumber=${result.bookingNumber}&status=success_test`)
      } else {
        toast({
          title: "Eroare la rezervare",
          description: result.message || "A apărut o eroare la crearea rezervării de test.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating test booking:", error)
      toast({
        title: "Eroare",
        description: "A apărut o eroare tehnică la testare. Verificați consola pentru detalii.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      toast({
        title: "Eroare",
        description: "Trebuie să acceptați termenii și condițiile pentru a continua.",
        variant: "destructive",
      })
      return
    }

    if (!reservationData) {
      toast({
        title: "Eroare",
        description: "Datele rezervării lipsesc. Vă rugăm să încercați din nou.",
        variant: "destructive",
      })
      return
    }

    // Dacă este modul de test, apelează direct API-ul
    if (isTestMode) {
      await handleTestBooking()
      return
    }

    setIsSubmitting(true)

    try {
      // Pregătim datele pentru comandă
      const completeOrderData = {
        reservationData,
        customerInfo: {
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          county,
          postalCode,
          company: needInvoice ? company : "",
          companyVAT: needInvoice ? companyVAT : "",
          companyReg: needInvoice ? companyReg : "",
          companyAddress: needInvoice ? companyAddress : "",
          notes: orderNotes,
        },
        paymentMethod,
        total: calculateTotal(),
        orderId: `PO-${Date.now()}`,
      }

      // Salvăm datele comenzii
      setOrderData(completeOrderData)
      sessionStorage.setItem("completeOrderData", JSON.stringify(completeOrderData))

      // Creăm o intenție de plată în Stripe
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: calculateTotal(),
          bookingData: {
            licensePlate: reservationData.licensePlate,
            startDate: `${reservationData.startDate}T${reservationData.startTime}:00`,
            endDate: `${reservationData.endDate}T${reservationData.endTime}:00`,
          },
          customerInfo: {
            firstName,
            lastName,
            email,
            phone,
          },
          orderId: completeOrderData.orderId,
        }),
      })

      const { clientSecret, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Salvăm client secret și afișăm formularul de plată
      setClientSecret(clientSecret)
      setShowPaymentForm(true)
      setIsSubmitting(false)
    } catch (error: any) {
      console.error("Order submission error:", error)
      toast({
        title: "Eroare",
        description: "A apărut o eroare la procesarea comenzii. Vă rugăm să încercați din nou.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = (paymentIntentId: string) => {
    // Salvăm ID-ul plății și redirecționăm către pagina de confirmare
    if (orderData) {
      const bookingResult = {
        ...orderData,
        bookingNumber: `PO-${Date.now()}`,
        success: true,
        transactionId: paymentIntentId,
      }

      sessionStorage.setItem("bookingResult", JSON.stringify(bookingResult))
      router.push("/confirmare")
    }
  }

  if (!reservationData) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 text-center">
          <p className="text-gray-600 mb-4">Se încarcă datele rezervării...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          {showPaymentForm ? "Finalizare plată" : "Plasare comandă"}
        </h1>

        {/* Test Mode Toggle */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="testMode"
              checked={isTestMode}
              onCheckedChange={(checked) => setIsTestMode(checked === true)}
            />
            <Label htmlFor="testMode" className="flex items-center space-x-2 cursor-pointer">
              <span className="text-yellow-800 font-medium">Mod Test (ocolește Stripe, rezervare directă)</span>
            </Label>
          </div>
          {isTestMode && (
            <p className="text-xs text-yellow-700 mt-2">
              În modul test, se va apela direct API-ul de rezervare fără procesarea plății prin Stripe.
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - Customer details form or Payment form */}
          <div className="flex-1">
            {showPaymentForm && clientSecret && !isTestMode ? (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg font-bold mb-4">Plată securizată</h2>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm clientSecret={clientSecret} orderData={orderData} onSuccess={handlePaymentSuccess} />
                </Elements>
              </div>
            ) : (
              <>
                <div className="bg-primary/5 rounded-xl p-4 mb-6">
                  <h2 className="text-lg font-bold mb-2 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    PARCARE AUTOTURISM
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>ASFALTATĂ</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>Spațiu de parcare suficient și bine organizat</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>Supraveghere video 24/7</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>Transfer gratuit la aeroport</span>
                      </li>
                    </ul>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>Infrastructură de înaltă calitate</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>Acces direct din DN1</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>Parcare împrejmuită cu gard</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>Iluminat STÂLPI DE ILUMINARE ELECTRICĂ</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      Anularea rezervărilor de parcare făcute cu minim 24 de ore înainte de data și ora intrării în
                      parcare!
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold mb-4">Detalii pentru facturare</h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">Prenume</Label>
                          <Input
                            id="firstName"
                            placeholder="Prenumele dvs."
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Nume</Label>
                          <Input
                            id="lastName"
                            placeholder="Numele dvs."
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@exemplu.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        placeholder="07xx xxx xxx"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    {!isTestMode && (
                      <>
                        <div>
                          <Label htmlFor="address">Adresă</Label>
                          <Textarea
                            id="address"
                            placeholder="Adresa dvs. completă"
                            rows={3}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="city">Oraș</Label>
                            <Input
                              id="city"
                              placeholder="Orașul dvs."
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="county">Județ</Label>
                            <Input
                              id="county"
                              placeholder="Județul dvs."
                              value={county}
                              onChange={(e) => setCounty(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="postalCode">Cod poștal</Label>
                            <Input
                              id="postalCode"
                              placeholder="Codul poștal"
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-start space-x-2 mb-4">
                            <Checkbox
                              id="needInvoice"
                              checked={needInvoice}
                              onCheckedChange={(checked) => setNeedInvoice(checked === true)}
                            />
                            <Label htmlFor="needInvoice" className="text-sm">
                              Doresc factură pentru persoană juridică
                            </Label>
                          </div>

                          {needInvoice && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <Label htmlFor="company">Denumire firmă</Label>
                                <Input
                                  id="company"
                                  placeholder="Denumirea firmei"
                                  value={company}
                                  onChange={(e) => setCompany(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="companyVAT">CUI / CIF</Label>
                                <Input
                                  id="companyVAT"
                                  placeholder="Codul fiscal"
                                  value={companyVAT}
                                  onChange={(e) => setCompanyVAT(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="companyReg">Număr Registrul Comerțului</Label>
                                <Input
                                  id="companyReg"
                                  placeholder="J40/12345/2023"
                                  value={companyReg}
                                  onChange={(e) => setCompanyReg(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="companyAddress">Adresa firmei</Label>
                                <Textarea
                                  id="companyAddress"
                                  placeholder="Adresa completă a firmei"
                                  rows={3}
                                  value={companyAddress}
                                  onChange={(e) => setCompanyAddress(e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="notes">Observații comandă</Label>
                          <Textarea
                            id="notes"
                            placeholder="Observații speciale pentru comanda dvs."
                            rows={3}
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                          />
                        </div>

                        <div>
                          <h2 className="text-lg font-bold mb-4">Metodă de plată</h2>

                          <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-colors">
                            <input
                              type="radio"
                              id="card"
                              name="paymentMethod"
                              value="card"
                              checked={paymentMethod === "card"}
                              onChange={() => setPaymentMethod("card")}
                              className="h-4 w-4 text-primary"
                            />
                            <Label htmlFor="card" className="flex-1 cursor-pointer">
                              <div className="flex items-center">
                                <span>Plată cu cardul (Stripe)</span>
                              </div>
                            </Label>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="terms"
                          checked={acceptTerms}
                          onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                        />
                        <Label htmlFor="terms" className="text-sm">
                          Am citit și sunt de acord cu{" "}
                          <Link href="/termeni" className="text-primary hover:underline">
                            Termenii și Condițiile
                          </Link>{" "}
                          și{" "}
                          <Link href="/confidentialitate" className="text-primary hover:underline">
                            Politica de Confidențialitate
                          </Link>
                        </Label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gradient-bg hover:opacity-90 py-6 text-base font-medium rounded-xl"
                      disabled={isSubmitting || !acceptTerms}
                    >
                      {isSubmitting ? "Se procesează..." : isTestMode ? "Rezervare directă (TEST)" : "Continuă spre plată"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Right column - Order summary */}
          <div className="lg:w-96">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold mb-4">Comanda ta</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Data intrare:</span>
                    <span className="font-medium">{reservationData.formattedStartDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Data ieșire:</span>
                    <span className="font-medium">{reservationData.formattedEndDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Durată:</span>
                    <span className="font-medium">{reservationData.days} zile</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Număr înmatriculare:</span>
                    <span className="font-medium">{reservationData.licensePlate}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preț standard:</span>
                    <span>{reservationData.price.toFixed(2)} RON</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount (30%):</span>
                    <span>-{calculateDiscount().toFixed(2)} RON</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{(reservationData.price - calculateDiscount()).toFixed(2)} RON</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TVA (19%):</span>
                    <span>{(calculateTotal() * 0.19).toFixed(2)} RON</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total:</span>
                    <span className="font-bold text-xl">{calculateTotal().toFixed(2)} RON</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    (include TVA 19% - {(calculateTotal() * 0.19).toFixed(2)} RON)
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {isTestMode ? "Rezervare directă (test)" : "Plătești cu cardul (Stripe)"}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  {isTestMode 
                    ? "În modul test, rezervarea se face direct prin API fără plată."
                    : "Plățile sunt procesate în mod securizat. Datele cardului tău nu sunt stocate pe serverele noastre."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
