'use client';

import { useState, useEffect, Suspense } from 'react';
import { SendIcon, Loader2, AlertCircle, X, Calendar, Hash, Moon, Sun, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { createClient } from '@supabase/supabase-js';

interface SearchResult {
  answer: string;
  sources: {
    content: string;
    channelName: string;
    timestamp: string;
    userId: string;
  }[];
}

interface Filters {
  channels: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function RAGSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  console.log('RAG Search: Component mounting');
  console.log('RAG Search: Search params:', Object.fromEntries(searchParams.entries()));
  
  // First try to get workspaceId from URL params
  useEffect(() => {
    async function getDefaultWorkspace() {
      try {
        // If no workspaceId in URL or cookie, get the first workspace
        const { data: workspace, error } = await supabase
          .from('workspaces')
          .select('id')
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching workspace:', error);
          return;
        }

        if (workspace) {
          console.log('Setting default workspace:', workspace.id);
          setWorkspaceId(workspace.id);
          Cookies.set('lastWorkspaceId', workspace.id);
        }
      } catch (error) {
        console.error('Error in getDefaultWorkspace:', error);
      }
    }

    const urlWorkspaceId = searchParams.get('workspaceId');
    if (urlWorkspaceId) {
      setWorkspaceId(urlWorkspaceId);
      Cookies.set('lastWorkspaceId', urlWorkspaceId);
    } else {
      const cookieWorkspaceId = Cookies.get('lastWorkspaceId');
      if (cookieWorkspaceId) {
        setWorkspaceId(cookieWorkspaceId);
      } else {
        getDefaultWorkspace();
      }
    }
  }, [searchParams]);

  console.log('RAG Search: Final workspaceId:', workspaceId);

  // Add effect to track workspaceId changes
  useEffect(() => {
    console.log('RAG Search: workspaceId changed to:', workspaceId);
    if (!workspaceId) {
      console.log('RAG Search: Warning - No workspaceId available');
    }
  }, [workspaceId]);

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [filters, setFilters] = useState<Filters>({
    channels: [],
    dateRange: {
      start: null,
      end: null
    }
  });

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      return;
    }
    
    // Fall back to system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(systemPrefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', systemPrefersDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('RAG Search: Attempting search with workspaceId:', workspaceId);
    if (!query.trim() || !workspaceId) {
      console.log('RAG Search: Missing query or workspaceId');
      setError('Please enter a query and ensure you have a valid workspace selected');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('RAG Search: Making API request with:', { query: query.trim(), workspaceId, filters });
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          workspaceId,
          filters: {
            channels: filters.channels,
            dateRange: {
              start: filters.dateRange.start,
              end: filters.dateRange.end
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.log('RAG Search: API error response:', errorData);
        throw new Error(errorData || 'Failed to fetch search results');
      }

      const data = await response.json();
      console.log('RAG Search: Received API response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResult(data);
    } catch (error) {
      console.error('RAG Search: Error during search:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (type: 'channels' | 'dateRange', value: any) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      channels: [],
      dateRange: {
        start: null,
        end: null
      }
    });
  };

  const handleBack = () => {
    console.log('RAG Search: Starting navigation back to platform');
    console.log('RAG Search: Current workspaceId:', workspaceId);
    
    const url = workspaceId ? 
      `/platform?workspaceId=${encodeURIComponent(workspaceId)}` : 
      '/platform';
    
    console.log('RAG Search: Navigating to URL:', url);
    window.location.href = url;
  };

  return (
    <div className="flex flex-col min-h-screen p-4 bg-white dark:bg-gray-900">
      <div className="flex items-center mb-4">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Workspace
        </button>
        <div className="flex-1" />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Search Conversation History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ask questions about past conversations and get AI-powered answers with relevant context
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about past conversations..."
                className="flex-1 p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <SendIcon className="w-5 h-5" />
                )}
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              
              {showFilters && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {/* Channel Filter */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Channels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {filters.channels.map(channel => (
                        <span
                          key={channel}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          <Hash className="w-4 h-4 mr-1" />
                          {channel}
                          <button
                            onClick={() => handleFilterChange('channels', 
                              filters.channels.filter(c => c !== channel)
                            )}
                            className="ml-2 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={filters.dateRange.start || ''}
                        onChange={(e) => handleFilterChange('dateRange', {
                          ...filters.dateRange,
                          start: e.target.value
                        })}
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={filters.dateRange.end || ''}
                        onChange={(e) => handleFilterChange('dateRange', {
                          ...filters.dateRange,
                          end: e.target.value
                        })}
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <p className="text-gray-600 dark:text-gray-400">Searching through conversations...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !isLoading && (
          <div className="space-y-6">
            {/* AI Answer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Answer</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.answer}</p>
            </div>

            {/* Source Messages */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Source Messages ({result.sources.length})
              </h2>
              <div className="space-y-4">
                {result.sources.map((source, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{source.content}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center flex-wrap gap-2">
                      <span className="flex items-center">
                        <Hash className="w-4 h-4 mr-1" />
                        {source.channelName}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(source.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RAGSearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>}>
      <RAGSearchContent />
    </Suspense>
  );
} 