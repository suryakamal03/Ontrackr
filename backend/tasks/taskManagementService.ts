import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Task } from '@/types'

export interface TaskManagementItem extends Task {
  projectName: string
}

export const taskManagementService = {
  /**
   * Get all tasks for Task Management Dashboard based on user role
   * - If user is a project lead: fetch all tasks from their projects
   * - If user is not a lead: fetch only tasks assigned to them
   */
  async getTasksForUser(userId: string): Promise<TaskManagementItem[]> {
    try {
      console.log('[TaskManagementService] Fetching tasks for userId:', userId)

      // Step 1: Get all projects where user is a member or lead
      const projectsQuery = query(
        collection(db, 'projects'),
        where('members', 'array-contains', userId)
      )
      const projectsSnapshot = await getDocs(projectsQuery)
      
      const userProjects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      console.log('[TaskManagementService] User is in', userProjects.length, 'projects')

      if (userProjects.length === 0) {
        return []
      }

      // Step 2: Determine if user is a lead in any project
      const leadProjectIds = userProjects
        .filter(project => project.createdBy === userId)
        .map(project => project.id)

      const isLead = leadProjectIds.length > 0

      console.log('[TaskManagementService] User is lead:', isLead)
      console.log('[TaskManagementService] Lead projects:', leadProjectIds)

      // Step 3: Fetch tasks based on role
      let tasks: TaskManagementItem[] = []

      if (!isLead) {
        // User is not a lead - return empty (Task Management is for leads only)
        console.log('[TaskManagementService] User is not a project lead - returning empty')
        return []
      }

      // User is a lead - fetch all tasks from their lead projects
      for (const projectId of leadProjectIds) {
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('projectId', '==', projectId)
        )
        const tasksSnapshot = await getDocs(tasksQuery)
        
        const projectName = userProjects.find(p => p.id === projectId)?.name || 'Unknown Project'
        
        tasksSnapshot.docs.forEach(taskDoc => {
          const taskData = taskDoc.data() as Task
          tasks.push({
            ...taskData,
            id: taskDoc.id,
            projectName
          })
        })
      }

      console.log('[TaskManagementService] Fetched', tasks.length, 'tasks')
      
      // Sort by deadline
      tasks.sort((a, b) => {
        if (!a.deadlineAt && !b.deadlineAt) return 0
        if (!a.deadlineAt) return 1
        if (!b.deadlineAt) return -1
        return a.deadlineAt.toDate().getTime() - b.deadlineAt.toDate().getTime()
      })

      return tasks
    } catch (error) {
      console.error('[TaskManagementService] Error fetching tasks:', error)
      return []
    }
  },

  /**
   * Subscribe to real-time task updates for Task Management Dashboard
   */
  subscribeToTasks(
    userId: string,
    callback: (tasks: TaskManagementItem[]) => void
  ): () => void {
    let unsubscribers: (() => void)[] = []

    // This is a simplified version - we'll fetch once and then subscribe
    // For a full real-time implementation, we'd need to handle project changes too
    this.getTasksForUser(userId).then(async (initialTasks) => {
      callback(initialTasks)

      // Set up real-time listeners for tasks
      const projectsQuery = query(
        collection(db, 'projects'),
        where('members', 'array-contains', userId)
      )
      
      const projectsSnapshot = await getDocs(projectsQuery)
      const userProjects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const leadProjectIds = userProjects
        .filter(project => project.createdBy === userId)
        .map(project => project.id)

      const isLead = leadProjectIds.length > 0

      if (isLead) {
        // Subscribe to all tasks in lead projects
        for (const projectId of leadProjectIds) {
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('projectId', '==', projectId)
          )
          
          const unsubscribe = onSnapshot(tasksQuery, () => {
            this.getTasksForUser(userId).then(callback)
          })
          
          unsubscribers.push(unsubscribe)
        }
      } else {
        // User is not a lead - no tasks to show
        callback([])
      }
    })

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }
}
