import { FC, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, PauseCircle, PlayCircle, ChevronLeft } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'

interface ActivityMessage {
  id: string
  content: string
  timestamp: Date
}

const SAMPLE_MESSAGES = [
  "Team collaboration is increasing in the #general channel",
  "Several important decisions were made in the #project-alpha discussion",
  "The development team has been actively sharing code snippets",
  "Good engagement in the recent technical discussion",
  "Team members are effectively using thread discussions",
  "Knowledge sharing is happening across multiple channels",
  "The team is maintaining a positive and constructive dialogue",
  "Important updates are being well-documented in the channels",
  "Cross-team collaboration is evident in recent discussions",
  "Team members are providing helpful feedback to each other"
]

interface ActivityFeedProps {
  className?: string;
}

export default function ActivityFeed({ className = '' }) {
  const [messages, setMessages] = useState<ActivityMessage[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Generate initial message
    addRandomMessage()

    // Set up interval for new messages if not paused
    const interval = setInterval(() => {
      if (!isPaused) {
        addRandomMessage()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isPaused])

  const addRandomMessage = () => {
    const randomMessage = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)]
    const timestamp = new Date()
    const newMessage: ActivityMessage = {
      id: `${timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      content: randomMessage,
      timestamp
    }
    setMessages(prev => [...prev.slice(-9), newMessage]) // Keep last 10 messages
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  return (
    <ErrorBoundary fallback={
      <div className="p-4">
        <p className="text-red-600">Activity feed is currently unavailable.</p>
      </div>
    }>
      <div className={`h-full flex flex-col border-l border-gray-200 dark:border-gray-700 ${
        isCollapsed ? 'w-[50px]' : 'w-[15vw]'
      } ${className}`}>
        <ErrorBoundary fallback={
          <div className="p-4">
            <p className="text-yellow-600">Activity header is unavailable.</p>
          </div>
        }>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1 transition-colors"
              >
                {isCollapsed ? 
                  <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : 
                  <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                }
              </button>
              {!isCollapsed && <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Feed</h2>}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isPaused ? <PlayCircle size={20} /> : <PauseCircle size={20} />}
              </button>
            )}
          </div>
        </ErrorBoundary>
        {!isCollapsed && (
          <ErrorBoundary fallback={
            <div className="p-4">
              <p className="text-yellow-600">Activity list is unavailable.</p>
            </div>
          }>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className="bg-white dark:bg-gray-700/50 rounded-lg p-3 shadow-sm"
                >
                  <p className="text-gray-700 dark:text-gray-200 text-sm">{message.content}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-sm text-gray-400 text-center p-4">
                  Waiting for activity updates...
                </div>
              )}
            </div>
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  )
} 