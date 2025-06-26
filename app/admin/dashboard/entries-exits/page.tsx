"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getDailyEntries,
  getDailyExits,
  type DailyEntryExit
} from "@/lib/admin-stats"

export default function EntriesExitsPage() {
  const [isClient, setIsClient] = useState(false)
  
  // State pentru intrări/ieșiri
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] // YYYY-MM-DD format
  })
  const [dailyEntries, setDailyEntries] = useState<DailyEntryExit[]>([])
  const [dailyExits, setDailyExits] = useState<DailyEntryExit[]>([])
  const [loadingDailyStats, setLoadingDailyStats] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && selectedDate) {
      loadDailyStats(selectedDate)
    }
  }, [isClient, selectedDate])

  const loadDailyStats = async (date: string) => {
    try {
      setLoadingDailyStats(true)
      
      // Încarcă intrările și ieșirile în paralel
      const [entries, exits] = await Promise.all([
        getDailyEntries(date),
        getDailyExits(date)
      ])

      setDailyEntries(entries)
      setDailyExits(exits)
      
    } catch (error) {
      console.error('Error loading daily stats:', error)
      setDailyEntries([])
      setDailyExits([])
    } finally {
      setLoadingDailyStats(false)
    }
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intrări/Ieșiri</h1>
          <p className="text-muted-foreground">
            Statistici detaliate pentru intrările și ieșirile pe data selectată
          </p>
        </div>
        <Button 
          onClick={() => loadDailyStats(selectedDate)} 
          disabled={loadingDailyStats}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingDailyStats ? 'animate-spin' : ''}`} />
          {loadingDailyStats ? 'Se încarcă...' : 'Actualizează'}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">
              Selectează data:
            </label>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          {loadingDailyStats && (
            <div className="text-sm text-gray-500">Se încarcă...</div>
          )}
        </div>
        
        {/* Desktop Layout - Side by Side */}
        <div className="hidden lg:grid gap-6 lg:grid-cols-2">
          {/* Tabelul pentru intrări */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">INTRĂRI</CardTitle>
              <CardDescription>
                Rezervări care încep în data de {new Date(selectedDate).toLocaleDateString('ro-RO')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyEntries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nu există intrări pentru această dată.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700">ORA</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">NR ÎNMATRICULARE</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">TEL</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">NR PERSOANE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">{entry.time}</td>
                          <td className="py-3 px-2">{entry.licensePlate}</td>
                          <td className="py-3 px-2">{entry.phone}</td>
                          <td className="py-3 px-2 text-center">{entry.numberOfPersons}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabelul pentru ieșiri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">IEȘIRI</CardTitle>
              <CardDescription>
                Rezervări care se termină în data de {new Date(selectedDate).toLocaleDateString('ro-RO')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyExits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nu există ieșiri pentru această dată.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700">ORA</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">NR ÎNMATRICULARE</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">TEL</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">NR PERSOANE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyExits.map((exit) => (
                        <tr key={exit.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">{exit.time}</td>
                          <td className="py-3 px-2">{exit.licensePlate}</td>
                          <td className="py-3 px-2">{exit.phone}</td>
                          <td className="py-3 px-2 text-center">{exit.numberOfPersons}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile & Tablet Layout - Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="entries" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entries" className="text-green-700 data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                INTRĂRI ({dailyEntries.length})
              </TabsTrigger>
              <TabsTrigger value="exits" className="text-red-700 data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
                IEȘIRI ({dailyExits.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="entries" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">INTRĂRI</CardTitle>
                  <CardDescription>
                    Rezervări care încep în data de {new Date(selectedDate).toLocaleDateString('ro-RO')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyEntries.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nu există intrări pentru această dată.</p>
                  ) : (
                    <>
                      {/* Tablet Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-2 font-medium text-gray-700">ORA</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-700">NR ÎNMATRICULARE</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-700">TEL</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-700">NR PERSOANE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailyEntries.map((entry) => (
                              <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-2 font-medium">{entry.time}</td>
                                <td className="py-3 px-2">{entry.licensePlate}</td>
                                <td className="py-3 px-2">{entry.phone}</td>
                                <td className="py-3 px-2 text-center">{entry.numberOfPersons}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {dailyEntries.map((entry) => (
                          <div key={entry.id} className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-green-700">{entry.time}</span>
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              </div>
                              <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                                {entry.numberOfPersons} pers.
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-600 font-medium uppercase tracking-wide">Număr auto</span>
                                <span className="font-semibold text-gray-900">{entry.licensePlate}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-600 font-medium uppercase tracking-wide">Telefon</span>
                                <span className="text-gray-700">{entry.phone}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="exits" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">IEȘIRI</CardTitle>
                  <CardDescription>
                    Rezervări care se termină în data de {new Date(selectedDate).toLocaleDateString('ro-RO')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyExits.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nu există ieșiri pentru această dată.</p>
                  ) : (
                    <>
                      {/* Tablet Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-2 font-medium text-gray-700">ORA</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-700">NR ÎNMATRICULARE</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-700">TEL</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-700">NR PERSOANE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailyExits.map((exit) => (
                              <tr key={exit.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-2 font-medium">{exit.time}</td>
                                <td className="py-3 px-2">{exit.licensePlate}</td>
                                <td className="py-3 px-2">{exit.phone}</td>
                                <td className="py-3 px-2 text-center">{exit.numberOfPersons}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {dailyExits.map((exit) => (
                          <div key={exit.id} className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-red-700">{exit.time}</span>
                                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                              </div>
                              <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                                {exit.numberOfPersons} pers.
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-red-600 font-medium uppercase tracking-wide">Număr auto</span>
                                <span className="font-semibold text-gray-900">{exit.licensePlate}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-red-600 font-medium uppercase tracking-wide">Telefon</span>
                                <span className="text-gray-700">{exit.phone}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 