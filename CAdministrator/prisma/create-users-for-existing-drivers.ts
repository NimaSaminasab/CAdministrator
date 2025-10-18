import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createUsersForExistingDrivers() {
  try {
    console.log('🔍 Checking for drivers without user accounts...')
    
    // Get all drivers
    const drivers = await prisma.driver.findMany({
      include: {
        user: true
      }
    })
    
    console.log(`📋 Found ${drivers.length} drivers in database`)
    
    const driversWithoutUsers = drivers.filter(driver => !driver.user)
    console.log(`👥 Found ${driversWithoutUsers.length} drivers without user accounts`)
    
    if (driversWithoutUsers.length === 0) {
      console.log('✅ All drivers already have user accounts!')
      return
    }
    
    console.log('\n🔧 Creating user accounts for drivers without accounts...')
    
    for (const driver of driversWithoutUsers) {
      const username = driver.driverNumber
      const password = `${driver.driverNumber}${driver.name}`
      
      try {
        const user = await prisma.user.create({
          data: {
            username,
            password,
            role: 'driver',
            driverId: driver.id
          }
        })
        
        console.log(`✅ Created user for ${driver.name} ${driver.lastName}: ${username} / ${password}`)
      } catch (error) {
        console.log(`❌ Failed to create user for ${driver.name} ${driver.lastName}:`, error)
      }
    }
    
    // Summary
    const allUsers = await prisma.user.findMany({
      include: {
        driver: true
      }
    })
    
    console.log('\n📊 Final User Summary:')
    console.log('👑 Admin Users:')
    allUsers.filter(u => u.role === 'admin').forEach(user => {
      console.log(`  - Username: ${user.username}, Password: ${user.password}`)
    })
    
    console.log('\n👥 Driver Users:')
    allUsers.filter(u => u.role === 'driver').forEach(user => {
      console.log(`  - Username: ${user.username}, Password: ${user.password}, Driver: ${user.driver?.name} ${user.driver?.lastName}`)
    })
    
    console.log(`\n🎉 Total users: ${allUsers.length}`)
    
  } catch (error) {
    console.error('❌ Error creating users for existing drivers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUsersForExistingDrivers()
