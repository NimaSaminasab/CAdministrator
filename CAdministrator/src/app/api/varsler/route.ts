import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check if varsel model exists (for graceful handling if Prisma Client is not regenerated)
    if (!prisma.varsel) {
      console.error('Prisma varsel model not available. Please run: npx prisma generate')
      return NextResponse.json([], { status: 200 })
    }
    
    const varsler = await prisma.varsel.findMany({
      include: {
        skift: {
          include: {
            driver: true,
            car: true
          }
        }
      },
      orderBy: { createdAt: 'desc' } // Newest first
    })
    
    // Map to Norwegian field names
    const norwegianVarsler = varsler.map(varsel => ({
      id: varsel.id,
      skiftId: varsel.skiftId,
      skiftNummer: varsel.skiftNumber,
      kmOpptatt: Number(varsel.kmOpptatt),
      opptattProsent: Number(varsel.opptattProsent.toFixed(2)),
      antTurer: varsel.antTurer,
      lonnBasis: Number(varsel.lonnBasis),
      reason: varsel.reason,
      createdAt: varsel.createdAt,
      updatedAt: varsel.updatedAt,
      skift: {
        id: varsel.skift.id,
        skiftNummer: varsel.skift.skiftNumber,
        startDato: varsel.skift.startDate.toISOString(),
        sluttDato: varsel.skift.stopDate?.toISOString(),
        startTid: varsel.skift.startTime,
        sluttTid: varsel.skift.stopTime,
        totalKm: Number(varsel.skift.totalKm),
        driver: {
          id: varsel.skift.driver.id,
          fornavn: varsel.skift.driver.name,
          etternavn: varsel.skift.driver.lastName,
          sjåforNummer: varsel.skift.driver.driverNumber
        },
        car: {
          id: varsel.skift.car.id,
          skiltNummer: varsel.skift.car.licenseNumber,
          bilmerke: varsel.skift.car.carBrand,
          arsmodell: varsel.skift.car.modelYear
        }
      }
    }))
    
    return NextResponse.json(norwegianVarsler)
  } catch (error) {
    console.error('Error fetching varsler:', error)
    return NextResponse.json({ error: 'Failed to fetch varsler' }, { status: 500 })
  }
}

