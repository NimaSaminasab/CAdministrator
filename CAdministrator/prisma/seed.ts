import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with 9 drivers...')

  // Clear existing data
  await prisma.skift.deleteMany()
  await prisma.car.deleteMany()
  await prisma.driver.deleteMany()

  // Create 9 sample drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        driverNumber: 'DRV001',
        personNumber: '12345678901',
        name: 'John',
        lastName: 'Doe',
        address: '123 Main Street',
        town: 'Oslo',
        postalCode: '0123',
        telephone: '+47 12345678',
        email: 'john.doe@example.com'
      }
    }),
    prisma.driver.create({
      data: {
        driverNumber: 'DRV002',
        personNumber: '12345678902',
        name: 'Jane',
        lastName: 'Smith',
        address: '456 Oak Avenue',
        town: 'Bergen',
        postalCode: '5000',
        telephone: '+47 87654321',
        email: 'jane.smith@example.com'
      }
    }),
    prisma.driver.create({
      data: {
        driverNumber: 'DRV003',
        personNumber: '12345678903',
        name: 'Erik',
        lastName: 'Hansen',
        address: '789 Pine Road',
        town: 'Trondheim',
        postalCode: '7000',
        telephone: '+47 11223344',
        email: 'erik.hansen@example.com'
      }
    }),
    prisma.driver.create({
      data: {
        driverNumber: 'DRV004',
        personNumber: '12345678904',
        name: 'Anna',
        lastName: 'Larsen',
        address: '321 Elm Street',
        town: 'Stavanger',
        postalCode: '4000',
        telephone: '+47 55667788',
        email: 'anna.larsen@example.com'
      }
    }),
    prisma.driver.create({
      data: {
        driverNumber: 'DRV005',
        personNumber: '12345678905',
        name: 'Lars',
        lastName: 'Andersen',
        address: '654 Birch Lane',
        town: 'Kristiansand',
        postalCode: '4600',
        telephone: '+47 99887766',
        email: 'lars.andersen@example.com'
      }
    }),
    prisma.driver.create({
      data: {
        driverNumber: 'DRV006',
        personNumber: '12345678906',
        name: 'Maria',
        lastName: 'Olsen',
        address: '987 Cedar Court',
        town: 'Tromsø',
        postalCode: '9000',
        telephone: '+47 44332211',
        email: 'maria.olsen@example.com'
      }
    }),
    prisma.driver.create({
      data: {
        driverNumber: 'DRV007',
        personNumber: '12345678907',
        name: 'Ole',
        lastName: 'Pedersen',
        address: '147 Maple Drive',
        town: 'Ålesund',
        postalCode: '6000',
        telephone: '+47 77889900',
        email: 'ole.pedersen@example.com'
      }
    }),
    prisma.driver.create({
      data: {
        driverNumber: 'DRV008',
        personNumber: '12345678908',
        name: 'Ingrid',
        lastName: 'Nilsen',
        address: '258 Spruce Way',
        town: 'Fredrikstad',
        postalCode: '1600',
        telephone: '+47 22334455',
        email: 'ingrid.nilsen@example.com'
      }
    }),
    prisma.driver.create({
      data: {
        driverNumber: 'DRV009',
        personNumber: '12345678909',
        name: 'Bjørn',
        lastName: 'Johansen',
        address: '369 Willow Street',
        town: 'Drammen',
        postalCode: '3000',
        telephone: '+47 66778899',
        email: 'bjorn.johansen@example.com'
      }
    })
  ])

  // Create sample cars with updated schema
  const cars = await Promise.all([
    prisma.car.create({
      data: {
        licenseNumber: 'TAXI001',
        carBrand: 'Toyota',
        modelYear: 2020
      }
    }),
    prisma.car.create({
      data: {
        licenseNumber: 'TAXI002',
        carBrand: 'Ford',
        modelYear: 2019
      }
    }),
    prisma.car.create({
      data: {
        licenseNumber: 'TAXI003',
        carBrand: 'BMW',
        modelYear: 2021
      }
    }),
    prisma.car.create({
      data: {
        licenseNumber: 'TAXI004',
        carBrand: 'Mercedes',
        modelYear: 2020
      }
    }),
    prisma.car.create({
      data: {
        licenseNumber: 'TAXI005',
        carBrand: 'Volkswagen',
        modelYear: 2018
      }
    })
  ])

  console.log(`✅ Created ${drivers.length} drivers and ${cars.length} cars successfully!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

