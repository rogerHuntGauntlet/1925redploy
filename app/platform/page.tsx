'use client'

import { useState, useEffect, Suspense } from 'react'
import {
  supabase,
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  getUserByEmail,
  createUserProfile,
  getChannels,
  getUserCount,
  testSupabaseConnection,
  testDatabaseTables,
  updateUserProfileId,
  addUserToUniversalWorkspace
} from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'
import ChatArea from '../../components/ChatArea'
import Header from '../../components/Header'
import WorkspaceList from '../../components/WorkspaceList'
import ProfileModal from '../../components/ProfileModal'
import { useRouter, useSearchParams } from 'next/navigation'
import CollapsibleDMList from '../../components/CollapsibleDMList'
import DirectMessageArea from '../../components/DirectMessageArea'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Workspace } from '@/types/supabase'
import ActivityFeed from '../../components/ActivityFeed'
import logger from '@/lib/logger'
import LogDisplay from '../../components/LogDisplay'
import config from '@/lib/config'

interface WorkspaceListProps {
  workspaces: Workspace[];
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: (e: React.FormEvent) => Promise<void>;
  newWorkspaceName: string;
  setNewWorkspaceName: (name: string) => void;
  onToggleFavorite: (workspaceId: string) => void;
}

export default function Platform() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`])
  }

  useEffect(() => {
    // Set up logger only once when component mounts
    const originalLog = logger.log;
    logger.log = addLog;

    // Initial logs
    addLog('Platform mounting');
    addLog(`Environment: ${config.app.isDev ? 'development' : 'production'}`);

    // Cleanup
    return () => {
      logger.log = originalLog; // Reset logger on unmount
    }
  }, []); // Empty dependency array means this only runs once on mount

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>}>
      <PlatformWithParams addLog={addLog} />
    </Suspense>
  )
}

function PlatformWithParams({ addLog }: { addLog: (message: string) => void }) {
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspaceId')
  return <PlatformContent addLog={addLog} initialWorkspaceId={workspaceId} />
}

function PlatformContent({ addLog, initialWorkspaceId }: { addLog: (message: string) => void, initialWorkspaceId: string | null }) {
  const [user, setUser] = useState<{ id: string; email: string; username?: string } | null>(null)
  const [activeWorkspace, setActiveWorkspace] = useState('')
  const [activeChannel, setActiveChannel] = useState('')
  const [activeDM, setActiveDM] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; role: string }[]>([])
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [joiningWorkspaceName, setJoiningWorkspaceName] = useState<string | null>(null)
  const [showWorkspaceSelection, setShowWorkspaceSelection] = useState(false)
  const [userWorkspaceIds, setUserWorkspaceIds] = useState<string[]>([])
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const MAX_USERS = 40
  const router = useRouter()
  const [isDMListCollapsed, setIsDMListCollapsed] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata.username
          })
          logger.log("Session found:", session)
          const userData = await getUserByEmail(session.user.email)
          if (userData) {
            setUser(userData)
            await fetchUserData(userData.id, userData.email)
          } else {
            throw new Error('User data not found')
          }
        } else {
          const storedEmail = sessionStorage.getItem('userEmail')
          if (storedEmail) {
            const userData = await getUserByEmail(storedEmail)
            if (userData) {
              setUser(userData)
              await fetchUserData(userData.id, userData.email)
            } else {
              throw new Error('User data not found')
            }
          } else {
            throw new Error('No user session or stored email')
          }
        }
      } catch (error) {
        logger.error('Error checking user:', error)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const fetchUserData = async (userId: string, email: string) => {
    try {
      const [userWorkspaces, userProfile] = await Promise.all([
        getWorkspaces(userId),
        getUserByEmail(email)
      ])
      logger.log("User data fetched:", { userWorkspaces, userProfile, userId })

      if (userProfile) {
        setUser(prevUser => ({
          ...prevUser,
          ...userProfile,
        }))
      }

      setWorkspaces(userWorkspaces)
      setUserWorkspaceIds(userWorkspaces.map((workspace: { id: string }) => workspace.id))
      
      if (userWorkspaces.length > 0) {
        setShowWorkspaceSelection(true)
      } else {
        setShowWorkspaceSelection(true)
      }
    } catch (error) {
      logger.error('Error fetching user data:', error)
      setError('Failed to fetch user data. Please try logging in again.')
    }
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const fetchWorkspaces = async () => {
    try {
      const userWorkspaces = await getWorkspaces()
      setWorkspaces(userWorkspaces)
      return userWorkspaces
    } catch (error) {
      logger.error('Error fetching workspaces:', error)
      return []
    }
  }

  const fetchChannels = async (workspaceId: string) => {
    if (!workspaceId) {
      logger.log('No workspace ID provided to fetchChannels')
      return
    }

    if (!user?.id) {
      logger.log('No user ID available, deferring channel fetch')
      return
    }

    try {
      logger.log(`Fetching channels for workspace ${workspaceId} and user ${user.id}`)
      const channels = await getChannels(workspaceId, user.id)

      if (channels.length > 0) {
        logger.log(`Setting active channel to ${channels[0].id}`)
        setActiveChannel(channels[0].id)
      } else {
        logger.log('No channels found for workspace')
        setActiveChannel('')
      }
    } catch (error) {
      logger.error('Error fetching channels:', error)
      setError('Failed to fetch channels. Please try again.')
    }
  }

  const fetchUserCount = async () => {
    try {
      const count = await getUserCount()
      setUserCount(count)
    } catch (error) {
      logger.error('Error fetching user count:', error)
      setError('Failed to fetch user count. Please try again.')
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (userCount >= MAX_USERS) {
        setError("We've reached our user limit. Please check back later.")
        return
      }

      // Get session first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      let userData = await getUserByEmail(email)
      const isNewUser = !userData

      if (isNewUser) {
        if (userCount >= MAX_USERS) {
          setError("We've reached our user limit. Please check back later.")
          return
        }
        userData = await createUserProfile({
          id: session.user.id,
          email: session.user.email
        })
        if (!userData) {
          throw new Error('Failed to create user profile')
        }
        setUserCount(prevCount => prevCount + 1)
      }

      if (userData) {
        // Set user data
        setUser({ id: userData.id, email: userData.email, username: userData.username })

        // Clear workspace state and show selection
        setActiveWorkspace('')
        setActiveChannel('')
        setShowWorkspaceSelection(true)

        // Fetch workspaces
        const workspaces = await getWorkspaces(userData.id)
        setWorkspaces(workspaces)
      } else {
        throw new Error('Failed to get or create user')
      }
    } catch (error: any) {
      logger.error('Error during email submission:', error)
      setError(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  const handleError = (error: any, defaultMessage: string) => {
    logger.error(defaultMessage, error)
    setError(error.message || defaultMessage)
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName || !user) {
      setError('Please enter a workspace name')
      return
    }

    try {
      addLog('Creating workspace...')

      // First ensure user profile exists
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      // Check if user profile exists
      let userData = await getUserByEmail(session.user.email!)
      if (!userData) {
        addLog('User profile not found, creating...')
        userData = await createUserProfile({
          id: session.user.id,
          email: session.user.email
        })
        if (!userData) {
          throw new Error('Failed to create user profile')
        }
      }

      // Now create the workspace
      const result = await createWorkspace(newWorkspaceName, userData.id)
      if (!result?.workspace) {
        logger.error('Failed to create workspace: No workspace data returned')
        setError('Failed to create workspace')
        return
      }

      addLog('Workspace created successfully')
      setWorkspaces(prevWorkspaces => [...prevWorkspaces, {
        id: result.workspace.id,
        name: result.workspace.name,
        role: 'admin'
      }])
      setNewWorkspaceName('')

      // Don't automatically enter the workspace, let user choose
      addLog('Workspace created, staying on selection screen')
    } catch (error: any) {
      logger.error('Error creating workspace:', error)
      setError(error.message || 'Failed to create workspace. Please try again.')
    }
  }

  const handleJoinWorkspace = async (workspaceId: string) => {
    if (!user) {
      setError('User not found')
      return
    }

    try {
      addLog(`Joining workspace ${workspaceId}...`)
      await joinWorkspace(workspaceId, user.id)

      // Fetch updated workspaces list
      const updatedWorkspaces = await getWorkspaces(user.id)
      setWorkspaces(updatedWorkspaces)
      setUserWorkspaceIds(updatedWorkspaces.map((workspace: { id: string }) => workspace.id))

      // Clear the joining state
      setJoiningWorkspaceName(null)

      addLog(`Successfully joined workspace ${workspaceId}`)
      return updatedWorkspaces
    } catch (error) {
      logger.error('Error joining workspace:', error)
      setError('Failed to join workspace. Please try again.')
      throw error
    }
  }

  const handleWorkspaceSelect = async (workspaceId: string) => {
    if (!workspaceId) {
      logger.error('No workspace ID provided to handleWorkspaceSelect')
      return
    }

    if (!user?.id) {
      logger.error('No user ID available for workspace selection')
      return
    }

    try {
      logger.log(`Selecting workspace ${workspaceId}`)
      setActiveWorkspace(workspaceId)

      // Clear current channel
      setActiveChannel('')

      // Fetch channels
      await fetchChannels(workspaceId)

      // Hide workspace selection
      setShowWorkspaceSelection(false)

      logger.log('Workspace selection complete')
    } catch (error) {
      logger.error('Error selecting workspace:', error)
      setError('Failed to select workspace. Please try again.')
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleSelectDM = (userId: string) => {
    setActiveDM(userId)
  }

  const handleSwitchChannel = (channelId: string) => {
    setActiveChannel(channelId);
    setActiveDM(null);
  };

  const fetchWorkspaceName = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single()

      if (error) throw error
      return data.name
    } catch (error) {
      logger.error('Error fetching workspace name:', error)
      return null
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      sessionStorage.removeItem('userEmail')
      setUser(null)
      setActiveWorkspace('')
      setActiveChannel('')
      setActiveDM(null)
      setWorkspaces([])
      setNewWorkspaceName('')
      setError(null)
      setShowProfileModal(false)
      setJoiningWorkspaceName(null)
      setShowWorkspaceSelection(false)
      setUserWorkspaceIds([])
      logger.log('User logged out successfully')
      router.push('/auth')
    } catch (error) {
      logger.error('Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    }
  }

  const handleReturnToWorkspaceSelection = () => {
    setActiveWorkspace('')
    setActiveChannel('')
    setActiveDM(null)
    setShowWorkspaceSelection(true)
  }

  const handleSearch = async (query: string) => {
    if (!query.trim() || !activeWorkspace) return;

    try {
      logger.log(`Searching for: "${query}" in workspace ${activeWorkspace}`)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          channel_id,
          user_id,
          channels!inner (
            id,
            name,
            workspace_id
          ),
          user_profiles!messages_user_id_fkey (
            username,
            email
          )
        `)
        .eq('channels.workspace_id', activeWorkspace)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        logger.error('Search error:', error)
        throw error;
      }

      logger.log(`Found ${data?.length || 0} results`)
      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (error) {
      logger.error('Error searching messages:', error);
      setError('Failed to search messages');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-300 to-blue-300 dark:from-pink-900 dark:to-blue-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Welcome to ChatGenius</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            Current users: {userCount} / {MAX_USERS}
          </p>
          {joiningWorkspaceName && (
            <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200">
                You're joining the workspace: <strong>{joiningWorkspaceName}</strong>
              </p>
            </div>
          )}
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
              disabled={userCount >= MAX_USERS}
            >
              {joiningWorkspaceName ? 'Join Workspace' : 'Continue'}
            </button>
          </form>
          {userCount >= MAX_USERS && (
            <p className="mt-4 text-center text-red-500">
              We've reached our user limit. Please check back later.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (showWorkspaceSelection) {
    return (
      <WorkspaceList
        workspaces={workspaces as Workspace[]}
        onSelectWorkspace={handleWorkspaceSelect}
        onCreateWorkspace={handleCreateWorkspace}
        newWorkspaceName={newWorkspaceName}
        setNewWorkspaceName={setNewWorkspaceName}
        onToggleFavorite={(workspaceId) => {
          // Add your favorite toggle logic here
          logger.log('Toggle favorite for workspace:', workspaceId)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="flex h-[calc(100vh-2rem)] flex-col overflow-hidden bg-gray-50 dark:bg-gray-800/95 rounded-2xl shadow-2xl">
        <style jsx global>{`
          /* Modern scrollbar styling */
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.15) transparent;
          }

          *::-webkit-scrollbar {
            width: 4px;
          }

          *::-webkit-scrollbar-track {
            background: transparent;
          }

          *::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.15);
            border-radius: 100vh;
          }

          *::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.25);
          }

          /* Hide scrollbar buttons */
          *::-webkit-scrollbar-button {
            display: none;
          }

          /* Dark mode adjustments */
          .dark *::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.08);
          }

          .dark *::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.15);
          }

          /* Hide scrollbar when not hovering */
          .hover-scroll {
            scrollbar-width: none;
          }

          .hover-scroll::-webkit-scrollbar {
            display: none;
          }

          .hover-scroll:hover {
            scrollbar-width: thin;
          }

          .hover-scroll:hover::-webkit-scrollbar {
            display: block;
          }
        `}</style>

        <Header
          currentUser={user}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onCreateWorkspace={() => setActiveWorkspace('')}
          onOpenProfile={() => setShowProfileModal(true)}
          onLogout={handleLogout}
          onReturnToWorkspaceSelection={handleReturnToWorkspaceSelection}
          activeWorkspaceId={activeWorkspace}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <div className="flex flex-1 overflow-hidden">
          <div className="flex shrink-0">
            <CollapsibleDMList
              workspaceId={activeWorkspace}
              onSelectDMAction={handleSelectDM}
              activeUserId={activeDM}
              currentUserId={user.id}
              isCollapsed={isDMListCollapsed}
              onCollapsedChange={setIsDMListCollapsed}
            />
            {activeDM && (
              <div className="w-[25vw] shrink-0">
                <DirectMessageArea
                  currentUser={user}
                  otherUserId={activeDM}
                  isDMListCollapsed={isDMListCollapsed}
                  onCloseAction={() => setActiveDM(null)}
                />
              </div>
            )}
          </div>
          <Sidebar
            activeWorkspace={activeWorkspace}
            setActiveWorkspace={setActiveWorkspace}
            activeChannel={activeChannel}
            setActiveChannel={(channel) => {
              setActiveChannel(channel)
            }}
            currentUser={user}
            workspaces={workspaces}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeWorkspace && activeChannel && user && (
              <div className="flex flex-1 h-full">
                <div className="flex-1 min-w-0 h-full">
                  <ChatArea
                    activeWorkspace={activeWorkspace}
                    activeChannel={activeChannel}
                    currentUser={user}
                    onSwitchChannelAction={handleSwitchChannel}
                    userWorkspaces={userWorkspaceIds}
                  />
                </div>
                <ActivityFeed className="transition-[width] duration-200" />
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                <ProfileModal
                  currentUser={user}
                  onClose={() => setShowProfileModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}