'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BarChart3 } from 'lucide-react'
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

export default function HistogramPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [shifts, setShifts] = useState<Skift[]>([])
  const [loading, setLoading] = useState(true)
  const [columnType, setColumnType] = useState<string>('')

  useEffect(() => {
    loadShifts()
    const col = searchParams.get('column') || ''
    setColumnType(col)
  }, [])

  const loadShifts = () => {
    try {
      // Try to get filtered shifts from sessionStorage first
      const storedShifts = sessionStorage.getItem('histogramShifts')
      
      if (storedShifts) {
        const parsedShifts = JSON.parse(storedShifts)
        setShifts(parsedShifts)
        setLoading(false)
        // Clear sessionStorage after use
        sessionStorage.removeItem('histogramShifts')
      } else {
        // Fallback: fetch all shifts if no stored data
        fetchShifts()
      }
    } catch (error) {
      console.error('Failed to load shifts:', error)
      fetchShifts()
    }
  }

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/skifts')
      const data = await response.json()
      
      // Filter shifts based on user role
      let filteredData = data
      if (user?.role === 'driver' && user?.driverId) {
        filteredData = data.filter((skift: any) => skift.sjåforId === user.driverId)
      }
      
      // Get date range from URL params if available
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      
      if (startDate) {
        const start = new Date(startDate)
        filteredData = filteredData.filter((skift: Skift) => {
          const skiftDate = new Date(skift.startDato)
          if (endDate) {
            const end = new Date(endDate)
            return skiftDate >= start && skiftDate <= end
          }
          return skiftDate.toDateString() === start.toDateString()
        })
      }
      
      setShifts(filteredData)
    } catch (error) {
      console.error('Failed to fetch shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group shifts by date and calculate value based on column type
  const getHistogramData = () => {
    const grouped: { [key: string]: Skift[] } = {}
    
    shifts.forEach(shift => {
      const date = new Date(shift.startDato)
      const dateKey = date.toISOString().split('T')[0]
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(shift)
    })
    
    const dates = Object.keys(grouped).sort()
    
    return dates.map(date => {
      const dateShifts = grouped[date]
      let value = 0
      let label = ''
      
      switch (columnType) {
        case 'totalKm':
          value = dateShifts.reduce((sum, s) => sum + s.totalKm, 0)
          label = 'km'
          break
        case 'kmOpptatt':
          value = dateShifts.reduce((sum, s) => sum + s.kmOpptatt, 0)
          label = 'km'
          break
        case 'occupiedPercentage':
          const totalKm = dateShifts.reduce((sum, s) => sum + s.totalKm, 0)
          const totalKmOpptatt = dateShifts.reduce((sum, s) => sum + s.kmOpptatt, 0)
          value = totalKm > 0 ? (totalKmOpptatt / totalKm) * 100 : 0
          label = '%'
          break
        case 'antTurer':
          value = dateShifts.reduce((sum, s) => sum + s.antTurer, 0)
          label = 'turer'
          break
        case 'lonnBasis':
          value = dateShifts.reduce((sum, s) => sum + s.lonnBasis, 0)
          label = 'NOK'
          break
        default:
          value = dateShifts.length
          label = 'skift'
      }
      
      return { date, value, count: dateShifts.length }
    })
  }

  const getColumnTitle = () => {
    switch (columnType) {
      case 'totalKm':
        return 'Km skift'
      case 'kmOpptatt':
        return 'Km opptatt'
      case 'occupiedPercentage':
        return 'Opptatt %'
      case 'antTurer':
        return 'Turer'
      case 'lonnBasis':
        return 'Lønnsgrunnlag'
      default:
        return 'Antall Skift'
    }
  }

  const formatValue = (value: number) => {
    switch (columnType) {
      case 'lonnBasis':
        return value.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })
      case 'occupiedPercentage':
        return value.toFixed(1) + '%'
      case 'totalKm':
      case 'kmOpptatt':
        return value.toLocaleString('no-NO') + ' km'
      case 'antTurer':
        return value.toLocaleString('no-NO')
      default:
        return value.toLocaleString('no-NO')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', { 
      day: '2-digit', 
      month: 'short' 
    })
  }

  const histogramData = getHistogramData()
  const maxValue = Math.max(...histogramData.map(d => d.value), 1)

  if (loading) {
    return <div className="text-center py-8">Laster histogram...</div>
  }

  const handleBack = () => {
    router.push('/dashboard?tab=skifts')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 lg:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Tilbake
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                {getColumnTitle()} Histogram
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              {shifts.length} skift totalt
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 lg:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{getColumnTitle()} per Dato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {histogramData.length > 0 ? (
                histogramData.map((item) => {
                  const barHeight = (item.value / maxValue) * 100
                  return (
                    <div key={item.date} className="flex items-end gap-2">
                      <div className="w-24 text-sm text-gray-600 text-right pr-2">
                        {formatDate(item.date)}
                      </div>
                      <div className="flex-1 flex items-end gap-1">
                        <div
                          className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-t cursor-pointer relative group"
                          style={{ height: `${Math.max(barHeight, 5)}%`, minHeight: '20px' }}
                          title={`${formatValue(item.value)} på ${formatDate(item.date)} (${item.count} skift)`}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {formatValue(item.value)}
                          </div>
                        </div>
                      </div>
                      <div className="w-32 text-xs text-gray-500 text-center">
                        {formatValue(item.value)}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Ingen skift funnet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total {getColumnTitle()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatValue(histogramData.reduce((sum, d) => sum + d.value, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Gjennomsnitt per Dato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {histogramData.length > 0 
                  ? formatValue(histogramData.reduce((sum, d) => sum + d.value, 0) / histogramData.length)
                  : formatValue(0)
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Antall Dager</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {histogramData.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
