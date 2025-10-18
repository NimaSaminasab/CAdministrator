'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Clock, User, Search, Car } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

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
  const [skifts, setSkifts] = useState<Skift[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user?.driverId) {
      fetchDriverSkifts()
    }
  }, [user])

  const fetchDriverSkifts = async () => {
    try {
      const response = await fetch('/api/skifts')
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

  const calculateSalary = (skift: Skift): number => {
    // For driver dashboard, we need to get the driver's salary percentage
    // Since we don't have it in the skift data, we'll use a default or get it from user context
    const salaryPercentage = user?.driver?.salaryPercentage || 50 // Default to 50% if not available
    return (skift.lonnBasis * salaryPercentage) / 100
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

  const filteredSkifts = skifts.filter(skift => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    if (skift.skiftNummer.toLowerCase() === searchLower) return true
    if (skift.skiftNummer.toLowerCase().includes(searchLower)) return true
    
    const startDate = new Date(skift.startDato).toLocaleDateString('no-NO')
    if (startDate.includes(searchLower)) return true
    
    return false
  })

  const calculateTotals = () => {
    const totalKmSkift = filteredSkifts.reduce((sum, skift) => sum + Number(skift.totalKm), 0)
    const totalKmOpptatt = filteredSkifts.reduce((sum, skift) => sum + Number(skift.kmOpptatt), 0)
    const totalTurer = filteredSkifts.reduce((sum, skift) => sum + Number(skift.antTurer), 0)
    const totalLonnBasis = filteredSkifts.reduce((sum, skift) => sum + Number(skift.lonnBasis), 0)
    
    return {
      totalKmSkift,
      totalKmOpptatt,
      totalTurer,
      totalLonnBasis
    }
  }

  const calculateAverageHourlySalary = (): number => {
    const validSalaries = filteredSkifts
      .map(skift => calculateHourlySalary(skift))
      .filter(salary => salary > 0)
    
    if (validSalaries.length === 0) return 0
    
    const total = validSalaries.reduce((sum, salary) => sum + salary, 0)
    return total / validSalaries.length
  }

  if (loading) {
    return <div className="text-center py-8">Laster dine skifter...</div>
  }

  const totals = calculateTotals()

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

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Mine Skifter ({filteredSkifts.length} av {skifts.length})</CardTitle>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Søk etter skiftnummer eller dato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead>Skift #</TableHead>
                <TableHead>Bil</TableHead>
                <TableHead>Start Dato & Tid</TableHead>
                <TableHead>Stopp Dato & Tid</TableHead>
                <TableHead>Km skift</TableHead>
                <TableHead>Km opptatt</TableHead>
                <TableHead>Opptatt %</TableHead>
                <TableHead>Turer</TableHead>
                <TableHead>Lønnsgrunnlag</TableHead>
                <TableHead>Lønn/time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSkifts.map((skift) => (
                <TableRow key={skift.id}>
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
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Summer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totals.totalKmSkift.toLocaleString('no-NO')} km
                </div>
                <div className="text-sm text-gray-600">Km skift</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totals.totalKmOpptatt.toLocaleString('no-NO')} km
                </div>
                <div className="text-sm text-gray-600">Km opptatt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {totals.totalTurer.toLocaleString('no-NO')}
                </div>
                <div className="text-sm text-gray-600">Turer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {totals.totalLonnBasis.toLocaleString('no-NO', { 
                    style: 'currency', 
                    currency: 'NOK' 
                  })}
                </div>
                <div className="text-sm text-gray-600">Lønnsgrunnlag</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gjennomsnitt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {calculateAverageHourlySalary().toLocaleString('no-NO', { 
                  style: 'currency', 
                  currency: 'NOK' 
                })}/time
              </div>
              <div className="text-sm text-gray-600">Gjennomsnittlig lønn/time</div>
              <div className="text-xs text-gray-500 mt-2">
                Basert på {filteredSkifts.filter(skift => calculateHourlySalary(skift) > 0).length} av {filteredSkifts.length} skifter
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
