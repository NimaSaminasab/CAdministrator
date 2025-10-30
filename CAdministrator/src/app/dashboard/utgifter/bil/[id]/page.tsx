'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CarExpensesPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 lg:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=cars')}>Tilbake</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {car?.skiltNummer || car?.licenseNumber
              ? `Utgifter for bil (${car.skiltNummer || car.licenseNumber})`
              : (carId && carId !== 'undefined' ? `Utgifter for bil (#${carId})` : 'Utgifter for bil')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Laster...</div>
          ) : expenses.length === 0 ? (
            <div className="text-sm text-gray-600">Ingen utgifter registrert ennå.</div>
          ) : (
            <div className="space-y-3">
              {expenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between border rounded px-3 py-2">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">{new Date(exp.date).toLocaleDateString('no-NO')} • {exp.category}</div>
                    {exp.description && <div className="text-xs text-gray-500">{exp.description}</div>}
                  </div>
                  <div className="text-sm font-semibold">{Number(exp.amount).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


