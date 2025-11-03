'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Calendar, { DateRange } from '@/components/Calendar'

export default function CarExpensesPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const isSkiftActive = pathname === '/dashboard' && searchParams?.get('tab') === 'skifts'
  const isAlleSkiftActive = pathname === '/dashboard/skift/alle'
  const carId = useMemo(() => {
    const fromParams = Array.isArray((params as any)?.id) ? (params as any).id[0] : ((params as any)?.id as string | undefined)
    if (fromParams && String(fromParams).length > 0) return String(fromParams)
    if (pathname) {
      const parts = pathname.split('/').filter(Boolean)
      const last = parts[parts.length - 1]
      if (last) return last
    }
    return undefined
  }, [params, pathname])

  const [car, setCar] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<DateRange | null>(null)

  useEffect(() => {
    if (!carId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/cars/${carId}`)
        const data = await res.json()
        setCar(data)
      } catch {
        setCar(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [carId])

  useEffect(() => {
    if (!carId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/utgifter/by-car/${carId}`)
        const data = await res.json()
        setExpenses(Array.isArray(data) ? data : [])
      } catch {
        setExpenses([])
      }
    })()
  }, [carId])

  // Helper function to get local date string (YYYY-MM-DD)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get expenses count by date for calendar
  const getExpensesByDate = () => {
    const expensesByDate: { [key: string]: number } = {}
    
    expenses.forEach(expense => {
      const date = new Date(expense.date)
      const dateKey = getLocalDateString(date)
      expensesByDate[dateKey] = (expensesByDate[dateKey] || 0) + 1
    })
    
    return expensesByDate
  }

  // Filter expenses based on selected date
  const getFilteredExpenses = () => {
    if (!selectedDate || !selectedDate.start) {
      return expenses
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      
      if (selectedDate.start && selectedDate.end) {
        const endOfDay = new Date(selectedDate.end)
        endOfDay.setHours(23, 59, 59, 999)
        return expenseDate >= selectedDate.start && expenseDate <= endOfDay
      } else if (selectedDate.start) {
        return expenseDate.toDateString() === selectedDate.start.toDateString()
      }
      
      return true
    })
  }

  const filteredExpenses = getFilteredExpenses()
  const expensesByDate = getExpensesByDate()
  
  // Calculate total sum of filtered expenses
  const totalSum = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-4">
            {/* Top menu buttons */}
            <div className="hidden md:flex items-center gap-2">
                {user?.role === 'admin' ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=drivers')}>Sjåfører</Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=cars')}>Biler</Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=skifts')}>Skift</Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=utgifter')}>Utgifter</Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=varsler')}>Varsler</Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push('/dashboard?tab=skifts')}
                      className={isSkiftActive ? 'bg-gray-300' : ''}
                    >
                      Skift
                    </Button>
                    {!user?.driver?.hideFromOthers && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => router.push('/dashboard/skift/alle')}
                        className={isAlleSkiftActive ? 'bg-gray-300' : ''}
                      >
                        Alle skift
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=varsler')}>Varsler</Button>
                  </>
                )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Logget inn som: <span className="font-medium">{user?.username}</span>
                {user?.role === 'driver' && user?.driver && (
                  <span className="ml-2">({user.driver.name} {user.driver.lastName})</span>
                )}
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logg ut
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=cars')}>Tilbake</Button>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses List - Left - Only show when date is selected */}
          {selectedDate && selectedDate.start && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {car?.skiltNummer || car?.licenseNumber
                      ? `Utgifter for bil (${car.skiltNummer || car.licenseNumber})`
                      : (carId && carId !== 'undefined' ? `Utgifter for bil (#${carId})` : 'Utgifter for bil')}
                    {selectedDate && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        {selectedDate.start && selectedDate.end
                          ? `(${selectedDate.start.toLocaleDateString('no-NO')} - ${selectedDate.end.toLocaleDateString('no-NO')})`
                          : selectedDate.start
                          ? `(${selectedDate.start.toLocaleDateString('no-NO')})`
                          : ''}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div>Laster...</div>
                  ) : filteredExpenses.length === 0 ? (
                    <div className="text-sm text-gray-600">
                      Ingen utgifter funnet for valgt periode.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 mb-3">
                        Viser {filteredExpenses.length} {filteredExpenses.length === 1 ? 'utgift' : 'utgifter'}
                        {selectedDate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 text-xs"
                            onClick={() => setSelectedDate(null)}
                          >
                            Fjern filter
                          </Button>
                        )}
                      </div>
                      {filteredExpenses.map(exp => (
                        <div key={exp.id} className="flex items-center justify-between border rounded px-3 py-2">
                          <div className="text-sm text-gray-700">
                            <div className="font-medium">{new Date(exp.date).toLocaleDateString('no-NO')} • {exp.category}</div>
                            {exp.description && <div className="text-xs text-gray-500">{exp.description}</div>}
                          </div>
                          <div className="text-sm font-semibold">{Number(exp.amount).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}</div>
                        </div>
                      ))}
                      {/* Total sum at the bottom */}
                      <div className="flex items-center justify-between border-t-2 border-gray-300 pt-3 mt-3">
                        <div className="text-base font-bold text-gray-900">Total sum:</div>
                        <div className="text-base font-bold text-gray-900">{totalSum.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Calendar - Centered at 1/3 width when no date selected, middle position when date selected */}
          <div className={selectedDate && selectedDate.start 
            ? 'lg:col-span-1' 
            : 'lg:col-start-2 lg:col-span-1'}>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              shiftsByDate={expensesByDate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}


