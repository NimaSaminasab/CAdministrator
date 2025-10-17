'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Clock, User, Car, Search } from 'lucide-react'

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
  driver: {
    fornavn: string
    etternavn: string
    sjåforNummer: string
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
  const [skifts, setSkifts] = useState<Skift[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSkifts()
  }, [])

  const fetchSkifts = async () => {
    try {
      const response = await fetch('/api/skifts')
      const data = await response.json()
      
      // Sort skifts by start date (oldest first - ascending)
      const sortedSkifts = data.sort((a: Skift, b: Skift) => {
        const dateA = new Date(a.startDato)
        const dateB = new Date(b.startDato)
        return dateA.getTime() - dateB.getTime() // Oldest first
      })
      
      setSkifts(sortedSkifts)
    } catch (error) {
      console.error('Failed to fetch skifts:', error)
    } finally {
      setLoading(false)
    }
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
    if (skift.sluttTid && skift.startTid && skift.lonnBasis > 0) {
      const hours = calculateHoursBetween(skift.startTid, skift.sluttTid, skift.startDato, skift.sluttDato)
      if (hours > 0) {
        return Number(skift.lonnBasis) / hours
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
    
    return {
      totalKmSkift,
      totalKmOpptatt,
      totalTurer,
      totalLonnBasis
    }
  }

  if (loading) {
    return <div className="text-center py-8">Laster skift...</div>
  }

  const filteredSkifts = skifts.filter(skift => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Søk i skiftnummer (eksakt match)
    if (skift.skiftNummer.toLowerCase() === searchLower) return true
    
    // Søk i sjåfør navn
    if (skift.driver) {
      const driverName = `${skift.driver.fornavn} ${skift.driver.etternavn}`.toLowerCase()
      if (driverName.includes(searchLower)) return true
      if (skift.driver.sjåforNummer.toLowerCase().includes(searchLower)) return true
    }
    
    // Søk i løyve
    if (skift.loyve && skift.loyve.toLowerCase().includes(searchLower)) return true
    
    // Søk i startdato
    const startDate = new Date(skift.startDato).toLocaleDateString('no-NO')
    if (startDate.includes(searchLower)) return true
    
    return false
  })

  const groupedSkifts = groupSkiftsByMonth(filteredSkifts)
  const sortedMonthYears = Object.keys(groupedSkifts).sort()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skift ({filteredSkifts.length} av {skifts.length})</CardTitle>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Søk etter skiftnummer, sjåfør, løyve eller startdato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {sortedMonthYears.map((monthYear) => (
            <div key={monthYear}>
              <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">
                {formatMonthYear(monthYear)} ({groupedSkifts[monthYear].length} skift)
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skift #</TableHead>
                    <TableHead>Sjåfør</TableHead>
                    <TableHead>Løyve</TableHead>
                    <TableHead>Start Dato & Tid</TableHead>
                    <TableHead>Stopp Dato & Tid</TableHead>
                    <TableHead>Km skift</TableHead>
                    <TableHead>Km opptatt</TableHead>
                    <TableHead>Opptatt %</TableHead>
                    <TableHead>Turer</TableHead>
                    <TableHead>Lønnsgrunnlag</TableHead>
                    <TableHead>Lønnsgrunnlag/time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedSkifts[monthYear].map((skift) => (
              <TableRow key={skift.id}>
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
                <TableCell className="font-medium">
                  {calculateHourlySalary(skift) > 0 ? (
                    calculateHourlySalary(skift).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' }) + '/time'
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
        
        {/* Summer */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Summer for alle skifter</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {calculateTotals().totalKmSkift.toLocaleString('no-NO')} km
              </div>
              <div className="text-sm text-gray-600">Km skift</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {calculateTotals().totalKmOpptatt.toLocaleString('no-NO')} km
              </div>
              <div className="text-sm text-gray-600">Km opptatt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {calculateTotals().totalTurer.toLocaleString('no-NO')}
              </div>
              <div className="text-sm text-gray-600">Turer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {calculateTotals().totalLonnBasis.toLocaleString('no-NO', { 
                  style: 'currency', 
                  currency: 'NOK' 
                })}
              </div>
              <div className="text-sm text-gray-600">Lønnsgrunnlag</div>
            </div>
          </div>
        </div>
        
        {/* Gjennomsnittlig lønn/time */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Gjennomsnittlig lønnsgrunnlag/time</h4>
              <p className="text-sm text-gray-600">Basert på alle skifter med gyldig lønnsgrunnlag/time beregning</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {calculateAverageHourlySalary().toLocaleString('no-NO', { 
                  style: 'currency', 
                  currency: 'NOK' 
                })}/time
              </div>
              <div className="text-sm text-gray-500">
                {filteredSkifts.filter(skift => calculateHourlySalary(skift) > 0).length} av {filteredSkifts.length} skifter
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

