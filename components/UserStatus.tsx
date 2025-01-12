import React, { useState, useEffect, useRef } from 'react'
import { User, ChevronDown, Settings } from 'lucide-react'
import { supabase, updateUserStatus } from '../lib/supabase'
import ErrorBoundary from './ErrorBoundary'

type Status = 'online' | 'offline' | 'away'

interface UserStatusProps {
  currentUser: {
    id: string;
    email: string;
    username?: string;
    avatar_url?: string;
  }
}

export default function UserStatus({ currentUser }: UserStatusProps) {
  const [status, setStatus] = useState<Status>('online')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const displayName = currentUser.username || currentUser.email.split('@')[0]

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
      if (status === 'offline') {
        setStatus('online')
        updateStatus('online')
      }
    }

    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 10000 && status === 'online') {
        setStatus('offline')
        updateStatus('offline')
      }
    }, 1000)

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      clearInterval(checkInactivity)
    }
  }, [status])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const updateStatus = async (newStatus: Status) => {
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', currentUser.id)

    if (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleStatusChange = async (newStatus: Status) => {
    setStatus(newStatus)
    const success = await updateUserStatus(newStatus)
    if (success) {
      console.log('Status updated successfully')
      await updateStatus(newStatus) // Update local database
    } else {
      console.error('Failed to update status')
    }
    setIsDropdownOpen(false)
  }

  return (
    <ErrorBoundary fallback={
      <div className="p-4">
        <p className="text-red-600">User status is currently unavailable.</p>
      </div>
    }>
      <div className="relative" ref={dropdownRef}>
        <ErrorBoundary fallback={
          <div className="p-2">
            <p className="text-yellow-600">User profile display is unavailable.</p>
          </div>
        }>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className={`w-3 h-3 rounded-full ${
              status === 'online' ? 'bg-green-500' :
              status === 'offline' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className="font-medium text-white">{displayName} (me)</span>
            <ChevronDown size={16} className="text-white" />
          </button>
        </ErrorBoundary>

        {isDropdownOpen && (
          <ErrorBoundary fallback={
            <div className="p-2">
              <p className="text-yellow-600">User status dropdown is unavailable.</p>
            </div>
          }>
            <div className="absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <button
                  onClick={() => handleStatusChange('online')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  role="menuitem"
                >
                  Online
                </button>
                <button
                  onClick={() => handleStatusChange('offline')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  role="menuitem"
                >
                  Offline
                </button>
                <button
                  onClick={() => handleStatusChange('away')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  role="menuitem"
                >
                  Away
                </button>
              </div>
            </div>
          </ErrorBoundary>
        )}
      </div>

      <ErrorBoundary fallback={
        <div className="p-2">
          <p className="text-yellow-600">Settings button is unavailable.</p>
        </div>
      }>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </ErrorBoundary>
    </ErrorBoundary>
  )
}
