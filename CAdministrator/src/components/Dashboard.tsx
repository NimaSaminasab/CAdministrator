'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Car, Users, Clock, Plus } from 'lucide-react'
import DriversTable, { DriversTableRef } from '@/components/DriversTable'
import CarsTable from '@/components/CarsTable'
import SkiftsTable from '@/components/SkiftsTable'
import AddDriverDialog from '@/components/AddDriverDialog'
import AddCarDialog from '@/components/AddCarDialog'

interface DashboardStats {
  totalDrivers: number
  totalCars: number
  totalSkifts: number
  activeSkifts: number
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalDrivers: 0,
    totalCars: 0,
    totalSkifts: 0,
    activeSkifts: 0
  })
  const initialTab = searchParams?.get('tab') || 'drivers'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [showAddCar, setShowAddCar] = useState(false)
  const driversTableRef = useRef<DriversTableRef>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  // Keep active tab in sync when URL query (?tab=...) changes externally (e.g., header buttons)
  useEffect(() => {
    const urlTab = searchParams?.get('tab') || 'drivers'
    if (urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams])

  const fetchStats = async () => {
    try {
      const [driversRes, carsRes, skiftsRes] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/cars'),
        fetch('/api/skifts')
      ])
      
      const drivers = await driversRes.json()
      const cars = await carsRes.json()
      const skifts = await skiftsRes.json()
      
      setStats({
        totalDrivers: drivers.length,
        totalCars: cars.length,
        totalSkifts: skifts.length,
        activeSkifts: skifts.filter((s: any) => !s.sluttDato).length
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleAddSuccess = () => {
    fetchStats()
    // Refresh the drivers table to show the new driver
    if (driversTableRef.current) {
      driversTableRef.current.refresh()
    }
    setShowAddDriver(false)
    setShowAddCar(false)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Sjåfører</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Biler</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCars}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Skift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSkifts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Skift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSkifts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v)
        try {
          const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []))
          sp.set('tab', v)
          router.replace(`?${sp.toString()}`)
        } catch {}
      }} className="space-y-6">
        <div className="flex justify-between items-center">
          {/* Tabs triggers hidden; navigation moved to top menu */}
          <div className="hidden md:block" />
          
          <div className="flex gap-2">
            {activeTab === 'drivers' && (
              <Button onClick={() => setShowAddDriver(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til Sjåfør
              </Button>
            )}
            {activeTab === 'cars' && (
              <Button onClick={() => setShowAddCar(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til Bil
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="drivers">
          <DriversTable ref={driversTableRef} onRefresh={fetchStats} />
        </TabsContent>
        
        <TabsContent value="cars">
          <CarsTable onRefresh={fetchStats} />
        </TabsContent>
        
        <TabsContent value="skifts">
          <SkiftsTable onRefresh={fetchStats} />
        </TabsContent>

        <TabsContent value="utgifter">
          <Card>
            <CardHeader>
              <CardTitle>Registrer utgift</CardTitle>
              <CardDescription>Fyll ut og lagre en ny utgift.</CardDescription>
            </CardHeader>
            <CardContent>
              <UtgifterForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddDriverDialog 
        open={showAddDriver} 
        onOpenChange={setShowAddDriver} 
        onSuccess={handleAddSuccess} 
      />
      <AddCarDialog 
        open={showAddCar} 
        onOpenChange={setShowAddCar} 
        onSuccess={handleAddSuccess} 
      />
    </div>
  )
}

function UtgifterForm() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    dato: new Date().toISOString().slice(0, 10),
    kategori: '',
    belop: '',
    beskrivelse: '',
    sjaforId: '',
    bilId: ''
  })
  const [message, setMessage] = useState<string | null>(null)
  const [drivers, setDrivers] = useState<any[]>([])
  const [cars, setCars] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const [dRes, cRes] = await Promise.all([
          fetch('/api/drivers'),
          fetch('/api/cars')
        ])
        const d = await dRes.json().catch(() => [])
        const c = await cRes.json().catch(() => [])
        setDrivers(Array.isArray(d) ? d : [])
        setCars(Array.isArray(c) ? c : [])
      } catch {
        setDrivers([]); setCars([])
      }
    })()
  }, [])

  const onChange = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/utgifter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.dato,
          category: form.kategori,
          amount: parseFloat(form.belop.replace(',', '.')),
          description: form.beskrivelse,
          driverId: form.sjaforId ? parseInt(form.sjaforId) : undefined,
          carId: form.bilId ? parseInt(form.bilId) : undefined,
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Kunne ikke lagre utgiften')
      }

      setMessage('Utgiften er lagret!')
      setForm({ dato: new Date().toISOString().slice(0, 10), kategori: '', belop: '', beskrivelse: '', sjaforId: '', bilId: '' })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Kunne ikke lagre utgiften.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dato">Dato</Label>
          <Input id="dato" type="date" value={form.dato} onChange={(e) => onChange('dato', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kategori">Kategori</Label>
          <Input id="kategori" placeholder="F.eks. Drivstoff, Service" value={form.kategori} onChange={(e) => onChange('kategori', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="belop">Beløp (NOK)</Label>
          <Input id="belop" type="number" step="0.01" placeholder="0.00" value={form.belop} onChange={(e) => onChange('belop', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="beskrivelse">Beskrivelse</Label>
          <Input id="beskrivelse" placeholder="Valgfritt" value={form.beskrivelse} onChange={(e) => onChange('beskrivelse', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sjaforId">Sjåfør (valgfritt)</Label>
            <select
              id="sjaforId"
              className="block w-full border rounded px-3 py-2 text-sm"
              value={form.sjaforId}
              onChange={(e) => onChange('sjaforId', e.target.value)}
            >
              <option value="">Velg sjåfør…</option>
              {drivers.map((dr: any) => (
                <option key={dr.id} value={dr.id}>
                  {`${dr.fornavn ?? ''} ${dr.etternavn ?? ''}`.trim() || `Sjåfør #${dr.id}`} {dr.sjåforNummer ? `(#${dr.sjåforNummer})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bilId">Bil (valgfritt)</Label>
            <select
              id="bilId"
              className="block w-full border rounded px-3 py-2 text-sm"
              value={form.bilId}
              onChange={(e) => onChange('bilId', e.target.value)}
            >
              <option value="">Velg bil…</option>
              {cars.map((car: any) => (
                <option key={car.id} value={car.id}>
                  {car.skiltNummer ?? `Bil #${car.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? 'Lagrer...' : 'Lagre utgift'}</Button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </form>
  )
}
