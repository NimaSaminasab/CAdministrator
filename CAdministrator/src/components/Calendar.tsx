'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronUp, ChevronDown, Clock, Car, MapPin, DollarSign, Users } from 'lucide-react'

export interface DateRange {
  start: Date | null
  end: Date | null
}

interface Shift {
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

interface CalendarProps {
  selectedDate: DateRange | null
  onDateSelect: (range: DateRange | null) => void
  shiftsByDate: { [key: string]: number } // Date string -> count of shifts
  shifts?: Shift[] // All shifts data (optional)
}

export default function Calendar({ selectedDate, onDateSelect, shiftsByDate, shifts }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)

  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Generate array of days
  const days = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  const monthNames = [
    'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
  ]

  const dayNames = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const goToPreviousYear = () => {
    setCurrentMonth(new Date(year - 1, month, 1))
  }

  const goToNextYear = () => {
    setCurrentMonth(new Date(year + 1, month, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    onDateSelect({ start: today, end: null })
  }

  const selectMonth = () => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    onDateSelect({ start: firstDayOfMonth, end: lastDayOfMonth })
  }

  const clearSelection = () => {
    onDateSelect(null)
  }

  const handleDateClick = (day: number, event: React.MouseEvent) => {
    const clickedDate = new Date(year, month, day)
    const isCtrlPressed = event.ctrlKey || event.metaKey

    if (!selectedDate || !selectedDate.start) {
      // First click - set start date
      onDateSelect({ start: clickedDate, end: null })
    } else if (isCtrlPressed && selectedDate.start) {
      // Ctrl+Click - set end date
      let start = selectedDate.start
      let end = clickedDate

      // Ensure start is before end
      if (end < start) {
        [start, end] = [end, start]
      }

      onDateSelect({ start, end })
    } else {
      // Regular click without Ctrl - set new single date
      onDateSelect({ start: clickedDate, end: null })
    }
  }

  const isToday = (day: number) => {
    const date = new Date(year, month, day)
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (day: number) => {
    if (!selectedDate || !selectedDate.start) return false
    const date = new Date(year, month, day)
    
    // Check if it's the start date
    if (selectedDate.start && date.toDateString() === selectedDate.start.toDateString()) {
      return true
    }
    
    // Check if it's the end date
    if (selectedDate.end && date.toDateString() === selectedDate.end.toDateString()) {
      return true
    }
    
    return false
  }

  const isInRange = (day: number) => {
    if (!selectedDate || !selectedDate.start || !selectedDate.end) return false
    const date = new Date(year, month, day)
    const dateTime = date.getTime()
    const startTime = selectedDate.start.getTime()
    const endTime = selectedDate.end.getTime()
    
    return dateTime >= startTime && dateTime <= endTime
  }

  const getDateKey = (day: number) => {
    const date = new Date(year, month, day)
    return date.toISOString().split('T')[0]
  }

  const getShiftsForDate = (day: number) => {
    if (!shifts) return []
    const dateKey = getDateKey(day)
    return shifts.filter(shift => shift.startDato.startsWith(dateKey))
  }

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift)
    setIsShiftDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO')
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const calculateHoursBetween = (startTime: string, stopTime: string, startDate?: string, stopDate?: string): number => {
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

  const calculateOccupiedPercentage = (shift: Shift): number => {
    if (shift.totalKm > 0 && shift.kmOpptatt > 0) {
      return (Number(shift.kmOpptatt) / Number(shift.totalKm)) * 100
    }
    return 0
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Kalender
        </CardTitle>
        <div className="space-y-2">
          {/* Year navigation */}
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousYear}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <h3 className="text-lg font-semibold mx-4">
              {year}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextYear}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {monthNames[month]}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-1 mb-0.5">
          {dayNames.map((dayName) => (
            <div key={dayName} className="text-center text-sm font-medium text-gray-500 p-0.5">
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-8" />
            }

            const isTodayDate = isToday(day)
            const isSelectedDate = isSelected(day)
            const isInRangeDate = isInRange(day)

            return (
              <Button
                key={day}
                variant={isSelectedDate ? "default" : "ghost"}
                size="sm"
                className={`
                  h-8 w-8 p-0 text-sm
                  ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
                  ${isSelectedDate ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  ${isInRangeDate && !isSelectedDate ? 'bg-blue-100 hover:bg-blue-200' : ''}
                `}
                onClick={(e) => handleDateClick(day, e)}
              >
                {day}
              </Button>
            )
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="flex-1"
          >
            Idag
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectMonth}
            className="flex-1"
          >
            Måneden
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            className="flex-1"
          >
            Alle
          </Button>
        </div>

        {/* Legend */}
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-600 rounded-full" />
            <span>Valgt dato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-100 rounded-full" />
            <span>Dato i område</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Hold Ctrl og klikk for å velge område
          </div>
        </div>
      </CardContent>

      {/* Shift Detail Dialog */}
      <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Skift Detaljer - {selectedShift?.skiftNummer}
            </DialogTitle>
          </DialogHeader>
          
          {selectedShift && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Start Dato & Tid</div>
                      <div className="font-medium">
                        {formatDate(selectedShift.startDato)} {formatTime(selectedShift.startTid)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Stopp Dato & Tid</div>
                      <div className="font-medium">
                        {selectedShift.sluttDato ? (
                          `${formatDate(selectedShift.sluttDato)} ${selectedShift.sluttTid ? formatTime(selectedShift.sluttTid) : ''}`
                        ) : (
                          'Ikke avsluttet'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Bil</div>
                      <div className="font-medium">
                        {selectedShift.car.skiltNummer} - {selectedShift.car.bilmerke} {selectedShift.car.arsmodell}
                      </div>
                    </div>
                  </div>
                  
                  {selectedShift.loyve && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Løyve</div>
                        <div className="font-medium">{selectedShift.loyve}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedShift.totalKm}</div>
                  <div className="text-sm text-gray-600">Km skift</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedShift.kmOpptatt}</div>
                  <div className="text-sm text-gray-600">Km opptatt</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedShift.antTurer}</div>
                  <div className="text-sm text-gray-600">Turer</div>
                </div>
                
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {calculateOccupiedPercentage(selectedShift).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Opptatt %</div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">Lønnsgrunnlag</span>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {selectedShift.lonnBasis.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Timer</span>
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {selectedShift.sluttTid ? 
                      calculateHoursBetween(selectedShift.startTid, selectedShift.sluttTid, selectedShift.startDato, selectedShift.sluttDato).toFixed(1) + 't'
                      : 'Pågående'
                    }
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Lønn/time</span>
                  </div>
                  <div className="text-xl font-bold text-purple-600">
                    {selectedShift.sluttTid && calculateHoursBetween(selectedShift.startTid, selectedShift.sluttTid, selectedShift.startDato, selectedShift.sluttDato) > 0 ? 
                      (selectedShift.lonnBasis / calculateHoursBetween(selectedShift.startTid, selectedShift.sluttTid, selectedShift.startDato, selectedShift.sluttDato)).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' }) + '/t'
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Netto</div>
                  <div className="text-lg font-semibold">
                    {selectedShift.netto.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Skift Status</div>
                  <div className="text-lg font-semibold">
                    {selectedShift.sluttDato ? (
                      <span className="text-green-600">Avsluttet</span>
                    ) : (
                      <span className="text-blue-600">Pågående</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
