'use client'

// app/(root)/layout.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
// Import your auth config/options as needed
// import { authOptions } from '@/lib/auth'
import AuthenticatedLayoutContent from './AuthenticatedLayoutContent'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
}