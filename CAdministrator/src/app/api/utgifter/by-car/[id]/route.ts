import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const carId = parseInt(params.id)
    const expenses = await prisma.expense.findMany({
      where: { carId },
      orderBy: { date: 'desc' }
    })
    return NextResponse.json(expenses)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}



