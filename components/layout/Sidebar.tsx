'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  User, 
  Workflow, 
  MessageSquare, 
  AlertTriangle, 
  Settings, 
  Shield 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navigation: NavItem[] = [
  { name: 'Project Dashboard', href: '/projects', icon: FolderKanban },
  { name: 'My Dashboard', href: '/my-dashboard', icon: User },
  { name: 'Task Management', href: '/tasks', icon: CheckSquare },
  { name: 'Real-Time Chat', href: '/chat', icon: MessageSquare, badge: 3 },
  { name: 'Risk Alerts', href: '/risk-alerts', icon: AlertTriangle, badge: 3 },
]

const bottomNavigation: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin Panel', href: '/admin', icon: Shield },
]

export default function Sidebar() {
  const pathname = usePathname()
  
  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-900">Ontrackr</span>
      </div>
      
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      
      <div className="px-3 py-4 border-t border-gray-200">
        <ul className="space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Made with <span className="text-red-500">❤</span> Visily
        </p>
      </div>
    </div>
  )
}
