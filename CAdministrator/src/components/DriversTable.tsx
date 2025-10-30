'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit, Trash2, Phone, Mail, Search } from 'lucide-react'
import EditDriverDialog from '@/components/EditDriverDialog'

interface Driver {
  id: number
  sjåforNummer: string
  personNummer: string
  fornavn: string
  etternavn: string
  adresse: string
  by: string
  postnummer: string
  telefon: string
  epost: string
  lonnprosent: number
  skifts: any[]
}

interface DriversTableProps {
  onRefresh: () => void
}

export interface DriversTableRef {
  refresh: () => void
}

const DriversTable = forwardRef<DriversTableRef, DriversTableProps>(({ onRefresh }, ref) => {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers')
      const data = await response.json()
      setDrivers(data)
    } catch (error) {
      console.error('Failed to fetch drivers:', error)
    } finally {
      setLoading(false)
    }
  }


  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: fetchDrivers
  }))

  const handleDelete = async (id: number) => {
    if (!confirm('Er du sikker på at du vil slette denne sjåføren?')) return
    
    try {
      await fetch(`/api/drivers/${id}`, { method: 'DELETE' })
      await fetchDrivers()
      onRefresh()
    } catch (error) {
      console.error('Failed to delete driver:', error)
    }
  }

  const openEdit = (driver: Driver) => {
    setSelectedDriver(driver)
    setEditOpen(true)
  }

  if (loading) {
    return <div className="text-center py-8">Laster sjåfører...</div>
  }

  const filteredDrivers = drivers.filter(driver => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Søk i sjåfør ID (eksakt match)
    if (driver.sjåforNummer.toLowerCase() === searchLower) return true
    
    // Søk i navn (fornavn og etternavn)
    const fullName = `${driver.fornavn} ${driver.etternavn}`.toLowerCase()
    if (fullName.includes(searchLower)) return true
    if (driver.fornavn.toLowerCase().includes(searchLower)) return true
    if (driver.etternavn.toLowerCase().includes(searchLower)) return true
    
    // Søk i personnummer
    if (driver.personNummer.toLowerCase().includes(searchLower)) return true
    
    // Søk i telefon
    if (driver.telefon.includes(searchTerm)) return true
    
    // Søk i email
    if (driver.epost.toLowerCase().includes(searchLower)) return true
    
    return false
  })

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Sjåfører ({filteredDrivers.length} av {drivers.length})</CardTitle>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Søk etter sjåfør ID, navn, personnummer, telefon eller email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Sjåfør ID</TableHead>
              <TableHead>Navn</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Lønnprosent</TableHead>
              <TableHead>Skift</TableHead>
              <TableHead>Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.sjåforNummer}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{driver.fornavn} {driver.etternavn}</div>
                    <div className="text-sm text-gray-500">ID: {driver.personNummer}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Phone className="h-3 w-3 mr-1" />
                      {driver.telefon}
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-3 w-3 mr-1" />
                      {driver.epost}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{driver.adresse}</div>
                    <div>{driver.postnummer} {driver.by}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {driver.lonnprosent}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {driver.skifts?.length || 0} skift
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(driver)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(driver.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
    <EditDriverDialog
      open={editOpen}
      onOpenChange={setEditOpen}
      driver={selectedDriver}
      onSuccess={async () => { await fetchDrivers(); onRefresh(); }}
    />
    </>
  )
})

DriversTable.displayName = 'DriversTable'

export default DriversTable

