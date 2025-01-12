import { FC, useState, useEffect } from 'react'
import { User, Hash, Share2, ChevronDown, ChevronRight } from 'lucide-react'
import ChannelList from './ChannelList'
import UserStatus from './UserStatus'
import { getChannels } from '../lib/supabase'
import '../styles/sidebar.css';
import ErrorBoundary from './ErrorBoundary';

interface Channel {
  id: string;
  name: string;
}

interface SidebarProps {
  activeWorkspace: string
  setActiveWorkspace: (workspaceId: string) => void
  activeChannel: string
  setActiveChannel: (channel: string) => void
  currentUser: {
    id: string
    email: string
    username?: string
  }
  workspaces: Array<{
    id: string
    name: string
    role: string
  }>
}

export default function Sidebar({
  activeWorkspace,
  setActiveWorkspace,
  activeChannel,
  setActiveChannel,
  currentUser,
  workspaces
}: SidebarProps) {
  const [showShareLink, setShowShareLink] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [showWorkspaces, setShowWorkspaces] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    fetchChannels()
  }, [activeWorkspace, currentUser?.id])

  const fetchChannels = async () => {
    if (activeWorkspace && currentUser?.id) {
      const fetchedChannels = await getChannels(activeWorkspace, currentUser.id)
      setChannels(fetchedChannels)
      if (fetchedChannels.length > 0 && !activeChannel) {
        setActiveChannel(fetchedChannels[0].id)
      }
    }
  }

  const handleShareWorkspace = async () => {
    const link = `${window.location.origin}/auth?workspaceId=${activeWorkspace}`
    setShareLink(link)
    setShowShareLink(true)
    try {
      await navigator.clipboard.writeText(link)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace)

  return (
    <ErrorBoundary fallback={
      <div className="w-64 bg-gray-100 p-4">
        <p className="text-red-600">Navigation sidebar is currently unavailable.</p>
      </div>
    }>
      <div className="w-64 h-full bg-gray-100 flex flex-col">
        <ErrorBoundary fallback={
          <div className="p-4">
            <p className="text-yellow-600">Workspace header is unavailable.</p>
          </div>
        }>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">{currentWorkspace?.name || 'Workspace'}</h2>
          </div>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="p-4">
            <p className="text-yellow-600">Channel list is unavailable.</p>
          </div>
        }>
          <div className="flex-1 overflow-y-auto">
            <ChannelList
              channels={channels}
              activeChannel={activeChannel}
              onChannelSelect={setActiveChannel}
              workspaceId={activeWorkspace}
              currentUser={currentUser}
            />
          </div>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="p-4">
            <p className="text-yellow-600">User section is unavailable.</p>
          </div>
        }>
          <div className="p-4 border-t">
            <UserStatus currentUser={currentUser} />
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  )
}
