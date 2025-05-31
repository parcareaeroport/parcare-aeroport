"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase" // Importă instanța db
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Save, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context" // Pentru a verifica dacă adminul e logat

interface PriceEntry {
  id: string // Firestore document ID
  days: number
  standardPrice: number
  discountedPrice: number // Va fi calculat
  discountPercentage: number
}

export default function PricesPage() {
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth() // Verifică starea de autentificare
  const [prices, setPrices] = useState<PriceEntry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ standardPrice: 0, discountPercentage: 0 })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPrice, setNewPrice] = useState({ days: 1, standardPrice: 50, discountPercentage: 0 })
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const pricesCollectionRef = collection(db, "prices")

  const fetchPrices = async () => {
    setIsLoading(true)
    try {
      const q = query(pricesCollectionRef, orderBy("days"))
      const data = await getDocs(q)
      const fetchedPrices: PriceEntry[] = data.docs.map((doc) => {
        const priceData = doc.data()
        return {
          id: doc.id,
          days: priceData.days,
          standardPrice: priceData.standardPrice,
          discountPercentage: priceData.discountPercentage,
          discountedPrice: priceData.standardPrice * (1 - priceData.discountPercentage / 100),
        }
      })
      setPrices(fetchedPrices)
    } catch (error) {
      console.error("Error fetching prices:", error)
      toast({ title: "Eroare", description: "Nu s-au putut încărca prețurile.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      // Doar dacă adminul e logat
      fetchPrices()
    } else if (!authLoading && !user) {
      setIsLoading(false) // Oprește loading dacă nu e logat
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const handleEdit = (price: PriceEntry) => {
    setEditingId(price.id)
    setEditValues({
      standardPrice: price.standardPrice,
      discountPercentage: price.discountPercentage,
    })
  }

  const handleSave = async (id: string) => {
    if (!user) return // Doar adminul poate salva
    const priceDoc = doc(db, "prices", id)
    const updatedPriceData = {
      standardPrice: editValues.standardPrice,
      discountPercentage: editValues.discountPercentage,
    }
    try {
      await updateDoc(priceDoc, updatedPriceData)
      setEditingId(null)
      fetchPrices() // Reîncarcă prețurile
      toast({ title: "Preț actualizat", description: "Prețul a fost actualizat cu succes." })
    } catch (error) {
      console.error("Error updating price:", error)
      toast({ title: "Eroare", description: "Actualizarea prețului a eșuat.", variant: "destructive" })
    }
  }

  const handleAddPrice = async () => {
    if (!user) return
    // Verifică dacă există deja un preț pentru acest număr de zile
    if (prices.some((p) => p.days === newPrice.days)) {
      toast({
        title: "Eroare",
        description: `Există deja un preț pentru ${newPrice.days} zile. Editați intrarea existentă.`,
        variant: "destructive",
      })
      return
    }
    const newPriceData = {
      days: newPrice.days,
      standardPrice: newPrice.standardPrice,
      discountPercentage: newPrice.discountPercentage,
    }
    try {
      await addDoc(pricesCollectionRef, newPriceData)
      setIsAddDialogOpen(false)
      setNewPrice({ days: Math.max(...prices.map((p) => p.days), 0) + 1, standardPrice: 50, discountPercentage: 0 }) // Reset form
      fetchPrices()
      toast({ title: "Preț adăugat", description: "Noul preț a fost adăugat cu succes." })
    } catch (error) {
      console.error("Error adding price:", error)
      toast({ title: "Eroare", description: "Adăugarea prețului a eșuat.", variant: "destructive" })
    }
  }

  const handleDeletePrice = async (id: string) => {
    if (!user) return
    const priceDoc = doc(db, "prices", id)
    try {
      await deleteDoc(priceDoc)
      fetchPrices()
      toast({ title: "Preț șters", description: "Prețul a fost șters cu succes." })
    } catch (error) {
      console.error("Error deleting price:", error)
      toast({ title: "Eroare", description: "Ștergerea prețului a eșuat.", variant: "destructive" })
    }
  }

  const applyGlobalDiscount = async () => {
    if (!user) return
    const batch = writeBatch(db)
    prices.forEach((price) => {
      const priceRef = doc(db, "prices", price.id)
      batch.update(priceRef, { discountPercentage: globalDiscount })
    })
    try {
      await batch.commit()
      fetchPrices()
      toast({ title: "Discount global aplicat", description: `Discountul de ${globalDiscount}% a fost aplicat.` })
    } catch (error) {
      console.error("Error applying global discount:", error)
      toast({ title: "Eroare", description: "Aplicarea discountului global a eșuat.", variant: "destructive" })
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Se încarcă datele...</p>
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
        <h1 className="text-2xl font-bold tracking-tight">Gestionare Prețuri</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg">
                <Plus className="mr-2 h-4 w-4" /> Adaugă Preț
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adaugă Preț Nou</DialogTitle>
                <DialogDescription>Adaugă un preț nou pentru un număr specific de zile.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="days" className="text-right">
                    Zile
                  </Label>
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    value={newPrice.days}
                    onChange={(e) => setNewPrice({ ...newPrice, days: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="standardPrice" className="text-right">
                    Preț Standard
                  </Label>
                  <Input
                    id="standardPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice.standardPrice}
                    onChange={(e) => setNewPrice({ ...newPrice, standardPrice: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discountPercentage" className="text-right">
                    Discount (%)
                  </Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={newPrice.discountPercentage}
                    onChange={(e) => setNewPrice({ ...newPrice, discountPercentage: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Anulează
                </Button>
                <Button onClick={handleAddPrice}>Adaugă</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prices">Prețuri Individuale</TabsTrigger>
          <TabsTrigger value="discounts">Discount Global</TabsTrigger>
        </TabsList>
        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista Prețurilor</CardTitle>
              <CardDescription>Gestionează prețurile pentru fiecare număr de zile de parcare.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zile</TableHead>
                    <TableHead>Preț Standard (RON)</TableHead>
                    <TableHead>Discount (%)</TableHead>
                    <TableHead>Preț Final (RON)</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{price.days}</TableCell>
                      <TableCell>
                        {editingId === price.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editValues.standardPrice}
                            onChange={(e) => setEditValues({ ...editValues, standardPrice: Number(e.target.value) })}
                            className="w-24"
                          />
                        ) : (
                          price.standardPrice.toFixed(2)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === price.id ? (
                          <Input
                            type="number"
                            value={editValues.discountPercentage}
                            onChange={(e) =>
                              setEditValues({ ...editValues, discountPercentage: Number(e.target.value) })
                            }
                            className="w-20"
                          />
                        ) : (
                          price.discountPercentage
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === price.id
                          ? (editValues.standardPrice * (1 - editValues.discountPercentage / 100)).toFixed(2)
                          : price.discountedPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === price.id ? (
                          <Button variant="outline" size="icon" onClick={() => handleSave(price.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(price)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDeletePrice(price.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discount Global</CardTitle>
              <CardDescription>Setează un discount global pentru toate prețurile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenție</AlertTitle>
                <AlertDescription>
                  Aplicarea unui discount global va suprascrie toate discounturile individuale.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="globalDiscount" className="text-right">
                  Discount Global (%)
                </Label>
                <Input
                  id="globalDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={applyGlobalDiscount}>Aplică Discount Global</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
