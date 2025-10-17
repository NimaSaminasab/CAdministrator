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

export async function GET() {
  try {
    const skifts = await prisma.skift.findMany({
      include: {
        driver: true,
        car: true
      },
      orderBy: { startDate: 'desc' }
    })
    
    // Map to Norwegian field names
    const norwegianSkifts = skifts.map(skift => mapSkiftToNorwegian(skift))
    
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

