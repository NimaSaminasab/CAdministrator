import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { mapSkiftToNorwegian, mapSkiftFromNorwegian } from '@/lib/norwegian-mapping'

const skiftSchema = z.object({
  skiftNummer: z.string().min(1),
  kmMellomSkift: z.number().min(0),
  startDato: z.string().datetime(),
  sluttDato: z.string().datetime().optional(),
  startTid: z.string(),
  sluttTid: z.string().optional(),
  lonnBasis: z.number().min(0),
  startKm: z.number().min(0),
  sluttKm: z.number().min(0),
  totalKm: z.number().min(0),
  antTurer: z.number().min(0),
  kmOpptatt: z.number().min(0),
  tipsKontant: z.number().min(0),
  tipsKreditt: z.number().min(0),
  netto: z.number(),
  loyve: z.string().optional(),
  sjåforId: z.number(),
  bilId: z.number(),
})

export async function GET(request: NextRequest) {
  try {
    // Get user info from query params (sent from client)
    const searchParams = request.nextUrl.searchParams
    const userRole = searchParams.get('role') || 'admin' // Default to admin if not provided
    const driverId = searchParams.get('driverId') // Optional: driver's ID
    
    const skifts = await prisma.skift.findMany({
      include: {
        driver: true,
        car: true
      },
      orderBy: { startDate: 'desc' }
    })
    
    // Filter skifts based on hideFromOthers flag and user role
    let filteredSkifts = skifts
    if (userRole !== 'admin') {
      // For non-admin users, filter out skifts from drivers with hideFromOthers=true
      // unless it's the current user's own skifts
      filteredSkifts = skifts.filter(skift => {
        if (skift.driver.hideFromOthers) {
          // If hideFromOthers is true, only show if it's the current user's own skifts
          if (driverId && skift.driverId === parseInt(driverId)) {
            return true // Show own skifts
          }
          return false // Hide skifts from other drivers with hideFromOthers=true
        }
        return true // Show skifts if hideFromOthers is false
      })
    }
    // Admin sees all skifts
    
    // Map to Norwegian field names
    const norwegianSkifts = filteredSkifts.map(skift => mapSkiftToNorwegian(skift))
    
    return NextResponse.json(norwegianSkifts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch skifts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = skiftSchema.parse(body)
    
    // Map from Norwegian to English field names for database
    const englishData = mapSkiftFromNorwegian(validatedData)
    
    const skift = await prisma.skift.create({
      data: {
        ...englishData,
        startDate: new Date(englishData.startDate),
        stopDate: englishData.stopDate ? new Date(englishData.stopDate) : null,
      },
      include: {
        driver: true,
        car: true
      }
    })
    
    // Map back to Norwegian for response
    const norwegianSkift = mapSkiftToNorwegian(skift)
    
    return NextResponse.json(norwegianSkift, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create skift' }, { status: 500 })
  }
}

