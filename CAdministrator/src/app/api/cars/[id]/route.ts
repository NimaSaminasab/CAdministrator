import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const carSchema = z.object({
  licenseNumber: z.string().min(1),
  carBrand: z.string().min(1),
  modelYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const car = await prisma.car.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        skifts: {
          include: {
            driver: true
          },
          orderBy: { startDate: 'desc' }
        }
      }
    })
    
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }
    
    return NextResponse.json(car)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch car' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = carSchema.parse(body)
    
    const car = await prisma.car.update({
      where: { id: parseInt(params.id) },
      data: validatedData
    })
    
    return NextResponse.json(car)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update car' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.car.delete({
      where: { id: parseInt(params.id) }
    })
    
    return NextResponse.json({ message: 'Car deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete car' }, { status: 500 })
  }
}

