'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
              <CardTitle>Utgifter</CardTitle>
              <CardDescription>Kommer snart. Her kan du registrere og se utgifter.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">Ingen data å vise ennå.</div>
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
