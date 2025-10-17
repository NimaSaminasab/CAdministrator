import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const driverSchema = z.object({
  driverNumber: z.string().min(1),
  personNumber: z.string().min(1),
  name: z.string().min(1),
  lastName: z.string().min(1),
  address: z.string().min(1),
  town: z.string().min(1),
  postalCode: z.string().min(1),
  telephone: z.string().min(1),
  email: z.string().email(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        skifts: {
          include: {
            car: true
          },
          orderBy: { startDate: 'desc' }
        }
      }
    })
    
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }
    
    return NextResponse.json(driver)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch driver' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = driverSchema.parse(body)
    
    const driver = await prisma.driver.update({
      where: { id: parseInt(params.id) },
      data: validatedData
    })
    
    return NextResponse.json(driver)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.driver.delete({
      where: { id: parseInt(params.id) }
    })
    
    return NextResponse.json({ message: 'Driver deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 })
  }
}

