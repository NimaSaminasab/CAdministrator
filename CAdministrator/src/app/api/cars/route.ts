import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { mapCarToNorwegian, mapCarFromNorwegian, mapSkiftToNorwegian } from '@/lib/norwegian-mapping'

const carSchema = z.object({
  skiltNummer: z.string().min(1),
  bilmerke: z.string().min(1),
  arsmodell: z.number().int().min(1900).max(new Date().getFullYear() + 1),
})

export async function GET() {
  try {
    const cars = await prisma.car.findMany({
      include: {
        skifts: {
          orderBy: { startDate: 'desc' },
          take: 5
        }
      },
      orderBy: { licenseNumber: 'asc' }
    })
    
    // Map to Norwegian field names
    const norwegianCars = cars.map(car => {
      const mappedCar = mapCarToNorwegian(car)
      // Map nested skifts if they exist
      if (car.skifts) {
        mappedCar.skifts = car.skifts.map((skift: any) => mapSkiftToNorwegian(skift))
      }
      return mappedCar
    })
    
    return NextResponse.json(norwegianCars)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = carSchema.parse(body)
    
    // Map from Norwegian to English field names for database
    const englishData = mapCarFromNorwegian(validatedData)
    
    const car = await prisma.car.create({
      data: englishData
    })
    
    // Map back to Norwegian for response
    const norwegianCar = mapCarToNorwegian(car)
    
    return NextResponse.json(norwegianCar, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 })
  }
}

