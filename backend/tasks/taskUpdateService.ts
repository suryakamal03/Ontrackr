import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const updateTaskDeadline = async (taskId: string, deadlineInDays: number): Promise<void> => {
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + deadlineInDays)
  
  const taskRef = doc(db, 'tasks', taskId)
  await updateDoc(taskRef, {
    deadlineAt: deadline,
    reminderSent: false
  })
}
