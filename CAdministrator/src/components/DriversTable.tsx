'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Phone, Mail } from 'lucide-react'

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

export default function DriversTable({ onRefresh }: DriversTableProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return <div className="text-center py-8">Laster sjåfører...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sjåfører ({drivers.length})</CardTitle>
      </CardHeader>
      <CardContent>
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
            {drivers.map((driver) => (
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
                    <Button variant="outline" size="sm">
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
      </CardContent>
    </Card>
  )
}

