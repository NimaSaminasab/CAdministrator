import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)
    
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        driver: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }
    
    // Check password
    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }
    
    // Return user data (without password)
    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      driverId: user.driverId,
      driver: user.driver ? {
        id: user.driver.id,
        name: user.driver.name,
        lastName: user.driver.lastName,
        driverNumber: user.driver.driverNumber,
        hideFromOthers: user.driver.hideFromOthers || false
      } : null
    }
    
    return NextResponse.json(userData)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
