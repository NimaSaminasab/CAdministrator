import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({ include: { driver: true, car: true }, orderBy: { date: 'desc' } })
    return NextResponse.json(expenses)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const date = body.date ? new Date(body.date) : new Date()
    const amount = typeof body.amount === 'number' ? body.amount : parseFloat(String(body.amount).replace(',', '.'))
    const driverId = body.driverId ? Number(body.driverId) : undefined
    const carId = body.carId ? Number(body.carId) : undefined

    if (!body.category || isNaN(amount)) {
      return NextResponse.json({ error: 'category and amount are required' }, { status: 400 })
    }

    const created = await prisma.expense.create({
      data: {
        date,
        category: String(body.category),
        amount,
        description: body.description ? String(body.description) : null,
        driverId,
        carId,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message || 'Failed to create expense' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const res = await prisma.expense.deleteMany()
    return NextResponse.json({ deleted: res.count })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete expenses' }, { status: 500 })
  }
}
