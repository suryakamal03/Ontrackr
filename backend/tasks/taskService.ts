import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task } from '@/types';

export interface CreateTaskData {
  title: string;
  projectId: string;
  assignedTo: string;
  assignedToName: string;
  deadlineInDays?: number;
}

export const taskService = {
  async createTask(data: CreateTaskData): Promise<string> {
    const keywords = this.extractKeywords(data.title);
    
    let deadlineAt = undefined;
    if (data.deadlineInDays && data.deadlineInDays > 0) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + data.deadlineInDays);
      deadlineAt = deadline;
    }
    
    const taskData: any = {
      title: data.title,
      projectId: data.projectId,
      assignedTo: data.assignedTo,
      assignedToName: data.assignedToName,
      status: 'To Do',
      keywords,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reminderEnabled: true,
      reminderSent: false
    };

    if (deadlineAt) {
      taskData.deadlineAt = deadlineAt;
    }

    const docRef = await addDoc(collection(db, 'tasks'), taskData);
    return docRef.id;
  },

  extractKeywords(title: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been'
    ]);

    const words = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    return [...new Set(words)];
  },

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  },

  async getTasksByMember(projectId: string, memberId: string): Promise<Task[]> {
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId),
      where('assignedTo', '==', memberId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  },

  subscribeToProjectTasks(
    projectId: string, 
    callback: (tasks: Task[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      callback(tasks);
    });
  },

  async updateTaskStatus(taskId: string, status: 'To Do' | 'In Review' | 'Done'): Promise<void> {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      status,
      updatedAt: serverTimestamp()
    });
  },

  async matchTaskForCommit(
    projectId: string,
    commitMessage: string,
    githubUsername: string
  ): Promise<void> {
    const messageKeywords = this.extractKeywords(commitMessage);
    
    const tasks = await this.getTasksByProject(projectId);
    
    for (const task of tasks) {
      if (task.status === 'To Do') {
        const userDoc = await getDocs(query(
          collection(db, 'users'),
          where('__name__', '==', task.assignedTo)
        ));
        
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          
          if (userData.githubUsername?.toLowerCase() === githubUsername.toLowerCase()) {
            const keywordMatch = task.keywords.some(keyword => 
              messageKeywords.includes(keyword)
            );
            
            if (keywordMatch) {
              await this.updateTaskStatus(task.id, 'In Review');
            }
          }
        }
      }
    }
  },

  async matchTaskForMerge(
    projectId: string,
    prTitle: string,
    prBody: string,
    githubUsername: string
  ): Promise<void> {
    const combinedText = `${prTitle} ${prBody}`;
    const prKeywords = this.extractKeywords(combinedText);
    
    const tasks = await this.getTasksByProject(projectId);
    
    for (const task of tasks) {
      if (task.status === 'In Review') {
        const userDoc = await getDocs(query(
          collection(db, 'users'),
          where('__name__', '==', task.assignedTo)
        ));
        
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          
          if (userData.githubUsername?.toLowerCase() === githubUsername.toLowerCase()) {
            const keywordMatch = task.keywords.some(keyword => 
              prKeywords.includes(keyword)
            );
            
            if (keywordMatch) {
              await this.updateTaskStatus(task.id, 'Done');
            }
          }
        }
      }
    }
  }
};
