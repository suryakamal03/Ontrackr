import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const taskServiceAdmin = {
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

  async matchTaskForCommit(
    projectId: string,
    commitMessage: string,
    githubUsername: string,
    isMainBranch: boolean = false
  ): Promise<void> {
    console.log('=== MATCHING TASK FOR COMMIT ===');
    console.log('Project ID:', projectId);
    console.log('Commit Message:', commitMessage);
    console.log('GitHub Username:', githubUsername);
    console.log('Is Main Branch:', isMainBranch);
    
    const messageKeywords = this.extractKeywords(commitMessage);
    console.log('Extracted Keywords from Commit:', messageKeywords);
    
    const tasksSnapshot = await adminDb.collection('tasks')
      .where('projectId', '==', projectId)
      .where('status', '==', 'To Do')
      .get();
    
    console.log('Found Tasks in To Do:', tasksSnapshot.size);
    
    for (const taskDoc of tasksSnapshot.docs) {
      const task = taskDoc.data();
      console.log('Checking Task:', task.title);
      console.log('Task Keywords:', task.keywords);
      console.log('Assigned To:', task.assignedTo);
      
      const userDoc = await adminDb.collection('users').doc(task.assignedTo).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('User GitHub Username:', userData?.githubUsername);
        
        if (userData?.githubUsername?.toLowerCase() === githubUsername.toLowerCase()) {
          console.log('✓ GitHub username matches!');
          
          const keywordMatch = task.keywords.some((keyword: string) => 
            messageKeywords.includes(keyword)
          );
          
          console.log('Keyword match result:', keywordMatch);
          
          if (keywordMatch) {
            const newStatus = isMainBranch ? 'Done' : 'In Review';
            
            await taskDoc.ref.update({
              status: newStatus,
              updatedAt: Timestamp.now()
            });
            
            console.log(`✓✓✓ Task ${taskDoc.id} moved to ${newStatus}!`);
          } else {
            console.log('✗ Keywords do not match');
          }
        } else {
          console.log('✗ GitHub username does not match');
          console.log(`Expected: ${githubUsername.toLowerCase()}, Got: ${userData?.githubUsername?.toLowerCase()}`);
        }
      } else {
        console.log('✗ User document not found');
      }
    }
    console.log('=== END MATCHING ===');
  },

  async matchTaskForMerge(
    projectId: string,
    prTitle: string,
    prBody: string,
    githubUsername: string
  ): Promise<void> {
    console.log('=== MATCHING TASK FOR PR MERGE ===');
    console.log('Project ID:', projectId);
    console.log('PR Title:', prTitle);
    console.log('GitHub Username:', githubUsername);
    
    const combinedText = `${prTitle} ${prBody}`;
    const prKeywords = this.extractKeywords(combinedText);
    console.log('Extracted Keywords from PR:', prKeywords);
    
    const tasksSnapshot = await adminDb.collection('tasks')
      .where('projectId', '==', projectId)
      .where('status', '==', 'In Review')
      .get();
    
    console.log('Found Tasks in In Review:', tasksSnapshot.size);
    
    for (const taskDoc of tasksSnapshot.docs) {
      const task = taskDoc.data();
      console.log('Checking Task:', task.title);
      console.log('Task Keywords:', task.keywords);
      
      const userDoc = await adminDb.collection('users').doc(task.assignedTo).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('User GitHub Username:', userData?.githubUsername);
        
        if (userData?.githubUsername?.toLowerCase() === githubUsername.toLowerCase()) {
          console.log('✓ GitHub username matches!');
          
          const keywordMatch = task.keywords.some((keyword: string) => 
            prKeywords.includes(keyword)
          );
          
          console.log('Keyword match result:', keywordMatch);
          
          if (keywordMatch) {
            await taskDoc.ref.update({
              status: 'Done',
              updatedAt: Timestamp.now()
            });
            console.log(`✓✓✓ Task ${taskDoc.id} moved to Done!`);
          } else {
            console.log('✗ Keywords do not match');
          }
        } else {
          console.log('✗ GitHub username does not match');
        }
      } else {
        console.log('✗ User document not found');
      }
    }
    console.log('=== END PR MERGE MATCHING ===');
  }
};
