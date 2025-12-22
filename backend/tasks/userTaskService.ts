import { collection, query, where, orderBy, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Task } from '@/types'

export interface UserTask extends Task {
  projectName?: string
}

export const userTaskService = {
  /**
   * Get all tasks assigned to a specific user across all projects
   */
  async getUserTasks(userId: string): Promise<UserTask[]> {
    try {
      console.log(`[UserTaskService] Fetching all tasks for userId: ${userId}`)
      
      const q = query(
        collection(db, 'tasks'),
        where('assignedTo', '==', userId)
      )

      const snapshot = await getDocs(q)
      console.log(`[UserTaskService] Found ${snapshot.docs.length} tasks`)
      
      const tasks: UserTask[] = []

      for (const docSnap of snapshot.docs) {
        const taskData = docSnap.data() as Task
        console.log(`[UserTaskService] Task:`, { id: docSnap.id, title: taskData.title, status: taskData.status })
        
        const task: UserTask = {
          ...taskData,
          id: docSnap.id
        }

        // Fetch project name
        if (task.projectId) {
          const projectDoc = await getDoc(doc(db, 'projects', task.projectId))
          if (projectDoc.exists()) {
            task.projectName = projectDoc.data()?.name || 'Unknown Project'
          }
        }

        tasks.push(task)
      }

      console.log(`[UserTaskService] Returning ${tasks.length} tasks`)
      return tasks
    } catch (error) {
      console.error('[UserTaskService] Error fetching user tasks:', error)
      return []
    }
  },

  /**
   * Get tasks by status for a specific user
   */
  async getUserTasksByStatus(userId: string, status: 'To Do' | 'In Review'): Promise<UserTask[]> {
    try {
      console.log(`[UserTaskService] Fetching tasks for userId: ${userId}, status: ${status}`)
      
      const q = query(
        collection(db, 'tasks'),
        where('assignedTo', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      console.log(`[UserTaskService] Found ${snapshot.docs.length} tasks`)
      
      const tasks: UserTask[] = []

      for (const docSnap of snapshot.docs) {
        const taskData = docSnap.data() as Task
        console.log(`[UserTaskService] Task data:`, { id: docSnap.id, ...taskData })
        
        const task: UserTask = {
          ...taskData,
          id: docSnap.id
        }

        // Fetch project name
        if (task.projectId) {
          const projectDoc = await getDoc(doc(db, 'projects', task.projectId))
          if (projectDoc.exists()) {
            task.projectName = projectDoc.data()?.name || 'Unknown Project'
          }
        }

        tasks.push(task)
      }

      return tasks
    } catch (error: any) {
      console.error('[UserTaskService] Error fetching user tasks by status:', error)
      console.error('[UserTaskService] Error code:', error?.code)
      console.error('[UserTaskService] Error message:', error?.message)
      
      // If it's an index error, provide helpful message
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.error('[UserTaskService] FIRESTORE INDEX REQUIRED!')
        console.error('[UserTaskService] You need to create a composite index for:')
        console.error('[UserTaskService] Collection: tasks')
        console.error('[UserTaskService] Fields: assignedTo (Ascending), status (Ascending), createdAt (Descending)')
      }
      
      return []
    }
  },

  /**
   * Subscribe to real-time updates for user tasks
   */
  subscribeToUserTasks(
    userId: string,
    callback: (tasks: UserTask[]) => void,
    status?: 'To Do' | 'In Review'
  ): () => void {
    const baseQuery = collection(db, 'tasks')
    
    const q = status
      ? query(
          baseQuery,
          where('assignedTo', '==', userId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        )
      : query(
          baseQuery,
          where('assignedTo', '==', userId),
          orderBy('createdAt', 'desc')
        )

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const tasks: UserTask[] = []

        for (const docSnap of snapshot.docs) {
          const taskData = docSnap.data() as Task
          const task: UserTask = {
            ...taskData,
            id: docSnap.id
          }

          // Fetch project name
          if (task.projectId) {
            try {
              const projectDoc = await getDoc(doc(db, 'projects', task.projectId))
              if (projectDoc.exists()) {
                task.projectName = projectDoc.data()?.name || 'Unknown Project'
              }
            } catch (err) {
              console.error('Error fetching project name:', err)
            }
          }

          tasks.push(task)
        }

        callback(tasks)
      },
      (error) => {
        console.error('[UserTaskService] Error in subscription:', error)
        callback([])
      }
    )

    return unsubscribe
  }
}
