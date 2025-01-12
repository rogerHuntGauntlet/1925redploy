import { User, Moon, Sun, LogOut, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ErrorBoundary from './ErrorBoundary'

export interface HeaderProps {
  currentUser: any
  isDarkMode: boolean
  toggleDarkMode: () => void
  onOpenProfile: () => void
  onLogout: () => void
  onReturnToWorkspaceSelection: () => void
  onCreateWorkspace?: () => void
  onSearch?: (query: string) => void
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  activeWorkspaceId?: string
}

export default function Header({
  currentUser,
  isDarkMode,
  toggleDarkMode,
  onOpenProfile,
  onLogout,
  onReturnToWorkspaceSelection,
  onCreateWorkspace,
  onSearch,
  searchQuery,
  setSearchQuery
}: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    onLogout()
  }

  return (
    <ErrorBoundary fallback={
      <div className="bg-white shadow">
        <div className="h-16 flex items-center justify-center">
          <p className="text-red-600">Navigation is currently unavailable.</p>
        </div>
      </div>
    }>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <ErrorBoundary fallback={
              <div className="flex items-center">
                <span className="text-yellow-600">Navigation menu unavailable</span>
              </div>
            }>
              <div className="flex items-center">
                <button
                  onClick={onReturnToWorkspaceSelection}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                {onSearch && setSearchQuery && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </ErrorBoundary>

            <ErrorBoundary fallback={
              <div className="flex items-center">
                <span className="text-yellow-600">User menu unavailable</span>
              </div>
            }>
              <div className="flex items-center">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button
                  onClick={onOpenProfile}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User className="w-5 h-5" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </header>
    </ErrorBoundary>
  )
}
