import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const skiftSchema = z.object({
  skiftNumber: z.string().min(1),
  kmBetweenSkift: z.number().min(0),
  startDate: z.string().datetime(),
  stopDate: z.string().datetime().optional(),
  startTime: z.string(),
  stopTime: z.string().optional(),
  salaryBasis: z.number().min(0),
  startKm: z.number().min(0),
  stopKm: z.number().min(0),
  totalKm: z.number().min(0),
  antTurer: z.number().min(0),
  kmOpptatt: z.number().min(0),
  tipsKontant: z.number().min(0),
  tipsKreditt: z.number().min(0),
  netto: z.number(),
  driverId: z.number(),
  carId: z.number(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skift = await prisma.skift.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        driver: true,
        car: true
      }
    })
    
    if (!skift) {
      return NextResponse.json({ error: 'Skift not found' }, { status: 404 })
    }
    
    return NextResponse.json(skift)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch skift' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = skiftSchema.parse(body)
    
    const skift = await prisma.skift.update({
      where: { id: parseInt(params.id) },
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        stopDate: validatedData.stopDate ? new Date(validatedData.stopDate) : null,
      },
      include: {
        driver: true,
        car: true
      }
    })
    
    return NextResponse.json(skift)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update skift' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.skift.delete({
      where: { id: parseInt(params.id) }
    })
    
    return NextResponse.json({ message: 'Skift deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete skift' }, { status: 500 })
  }
}

