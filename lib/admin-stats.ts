import { db } from './firebase'
import { collection, query, where, getDocs, orderBy, limit, Timestamp, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

// Interfețe pentru tipurile de date
export interface MonthlyStats {
  name: string
  value: number
}

export interface BookingStatusStats {
  name: string
  value: number
}

export interface OccupancyStats {
  name: string
  value: number
}

export interface RecentBooking {
  id: string
  licensePlate: string
  clientName: string
  startDate: string
  endDate: string
  status: string
  amount: number
}

export interface DashboardStats {
  totalRevenue: number
  totalBookings: number
  totalClients: number
  currentOccupancy: number
  revenueGrowth: string
  bookingsGrowth: string
  clientsGrowth: string
}

/**
 * Obține statisticile principale pentru dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const bookingsRef = collection(db, 'bookings')
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1
    
    // Calculează începutul și sfârșitul anului curent
    const currentYearStart = new Date(currentYear, 0, 1)
    const currentYearEnd = new Date(currentYear, 11, 31, 23, 59, 59)
    const lastYearStart = new Date(lastYear, 0, 1)
    const lastYearEnd = new Date(lastYear, 11, 31, 23, 59, 59)

    // Query pentru rezervările din anul curent
    const currentYearQuery = query(
      bookingsRef,
      where('createdAt', '>=', Timestamp.fromDate(currentYearStart)),
      where('createdAt', '<=', Timestamp.fromDate(currentYearEnd))
    )

    // Query pentru rezervările din anul trecut
    const lastYearQuery = query(
      bookingsRef,
      where('createdAt', '>=', Timestamp.fromDate(lastYearStart)),
      where('createdAt', '<=', Timestamp.fromDate(lastYearEnd))
    )

    const [currentYearSnap, lastYearSnap] = await Promise.all([
      getDocs(currentYearQuery),
      getDocs(lastYearQuery)
    ])

    // Calculează statisticile pentru anul curent
    let totalRevenue = 0
    let totalBookings = 0
    const uniqueClients = new Set<string>()
    let confirmedBookings = 0

    currentYearSnap.forEach(doc => {
      const booking = doc.data()
      totalRevenue += booking.amount || 0
      totalBookings++
      if (booking.clientEmail) {
        uniqueClients.add(booking.clientEmail)
      }
      if (booking.status === 'confirmed' || booking.status === 'paid') {
        confirmedBookings++
      }
    })

    // Calculează statisticile pentru anul trecut
    let lastYearRevenue = 0
    let lastYearBookings = 0
    const lastYearClients = new Set<string>()

    lastYearSnap.forEach(doc => {
      const booking = doc.data()
      lastYearRevenue += booking.amount || 0
      lastYearBookings++
      if (booking.clientEmail) {
        lastYearClients.add(booking.clientEmail)
      }
    })

    // Calculează procentajele de creștere
    const revenueGrowth = lastYearRevenue > 0 
      ? `${(((totalRevenue - lastYearRevenue) / lastYearRevenue) * 100).toFixed(1)}%`
      : '0%'
    
    const bookingsGrowth = lastYearBookings > 0 
      ? `${(((totalBookings - lastYearBookings) / lastYearBookings) * 100).toFixed(1)}%`
      : '0%'

    const clientsGrowth = lastYearClients.size > 0 
      ? `${(((uniqueClients.size - lastYearClients.size) / lastYearClients.size) * 100).toFixed(1)}%`
      : '0%'

    // Calculează ocuparea curentă (rezervări active)
    const today = new Date()
    const activeBookingsQuery = query(
      bookingsRef,
      where('startDate', '<=', today.toISOString().split('T')[0]),
      where('endDate', '>=', today.toISOString().split('T')[0]),
      where('status', 'in', ['confirmed', 'paid'])
    )

    console.log('🔍 Dashboard occupancy check for date:', today.toISOString().split('T')[0])

    const activeBookingsSnap = await getDocs(activeBookingsQuery)
    console.log('📊 Dashboard active bookings found:', activeBookingsSnap.size)
    
    const currentOccupancy = Math.min((activeBookingsSnap.size / 100) * 100, 100) // Presupunem 100 locuri maxim

    return {
      totalRevenue,
      totalBookings,
      totalClients: uniqueClients.size,
      currentOccupancy: Math.round(currentOccupancy),
      revenueGrowth,
      bookingsGrowth,
      clientsGrowth
    }

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Returnează valori default în caz de eroare
    return {
      totalRevenue: 0,
      totalBookings: 0,
      totalClients: 0,
      currentOccupancy: 0,
      revenueGrowth: '0%',
      bookingsGrowth: '0%',
      clientsGrowth: '0%'
    }
  }
}

/**
 * Obține datele pentru graficul de venituri lunare
 */
export async function getMonthlyRevenueData(): Promise<MonthlyStats[]> {
  try {
    const bookingsRef = collection(db, 'bookings')
    const currentYear = new Date().getFullYear()
    
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59)

    const q = query(
      bookingsRef,
      where('createdAt', '>=', Timestamp.fromDate(startOfYear)),
      where('createdAt', '<=', Timestamp.fromDate(endOfYear)),
      where('status', 'in', ['confirmed', 'paid'])
    )

    const snapshot = await getDocs(q)
    
    // Inițializează array-ul cu toate lunile
    const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyData: MonthlyStats[] = monthNames.map(name => ({ name, value: 0 }))

    // Agregă veniturile pe luni
    snapshot.forEach(doc => {
      const booking = doc.data()
      const date = booking.createdAt.toDate()
      const monthIndex = date.getMonth()
      monthlyData[monthIndex].value += booking.amount || 0
    })

    return monthlyData

  } catch (error) {
    console.error('Error fetching monthly revenue data:', error)
    return []
  }
}

