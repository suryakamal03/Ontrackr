import { collection, query, where, orderBy, limit, getDocs, Unsubscribe, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GitHubActivity } from '@/types';

export const githubActivityService = {
  async getActivitiesByProject(projectId: string, limitCount: number = 20): Promise<GitHubActivity[]> {
    const q = query(
      collection(db, 'githubActivity'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GitHubActivity));
  },

  subscribeToActivities(
    projectId: string,
    callback: (activities: GitHubActivity[]) => void,
    onError?: (error: Error) => void,
    limitCount: number = 20
  ): Unsubscribe {
    console.log('[githubActivityService] Creating subscription for project:', projectId)
    
    const q = query(
      collection(db, 'githubActivity'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(
      q, 
      (snapshot) => {
        console.log('[githubActivityService] Received snapshot with', snapshot.docs.length, 'activities')
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as GitHubActivity));
        callback(activities);
      },
      (error) => {
        console.error('[githubActivityService] Subscription error:', error)
        if (onError) {
          onError(error as Error)
        }
      }
    );
  }
};
