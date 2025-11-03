'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, User, Car, Search } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import Calendar, { DateRange } from '@/components/Calendar'
import { useRouter } from 'next/navigation'

interface Skift {
  id: number
  skiftNummer: string
  startDato: string
  sluttDato?: string
  startTid: string
  sluttTid?: string
  totalKm: number
  antTurer: number
  netto: number
  loyve?: string
  lonnBasis: number
  kmOpptatt: number
  car: {
    skiltNummer: string
    bilmerke: string
    arsmodell: number
  }
}

export default function DriverDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [skifts, setSkifts] = useState<Skift[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<DateRange | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user?.driverId) {
      fetchDriverSkifts()
    }
  }, [user])

  const fetchDriverSkifts = async () => {
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
      
      // Filter skifts for this driver only
      const driverSkifts = data.filter((skift: any) => skift.sjåforId === user?.driverId)
      
      // Sort by start date (newest first)
      const sortedSkifts = driverSkifts.sort((a: Skift, b: Skift) => {
        const dateA = new Date(a.startDato)
        const dateB = new Date(b.startDato)
        return dateB.getTime() - dateA.getTime()
      })
      
      setSkifts(sortedSkifts)
    } catch (error) {
      console.error('Failed to fetch skifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO')
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const parseTime = (timeString: string): number => {
    const cleanTime = timeString.replace(/[^\d:.]/g, '')
    const parts = cleanTime.split(/[:.]/)
    
    if (parts.length >= 2) {
      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      
      if (hours === 0 && minutes === 0) {
        return 0
      }
      
      return hours * 60 + minutes
    }
    
    return 0
  }

  const calculateHoursBetween = (startTime: string, stopTime: string, startDate?: string, stopDate?: string): number => {
    const startMinutes = parseTime(startTime)
    const stopMinutes = parseTime(stopTime)
    
    if (startMinutes === 0 && stopMinutes === 0) {
      if (startDate && stopDate) {
        const start = new Date(startDate)
        const stop = new Date(stopDate)
        const dayDiff = Math.floor((stop.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        return dayDiff * 24
      }
      return 0
    }
    
    if (startMinutes === 0) {
      if (stopMinutes > 0) {
        return stopMinutes / 60
      }
      return 0
    }
    
    if (stopMinutes === 0) {
      return (24 * 60 - startMinutes) / 60
    }
    
    let diffMinutes = stopMinutes - startMinutes
    
    if (startDate && stopDate) {
      const start = new Date(startDate)
      const stop = new Date(stopDate)
      const dayDiff = Math.floor((stop.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dayDiff > 0) {
        diffMinutes += dayDiff * 24 * 60
      } else if (diffMinutes < 0) {
        diffMinutes += 24 * 60
      }
    } else {
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60
      }
    }
    
    return diffMinutes / 60
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



  // Create shifts data for calendar
  const getShiftsByDate = () => {
    const shiftsByDate: { [key: string]: number } = {}
    
    skifts.forEach(skift => {
      const dateKey = skift.startDato.split('T')[0]
      shiftsByDate[dateKey] = (shiftsByDate[dateKey] || 0) + 1
    })
    
    return shiftsByDate
  }

  // Filter shifts based on search term
  const filteredSkifts = skifts.filter(skift => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Search in various fields
    if (skift.skiftNummer.toLowerCase().includes(searchLower)) return true
    if (skift.car.skiltNummer.toLowerCase().includes(searchLower)) return true
    if (skift.car.bilmerke.toLowerCase().includes(searchLower)) return true
    if (skift.loyve?.toLowerCase().includes(searchLower)) return true
    
    const startDate = new Date(skift.startDato).toLocaleDateString('no-NO')
    if (startDate.includes(searchLower)) return true
    
    const startTime = formatTime(skift.startTid)
    if (startTime.includes(searchLower)) return true
    
    return false
  })

  // Filter shifts based on selected date range
  const getFilteredSkiftsByDate = () => {
    if (!selectedDate) return filteredSkifts
    
    return filteredSkifts.filter(skift => {
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

  // Group shifts by month and year
  const groupShiftsByMonthYear = (shifts: Skift[]) => {
    const grouped: { [key: string]: Skift[] } = {}
    
    shifts.forEach(skift => {
      const date = new Date(skift.startDato)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = []
      }
      grouped[monthYear].push(skift)
    })
    
    return grouped
  }

  // Format month and year for display
  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const monthNames = [
      'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  // Calculate salary (50% of lonnBasis for drivers)
  const calculateSalary = (skift: Skift): number => {
    return (skift.lonnBasis * 50) / 100
  }

  // Navigate to histogram page with column type and filtered shifts
  const handleColumnClick = (columnType: string) => {
    const filteredShifts = getFilteredSkiftsByDate()
    
    // Store filtered shifts in sessionStorage temporarily
    sessionStorage.setItem('histogramShifts', JSON.stringify(filteredShifts))
    try {
      sessionStorage.setItem('from', window.location.pathname + window.location.search)
    } catch {}
    
    const params = new URLSearchParams()
    if (columnType === 'occupiedPercentage') params.set('metric', 'occupiedPercentage')
    if (columnType === 'antTurer') params.set('metric', 'antTurer')
    try {
      const from = window.location.pathname + window.location.search
      params.set('from', encodeURIComponent(from))
    } catch {}
    
    if (selectedDate?.start) {
      params.set('startDate', selectedDate.start.toISOString().split('T')[0])
    }
    
    if (selectedDate?.end) {
      params.set('endDate', selectedDate.end.toISOString().split('T')[0])
    }
    
    router.push(`/dashboard/shifts/by-driver${params.toString() ? `?${params.toString()}` : ''}`)
  }

  if (loading) {
    return <div className="text-center py-8">Laster dine skifter...</div>
  }

  const shiftsByDate = getShiftsByDate()
  const dateFilteredSkifts = getFilteredSkiftsByDate()

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Velkommen, {user?.driver?.name} {user?.driver?.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Sjåfør ID:</span> {user?.driver?.driverNumber}
            </div>
            <div>
              <span className="font-medium">Totalt antall skifter:</span> {skifts.length}
            </div>
            <div>
              <span className="font-medium">Sist oppdatert:</span> {new Date().toLocaleDateString('no-NO')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View - 1/3 Width */}
      <div className="flex justify-center">
        <div className="w-1/3 min-w-[320px]">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            shiftsByDate={shiftsByDate}
            shifts={skifts}
          />
        </div>
      </div>
      
      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Mine Skifter ({filteredSkifts.length} av {skifts.length})
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
                placeholder="Søk etter skiftnummer, bil, løyve, dato, tid eller annen informasjon..."
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
            {(() => {
              const groupedSkifts = groupShiftsByMonthYear(getFilteredSkiftsByDate())
              const sortedMonthYears = Object.keys(groupedSkifts).sort((a, b) => {
                const [yearA, monthA] = a.split('-').map(Number)
                const [yearB, monthB] = b.split('-').map(Number)
                if (yearA !== yearB) return yearB - yearA // Newest year first
                return monthB - monthA // Newest month first
              })

              return sortedMonthYears.map((monthYear) => (
                <div key={monthYear}>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">
                    {formatMonthYear(monthYear)} ({groupedSkifts[monthYear].length} skift)
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skift #</TableHead>
                          <TableHead>Bil</TableHead>
                          <TableHead>Løyve</TableHead>
                          <TableHead>Start Dato & Tid</TableHead>
                          <TableHead>Stopp Dato & Tid</TableHead>
                          <TableHead 
                            className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                            onClick={() => handleColumnClick('totalKm')}
                            title="Klikk for å se histogram"
                          >
                            Km skift
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                            onClick={() => {
                              const filteredShifts = getFilteredSkiftsByDate()
                              sessionStorage.setItem('histogramShifts', JSON.stringify(filteredShifts))
                              router.push('/dashboard/shifts/by-driver')
                            }}
                            title="Klikk for å se graf per sjåfør"
                          >
                            Km opptatt
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                            onClick={() => handleColumnClick('occupiedPercentage')}
                            title="Klikk for å se graf per sjåfør"
                          >
                            Opptatt %
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                            onClick={() => handleColumnClick('antTurer')}
                            title="Klikk for å se graf per sjåfør"
                          >
                            Turer
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                            onClick={() => handleColumnClick('lonnBasis')}
                            title="Klikk for å se histogram"
                          >
                            Lønnsgrunnlag
                          </TableHead>
                          <TableHead>Min Lønn</TableHead>
                          <TableHead>Lønnsgrunnlag/time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedSkifts[monthYear].map((skift, index) => (
                          <TableRow key={`${monthYear}-${skift.id || skift.skiftNummer || index}`}>
                            <TableCell className="font-medium">{skift.skiftNummer}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Car className="h-4 w-4 mr-2" />
                                <div>
                                  <div className="font-medium">{skift.car.skiltNummer}</div>
                                  <div className="text-sm text-gray-500">{skift.car.bilmerke} {skift.car.arsmodell}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {skift.loyve || 'N/A'}
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
                            <TableCell>
                              <button
                                onClick={() => {
                                  sessionStorage.setItem('histogramShifts', JSON.stringify([skift]))
                                  let from = ''
                                  try { from = window.location.pathname + window.location.search } catch {}
                                  const qs = from ? `?from=${encodeURIComponent(from)}` : ''
                                  router.push(`/dashboard/shifts/by-driver${qs}`)
                                }}
                                className="text-blue-600 hover:underline"
                                title="Se graf for dette skiftet"
                              >
                                {skift.kmOpptatt} km
                              </button>
                            </TableCell>
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
              ))
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
