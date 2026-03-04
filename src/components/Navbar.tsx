'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { BookOpen, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateUniversityModal } from '@/components/modals/CreateUniversityModal';

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <BookOpen className="w-6 h-6" />
            StudyHub
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/universities" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Universities
            </Link>
            {session && (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Dashboard
              </Link>
            )}
            {session?.user.role === 'ADMIN' && (
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Admin
              </Link>
            )}
            {session && <CreateUniversityModal />}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {session.user.image ? (
                    <img src={session.user.image} className="w-8 h-8 rounded-full" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {session.user.name?.[0] ?? 'U'}
                    </div>
                  )}
                  <span>{session.user.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      {session.user.email}
                      <span className={cn('ml-2 badge', {
                        'bg-blue-100 text-blue-700': session.user.role === 'CREATOR',
                        'bg-red-100 text-red-700': session.user.role === 'ADMIN',
                        'bg-gray-100 text-gray-700': session.user.role === 'USER',
                      })}>
                        {session.user.role}
                      </span>
                    </div>
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      Dashboard
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm">Sign in</Link>
                <Link href="/login" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3 space-y-2">
          <Link href="/universities" className="block py-2 text-sm text-gray-700" onClick={() => setMobileOpen(false)}>Universities</Link>
          {session && (
            <Link href="/dashboard" className="block py-2 text-sm text-gray-700" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          )}
          {session?.user.role === 'ADMIN' && (
            <Link href="/admin" className="block py-2 text-sm text-gray-700" onClick={() => setMobileOpen(false)}>Admin</Link>
          )}
          {session && (
            <div className="py-1">
              <CreateUniversityModal />
            </div>
          )}
          {session ? (
            <button onClick={() => signOut({ callbackUrl: '/' })} className="block w-full text-left py-2 text-sm text-red-600">
              Sign out
            </button>
          ) : (
            <Link href="/login" className="btn-primary block text-center text-sm" onClick={() => setMobileOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
