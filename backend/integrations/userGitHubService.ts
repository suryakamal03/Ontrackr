import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { GitHubActivity } from '@/types'

export interface UserGitHubActivity extends GitHubActivity {
  projectName?: string
}

export interface GitHubIssue {
  id: string
  projectId: string
  projectName?: string
  title: string
  number: number
  state: 'open' | 'closed'
  githubUrl: string
  githubUsername: string
  createdAt: any
  relatedBranch?: string
}

export const userGitHubService = {
  /**
   * Get GitHub activities for a specific user across all projects
   */
  async getUserGitHubActivities(
    githubUsername: string,
    limitCount: number = 10
  ): Promise<UserGitHubActivity[]> {
    try {
      console.log(`[UserGitHubService] Fetching activities for: ${githubUsername}`)
      
      const q = query(
        collection(db, 'githubActivity'),
        where('githubUsername', '==', githubUsername)
      )

      const snapshot = await getDocs(q)
      console.log(`[UserGitHubService] Found ${snapshot.docs.length} activities`)
      
      const activities: UserGitHubActivity[] = []

      for (const docSnap of snapshot.docs) {
        const activityData = docSnap.data() as GitHubActivity
        const activity: UserGitHubActivity = {
          ...activityData,
          id: docSnap.id
        }

        // Fetch project name
        if (activity.projectId) {
          const projectDoc = await getDoc(doc(db, 'projects', activity.projectId))
          if (projectDoc.exists()) {
            activity.projectName = projectDoc.data()?.name || 'Unknown Project'
          }
        }

        activities.push(activity)
      }

      // Sort by createdAt and limit on client side
      const sortedActivities = activities
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0)
          const bTime = b.createdAt?.toDate?.() || new Date(0)
          return bTime.getTime() - aTime.getTime()
        })
        .slice(0, limitCount)

      console.log(`[UserGitHubService] Returning ${sortedActivities.length} activities`)
      return sortedActivities
    } catch (error) {
      console.error('[UserGitHubService] Error fetching user activities:', error)
      return []
    }
  },

  /**
   * Get GitHub issues assigned to or created by a specific user
   */
  async getUserGitHubIssues(githubUsername: string): Promise<GitHubIssue[]> {
    try {
      console.log(`[UserGitHubService] Fetching issues for: ${githubUsername}`)
      
      // Simplified: fetch all activities for user, filter for issues client-side
      const q = query(
        collection(db, 'githubActivity'),
        where('githubUsername', '==', githubUsername)
      )

      const snapshot = await getDocs(q)
      console.log(`[UserGitHubService] Found ${snapshot.docs.length} total activities`)
      
      const issues: GitHubIssue[] = []

      for (const docSnap of snapshot.docs) {
        const activityData = docSnap.data()
        
        // Filter for issue activities
        if (activityData.activityType !== 'issue_opened' && activityData.activityType !== 'issue_closed') {
          continue
        }
        
        // Extract issue number from githubId or title
        const issueNumber = activityData.githubId?.match(/issue-(\d+)/)?.[1] || 0

        const issue: GitHubIssue = {
          id: docSnap.id,
          projectId: activityData.projectId,
          title: activityData.title,
          number: parseInt(issueNumber as string),
          state: activityData.activityType === 'issue_closed' ? 'closed' : 'open',
          githubUrl: activityData.githubUrl,
          githubUsername: activityData.githubUsername,
          createdAt: activityData.createdAt,
          relatedBranch: activityData.branch
        }

        // Fetch project name
        if (issue.projectId) {
          const projectDoc = await getDoc(doc(db, 'projects', issue.projectId))
          if (projectDoc.exists()) {
            issue.projectName = projectDoc.data()?.name || 'Unknown Project'
          }
        }

        // Only add open issues or recently closed ones
        if (issue.state === 'open') {
          issues.push(issue)
        }
      }

      // Remove duplicates based on issue number and project
      const uniqueIssues = Array.from(
        new Map(issues.map(issue => [`${issue.projectId}-${issue.number}`, issue])).values()
      )

      return uniqueIssues
    } catch (error) {
      console.error('[UserGitHubService] Error fetching user issues:', error)
      return []
    }
  }
}
