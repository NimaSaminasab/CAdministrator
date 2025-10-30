'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Car } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Car {
  id: number
  skiltNummer: string
  bilmerke: string
  arsmodell: number
  skifts: any[]
}

interface CarsTableProps {
  onRefresh: () => void
}

export default function CarsTable({ onRefresh }: CarsTableProps) {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    try {
      const response = await fetch('/api/cars')
      const data = await response.json()
      setCars(data)
    } catch (error) {
      console.error('Failed to fetch cars:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Er du sikker på at du vil slette denne bilen?')) return
    
    try {
      await fetch(`/api/cars/${id}`, { method: 'DELETE' })
      await fetchCars()
      onRefresh()
    } catch (error) {
      console.error('Failed to delete car:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Laster biler...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biler ({cars.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead>Skilt Nummer</TableHead>
              <TableHead>Bilmerke</TableHead>
              <TableHead>Årsmodell</TableHead>
              <TableHead>Skift</TableHead>
              <TableHead>Utgifter</TableHead>
              <TableHead>Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.map((car) => (
              <TableRow key={car.id}>
                <TableCell className="font-medium">{car.skiltNummer}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    {car.bilmerke}
                  </div>
                </TableCell>
                <TableCell>{car.arsmodell}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {car.skifts?.length || 0} skift
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/utgifter/bil/${car.id}`)}>
                    Se utgifter
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(car.id)}
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
  )
}

