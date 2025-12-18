'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Chrome } from 'lucide-react'
import { authService } from '@/backend/auth/authService'
import { validateEmail, validatePassword, validateFullName } from '@/backend/auth/authHelpers'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const nameValidation = validateFullName(fullName)
    if (!nameValidation.isValid) {
      setError(nameValidation.message || 'Invalid name')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Invalid password')
      return
    }

    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)

    try {
      await authService.signUpWithEmail({ email, password, fullName })
      router.push('/projects')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)

    try {
      await authService.signInWithGoogle()
      router.push('/projects')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Ontrackr</h1>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Create your Ontrackr account</h2>
          <p className="text-gray-600 text-center mb-6">Unlock seamless project management and AI-powered insights.</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <Button 
              type="button"
              variant="secondary" 
              className="w-full gap-2" 
              size="lg"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <Chrome className="w-5 h-5" />
              Sign up with Google
            </Button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>
            
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
              
              <Input
                label="Email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  disabled={loading}
                  className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-500 hover:text-primary-600">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-500 hover:text-primary-600">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              
              <Button type="submit" className="w-full" size="lg" disabled={!agreed || loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
            
            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-500 hover:text-primary-600 font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
