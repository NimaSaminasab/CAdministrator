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
  ikkeVisMegForAndre: z.boolean().optional().default(false),
})

export async function GET(request: NextRequest) {
  try {
    // Get user info from query params (sent from client)
    const searchParams = request.nextUrl.searchParams
    const userRole = searchParams.get('role') || 'admin' // Default to admin if not provided
    const userId = searchParams.get('userId') // Optional: driver's user ID
    const driverId = searchParams.get('driverId') // Optional: driver's ID
    
    const drivers = await prisma.driver.findMany({
      include: {
        skifts: {
          orderBy: { startDate: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    // Filter drivers based on hideFromOthers flag and user role
    let filteredDrivers = drivers
    if (userRole !== 'admin') {
      // For non-admin users, filter out drivers with hideFromOthers=true
      // unless it's the current user's own driver record
      filteredDrivers = drivers.filter(driver => {
        if (driver.hideFromOthers) {
          // If hideFromOthers is true, only show if it's the current user's own driver record
          if (driverId && driver.id === parseInt(driverId)) {
            return true // Show own record
          }
          return false // Hide from others
        }
        return true // Show if hideFromOthers is false
      })
    }
    // Admin sees all drivers
    
    // Map to Norwegian field names
    const norwegianDrivers = filteredDrivers.map(driver => {
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
    
    // Create driver and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the driver
      const driver = await tx.driver.create({
        data: englishData
      })
      console.log('Driver created:', driver)
      
      // Create user account for the driver
      const username = driver.driverNumber
      const password = `${driver.driverNumber}${driver.name}`
      
      const user = await tx.user.create({
        data: {
          username,
          password,
          role: 'driver',
          driverId: driver.id
        }
      })
      console.log('User created for driver:', user)
      
      return { driver, user }
    })
    
    // Map back to Norwegian for response
    const norwegianDriver = mapDriverToNorwegian(result.driver)
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
        if (target?.includes('username')) {
          return NextResponse.json({ error: 'Brukernavn eksisterer allerede' }, { status: 400 })
        }
        return NextResponse.json({ error: 'En eller flere felt eksisterer allerede' }, { status: 400 })
      }
    }
    
    console.error('Driver creation error:', error)
    return NextResponse.json({ error: 'Feil ved oppretting av sjåfør' }, { status: 500 })
  }
}