/**
 * Obține datele pentru graficul de rezervări lunare
 */
export async function getMonthlyBookingsData(): Promise<MonthlyStats[]> {
  try {
    const bookingsRef = collection(db, 'bookings')
    const currentYear = new Date().getFullYear()
    
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59)

    const q = query(
      bookingsRef,
      where('createdAt', '>=', Timestamp.fromDate(startOfYear)),
      where('createdAt', '<=', Timestamp.fromDate(endOfYear))
    )

    const snapshot = await getDocs(q)
    
    // Inițializează array-ul cu toate lunile
    const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyData: MonthlyStats[] = monthNames.map(name => ({ name, value: 0 }))

    // Contorizează rezervările pe luni
    snapshot.forEach(doc => {
      const booking = doc.data()
      const date = booking.createdAt.toDate()
      const monthIndex = date.getMonth()
      monthlyData[monthIndex].value += 1
    })

    return monthlyData

  } catch (error) {
    console.error('Error fetching monthly bookings data:', error)
    return []
  }
}

/**
 * Obține datele pentru graficul de status al rezervărilor
 */
export async function getBookingStatusData(): Promise<BookingStatusStats[]> {
  try {
    const bookingsRef = collection(db, 'bookings')
    const snapshot = await getDocs(bookingsRef)
    
    const statusCounts = {
      confirmed: 0,
      pending: 0,
      cancelled: 0
    }

    snapshot.forEach(doc => {
      const booking = doc.data()
      const status = booking.status || 'pending'
      
      if (status === 'confirmed' || status === 'paid') {
        statusCounts.confirmed++
      } else if (status === 'cancelled') {
        statusCounts.cancelled++
      } else {
        statusCounts.pending++
      }
    })

    const total = statusCounts.confirmed + statusCounts.pending + statusCounts.cancelled
    
    if (total === 0) {
      return [
        { name: 'Confirmate', value: 0 },
        { name: 'În așteptare', value: 0 },
        { name: 'Anulate', value: 0 }
      ]
    }

    return [
      { name: 'Confirmate', value: Math.round((statusCounts.confirmed / total) * 100) },
      { name: 'În așteptare', value: Math.round((statusCounts.pending / total) * 100) },
      { name: 'Anulate', value: Math.round((statusCounts.cancelled / total) * 100) }
    ]

  } catch (error) {
    console.error('Error fetching booking status data:', error)
    return [
      { name: 'Confirmate', value: 0 },
      { name: 'În așteptare', value: 0 },
      { name: 'Anulate', value: 0 }
    ]
  }
}

/**
 * Marchează rezervările expirate ca fiind inactive
 */
async function markExpiredBookingsAsInactive() {
  try {
    const now = new Date()
    const currentDateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const currentTimeStr = now.toTimeString().slice(0, 5) // HH:mm
    
    console.log('🕒 Checking for expired bookings at:', { currentDateStr, currentTimeStr })
    
    const bookingsRef = collection(db, 'bookings')
    
    // Query pentru rezervările care ar trebui să fie active dar poate au expirat
    const potentiallyExpiredQuery = query(
      bookingsRef,
      where('status', 'in', ['confirmed_paid', 'confirmed_test', 'confirmed', 'paid']),
      where('endDate', '<=', currentDateStr) // Toate rezervările care se termină astăzi sau în trecut
    )
    
    const snapshot = await getDocs(potentiallyExpiredQuery)
    const expiredBookings = []
    
    for (const doc of snapshot.docs) {
      const booking = doc.data()
      const endDateTime = new Date(`${booking.endDate}T${booking.endTime}:00`)
      
      if (endDateTime <= now) {
        expiredBookings.push({
          id: doc.id,
          ...booking,
          endDateTime: endDateTime.toISOString()
        })
        
        // Marchează rezervarea ca expirată
        await updateDoc(doc.ref, {
          status: 'expired',
          expiredAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        })
        
        console.log('⏰ Marked booking as expired:', {
          id: doc.id,
          licensePlate: booking.licensePlate,
          endDate: booking.endDate,
          endTime: booking.endTime,
          endDateTime: endDateTime.toISOString()
        })
      }
    }
    
    if (expiredBookings.length > 0) {
      console.log(`✅ Marked ${expiredBookings.length} bookings as expired`)
      
      // Actualizează statisticile - scade numărul de rezervări active
      const statsDocRef = doc(db, "config", "reservationStats")
      await updateDoc(statsDocRef, {
        activeBookingsCount: increment(-expiredBookings.length),
        lastUpdated: serverTimestamp()
      })
    }
    
    return expiredBookings.length
    
  } catch (error) {
    console.error('❌ Error marking expired bookings:', error)
    return 0
  }
}

