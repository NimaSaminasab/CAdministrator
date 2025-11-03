import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check if varsel model exists (try-catch in case model doesn't exist yet)
    let varselModelExists = true
    try {
      // Try to access the model
      if (!(prisma as any).varsel) {
        varselModelExists = false
      }
    } catch (e) {
      varselModelExists = false
    }
    
    if (!varselModelExists) {
      return NextResponse.json({ 
        success: false,
        error: 'Prisma varsel model not available',
        message: 'Du må stoppe serveren, kjøre "npx prisma generate", og starte serveren igjen.'
      }, { status: 500 })
    }

    console.log('Fetching all skifts...')
    const skifts = await prisma.skift.findMany({
      include: {
        varsler: true // Check if alert already exists
      }
    })
    
    console.log(`Found ${skifts.length} skifts to check`)
    
    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    
    for (const skift of skifts) {
      // Calculate occupied percentage
      const totalKm = Number(skift.totalKm)
      const kmOpptatt = Number(skift.kmOpptatt)
      const opptattProsent = totalKm > 0 ? (kmOpptatt / totalKm) * 100 : 0
      const lonnBasis = Number(skift.salaryBasis)
      
      // Check criteria
      const reasons: string[] = []
      
      if (kmOpptatt < 40) {
        reasons.push('Km opptatt < 40')
      }
      
      if (opptattProsent < 20) {
        reasons.push('Opptatt% < 20%')
      }
      
      if (skift.antTurer < 10) {
        reasons.push('Antall turer < 10')
      }
      
      if (lonnBasis < 2000) {
        reasons.push('Lønnsgrunnlag < 2000')
      }
      
      // If no reasons, skip
      if (reasons.length === 0) {
        skippedCount++
        continue
      }
      
      // Check if alert already exists
      if (skift.varsler) {
        // Update existing alert
        await prisma.varsel.update({
          where: { skiftId: skift.id },
          data: {
            kmOpptatt,
            opptattProsent,
            antTurer: skift.antTurer,
            lonnBasis,
            reason: reasons.join(', ')
          }
        })
        updatedCount++
        console.log(`Updated alert for skift ${skift.skiftNumber}`)
      } else {
        // Create new alert
        await prisma.varsel.create({
          data: {
            skiftId: skift.id,
            skiftNumber: skift.skiftNumber,
            kmOpptatt,
            opptattProsent,
            antTurer: skift.antTurer,
            lonnBasis,
            reason: reasons.join(', ')
          }
        })
        createdCount++
        console.log(`Created alert for skift ${skift.skiftNumber}`)
      }
    }
    
    const summary = {
      total: skifts.length,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount
    }
    
    console.log('\nSummary:', summary)
    
    return NextResponse.json({
      success: true,
      message: 'Sjekking av alle skift fullført',
      summary
    })
  } catch (error) {
    console.error('Error checking skifts:', error)
    return NextResponse.json({ 
      error: 'Failed to check skifts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

