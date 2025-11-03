'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Varsel {
  id: number
  skiftId: number
  skiftNummer: string
  kmOpptatt: number
  opptattProsent: number
  antTurer: number
  lonnBasis: number
  reason: string
  createdAt: string
  updatedAt: string
  skift: {
    id: number
    skiftNummer: string
    startDato: string
    sluttDato?: string
    startTid: string
    sluttTid?: string
    totalKm: number
    driver: {
      id: number
      fornavn: string
      etternavn: string
      sjåforNummer: string
    }
    car: {
      id: number
      skiltNummer: string
      bilmerke: string
      arsmodell: number
    }
  }
}

export default function VarslerTable() {
  const [varsler, setVarsler] = useState<Varsel[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAll, setCheckingAll] = useState(false)

  useEffect(() => {
    fetchVarsler()
  }, [])

  const fetchVarsler = async () => {
    try {
      const response = await fetch('/api/varsler')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // Check if data is an array, otherwise it might be an error object
      if (Array.isArray(data)) {
        setVarsler(data)
      } else {
        console.error('Invalid response format:', data)
        setVarsler([])
      }
    } catch (error) {
      console.error('Failed to fetch varsler:', error)
      setVarsler([])
    } finally {
      setLoading(false)
    }
  }

  const checkAllSkifts = async () => {
    setCheckingAll(true)
    try {
      const response = await fetch('/api/varsler/check-all', {
        method: 'POST'
      })
      const data = await response.json()
      if (response.ok && data.success) {
        // Refresh the varsler list silently
        await fetchVarsler()
      } else {
        console.error('Error checking skifts:', data.message || data.error || 'Ukjent feil')
      }
    } catch (error) {
      console.error('Failed to check all skifts:', error)
    } finally {
      setCheckingAll(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Varsler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Laster...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>Varsler</CardTitle>
          </div>
          <Button 
            onClick={checkAllSkifts} 
            disabled={checkingAll}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checkingAll ? 'animate-spin' : ''}`} />
            {checkingAll ? 'Sjekker...' : 'Sjekk alle skift'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {varsler.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Ingen varsler registrert
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skift #</TableHead>
                  <TableHead>Sjåfør</TableHead>
                  <TableHead>Bil</TableHead>
                  <TableHead>Dato</TableHead>
                  <TableHead>Km opptatt</TableHead>
                  <TableHead>Opptatt %</TableHead>
                  <TableHead>Antall turer</TableHead>
                  <TableHead>Lønnsgrunnlag</TableHead>
                  <TableHead>Årsak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {varsler.map((varsel) => (
                  <TableRow key={varsel.id}>
                    <TableCell className="font-medium">{varsel.skiftNummer}</TableCell>
                    <TableCell>
                      {varsel.skift.driver.fornavn} {varsel.skift.driver.etternavn}
                      <br />
                      <span className="text-sm text-gray-500">#{varsel.skift.driver.sjåforNummer}</span>
                    </TableCell>
                    <TableCell>
                      {varsel.skift.car.skiltNummer}
                      <br />
                      <span className="text-sm text-gray-500">{varsel.skift.car.bilmerke}</span>
                    </TableCell>
                    <TableCell>
                      {formatDate(varsel.skift.startDato)}
                      <br />
                      <span className="text-sm text-gray-500">
                        {varsel.skift.startTid}
                        {varsel.skift.sluttTid && ` - ${varsel.skift.sluttTid}`}
                      </span>
                    </TableCell>
                    <TableCell>{varsel.kmOpptatt.toFixed(1)} km</TableCell>
                    <TableCell>{varsel.opptattProsent.toFixed(1)}%</TableCell>
                    <TableCell>{varsel.antTurer}</TableCell>
                    <TableCell>{formatCurrency(varsel.lonnBasis)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-orange-600 font-medium">
                        {varsel.reason}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

