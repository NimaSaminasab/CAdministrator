'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Driver {
  id: number
  fornavn: string
  etternavn: string
  sjåforNummer: string
}

interface Car {
  id: number
  skiltNummer: string
  bilmerke: string
  arsmodell: number
}

interface AddSkiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddSkiftDialog({ open, onOpenChange, onSuccess }: AddSkiftDialogProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [formData, setFormData] = useState({
    skiftNummer: '',
    kmMellomSkift: 0,
    startDato: '',
    startTid: '',
    lonnBasis: 0,
    startKm: 0,
    sluttKm: 0,
    totalKm: 0,
    antTurer: 0,
    kmOpptatt: 0,
    tipsKontant: 0,
    tipsKreditt: 0,
    netto: 0,
    sjåforId: 0,
    bilId: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchDriversAndCars()
    }
  }, [open])

  const fetchDriversAndCars = async () => {
    try {
      const [driversRes, carsRes] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/cars')
      ])
      
      const driversData = await driversRes.json()
      const carsData = await carsRes.json()
      
      setDrivers(driversData)
      setCars(carsData)
    } catch (error) {
      console.error('Failed to fetch drivers and cars:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/skifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startDato: new Date(formData.startDato).toISOString()
        }),
      })

      if (response.ok) {
        setFormData({
          skiftNummer: '',
          kmMellomSkift: 0,
          startDato: '',
          startTid: '',
          lonnBasis: 0,
          startKm: 0,
          sluttKm: 0,
          totalKm: 0,
          antTurer: 0,
          kmOpptatt: 0,
          tipsKontant: 0,
          tipsKreditt: 0,
          netto: 0,
          sjåforId: 0,
          bilId: 0
        })
        onSuccess()
      } else {
        const error = await response.json()
        console.error('Failed to create skift:', error)
      }
    } catch (error) {
      console.error('Failed to create skift:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legg til Nytt Skift</DialogTitle>
          <DialogDescription>
            Skriv inn skift-informasjonen for å legge den til i systemet.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skiftNummer">Skift Nummer</Label>
              <Input
                id="skiftNummer"
                value={formData.skiftNummer}
                onChange={(e) => handleInputChange('skiftNummer', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDato">Start Dato</Label>
              <Input
                id="startDato"
                type="date"
                value={formData.startDato}
                onChange={(e) => handleInputChange('startDato', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sjåforId">Sjåfør</Label>
              <select
                id="sjåforId"
                value={formData.sjåforId}
                onChange={(e) => handleInputChange('sjåforId', parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value={0}>Velg en sjåfør</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.fornavn} {driver.etternavn} (#{driver.sjåforNummer})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bilId">Bil</Label>
              <select
                id="bilId"
                value={formData.bilId}
                onChange={(e) => handleInputChange('bilId', parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value={0}>Velg en bil</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.skiltNummer} - {car.bilmerke} ({car.arsmodell})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTid">Start Tid</Label>
              <Input
                id="startTid"
                type="time"
                value={formData.startTid}
                onChange={(e) => handleInputChange('startTid', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startKm">Start KM</Label>
              <Input
                id="startKm"
                type="number"
                step="0.1"
                value={formData.startKm}
                onChange={(e) => handleInputChange('startKm', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sluttKm">Slutt KM</Label>
              <Input
                id="sluttKm"
                type="number"
                step="0.1"
                value={formData.sluttKm}
                onChange={(e) => handleInputChange('sluttKm', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalKm">Total KM</Label>
              <Input
                id="totalKm"
                type="number"
                step="0.1"
                value={formData.totalKm}
                onChange={(e) => handleInputChange('totalKm', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="antTurer">Number of Trips</Label>
              <Input
                id="antTurer"
                type="number"
                value={formData.antTurer}
                onChange={(e) => handleInputChange('antTurer', parseInt(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kmOpptatt">KM Occupied</Label>
              <Input
                id="kmOpptatt"
                type="number"
                step="0.1"
                value={formData.kmOpptatt}
                onChange={(e) => handleInputChange('kmOpptatt', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryBasis">Salary Base</Label>
              <Input
                id="salaryBasis"
                type="number"
                step="0.01"
                value={formData.salaryBasis}
                onChange={(e) => handleInputChange('salaryBasis', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipsKontant">Cash Tips</Label>
              <Input
                id="tipsKontant"
                type="number"
                step="0.01"
                value={formData.tipsKontant}
                onChange={(e) => handleInputChange('tipsKontant', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipsKreditt">Credit Tips</Label>
              <Input
                id="tipsKreditt"
                type="number"
                step="0.01"
                value={formData.tipsKreditt}
                onChange={(e) => handleInputChange('tipsKreditt', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="netto">Net Income</Label>
            <Input
              id="netto"
              type="number"
              step="0.01"
              value={formData.netto}
              onChange={(e) => handleInputChange('netto', parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

