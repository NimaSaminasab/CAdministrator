// Norwegian field name mapping utilities

export const driverFieldMapping = {
  // Norwegian -> English
  sjåforNummer: 'driverNumber',
  personNummer: 'personNumber',
  fornavn: 'name',
  etternavn: 'lastName',
  adresse: 'address',
  by: 'town',
  postnummer: 'postalCode',
  telefon: 'telephone',
  epost: 'email',
  lonnprosent: 'salaryPercentage',
  ikkeVisMegForAndre: 'hideFromOthers',
  opprettet: 'createdAt',
  oppdatert: 'updatedAt'
} as const

export const carFieldMapping = {
  // Norwegian -> English
  skiltNummer: 'licenseNumber',
  bilmerke: 'carBrand',
  arsmodell: 'modelYear',
  opprettet: 'createdAt',
  oppdatert: 'updatedAt'
} as const

export const skiftFieldMapping = {
  // Norwegian -> English
  skiftNummer: 'skiftNumber',
  kmMellomSkift: 'kmBetweenSkift',
  startDato: 'startDate',
  sluttDato: 'stopDate',
  startTid: 'startTime',
  sluttTid: 'stopTime',
  lonnBasis: 'salaryBasis',
  startKm: 'startKm',
  sluttKm: 'stopKm',
  totalKm: 'totalKm',
  antTurer: 'antTurer', // Already Norwegian
  kmOpptatt: 'kmOpptatt', // Already Norwegian
  tipsKontant: 'tipsKontant', // Already Norwegian
  tipsKreditt: 'tipsKreditt', // Already Norwegian
  netto: 'netto', // Already Norwegian
  loyve: 'loyve', // Already Norwegian
  opprettet: 'createdAt',
  oppdatert: 'updatedAt',
  sjåforId: 'driverId',
  bilId: 'carId'
} as const

// Reverse mappings (English -> Norwegian)
export const reverseDriverMapping = Object.fromEntries(
  Object.entries(driverFieldMapping).map(([norwegian, english]) => [english, norwegian])
) as Record<string, string>

export const reverseCarMapping = Object.fromEntries(
  Object.entries(carFieldMapping).map(([norwegian, english]) => [english, norwegian])
) as Record<string, string>

export const reverseSkiftMapping = Object.fromEntries(
  Object.entries(skiftFieldMapping).map(([norwegian, english]) => [english, norwegian])
) as Record<string, string>

// Utility functions
export function mapDriverToNorwegian(driver: any): any {
  const mapped: any = {}
  if (driver.id !== undefined) mapped.id = driver.id
  for (const [norwegian, english] of Object.entries(driverFieldMapping)) {
    if (driver[english] !== undefined) {
      mapped[norwegian] = driver[english]
    }
  }
  return mapped
}

export function mapDriverFromNorwegian(driver: any): any {
  const mapped: any = {}
  for (const [norwegian, english] of Object.entries(driverFieldMapping)) {
    if (driver[norwegian] !== undefined) {
      mapped[english] = driver[norwegian]
    }
  }
  return mapped
}

export function mapCarToNorwegian(car: any): any {
  const mapped: any = {}
  if (car.id !== undefined) mapped.id = car.id
  for (const [norwegian, english] of Object.entries(carFieldMapping)) {
    if (car[english] !== undefined) {
      mapped[norwegian] = car[english]
    }
  }
  return mapped
}

export function mapCarFromNorwegian(car: any): any {
  const mapped: any = {}
  for (const [norwegian, english] of Object.entries(carFieldMapping)) {
    if (car[norwegian] !== undefined) {
      mapped[english] = car[norwegian]
    }
  }
  return mapped
}

export function mapSkiftToNorwegian(skift: any): any {
  const mapped: any = {}
  for (const [norwegian, english] of Object.entries(skiftFieldMapping)) {
    if (skift[english] !== undefined) {
      mapped[norwegian] = skift[english]
    }
  }
  
  // Map nested driver object
  if (skift.driver) {
    mapped.driver = mapDriverToNorwegian(skift.driver)
  }
  
  // Map nested car object
  if (skift.car) {
    mapped.car = mapCarToNorwegian(skift.car)
  }
  
  return mapped
}

export function mapSkiftFromNorwegian(skift: any): any {
  const mapped: any = {}
  for (const [norwegian, english] of Object.entries(skiftFieldMapping)) {
    if (skift[norwegian] !== undefined) {
      mapped[english] = skift[norwegian]
    }
  }
  
  // Map nested driver object (if present)
  if (skift.driver) {
    mapped.driver = mapDriverFromNorwegian(skift.driver)
  }
  
  // Map nested car object (if present)
  if (skift.car) {
    mapped.car = mapCarFromNorwegian(skift.car)
  }
  
  return mapped
}

// Norwegian labels for UI
export const norwegianLabels = {
  drivers: {
    sjåforNummer: 'Sjåfør Nummer',
    personNummer: 'Person Nummer',
    fornavn: 'Fornavn',
    etternavn: 'Etternavn',
    adresse: 'Adresse',
    by: 'By',
    postnummer: 'Postnummer',
    telefon: 'Telefon',
    epost: 'E-post',
    lonnprosent: 'Lønnprosent'
  },
  cars: {
    skiltNummer: 'Skilt Nummer',
    bilmerke: 'Bilmerke',
    arsmodell: 'Årsmodell'
  },
  skifts: {
    skiftNummer: 'Skift Nummer',
    kmMellomSkift: 'KM Mellom Skift',
    startDato: 'Start Dato',
    sluttDato: 'Slutt Dato',
    startTid: 'Start Tid',
    sluttTid: 'Slutt Tid',
    lonnBasis: 'Lønn Basis',
    startKm: 'Start KM',
    sluttKm: 'Slutt KM',
    totalKm: 'Total KM',
    antTurer: 'Antall Turer',
    kmOpptatt: 'KM Opptatt',
    tipsKontant: 'Tips Kontant',
    tipsKreditt: 'Tips Kreditt',
    netto: 'Netto',
    loyve: 'Løyve'
  }
}
