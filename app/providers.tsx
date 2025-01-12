'use client'

import { createContext, useState, useContext, ReactNode, useEffect } from 'react'
import SupabaseProvider from '@/lib/supabase-provider'
import ErrorBoundary from '@/components/ErrorBoundary'

interface User {
  id: string
  name: string
  email: string
  status: 'online' | 'away' | 'offline'
}

interface ChatContext {
  currentUser: User
  setCurrentUser: (user: User) => void
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ChatContext = createContext<ChatContext | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>({
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    status: 'online'
  })
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }

  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <ChatContext.Provider value={{ currentUser, setCurrentUser, isDarkMode, toggleDarkMode }}>
          {children}
        </ChatContext.Provider>
      </SupabaseProvider>
    </ErrorBoundary>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
