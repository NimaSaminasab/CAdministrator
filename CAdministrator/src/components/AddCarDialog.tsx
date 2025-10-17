'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddCarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddCarDialog({ open, onOpenChange, onSuccess }: AddCarDialogProps) {
  const [formData, setFormData] = useState({
    skiltNummer: '',
    bilmerke: '',
    arsmodell: new Date().getFullYear()
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          skiltNummer: '',
          bilmerke: '',
          arsmodell: new Date().getFullYear()
        })
        onSuccess()
      } else {
        const error = await response.json()
        console.error('Failed to create car:', error)
      }
    } catch (error) {
      console.error('Failed to create car:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New Car</DialogTitle>
          <DialogDescription>
            Enter the car's information to add it to the fleet.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carBrand">Car Brand</Label>
            <Input
              id="carBrand"
              value={formData.carBrand}
              onChange={(e) => handleInputChange('carBrand', e.target.value)}
              placeholder="e.g., Toyota, Ford, BMW"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelYear">Model Year</Label>
            <Input
              id="modelYear"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={formData.modelYear}
              onChange={(e) => handleInputChange('modelYear', parseInt(e.target.value) || new Date().getFullYear())}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Legger til...' : 'Legg til Bil'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

