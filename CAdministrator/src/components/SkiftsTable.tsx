'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Clock, User, Car, Search } from 'lucide-react'
import Calendar, { DateRange } from './Calendar'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface Skift {
  id: number
  skiftNummer: string
  startDato: string
  sluttDato?: string
  startTid: string
  sluttTid?: string
  totalKm: number
  kmOpptatt: number
  antTurer: number
  lonnBasis: number
  netto: number
  loyve?: string
  driver: {
    fornavn: string
    etternavn: string
    sjåforNummer: string
    lonnprosent: number
  }
  car: {
    skiltNummer: string
    bilmerke: string
    arsmodell: number
  }
}

interface SkiftsTableProps {
  onRefresh: () => void
}

export default function SkiftsTable({ onRefresh }: SkiftsTableProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [skifts, setSkifts] = useState<Skift[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState<DateRange | null>(null)

  useEffect(() => {
    fetchSkifts()
  }, [user])

  const fetchSkifts = async () => {
    try {
      // Build query params with user info
      const params = new URLSearchParams()
      if (user?.role) {
        params.set('role', user.role)
      }
      if (user?.driverId) {
        params.set('driverId', user.driverId.toString())
      }
      
      const response = await fetch(`/api/skifts?${params.toString()}`)
      const data = await response.json()
      
      // API already returns data sorted by newest first (orderBy: { startDate: 'desc' })
      setSkifts(data)
    } catch (error) {
      console.error('Failed to fetch skifts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get local date string (YYYY-MM-DD) without timezone issues
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get shifts count by date for calendar
  const getShiftsByDate = () => {
    const shiftsByDate: { [key: string]: number } = {}
    
    skifts.forEach(skift => {
      const date = new Date(skift.startDato)
      const dateKey = getLocalDateString(date)
      shiftsByDate[dateKey] = (shiftsByDate[dateKey] || 0) + 1
    })
    
    return shiftsByDate
  }

  const groupSkiftsByMonth = (skifts: Skift[]) => {
    const groups: { [key: string]: Skift[] } = {}
    
    skifts.forEach(skift => {
      const date = new Date(skift.startDato)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!groups[monthYear]) {
        groups[monthYear] = []
      }
      groups[monthYear].push(skift)
    })
    
    // Sort shifts within each month group by start date (newest first)
    Object.keys(groups).forEach(monthYear => {
      groups[monthYear].sort((a, b) => {
        const dateA = new Date(a.startDato)
        const dateB = new Date(b.startDato)
        return dateB.getTime() - dateA.getTime() // Newest first
      })
    })
    
    return groups
  }

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('no-NO', { 
      year: 'numeric', 
      month: 'long' 
    })
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const parseTime = (timeString: string): number => {
    // Parse time string like "14:30" or "14.30" to minutes
    const cleanTime = timeString.replace(/[^\d:.]/g, '')
    const parts = cleanTime.split(/[:.]/)
    
    if (parts.length >= 2) {
      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      
      // Handle 00:00 as a valid time (start of day)
      if (hours === 0 && minutes === 0) {
        return 0 // 00:00 = 0 minutes
      }
      
      return hours * 60 + minutes
    }
    
    return 0
  }

  const calculateHoursBetween = (startTime: string, stopTime: string, startDate?: string, stopDate?: string): number => {
    const startMinutes = parseTime(startTime)
    const stopMinutes = parseTime(stopTime)
    
    // Handle special case where both times are 00:00
    if (startMinutes === 0 && stopMinutes === 0) {
      if (startDate && stopDate) {
        const start = new Date(startDate)
        const stop = new Date(stopDate)
        const dayDiff = Math.floor((stop.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        return dayDiff * 24 // Full days
      }
      return 0
    }
    
    // Handle case where start time is 00:00
    if (startMinutes === 0) {
      // Start time is 00:00, treat as start of day
      if (stopMinutes > 0) {
        return stopMinutes / 60 // Hours from 00:00 to stop time
      }
      return 0
    }
    
    // Handle case where stop time is 00:00
    if (stopMinutes === 0) {
      // Stop time is 00:00, treat as end of day (24:00)
      return (24 * 60 - startMinutes) / 60 // Hours from start time to 24:00
    }
    
    let diffMinutes = stopMinutes - startMinutes
    
    // If we have dates, check if it's an overnight shift
    if (startDate && stopDate) {
      const start = new Date(startDate)
      const stop = new Date(stopDate)
      const dayDiff = Math.floor((stop.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dayDiff > 0) {
        // Overnight shift - add the full days
        diffMinutes += dayDiff * 24 * 60
      } else if (diffMinutes < 0) {
        // Same day but stop time is before start time - overnight shift
        diffMinutes += 24 * 60
      }
    } else {
      // Fallback: if stop time is before start time, assume it's next day
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60
      }
    }
    
    return diffMinutes / 60 // Convert to hours
  }

  const calculateHourlySalary = (skift: Skift): number => {
    if (skift.sluttTid && skift.startTid) {
      const hours = calculateHoursBetween(skift.startTid, skift.sluttTid, skift.startDato, skift.sluttDato)
      if (hours > 0) {
        const salary = calculateSalary(skift)
        return salary / hours
      }
    }
    return 0
  }

  const calculateOccupiedPercentage = (skift: Skift): number => {
    if (skift.totalKm > 0 && skift.kmOpptatt > 0) {
      return (Number(skift.kmOpptatt) / Number(skift.totalKm)) * 100
    }
    return 0
  }

  const calculateSalary = (skift: Skift): number => {
    if (!skift.driver || !skift.driver.lonnprosent) return 0
    return (skift.lonnBasis * skift.driver.lonnprosent) / 100
  }

  const calculateAverageHourlySalary = (skiftsToCalculate: Skift[] = filteredSkifts): number => {
    const validSalaries = skiftsToCalculate
      .map(skift => calculateHourlySalary(skift))
      .filter(salary => salary > 0)
    
    if (validSalaries.length === 0) return 0
    
    const total = validSalaries.reduce((sum, salary) => sum + salary, 0)
    return total / validSalaries.length
  }

  const calculateTotals = (skiftsToCalculate: Skift[] = filteredSkifts) => {
    const totalKmSkift = skiftsToCalculate.reduce((sum, skift) => sum + Number(skift.totalKm), 0)
    const totalKmOpptatt = skiftsToCalculate.reduce((sum, skift) => sum + Number(skift.kmOpptatt), 0)
    const totalTurer = skiftsToCalculate.reduce((sum, skift) => sum + Number(skift.antTurer), 0)
    const totalLonnBasis = skiftsToCalculate.reduce((sum, skift) => sum + Number(skift.lonnBasis), 0)
    const totalSalary = skiftsToCalculate.reduce((sum, skift) => sum + calculateSalary(skift), 0)
    
    return {
      totalKmSkift,
      totalKmOpptatt,
      totalTurer,
      totalLonnBasis,
      totalSalary
    }
  }

  if (loading) {
    return <div className="text-center py-8">Laster skift...</div>
  }

  const filteredSkifts = skifts.filter(skift => {
    // Date filtering - support both single date and date range
    if (selectedDate && selectedDate.start) {
      const skiftDate = new Date(skift.startDato)
      const skiftDateStr = getLocalDateString(skiftDate)
      const startDateStr = getLocalDateString(selectedDate.start)
      
      if (selectedDate.end) {
        // Date range filtering
        const endDateStr = getLocalDateString(selectedDate.end)
        if (skiftDateStr < startDateStr || skiftDateStr > endDateStr) {
          return false
        }
      } else {
        // Single date filtering
        if (skiftDateStr !== startDateStr) {
          return false
        }
      }
    }
    
    // Search term filtering - comprehensive search across all fields
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase().trim()
    
    // Search in shift number
    if (skift.skiftNummer.toLowerCase().includes(searchLower)) return true
    
    // Search in driver information
    if (skift.driver) {
      const driverName = `${skift.driver.fornavn} ${skift.driver.etternavn}`.toLowerCase()
      if (driverName.includes(searchLower)) return true
      if (skift.driver.sjåforNummer.toLowerCase().includes(searchLower)) return true
      if (skift.driver.fornavn.toLowerCase().includes(searchLower)) return true
      if (skift.driver.etternavn.toLowerCase().includes(searchLower)) return true
    }
    
    // Search in license (løyve)
    if (skift.loyve && skift.loyve.toLowerCase().includes(searchLower)) return true
    
    // Search in car information
    if (skift.car) {
      if (skift.car.skiltNummer.toLowerCase().includes(searchLower)) return true
      if (skift.car.bilmerke.toLowerCase().includes(searchLower)) return true
      if (skift.car.arsmodell.toString().includes(searchLower)) return true
    }
    
    // Search in dates (various formats)
    const startDate = new Date(skift.startDato)
    const startDateStr = startDate.toLocaleDateString('no-NO')
    const startDateISO = getLocalDateString(startDate)
    if (startDateStr.includes(searchLower)) return true
    if (startDateISO.includes(searchLower)) return true
    
    if (skift.sluttDato) {
      const endDate = new Date(skift.sluttDato)
      const endDateStr = endDate.toLocaleDateString('no-NO')
      if (endDateStr.includes(searchLower)) return true
    }
    
    // Search in times
    if (skift.startTid && skift.startTid.toLowerCase().includes(searchLower)) return true
    if (skift.sluttTid && skift.sluttTid.toLowerCase().includes(searchLower)) return true
    
    // Search in numeric fields (as strings for partial matches)
    if (skift.totalKm.toString().includes(searchLower)) return true
    if (skift.kmOpptatt.toString().includes(searchLower)) return true
    if (skift.antTurer.toString().includes(searchLower)) return true
    if (skift.lonnBasis.toString().includes(searchLower)) return true
    if (skift.netto.toString().includes(searchLower)) return true
    
    return false
  })

  const groupedSkifts = groupSkiftsByMonth(filteredSkifts)
  const sortedMonthYears = Object.keys(groupedSkifts).sort((a, b) => {
    // Sort by year first, then by month (newest first)
    const [yearA, monthA] = a.split('-').map(Number)
    const [yearB, monthB] = b.split('-').map(Number)
    
    if (yearA !== yearB) {
      return yearB - yearA // Newest year first
    }
    return monthB - monthA // Newest month first
  })

  // Navigate to histogram page with column type and filtered shifts
  const handleColumnClick = (columnType: string) => {
    // Filter shifts based on selected date
    let filteredShifts = filteredSkifts
    if (selectedDate) {
      filteredShifts = filteredSkifts.filter(skift => {
        const skiftDate = new Date(skift.startDato)
        
        if (selectedDate.start && selectedDate.end) {
          const endOfDay = new Date(selectedDate.end)
          endOfDay.setHours(23, 59, 59, 999)
          return skiftDate >= selectedDate.start && skiftDate <= endOfDay
        } else if (selectedDate.start) {
          return skiftDate.toDateString() === selectedDate.start.toDateString()
        }
        
        return true
      })
    }
    
    // Store filtered shifts in sessionStorage temporarily
    sessionStorage.setItem('histogramShifts', JSON.stringify(filteredShifts))
    
    const params = new URLSearchParams()
    params.set('column', columnType)
    
    if (selectedDate?.start) {
      params.set('startDate', selectedDate.start.toISOString().split('T')[0])
    }
    
    if (selectedDate?.end) {
      params.set('endDate', selectedDate.end.toISOString().split('T')[0])
    }
    try {
      const from = window.location.pathname + window.location.search
      params.set('from', encodeURIComponent(from))
    } catch {}

    router.push(`/dashboard/shifts/histogram?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Calendar Component - 1/3 Width */}
      <div className="flex justify-center">
        <div className="w-1/3 min-w-[320px]">
          <Calendar 
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            shiftsByDate={getShiftsByDate()}
            shifts={skifts}
          />
        </div>
      </div>
      
      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Skift ({filteredSkifts.length} av {skifts.length})
            {selectedDate && selectedDate.start && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                - {selectedDate.start.toLocaleDateString('no-NO')}
                {selectedDate.end && ` til ${selectedDate.end.toLocaleDateString('no-NO')}`}
              </span>
            )}
          </CardTitle>
          <div className="mt-4 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Søk etter skiftnummer, sjåfør, bil, løyve, dato, tid eller annen informasjon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Clear search"
                  type="button"
                >
                  <span className="text-lg">×</span>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="text-sm text-gray-500">
                {filteredSkifts.length === 0 ? (
                  <span className="text-red-500">Ingen skift funnet for "{searchTerm}"</span>
                ) : (
                  <span>Fant {filteredSkifts.length} {filteredSkifts.length === 1 ? 'skift' : 'skift'} for "{searchTerm}"</span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {sortedMonthYears.map((monthYear) => (
            <div key={monthYear}>
              <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">
                {formatMonthYear(monthYear)} ({groupedSkifts[monthYear].length} skift)
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                  <TableRow>
                    <TableHead>Skift #</TableHead>
                    <TableHead>Sjåfør</TableHead>
                    <TableHead>Løyve</TableHead>
                    <TableHead>Start Dato & Tid</TableHead>
                    <TableHead>Stopp Dato & Tid</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                      onClick={() => {
                        let toSend = filteredSkifts
                        if (selectedDate) {
                          toSend = filteredSkifts.filter(skift => {
                            const skiftDate = new Date(skift.startDato)
                            if (selectedDate.start && selectedDate.end) {
                              const endOfDay = new Date(selectedDate.end)
                              endOfDay.setHours(23, 59, 59, 999)
                              return skiftDate >= selectedDate.start && skiftDate <= endOfDay
                            } else if (selectedDate.start) {
                              return skiftDate.toDateString() === selectedDate.start.toDateString()
                            }
                            return true
                          })
                        }
                        sessionStorage.setItem('histogramShifts', JSON.stringify(toSend))
                        try { sessionStorage.setItem('from', window.location.pathname + window.location.search) } catch {}
                        let from = ''
                        try { from = window.location.pathname + window.location.search } catch {}
                        const qs = new URLSearchParams()
                        qs.set('metric','totalKm')
                        if (from) qs.set('from', encodeURIComponent(from))
                        router.push(`/dashboard/shifts/by-driver?${qs.toString()}`)
                      }}
                      title="Klikk for å se graf per sjåfør"
                    >
                      Km skift
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                      onClick={() => {
                        // reuse filteredSkifts (already filtered by search) + date filter in-line
                        let toSend = filteredSkifts
                        if (selectedDate) {
                          toSend = filteredSkifts.filter(skift => {
                            const skiftDate = new Date(skift.startDato)
                            if (selectedDate.start && selectedDate.end) {
                              const endOfDay = new Date(selectedDate.end)
                              endOfDay.setHours(23, 59, 59, 999)
                              return skiftDate >= selectedDate.start && skiftDate <= endOfDay
                            } else if (selectedDate.start) {
                              return skiftDate.toDateString() === selectedDate.start.toDateString()
                            }
                            return true
                          })
                        }
                        sessionStorage.setItem('histogramShifts', JSON.stringify(toSend))
                        try { sessionStorage.setItem('from', window.location.pathname + window.location.search) } catch {}
                        let from = ''
                        try { from = window.location.pathname + window.location.search } catch {}
                        const qs = from ? `?from=${encodeURIComponent(from)}` : ''
                        router.push(`/dashboard/shifts/by-driver${qs}`)
                      }}
                      title="Klikk for å se graf per sjåfør"
                    >
                      Km opptatt
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                      onClick={() => {
                        let toSend = filteredSkifts
                        if (selectedDate) {
                          toSend = filteredSkifts.filter(skift => {
                            const skiftDate = new Date(skift.startDato)
                            if (selectedDate.start && selectedDate.end) {
                              const endOfDay = new Date(selectedDate.end)
                              endOfDay.setHours(23, 59, 59, 999)
                              return skiftDate >= selectedDate.start && skiftDate <= endOfDay
                            } else if (selectedDate.start) {
                              return skiftDate.toDateString() === selectedDate.start.toDateString()
                            }
                            return true
                          })
                        }
                        sessionStorage.setItem('histogramShifts', JSON.stringify(toSend))
                        try { sessionStorage.setItem('from', window.location.pathname + window.location.search) } catch {}
                        let from = ''
                        try { from = window.location.pathname + window.location.search } catch {}
                        const qs = new URLSearchParams()
                        qs.set('metric','occupiedPercentage')
                        if (from) qs.set('from', encodeURIComponent(from))
                        router.push(`/dashboard/shifts/by-driver?${qs.toString()}`)
                      }}
                      title="Klikk for å se graf per sjåfør"
                    >
                      Opptatt %
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                      onClick={() => {
                        let toSend = filteredSkifts
                        if (selectedDate) {
                          toSend = filteredSkifts.filter(skift => {
                            const skiftDate = new Date(skift.startDato)
                            if (selectedDate.start && selectedDate.end) {
                              const endOfDay = new Date(selectedDate.end)
                              endOfDay.setHours(23, 59, 59, 999)
                              return skiftDate >= selectedDate.start && skiftDate <= endOfDay
                            } else if (selectedDate.start) {
                              return skiftDate.toDateString() === selectedDate.start.toDateString()
                            }
                            return true
                          })
                        }
                        sessionStorage.setItem('histogramShifts', JSON.stringify(toSend))
                        try { sessionStorage.setItem('from', window.location.pathname + window.location.search) } catch {}
                        let from = ''
                        try { from = window.location.pathname + window.location.search } catch {}
                        const qs = new URLSearchParams()
                        qs.set('metric','antTurer')
                        if (from) qs.set('from', encodeURIComponent(from))
                        router.push(`/dashboard/shifts/by-driver?${qs.toString()}`)
                      }}
                      title="Klikk for å se graf per sjåfør"
                    >
                      Turer
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                      onClick={() => {
                        let toSend = filteredSkifts
                        if (selectedDate) {
                          toSend = filteredSkifts.filter(skift => {
                            const skiftDate = new Date(skift.startDato)
                            if (selectedDate.start && selectedDate.end) {
                              const endOfDay = new Date(selectedDate.end)
                              endOfDay.setHours(23, 59, 59, 999)
                              return skiftDate >= selectedDate.start && skiftDate <= endOfDay
                            } else if (selectedDate.start) {
                              return skiftDate.toDateString() === selectedDate.start.toDateString()
                            }
                            return true
                          })
                        }
                        sessionStorage.setItem('histogramShifts', JSON.stringify(toSend))
                        try { sessionStorage.setItem('from', window.location.pathname + window.location.search) } catch {}
                        let from = ''
                        try { from = window.location.pathname + window.location.search } catch {}
                        const qs = new URLSearchParams()
                        qs.set('metric','lonnBasis')
                        if (from) qs.set('from', encodeURIComponent(from))
                        router.push(`/dashboard/shifts/by-driver?${qs.toString()}`)
                      }}
                      title="Klikk for å se graf per sjåfør"
                    >
                      Lønnsgrunnlag
                    </TableHead>
                    <TableHead>Lønn</TableHead>
                    <TableHead>Lønnsgrunnlag/time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedSkifts[monthYear].map((skift, index) => (
              <TableRow key={`${monthYear}-${skift.id || skift.skiftNummer || index}`}>
                <TableCell className="font-medium">{skift.skiftNummer}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <div>
                      <div className="font-medium">
                        {skift.driver ? `${skift.driver.fornavn} ${skift.driver.etternavn}` : 'Ukjent sjåfør'}
                      </div>
                      <div className="text-sm text-gray-500">
                        #{skift.driver?.sjåforNummer || 'N/A'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="font-medium">
                      {skift.loyve || 'N/A'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(skift.startDato)} {formatTime(skift.startTid)}
                  </div>
                </TableCell>
                <TableCell>
                  {skift.sluttDato ? (
                    <div className="flex items-center text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(skift.sluttDato)} {skift.sluttTid && formatTime(skift.sluttTid)}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Ikke avsluttet</span>
                  )}
                </TableCell>
                <TableCell>{skift.totalKm} km</TableCell>
                <TableCell>{skift.kmOpptatt} km</TableCell>
                <TableCell className="font-medium">
                  {calculateOccupiedPercentage(skift) > 0 ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      calculateOccupiedPercentage(skift) >= 50 
                        ? 'bg-green-100 text-green-800' 
                        : calculateOccupiedPercentage(skift) >= 25
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {calculateOccupiedPercentage(skift).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell>{skift.antTurer}</TableCell>
                <TableCell className="font-medium">
                  {skift.lonnBasis.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
                </TableCell>
                <TableCell className="font-medium text-green-700">
                  {calculateSalary(skift).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
                </TableCell>
                <TableCell className="font-medium">
                  {calculateHourlySalary(skift) > 0 ? (
                    (skift.lonnBasis / calculateHoursBetween(skift.startTid, skift.sluttTid || skift.startTid, skift.startDato, skift.sluttDato)).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' }) + '/time'
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summer (kompakt) */}
        <div className="mt-4 px-3 py-2 bg-blue-50/60 rounded border flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-gray-700 mr-1">Summer:</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/70 text-blue-700 border">
            <span className="font-semibold">Km skift:</span>
            {calculateTotals().totalKmSkift.toLocaleString('no-NO')} km
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/70 text-green-700 border">
            <span className="font-semibold">Km opptatt:</span>
            {calculateTotals().totalKmOpptatt.toLocaleString('no-NO')} km
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/70 text-purple-700 border">
            <span className="font-semibold">Turer:</span>
            {calculateTotals().totalTurer.toLocaleString('no-NO')}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/70 text-orange-700 border">
            <span className="font-semibold">Lønnsgrunnlag:</span>
            {calculateTotals().totalLonnBasis.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/70 text-emerald-700 border">
            <span className="font-semibold">Total lønn:</span>
            {calculateTotals().totalSalary.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
          </span>
        </div>
        
        {/* Gjennomsnittlig lønn/time (kompakt) */}
        <div className="mt-3 px-3 py-2 bg-gray-50 rounded border flex items-center justify-between text-xs">
          <span className="text-gray-700">Gjennomsnittlig lønn/time</span>
          <span className="font-semibold text-green-700">
            {calculateAverageHourlySalary().toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}/time
          </span>
          <span className="text-gray-500">
            {filteredSkifts.filter(skift => calculateHourlySalary(skift) > 0).length} av {filteredSkifts.length} skifter
          </span>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

