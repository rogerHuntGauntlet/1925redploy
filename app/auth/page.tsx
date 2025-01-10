'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createUserProfile } from '@/lib/supabase'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

console.log('🔐 [Auth] Auth page loaded');

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

function getRandomWorkspaceBlurb() {
  const blurbs = [
    "A vibrant community of innovators collaborating to build something amazing.",
    "Join this dynamic workspace where creativity meets productivity.",
    "A thriving hub of professionals sharing ideas and driving success.",
    "Connect with passionate team members in this engaging workspace.",
    "Experience seamless collaboration in this well-organized workspace."
  ]
  return blurbs[Math.floor(Math.random() * blurbs.length)]
}

interface AuthContentProps {
  workspaceId: string | null;
}

function AuthContent({ workspaceId }: AuthContentProps) {
  console.log('🔐 [Auth] AuthContent rendered with workspaceId:', workspaceId);
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState<string | null>(null)
  const [workspaceBlurb] = useState(getRandomWorkspaceBlurb())
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    console.log('🔐 [Auth] Checking for workspace details...');
    if (workspaceId) {
      fetchWorkspaceDetails()
    }
  }, [workspaceId])

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {}

    // Email validation
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = 'Invalid email address'
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    } else if (!PASSWORD_REGEX.test(password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkspaceDetails = async () => {
    if (!workspaceId) return

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single()

      if (error) throw error
      setWorkspaceName(data.name)
    } catch (error) {
      console.error('Error fetching workspace details:', error)
      setError('Failed to fetch workspace details')
    }
  }

  const addUserToWorkspace = async (userId: string) => {
    if (!workspaceId) return

    try {
      const { error } = await supabase
        .from('workspace_members')
        .insert([
          {
            workspace_id: workspaceId,
            user_id: userId,
            role: 'member'
          }
        ])

      if (error) throw error
    } catch (error) {
      console.error('Error adding user to workspace:', error)
      throw error
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      console.log('Signing in...')
      setMessage('Signing in...')
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      setMessage('Sign in successful. Setting up your profile...')
      sessionStorage.setItem('userEmail', email)

      // Ensure user profile exists
      if (!user) throw new Error('No user data after sign in')
      
      const userProfile = await createUserProfile({
        id: user.id,
        email: user.email
      })
      
      console.log('User profile created...', userProfile)
      if (workspaceId && userProfile) {
        await addUserToWorkspace(userProfile.id)
        router.push('/platform')
      }

      router.push('/platform')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      setMessage('Signing up...')
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      if (!user) throw new Error('No user data after sign up')

      // Create user profile
      const userProfile = await createUserProfile({
        id: user.id,
        email: user.email
      })

      if (workspaceId && userProfile) {
        setMessage('Profile created. Adding you to workspace...')
        await addUserToWorkspace(userProfile.id)
        router.push('/platform')
      }

      setMessage('Profile created. You will receive an email to verify your account.')
      //router.push('/platform')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl w-full mx-4 flex flex-col lg:flex-row gap-8 py-8">
        {/* Left side - Branding */}
        <motion.div
          className="flex-1 flex flex-col justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <a
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            target="_blank"
            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group hover:scale-105 transition-all duration-300 mb-6"
          >
            <span className="text-3xl font-bold text-white">?</span>
          </a>
          <span className="text-gray-400 text-sm group-hover:text-indigo-400 transition-colors mb-6">
            Help us choose a logo and win prizes!
          </span>

          <h1 className="text-4xl font-bold text-white mb-3">
            Welcome to ChatGenius
          </h1>
          <p className="text-xl text-gray-400 mb-6">
            Your intelligent workspace companion
          </p>

          {workspaceName && (
            <motion.div
              className="p-6 bg-white/5 rounded-xl border border-white/10 max-w-md backdrop-blur-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-white mb-3">
                Joining workspace: {workspaceName}
              </h2>
              <p className="text-gray-300 text-base italic">
                "{workspaceBlurb}"
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Right side - Auth form */}
        <motion.div
          className="w-full lg:w-[400px] bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {message && (
            <motion.div
              className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-green-400 text-sm">{message}</p>
            </motion.div>
          )}

          <form className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`mt-1 block w-full rounded-xl bg-white/5 border ${validationErrors.email ? 'border-red-500' : 'border-white/10'
                  } text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-300 h-12 px-4`}
                placeholder="you@example.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`mt-1 block w-full rounded-xl bg-white/5 border ${validationErrors.password ? 'border-red-500' : 'border-white/10'
                    } text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-300 h-12 px-4 pr-10`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.password}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </button>
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? 'Processing...' : 'Create Account'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-400 bg-gray-900">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <FaGithub className="w-5 h-5" />
                  <span>GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <FaGoogle className="w-5 h-5" />
                  <span>Google</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

function AuthParams() {
  console.log('🔐 [Auth] AuthParams component mounted');
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspaceId')
  return <AuthContent workspaceId={workspaceId} />
}

export default function Auth() {
  console.log('🔐 [Auth] Main Auth component mounted');
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>}>
      <AuthParams />
    </Suspense>
  )
}
