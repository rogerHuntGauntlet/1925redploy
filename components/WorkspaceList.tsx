import React, { useState } from 'react'
import { PlusCircle, Folder, Star, Search, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ErrorBoundary from './ErrorBoundary'

interface Workspace {
  id: string
  name: string
  isFavorite: boolean
}

interface WorkspaceListProps {
  workspaces: Workspace[]
  onSelectWorkspace: (workspaceId: string) => void
  onCreateWorkspace: (e: React.FormEvent) => void
  newWorkspaceName: string
  setNewWorkspaceName: (name: string) => void
  onToggleFavorite: (workspaceId: string) => void
}

const WorkspaceCard: React.FC<{
  workspace: Workspace
  onSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  index: number
}> = ({ workspace, onSelect, onToggleFavorite, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={() => onSelect(workspace.id)}
    className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg dark:hover:shadow-2xl-dark transition-all duration-200 cursor-pointer overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="relative z-10 flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg">
          <Folder className="h-5 w-5 text-indigo-500" />
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
          {workspace.name}
        </h3>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(workspace.id)
        }}
        className="relative z-10 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        <Star
          className={`h-5 w-5 transition-colors ${
            workspace.isFavorite
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-400'
          }`}
        />
      </motion.button>
    </div>
  </motion.div>
)

const WorkspaceList: React.FC<WorkspaceListProps> = ({
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace,
  newWorkspaceName,
  setNewWorkspaceName,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(workspaces.length === 0)
  const [isLoading, setIsLoading] = useState(false)

  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const favoriteWorkspaces = workspaces.filter((workspace) => workspace.isFavorite)

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onCreateWorkspace(e)
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating workspace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ErrorBoundary fallback={
      <div className="p-4">
        <p className="text-red-600">Unable to load workspaces. Please refresh the page.</p>
      </div>
    }>
      <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
        <div className="h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="flex-shrink-0 p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {workspaces.length === 0 ? 'Create Your First Workspace' : 'Your Workspaces'}
            </motion.h1>
            {workspaces.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search workspaces..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:text-white transition-all duration-200"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  New Workspace
                </motion.button>
              </div>
            )}
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-gradient-to-r from-indigo-500/10 to-pink-500/10 p-8 rounded-2xl mb-6">
                  <Folder className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome to ChatGenius!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Get started by creating your first workspace. A workspace is where you and your team can collaborate, chat, and work together.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
                  >
                    <Plus size={20} />
                    Create Your First Workspace
                  </motion.button>
                </div>
              </div>
            ) : (
              <>
                {/* Favorites Section */}
                <AnimatePresence>
                  {favoriteWorkspaces.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-8"
                    >
                      <h2 className="text-base font-medium mb-3 text-gray-900 dark:text-white flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-800 py-2">
                        <Star className="fill-yellow-400 text-yellow-400" size={18} />
                        <span>Favorites</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteWorkspaces.map((workspace, index) => (
                          <WorkspaceCard
                            key={workspace.id}
                            workspace={workspace}
                            onSelect={onSelectWorkspace}
                            onToggleFavorite={onToggleFavorite}
                            index={index}
                          />
                        ))}
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* All Workspaces */}
                <section>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorkspaces.map((workspace, index) => (
                      <WorkspaceCard
                        key={workspace.id}
                        workspace={workspace}
                        onSelect={onSelectWorkspace}
                        onToggleFavorite={onToggleFavorite}
                        index={index}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Create Workspace Modal */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => !isLoading && workspaces.length > 0 && setIsCreating(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md"
                >
                  <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                    {workspaces.length === 0 ? 'Create Your First Workspace' : 'Create New Workspace'}
                  </h3>
                  <form onSubmit={handleCreateSubmit} className="space-y-5">
                    <div className="space-y-1">
                      <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Workspace Name
                      </label>
                      <input
                        id="workspace-name"
                        type="text"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        placeholder="Enter workspace name"
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      {workspaces.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsCreating(false)}
                          disabled={isLoading}
                          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      )}
                      <motion.button
                        whileHover={{ scale: isLoading ? 1 : 1.01 }}
                        whileTap={{ scale: isLoading ? 1 : 0.99 }}
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          </div>
                        ) : (
                          'Create'
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default WorkspaceList
