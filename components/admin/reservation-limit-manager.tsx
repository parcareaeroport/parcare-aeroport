// ReservationLimitManager v2 – limită + toggle activare, fără defocus & cu flux logic robust
"use client"

import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings, Save, Loader2, Power, PowerOff } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, setDoc, onSnapshot, collection, query, getCountFromServer, where } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

export function ReservationLimitManager() {
  const { toast } = useToast()

  /*──────────────────────────────────┐
  │   STATE                         │
  └──────────────────────────────────*/
  // limită
  const [maxInput, setMaxInput] = useState("")
  const [currentLimit, setCurrentLimit] = useState<number | null>(null)

  // toggle rezervări
  const [reservationsEnabled, setReservationsEnabled] = useState<boolean | null>(null)

  // statistici
  const [activeBookings, setActiveBookings] = useState<number | null>(null)

  // flags
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingLimit, setSavingLimit] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)

  // refs pentru focus‑handling
  const hasLoadedOnce = useRef(false)
  const userTyped = useRef(false)

  /*──────────────────────────────────┐
  │   SNAPSHOT: settings (limită + toggle) │
  └──────────────────────────────────*/
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "config", "reservationSettings"),
      (snap) => {
        const data = snap.data() ?? {}
        const dbLimit = data.maxTotalReservations ?? 0
        const dbEnabled = data.reservationsEnabled ?? true

        setCurrentLimit(dbLimit)
        setReservationsEnabled(dbEnabled)

        if (!hasLoadedOnce.current && !userTyped.current) {
          setMaxInput(dbLimit.toString())
        }

        hasLoadedOnce.current = true
        setLoadingSettings(false)
      },
      (err) => {
        console.error(err)
        toast({ title: "Eroare", description: "Nu s-au putut încărca setările.", variant: "destructive" })
        setLoadingSettings(false)
      },
    )
    return () => unsub()
  }, [toast])

  /*──────────────────────────────────┐
  │   SNAPSHOT: rezervări active     │
  └──────────────────────────────────*/
  useEffect(() => {
    const col = collection(db, "bookings")
    const q = query(col, where("status", "!=", "cancelled"))
    const unsub = onSnapshot(q, async () => {
      const snap = await getCountFromServer(q)
      setActiveBookings(snap.data().count)
    })
    return () => unsub()
  }, [])

  /*──────────────────────────────────┐
  │   HANDLERS                       │
  └──────────────────────────────────*/
  const onLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    userTyped.current = true
    setMaxInput(e.target.value)
  }

  const saveLimit = async () => {
    const newLimit = Number.parseInt(maxInput, 10)
    if (isNaN(newLimit) || newLimit < 0) {
      toast({ title: "Valoare invalidă", description: "Limita trebuie să fie un număr pozitiv.", variant: "destructive" })
      return
    }

    const prev = currentLimit
    setCurrentLimit(newLimit)
    setSavingLimit(true)

    try {
      await setDoc(doc(db, "config", "reservationSettings"), { maxTotalReservations: newLimit }, { merge: true })
      userTyped.current = false
      toast({ title: "Succes", description: "Limita a fost actualizată." })
    } catch (err) {
      console.error(err)
      setCurrentLimit(prev)
      toast({ title: "Eroare", description: "Salvarea a eșuat.", variant: "destructive" })
    } finally {
      setSavingLimit(false)
    }
  }

  const toggleEnabled = async (enabled: boolean) => {
    const prev = reservationsEnabled
    setReservationsEnabled(enabled)
    setSavingToggle(true)

    try {
      await setDoc(doc(db, "config", "reservationSettings"), { reservationsEnabled: enabled }, { merge: true })
      toast({ title: "Succes", description: `Rezervările au fost ${enabled ? "activate" : "dezactivate"}.` })
    } catch (err) {
      console.error(err)
      setReservationsEnabled(prev)
      toast({ title: "Eroare", description: "Nu s-a putut actualiza statusul.", variant: "destructive" })
    } finally {
      setSavingToggle(false)
    }
  }

  /*──────────────────────────────────┐
  │   DERIVED                        │
  └──────────────────────────────────*/
  const limitDirty = maxInput !== (currentLimit ?? "").toString()
  const anySaving = savingLimit || savingToggle
  const disabledAll = loadingSettings || anySaving

  /*──────────────────────────────────┐
  │   UI                             │
  └──────────────────────────────────*/
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" /> Management Rezervări
        </CardTitle>
        <CardDescription>Configurați limita maximă și activați/ dezactivați sistemul de rezervări.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Limită maximă */}
        <div>
          <label htmlFor="maxReservations" className="block text-sm font-medium mb-1">
            Limită Maximă Rezervări
          </label>
          <div className="flex items-end gap-4">
            <Input
              id="maxReservations"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={maxInput}
              onChange={onLimitChange}
              placeholder="Ex: 100"
              disabled={disabledAll}
              className="flex-grow"
            />
            <Button onClick={saveLimit} disabled={!limitDirty || disabledAll}>
              {savingLimit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvează
            </Button>
          </div>
        </div>

        <div className="border-t" />

        {/* Toggle rezervări */}
        <div>
          <label htmlFor="reservationsEnabledSwitch" className="block text-sm font-medium mb-2">
            Status Sistem Rezervări
          </label>
          {loadingSettings ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Se încarcă…
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {reservationsEnabled ? (
                  <Power className="h-5 w-5 text-green-500" />
                ) : (
                  <PowerOff className="h-5 w-5 text-red-500" />
                )}
                <span className={`text-sm font-semibold ${reservationsEnabled ? "text-green-600" : "text-red-600"}`}>
                  {reservationsEnabled ? "Rezervări ACTIVE" : "Rezervări OPRITE"}
                </span>
              </div>

              <Switch
                id="reservationsEnabledSwitch"
                checked={reservationsEnabled ?? false}
                onCheckedChange={toggleEnabled}
                disabled={disabledAll}
              />
            </div>
          )}
        </div>

        {/* Statistici */}
        <p className="text-sm text-muted-foreground pt-2">
          Rezervări active curente: <strong className="text-primary">{activeBookings ?? "—"}</strong> /{' '}
          <strong className="text-primary">{currentLimit ?? "—"}</strong>
        </p>
      </CardContent>
    </Card>
  )
}
