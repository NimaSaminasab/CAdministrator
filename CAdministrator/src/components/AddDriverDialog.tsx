'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddDriverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddDriverDialog({ open, onOpenChange, onSuccess }: AddDriverDialogProps) {
  const [formData, setFormData] = useState({
    sjåforNummer: '',
    personNummer: '',
    fornavn: '',
    etternavn: '',
    adresse: '',
    by: '',
    postnummer: '',
    telefon: '',
    epost: '',
    lonnprosent: 50
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          sjåforNummer: '',
          personNummer: '',
          fornavn: '',
          etternavn: '',
          adresse: '',
          by: '',
          postnummer: '',
          telefon: '',
          epost: '',
          lonnprosent: 50
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const errorData = await response.json()
        console.error('Failed to create driver:', errorData)
        alert('Feil ved oppretting av sjåfør: ' + (errorData.error || 'Ukjent feil'))
      }
    } catch (error) {
      console.error('Failed to create driver:', error)
      alert('Feil ved oppretting av sjåfør: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Legg til Ny Sjåfør</DialogTitle>
          <DialogDescription>
            Skriv inn sjåførens informasjon for å legge dem til i systemet.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sjåforNummer">Sjåfør Nummer</Label>
              <Input
                id="sjåforNummer"
                value={formData.sjåforNummer}
                onChange={(e) => handleInputChange('sjåforNummer', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personNummer">Person Nummer</Label>
              <Input
                id="personNummer"
                value={formData.personNummer}
                onChange={(e) => handleInputChange('personNummer', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fornavn">Fornavn</Label>
              <Input
                id="fornavn"
                value={formData.fornavn}
                onChange={(e) => handleInputChange('fornavn', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="etternavn">Etternavn</Label>
              <Input
                id="etternavn"
                value={formData.etternavn}
                onChange={(e) => handleInputChange('etternavn', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={formData.adresse}
              onChange={(e) => handleInputChange('adresse', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="by">By</Label>
              <Input
                id="by"
                value={formData.by}
                onChange={(e) => handleInputChange('by', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postnummer">Postnummer</Label>
              <Input
                id="postnummer"
                value={formData.postnummer}
                onChange={(e) => handleInputChange('postnummer', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                value={formData.telefon}
                onChange={(e) => handleInputChange('telefon', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epost">E-post</Label>
              <Input
                id="epost"
                type="email"
                value={formData.epost}
                onChange={(e) => handleInputChange('epost', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lonnprosent">Lønnprosent (%)</Label>
            <Input
              id="lonnprosent"
              type="number"
              min="0"
              max="100"
              value={formData.lonnprosent}
              onChange={(e) => handleInputChange('lonnprosent', parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Driver'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

