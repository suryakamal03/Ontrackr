import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Flowchart } from '@/types'

export const flowchartService = {
  /**
   * Create a new flowchart for a project
   */
  async createFlowchart(
    projectId: string, 
    userId: string,
    name: string, 
    description: string, 
    diagramData: string
  ): Promise<{ success: boolean; flowchartId?: string; error?: string }> {
    try {
      const flowchartData = {
        projectId,
        name,
        description,
        diagramData,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'flowcharts'), flowchartData)
      
      return {
        success: true,
        flowchartId: docRef.id
      }
    } catch (error: any) {
      console.error('[FlowchartService] Error creating flowchart:', error)
      return {
        success: false,
        error: error.message || 'Failed to save flowchart'
      }
    }
  },

  /**
   * Get all flowcharts for a specific project
   */
  async getProjectFlowcharts(projectId: string): Promise<Flowchart[]> {
    try {
      const q = query(
        collection(db, 'flowcharts'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Flowchart))
    } catch (error) {
      console.error('[FlowchartService] Error fetching flowcharts:', error)
      return []
    }
  },

  /**
   * Get a specific flowchart by ID
   */
  async getFlowchart(flowchartId: string): Promise<Flowchart | null> {
    try {
      const docRef = doc(db, 'flowcharts', flowchartId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Flowchart
    } catch (error) {
      console.error('[FlowchartService] Error fetching flowchart:', error)
      return null
    }
  },

  /**
   * Update an existing flowchart
   */
  async updateFlowchart(
    flowchartId: string,
    updates: { name?: string; description?: string; diagramData?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, 'flowcharts', flowchartId)
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })

      return { success: true }
    } catch (error: any) {
      console.error('[FlowchartService] Error updating flowchart:', error)
      return {
        success: false,
        error: error.message || 'Failed to update flowchart'
      }
    }
  },

  /**
   * Delete a flowchart
   */
  async deleteFlowchart(flowchartId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, 'flowcharts', flowchartId)
      await deleteDoc(docRef)

      return { success: true }
    } catch (error: any) {
      console.error('[FlowchartService] Error deleting flowchart:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete flowchart'
      }
    }
  },

  /**
   * Subscribe to flowchart changes for a project (real-time)
   */
  subscribeToProjectFlowcharts(
    projectId: string,
    callback: (flowcharts: Flowchart[]) => void
  ): () => void {
    const q = query(
      collection(db, 'flowcharts'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    )

    // Note: For real-time subscription, you would use onSnapshot
    // For now, we'll use polling or manual refresh
    // This can be enhanced with onSnapshot if needed
    
    const unsubscribe = () => {
      // Cleanup function
    }

    return unsubscribe
  }
}
