
"use client"

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

// Simple hamburger icon
function Hamburger({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <button
      className="sm:hidden flex items-center px-2 py-2 text-gray-700 focus:outline-none"
      aria-label="Open menu"
      onClick={() => setOpen(!open)}
      data-testid="hamburger-btn"
    >
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        {open ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
        )}
      </svg>
    </button>
  )
}

export default function AuthHeader() {
  // Debug: log session user role and isAdmin when rendering mobile menu

  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false) // For user dropdown
  const [menuOpen, setMenuOpen] = useState(false) // For mobile hamburger
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const isAdmin = (session?.user as any)?.role === 'ADMIN';


  // Debug: log session user role and isAdmin when rendering mobile menu
  useEffect(() => {
    if (typeof window !== 'undefined' && menuOpen) {
      // eslint-disable-next-line no-console
      console.log('AuthHeader debug:', {
        role: (session?.user as any)?.role,
        isAdmin,
        sessionUser: session?.user
      });
    }
  }, [menuOpen, session, isAdmin]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (open || menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, menuOpen])
  if (status === 'loading') {
    return <div className="flex items-center justify-end space-x-4 w-full px-2 py-2" />;
  }
  return (
    <div className="flex items-center justify-end w-full px-2 py-2 print:hidden">
      {/* Hamburger for mobile */}
      <div className="flex sm:hidden" ref={menuRef}>
        <Hamburger open={menuOpen} setOpen={setMenuOpen} />
        {menuOpen && (
          <div className="absolute top-14 right-2 w-56 bg-white border border-gray-200 rounded shadow-lg z-50 animate-fade-in">
            <div className="flex flex-col py-2">
              <Link href="/" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Home</Link>
              {status === 'authenticated' && (
                <>
                  {isAdmin ? (
                    <Link href="/properties" data-testid="mobile-all-properties" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>All Properties</Link>
                  ) : (
                    <Link href="/properties" data-testid="mobile-my-properties" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>My Properties</Link>
                  )}
                  <span className="px-4 py-2 text-xs text-gray-500 truncate">{session?.user?.email ?? ''}</span>
                  <Link href="/account" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Account</Link>
                  {isAdmin && (
                    <Link href="/admin" data-testid="mobile-admin-link" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Admin</Link>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                    className="px-4 py-2 text-sm text-gray-700 text-left hover:bg-gray-100"
                  >Logout</button>
                </>
              )}
              {status !== 'authenticated' && (
                <>
                  <Link href="/login" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Login</Link>
                  {status === 'unauthenticated' && <Link href="/register" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Sign Up</Link>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Desktop nav */}
      <div className="hidden sm:flex items-center space-x-4 w-full justify-end">
        {status === 'authenticated' ? (
          <>
            <Link href="/" className="text-sm sm:text-base text-indigo-700">Home</Link>
            {isAdmin ? (
              <Link href="/properties" className="text-sm sm:text-base text-indigo-700">All Properties</Link>
            ) : (
              <Link href="/properties" className="text-sm sm:text-base text-indigo-700">My Properties</Link>
            )}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 text-sm sm:text-base text-gray-700 bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 focus:outline-none"
                onClick={() => setOpen((v) => !v)}
              >
                <span className="truncate max-w-[120px] sm:max-w-none">{session?.user?.email ?? ''}</span>
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
                  <div className="flex flex-col py-2">
                    <Link href="/account" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Account</Link>
                    {session?.user && (session.user as any)?.role === 'ADMIN' && (
                      <Link href="/admin" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin</Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="px-4 py-2 text-sm text-gray-700 text-left hover:bg-gray-100"
                    >Logout</button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/" className="text-sm sm:text-base text-indigo-700">Home</Link>
            <Link href="/login" className="text-sm sm:text-base text-indigo-700">Login</Link>
            {/* Only show Register if unauthenticated */}
            {status === 'unauthenticated' && <Link href="/register" className="text-sm sm:text-base text-indigo-700">Sign Up</Link>}
          </>
        )}
      </div>
    </div>
  )
}