/**
 * Obține datele pentru graficul de ocupare
 */
export async function getOccupancyData(): Promise<OccupancyStats[]> {
  try {
    // Folosește query-ul inteligent pentru ocuparea curentă
    const { getCurrentParkingOccupancy } = await import('./booking-utils')
    const currentOccupancy = await getCurrentParkingOccupancy()
    
    // Opțional: cleanup soft dacă e necesar
    const { softCleanupExpiredBookings } = await import('./booking-utils')
    const expiredCount = await softCleanupExpiredBookings()
    if (expiredCount > 0) {
      console.log(`🔄 Soft cleanup: marked ${expiredCount} expired bookings`)
    }
    
    const bookingsRef = collection(db, 'bookings')
    const now = new Date()
    const currentDateStr = now.toISOString().split('T')[0]
    const currentTimeStr = now.toTimeString().slice(0, 5)

    console.log('🔍 Checking occupancy for date:', currentDateStr, 'time:', currentTimeStr)

    // Query pentru rezervările REALMENTE active în acest moment
    const activeBookingsQuery = query(
      bookingsRef,
      where('startDate', '<=', currentDateStr),
      where('endDate', '>=', currentDateStr),
      where('status', 'in', ['confirmed_paid', 'confirmed_test', 'confirmed', 'paid'])
    )

    const snapshot = await getDocs(activeBookingsQuery)
    
    // Filtrează rezervările care sunt REALMENTE active acum (incluzând ora)
    let reallyActiveBookings = 0
    const now_timestamp = now.getTime()
    
    snapshot.forEach(doc => {
      const booking = doc.data()
      const startDateTime = new Date(`${booking.startDate}T${booking.startTime}:00`)
      const endDateTime = new Date(`${booking.endDate}T${booking.endTime}:00`)
      
      // Verifică dacă rezervarea este activă chiar acum
      if (startDateTime.getTime() <= now_timestamp && endDateTime.getTime() > now_timestamp) {
        reallyActiveBookings++
        console.log('📋 Active booking now:', {
          id: doc.id,
          licensePlate: booking.licensePlate,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          status: booking.status
        })
      } else {
        console.log('⏰ Booking not currently active:', {
          id: doc.id,
          licensePlate: booking.licensePlate,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          status: booking.status,
          reason: startDateTime.getTime() > now_timestamp ? 'Not started yet' : 'Already ended'
        })
      }
    })

    const totalSpots = 100 // Presupunem 100 locuri total
    const occupiedPercentage = Math.round((reallyActiveBookings / totalSpots) * 100)
    const freePercentage = 100 - occupiedPercentage

    console.log('📈 Real-time occupancy calculation:', {
      reallyActiveBookings,
      totalSpots,
      occupiedPercentage,
      freePercentage,
      currentDateTime: now.toISOString()
    })

    return [
      { name: 'Ocupat', value: occupiedPercentage },
      { name: 'Liber', value: freePercentage }
    ]

  } catch (error) {
    console.error('Error fetching occupancy data:', error)
    return [
      { name: 'Ocupat', value: 0 },
      { name: 'Liber', value: 100 }
    ]
  }
}

/**
 * Obține rezervările recente
 */
export async function getRecentBookings(): Promise<RecentBooking[]> {
  try {
    const bookingsRef = collection(db, 'bookings')
    const q = query(
      bookingsRef,
      orderBy('createdAt', 'desc'),
      limit(5)
    )

    const snapshot = await getDocs(q)
    const recentBookings: RecentBooking[] = []

    snapshot.forEach(doc => {
      const booking = doc.data()
      recentBookings.push({
        id: doc.id,
        licensePlate: booking.licensePlate || 'N/A',
        clientName: booking.clientName || 'N/A',
        startDate: booking.startDate || '',
        endDate: booking.endDate || '',
        status: booking.status || 'pending',
        amount: booking.amount || 0
      })
    })

    return recentBookings

  } catch (error) {
    console.error('Error fetching recent bookings:', error)
    return []
  }
} 