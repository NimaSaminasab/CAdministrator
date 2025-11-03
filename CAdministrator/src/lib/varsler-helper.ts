import { prisma } from '@/lib/prisma'

// Helper function to check if a skift should trigger an alert
// Criteria:
// - kmOpptatt < 40
// - opptatt% < 20%
// - antTurer < 10
// - lonnBasis < 2000

export interface SkiftData {
  id: number
  skiftNumber: string
  kmOpptatt: number | string
  antTurer: number
  lonnBasis: number | string
  totalKm: number | string
}

export function shouldTriggerAlert(skift: SkiftData): { shouldAlert: boolean; reasons: string[] } {
  const reasons: string[] = []
  
  const kmOpptatt = typeof skift.kmOpptatt === 'string' ? parseFloat(skift.kmOpptatt) : skift.kmOpptatt
  const totalKm = typeof skift.totalKm === 'string' ? parseFloat(skift.totalKm) : skift.totalKm
  const lonnBasis = typeof skift.lonnBasis === 'string' ? parseFloat(skift.lonnBasis) : skift.lonnBasis
  
  // Calculate occupied percentage
  const opptattProsent = totalKm > 0 ? (kmOpptatt / totalKm) * 100 : 0
  
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
  
  return {
    shouldAlert: reasons.length > 0,
    reasons
  }
}

export async function createAlertIfNeeded(skift: SkiftData) {
  try {
    const { shouldAlert, reasons } = shouldTriggerAlert(skift)
    
    if (!shouldAlert) {
      return null
    }
    
    // Check if alert already exists for this skift
    const existingAlert = await prisma.varsel.findUnique({
      where: { skiftId: skift.id }
    })
    
    if (existingAlert) {
      // Update existing alert
      const kmOpptatt = typeof skift.kmOpptatt === 'string' ? parseFloat(skift.kmOpptatt) : skift.kmOpptatt
      const totalKm = typeof skift.totalKm === 'string' ? parseFloat(skift.totalKm) : skift.totalKm
      const lonnBasis = typeof skift.lonnBasis === 'string' ? parseFloat(skift.lonnBasis) : skift.lonnBasis
      const opptattProsent = totalKm > 0 ? (kmOpptatt / totalKm) * 100 : 0
      
      return await prisma.varsel.update({
        where: { skiftId: skift.id },
        data: {
          kmOpptatt,
          opptattProsent,
          antTurer: skift.antTurer,
          lonnBasis,
          reason: reasons.join(', ')
        }
      })
    }
    
    // Create new alert
    const kmOpptatt = typeof skift.kmOpptatt === 'string' ? parseFloat(skift.kmOpptatt) : skift.kmOpptatt
    const totalKm = typeof skift.totalKm === 'string' ? parseFloat(skift.totalKm) : skift.totalKm
    const lonnBasis = typeof skift.lonnBasis === 'string' ? parseFloat(skift.lonnBasis) : skift.lonnBasis
    const opptattProsent = totalKm > 0 ? (kmOpptatt / totalKm) * 100 : 0
    
    return await prisma.varsel.create({
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
  } catch (error) {
    console.error('Error creating alert:', error)
    return null
  }
}

