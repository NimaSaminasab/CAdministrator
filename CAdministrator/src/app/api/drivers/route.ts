import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { mapDriverToNorwegian, mapDriverFromNorwegian, mapSkiftToNorwegian } from '@/lib/norwegian-mapping'

const driverSchema = z.object({
  sjåforNummer: z.string().min(1),
  personNummer: z.string().min(1),
  fornavn: z.string().min(1),
  etternavn: z.string().min(1),
  adresse: z.string().min(1),
  by: z.string().min(1),
  postnummer: z.string().min(1),
  telefon: z.string().min(1),
  epost: z.string().email(),
  lonnprosent: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) throw new Error('Lønnprosent må være et tall')
    return num
  }).refine((val) => val >= 0 && val <= 100, {
    message: 'Lønnprosent må være mellom 0 og 100'
  }),
})

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        skifts: {
          orderBy: { startDate: 'desc' },
          take: 5
        }
      },
      orderBy: { name: 'asc' }
    })
    
    // Map to Norwegian field names
    const norwegianDrivers = drivers.map(driver => {
      const mappedDriver = mapDriverToNorwegian(driver)
      // Map nested skifts if they exist
      if (driver.skifts) {
        mappedDriver.skifts = driver.skifts.map((skift: any) => mapSkiftToNorwegian(skift))
      }
      return mappedDriver
    })
    
    return NextResponse.json(norwegianDrivers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Creating new driver...')
    const body = await request.json()
    console.log('Request body:', body)
    
    const validatedData = driverSchema.parse(body)
    console.log('Validated data:', validatedData)
    
    // Map from Norwegian to English field names for database
    const englishData = mapDriverFromNorwegian(validatedData)
    console.log('Mapped to English:', englishData)
    
    const driver = await prisma.driver.create({
      data: englishData
    })
    console.log('Driver created:', driver)
    
    // Map back to Norwegian for response
    const norwegianDriver = mapDriverToNorwegian(driver)
    console.log('Mapped back to Norwegian:', norwegianDriver)
    
    return NextResponse.json(norwegianDriver, { status: 201 })
  } catch (error) {
    console.error('Driver creation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Valideringsfeil: ' + error.errors.map(e => e.message).join(', ') }, { status: 400 })
    }
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        const target = (error as any).meta?.target
        if (target?.includes('driverNumber')) {
          return NextResponse.json({ error: 'Sjåførnummer eksisterer allerede' }, { status: 400 })
        }
        if (target?.includes('personNumber')) {
          return NextResponse.json({ error: 'Personnummer eksisterer allerede' }, { status: 400 })
        }
        if (target?.includes('email')) {
          return NextResponse.json({ error: 'E-post eksisterer allerede' }, { status: 400 })
        }
        return NextResponse.json({ error: 'En eller flere felt eksisterer allerede' }, { status: 400 })
      }
    }
    
    console.error('Driver creation error:', error)
    return NextResponse.json({ error: 'Feil ved oppretting av sjåfør' }, { status: 500 })
  }
}

