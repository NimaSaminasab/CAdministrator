# Taxi Management System

A modern taxi management application built with Next.js, TypeScript, Prisma, and SQLite. This system allows taxi owners to manage their fleet of cars, drivers, and shifts efficiently.

## Features

- **Driver Management**: Add, view, edit, and delete driver information including personal details and contact information
- **Car Management**: Manage taxi fleet with license numbers and registration details
- **Shift Management**: Track driver shifts with detailed metrics including:
  - Start/stop times and dates
  - Distance traveled (start KM, stop KM, total KM)
  - Number of trips
  - Tips (cash and credit)
  - Net income calculations
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and Radix UI components
- **Real-time Dashboard**: Overview of total drivers, cars, shifts, and active shifts

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: SQLite with Prisma ORM
- **Validation**: Zod for data validation
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd taxi-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push the schema to create the database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Driver Entity
- `driverNumber`: Unique driver identifier
- `personNumber`: Personal identification number
- `name`: First name
- `lastName`: Last name
- `address`: Street address
- `town`: City/town
- `postalCode`: Postal code
- `telephone`: Phone number
- `email`: Email address

### Car Entity
- `løyvenummer`: Taxi license number
- `regNumber`: Vehicle registration number

### Skift (Shift) Entity
- `skiftNumber`: Unique shift identifier
- `kmBetweenSkift`: Kilometers between shifts
- `startDate`: Shift start date
- `stopDate`: Shift end date (optional)
- `startTime`: Shift start time
- `stopTime`: Shift end time (optional)
- `lønnsgrunnlag`: Salary base amount
- `startKm`: Starting odometer reading
- `stopKm`: Ending odometer reading
- `totalKm`: Total kilometers driven
- `antTurer`: Number of trips
- `kmOpptatt`: Kilometers with passengers
- `tipsKontant`: Cash tips received
- `tipsKreditt`: Credit card tips received
- `netto`: Net income for the shift

## API Endpoints

### Drivers
- `GET /api/drivers` - Get all drivers
- `POST /api/drivers` - Create a new driver
- `GET /api/drivers/[id]` - Get driver by ID
- `PUT /api/drivers/[id]` - Update driver
- `DELETE /api/drivers/[id]` - Delete driver

### Cars
- `GET /api/cars` - Get all cars
- `POST /api/cars` - Create a new car
- `GET /api/cars/[id]` - Get car by ID
- `PUT /api/cars/[id]` - Update car
- `DELETE /api/cars/[id]` - Delete car

### Shifts
- `GET /api/skifts` - Get all shifts
- `POST /api/skifts` - Create a new shift
- `GET /api/skifts/[id]` - Get shift by ID
- `PUT /api/skifts/[id]` - Update shift
- `DELETE /api/skifts/[id]` - Delete shift

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── DriversTable.tsx  # Drivers management table
│   ├── CarsTable.tsx     # Cars management table
│   ├── SkiftsTable.tsx   # Shifts management table
│   └── Add*Dialog.tsx    # Add/edit dialogs
└── lib/                  # Utility functions
    ├── prisma.ts         # Prisma client
    └── utils.ts          # Helper functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

