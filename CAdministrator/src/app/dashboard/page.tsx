'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DriverDashboard from '@/components/DriverDashboard'
import Dashboard from '@/components/Dashboard'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Taxi Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Top menu buttons */}
              <div className="hidden md:flex items-center gap-2 mr-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=drivers')}>Sjåfører</Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=cars')}>Biler</Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=skifts')}>Skift</Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard?tab=utgifter')}>Utgifter</Button>
              </div>
              <div className="text-sm text-gray-600">
                Logget inn som: <span className="font-medium">{user.username}</span>
                {user.role === 'driver' && user.driver && (
                  <span className="ml-2">({user.driver.name} {user.driver.lastName})</span>
                )}
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logg ut
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {user.role === 'admin' ? (
          <Dashboard />
        ) : (
          <DriverDashboard />
        )}
      </div>
    </div>
  )
}
