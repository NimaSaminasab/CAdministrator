'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BarChart3, User } from 'lucide-react'
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
  sjåforId?: number
  driver?: {
    fornavn?: string
    etternavn?: string
    sjåforNummer?: string
    name?: string
    lastName?: string
  }
}

export default function KmOpptattByDriverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [shifts, setShifts] = useState<Skift[]>([])
  const [loading, setLoading] = useState(true)
  const metric = (searchParams?.get('metric') || 'kmOpptatt') as 'kmOpptatt' | 'occupiedPercentage' | 'antTurer'

  useEffect(() => {
    loadShifts()
  }, [])

  const loadShifts = async () => {
    try {
      const stored = sessionStorage.getItem('histogramShifts')
      if (stored) {
        setShifts(JSON.parse(stored))
        // Viktig: ikke slett umiddelbart i dev/StrictMode, ellers vil fallback hente alt
        setLoading(false)
        return
      }
      const res = await fetch('/api/skifts')
      const data = await res.json()
      let filtered = data
      if (user?.role === 'driver' && user?.driverId) {
        filtered = data.filter((s: any) => s.sjåforId === user.driverId)
      }
      setShifts(filtered)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const byDriver = useMemo(() => {
    // Helpers to parse numbers that might be localized strings
    const parseNum = (val: any): number => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9.,-]/g, '').replace(',', '.')
        const parsed = parseFloat(cleaned)
        return isNaN(parsed) ? 0 : parsed
      }
      return 0
    }

    // Aggregate per driver
    const sumMap: Record<string, { kmOpptatt: number; totalKm: number; turer: number }> = {}
    for (const s of shifts) {
      let name = 'Ukjent'
      if (s.driver) {
        const a = (s.driver.fornavn ?? s.driver.name ?? '').toString().trim()
        const b = (s.driver.etternavn ?? s.driver.lastName ?? '').toString().trim()
        name = `${a} ${b}`.trim() || s.driver.sjåforNummer || `Sjåfør #${s.sjåforId ?? ''}` || 'Ukjent'
      } else if (s.sjåforId) {
        name = `Sjåfør #${s.sjåforId}`
      }
      const kmOcc = parseNum(s.kmOpptatt)
      const tKm = parseNum(s.totalKm)
      const tur = parseNum(s.antTurer)
      if (!sumMap[name]) sumMap[name] = { kmOpptatt: 0, totalKm: 0, turer: 0 }
      sumMap[name].kmOpptatt += kmOcc
      sumMap[name].totalKm += tKm
      sumMap[name].turer += tur
    }

    // Produce series based on metric
    let entries: Array<[string, number]> = []
    if (metric === 'kmOpptatt') {
      entries = Object.entries(sumMap).map(([n, v]) => [n, v.kmOpptatt])
    } else if (metric === 'antTurer') {
      entries = Object.entries(sumMap).map(([n, v]) => [n, v.turer])
    } else {
      // occupiedPercentage = sum(kmOpptatt)/sum(totalKm)*100
      entries = Object.entries(sumMap).map(([n, v]) => [n, v.totalKm > 0 ? (v.kmOpptatt / v.totalKm) * 100 : 0])
    }
    entries.sort((a, b) => b[1] - a[1])
    return entries
  }, [shifts, metric])

  const maxValue = Math.max(...byDriver.map(([, v]) => v), 1)
  const unit = metric === 'occupiedPercentage' ? '%' : metric === 'antTurer' ? '' : 'km'
  const title = metric === 'occupiedPercentage' ? 'Opptatt % per sjåfør' : metric === 'antTurer' ? 'Turer per sjåfør' : 'Km opptatt per sjåfør'

  // Build y-axis ticks with ~30% headroom above the max value
  const getTicks = () => {
    const targetTicks = 5
    const desiredTop = Math.max(1, maxValue * 1.3)
    // nice step rounding: 1/2/5 * 10^n closest to desired step
    const roughStep = desiredTop / targetTicks
    const pow10 = Math.pow(10, Math.floor(Math.log10(roughStep)))
    const candidates = [1, 2, 5].map(m => m * pow10)
    const step = candidates.reduce((best, cur) => Math.abs(cur - roughStep) < Math.abs(best - roughStep) ? cur : best, candidates[0]) || 1
    let top = Math.ceil(desiredTop / step) * step
    if (metric === 'occupiedPercentage') {
      top = Math.min(100, top)
    }
    const ticks: number[] = []
    for (let v = 0; v <= top + 0.0001; v += step) {
      ticks.push(Math.round(v * 100) / 100)
    }
    return { ticks, top }
  }
  const { ticks, top } = getTicks()

  if (loading) return <div className="py-8 text-center">Laster graf...</div>

  const handleBack = () => {
    router.push('/dashboard?tab=skifts')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 lg:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Tilbake
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6" /> {title}
              </h1>
            </div>
            <div className="text-sm text-gray-600">{shifts.length} skift grunnlag</div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 lg:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            {byDriver.length === 0 ? (
              <div className="py-8 text-center text-gray-500">Ingen data</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="h-80 min-w-full relative flex">
                  {/* Y-axis labels and ticks */}
                  <div className="w-16 pr-2 relative">
                    {/* Y-axis line */}
                    <div className="absolute left-[calc(100%-1px)] top-0 bottom-6 border-r border-gray-300" />
                    {/* Ticks */}
                    {ticks.map(v => {
                      const bottomPct = top > 0 ? (v / top) * 100 : 0
                      return (
                        <div key={v} className="absolute left-0 right-0" style={{ bottom: `calc(${bottomPct}% + 0px)` }}>
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] text-gray-600 w-12 text-right">{v.toLocaleString('no-NO')}</div>
                            <div className="flex-1 border-t border-dashed border-gray-200" />
                          </div>
                        </div>
                      )
                    })}
                    {/* Y-axis unit near top, clearly visible */}
                    <div className="absolute top-2 right-1 text-[10px] text-gray-500 select-none">{unit}</div>
                  </div>

                  {/* Plot area */}
                  <div className="flex-1 relative h-full">
                    {/* X-axis line */}
                    <div className="absolute left-0 right-0 bottom-6 border-t border-gray-300" />
                    {/* Bars */}
                    <div className="absolute left-0 right-0 top-0 bottom-6 flex items-end gap-3 px-2">
                      {byDriver.map(([name, value]) => {
                        const heightPct = top > 0 ? (value / top) * 100 : 0
                        return (
                          <div key={name} className="relative flex flex-col items-center w-16 h-full">
                            <div
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 bg-blue-600 hover:bg-blue-700 transition-colors rounded-t group"
                              style={{ height: `${heightPct}%` }}
                              title={`${value.toLocaleString('no-NO')}${unit ? ' ' + unit : ''}`}
                            >
                              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                                {value.toLocaleString('no-NO')}{unit ? ' ' + unit : ''}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* X labels under baseline */}
                    <div className="absolute left-0 right-0 bottom-0 h-6 flex items-start gap-3 px-2">
                      {byDriver.map(([name]) => (
                        <div key={name} className="w-16 text-center text-[10px] text-gray-700 truncate" title={name}>
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


