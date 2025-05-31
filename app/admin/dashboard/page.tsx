"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Calendar, Car, CreditCard, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReservationLimitManager } from "@/components/admin/reservation-limit-manager" // Importă noua componentă

// Date mock pentru statistici (rămân aici sau pot fi mutate dacă sunt specifice altor carduri)
const revenueData = [
  { name: "Ian", value: 12500 },
  { name: "Feb", value: 14200 },
  { name: "Mar", value: 16800 },
  { name: "Apr", value: 18900 },
  { name: "Mai", value: 21500 },
  { name: "Iun", value: 25800 },
  { name: "Iul", value: 31200 },
  { name: "Aug", value: 29800 },
  { name: "Sep", value: 24500 },
  { name: "Oct", value: 19800 },
  { name: "Nov", value: 16500 },
  { name: "Dec", value: 15200 },
]

const bookingsData = [
  { name: "Ian", value: 125 },
  { name: "Feb", value: 142 },
  { name: "Mar", value: 168 },
  { name: "Apr", value: 189 },
  { name: "Mai", value: 215 },
  { name: "Iun", value: 258 },
  { name: "Iul", value: 312 },
  { name: "Aug", value: 298 },
  { name: "Sep", value: 245 },
  { name: "Oct", value: 198 },
  { name: "Nov", value: 165 },
  { name: "Dec", value: 152 },
]

const occupancyData = [
  { name: "Ocupat", value: 72 },
  { name: "Liber", value: 28 },
]

const COLORS = ["#22c55e", "#e5e7eb"]

const bookingStatusData = [
  { name: "Confirmate", value: 65 },
  { name: "În așteptare", value: 15 },
  { name: "Anulate", value: 20 },
]

const STATUS_COLORS = ["#22c55e", "#f59e0b", "#ef4444"]

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // State-ul și useEffect-urile pentru ReservationLimitManager au fost mutate în componenta dedicată.

  if (!isClient) {
    return null // Sau un loader global pentru pagină
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Aici randăm noua componentă */}
      <ReservationLimitManager />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venit Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247,500 RON</div>
            <p className="text-xs text-muted-foreground">+20.1% față de anul trecut</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rezervări</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground">+15.2% față de anul trecut</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clienți</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,274</div>
            <p className="text-xs text-muted-foreground">+4.5% față de anul trecut</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupare Curentă</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">72 din 100 locuri ocupate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Venituri</TabsTrigger>
          <TabsTrigger value="bookings">Rezervări</TabsTrigger>
          <TabsTrigger value="occupancy">Ocupare</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Venituri Lunare</CardTitle>
              <CardDescription>Veniturile totale pe fiecare lună din anul curent</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} RON`, "Venit"]} />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rezervări Lunare</CardTitle>
              <CardDescription>Numărul de rezervări pe fiecare lună din anul curent</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, "Rezervări"]} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Rezervări</CardTitle>
                <CardDescription>Distribuția rezervărilor după status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {bookingStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Rezervări Recente</CardTitle>
                <CardDescription>Ultimele 5 rezervări efectuate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">B-123-ABC</p>
                      <p className="text-xs text-muted-foreground">Popescu Ion</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">23-25 Mai 2023</p>
                      <p className="text-xs text-green-600">Confirmată</p>
                    </div>
                  </div>
                  {/* Restul rezervărilor recente mock... */}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="occupancy" className="space-y-4">
          {/* Restul tab-ului de ocupare... */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
