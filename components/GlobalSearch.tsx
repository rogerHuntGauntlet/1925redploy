'use client'

import React, { useState } from 'react'
import { Search } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'

interface SearchResult {
  id: string;
  content: string;
  sender: string;
  channelName: string;
  timestamp: number;
}

export default function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isDemoMode] = useState(false)

  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  return (
    <ErrorBoundary fallback={
      <div className="p-4">
        <p className="text-red-600">Search functionality is currently unavailable.</p>
      </div>
    }>
      <div className="relative">
        <ErrorBoundary fallback={
          <div className="p-2">
            <p className="text-yellow-600">Search input is unavailable.</p>
          </div>
        }>
          <div className="relative">
            <input
              type="text"
              placeholder="Global Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
              size={20}
              onClick={handleSearch}
            />
          </div>
        </ErrorBoundary>

        {searchResults.length > 0 && (
          <ErrorBoundary fallback={
            <div className="p-2">
              <p className="text-yellow-600">Search results are unavailable.</p>
            </div>
          }>
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
              {searchResults.map((result) => (
                <div key={result.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <p className="font-bold">{result.sender} in #{result.channelName}</p>
                  <p className="text-sm">{result.content}</p>
                  <p className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  )
}
