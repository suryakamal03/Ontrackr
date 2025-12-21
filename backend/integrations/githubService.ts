import { adminDb } from '@/lib/firebase-admin';
import { taskServiceAdmin } from '@/backend/tasks/taskServiceAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export interface GitHubEvent {
  id: string;
  projectId: string;
  eventType: 'push' | 'pull_request' | 'issues';
  action?: string;
  payload: any;
  createdAt: Timestamp;
}

export interface WebhookPayload {
  repository: {
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  sender: {
    login: string;
    avatar_url?: string;
  };
  action?: string;
  ref?: string;
  commits?: Array<{
    id: string;
    message: string;
    url?: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
    timestamp: string;
  }>;
  pull_request?: {
    id: number;
    number: number;
    html_url: string;
    title: string;
    body?: string;
    state: string;
    merged?: boolean;
    head?: {
      ref: string;
    };
    base?: {
      ref: string;
    };
    user: {
      login: string;
    };
    created_at: string;
    updated_at: string;
    merged_at?: string;
  };
  issue?: {
    id: number;
    number: number;
    html_url: string;
    title: string;
    state: string;
    user: {
      login: string;
    };
    created_at: string;
    closed_at?: string;
  };
}

// Activity deduplication helper
interface ActivityIdentifier {
  projectId: string;
  activityType: string;
  githubId: string; // Unique GitHub identifier (commit SHA, PR number, Issue number)
}

async function checkActivityExists(identifier: ActivityIdentifier): Promise<boolean> {
  const querySnapshot = await adminDb
    .collection('githubActivity')
    .where('projectId', '==', identifier.projectId)
    .where('activityType', '==', identifier.activityType)
    .where('githubId', '==', identifier.githubId)
    .limit(1)
    .get();
  
  return !querySnapshot.empty;
}

// Project member validation
async function isProjectMember(projectId: string, githubUsername: string): Promise<boolean> {
  try {
    const membersSnapshot = await adminDb
      .collection('projectMembers')
      .where('projectId', '==', projectId)
      .where('githubUsername', '==', githubUsername)
      .limit(1)
      .get();
    
    if (!membersSnapshot.empty) {
      return true;
    }
    
    // Also check if the user is the project lead
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    if (projectDoc.exists) {
      const projectData = projectDoc.data();
      if (projectData?.lead?.githubUsername === githubUsername) {
        return true;
      }
    }
    
    // For now, allow all activities (you can make this stricter)
    return true;
  } catch (error) {
    console.error('Error checking project membership:', error);
    return true; // Allow activity on error to avoid blocking legitimate events
  }
}

export const githubService = {
  async storeWebhookEvent(projectId: string, eventType: 'push' | 'pull_request' | 'issues', payload: WebhookPayload): Promise<string> {
    const eventData = {
      projectId,
      eventType,
      action: payload.action || 'unknown',
      payload: JSON.parse(JSON.stringify(payload)),
      repository: {
        name: payload.repository.name,
        fullName: payload.repository.full_name,
        owner: payload.repository.owner.login
      },
      sender: {
        login: payload.sender.login,
        avatarUrl: payload.sender.avatar_url
      },
      createdAt: Timestamp.now()
    };

    const docRef = await adminDb.collection('github_events').add(eventData);
    return docRef.id;
  },

  async processPushEvent(payload: WebhookPayload, projectId: string): Promise<void> {
    console.log(`[GitHub] Processing push event for project ${projectId}`);
    await this.storeWebhookEvent(projectId, 'push', payload);
    
    if (payload.commits && payload.commits.length > 0) {
      const branchRef = payload.ref || '';
      const branchName = branchRef.replace('refs/heads/', '');
      const isMainBranch = branchName === 'main' || branchName === 'master';
      
      console.log(`[GitHub] Push to branch: ${branchName}, Commits: ${payload.commits.length}, Is Main: ${isMainBranch}`);
      
      for (const commit of payload.commits) {
        const githubUsername = commit.author.username || payload.sender.login;
        const commitMessage = commit.message;
        const commitId = commit.id;
        
        // Check if member of project
        const isMember = await isProjectMember(projectId, githubUsername);
        if (!isMember) {
          console.log(`[GitHub] Skipping commit ${commitId} - user ${githubUsername} not a project member`);
          continue;
        }
        
        // Check for duplicate activity
        const exists = await checkActivityExists({
          projectId,
          activityType: 'commit',
          githubId: commitId
        });
        
        if (exists) {
          console.log(`[GitHub] Activity already exists for commit ${commitId}, skipping`);
          continue;
        }
        
        const commitUrl = commit.url || `https://github.com/${payload.repository.full_name}/commit/${commitId}`;
        
        try {
          await adminDb.collection('githubActivity').add({
            projectId,
            repositoryFullName: payload.repository.full_name,
            activityType: 'commit',
            title: commitMessage,
            githubUsername,
            branch: branchName,
            githubUrl: commitUrl,
            githubId: commitId, // For idempotency
            avatarUrl: payload.sender.avatar_url,
            createdAt: Timestamp.now()
          });
          
          console.log(`[GitHub] Stored commit activity: ${commitId.substring(0, 7)} by ${githubUsername}`);
          
          // Try to match task
          try {
            await taskServiceAdmin.matchTaskForCommit(
              projectId, 
              commitMessage, 
              githubUsername,
              isMainBranch
            );
          } catch (error) {
            console.error(`[GitHub] Error matching task for commit ${commitId}:`, error);
          }
        } catch (error) {
          console.error(`[GitHub] Error storing commit activity ${commitId}:`, error);
        }
      }
      
      console.log(`[GitHub] Processed ${payload.commits.length} commits successfully`);
    }
  },

  async processPullRequestEvent(payload: WebhookPayload, projectId: string): Promise<void> {
    console.log(`[GitHub] Processing pull_request event (action: ${payload.action}) for project ${projectId}`);
    await this.storeWebhookEvent(projectId, 'pull_request', payload);
    
    if (payload.pull_request) {
      const pr = payload.pull_request;
      const prNumber = pr.number;
      const prUrl = pr.html_url;
      const githubUsername = pr.user.login;
      const branchName = pr.head?.ref || pr.base?.ref;
      
      // Check if member of project
      const isMember = await isProjectMember(projectId, githubUsername);
      if (!isMember) {
        console.log(`[GitHub] Skipping PR #${prNumber} - user ${githubUsername} not a project member`);
        return;
      }
      
      if (payload.action === 'opened') {
        // Check for duplicate
        const exists = await checkActivityExists({
          projectId,
          activityType: 'pull_request_opened',
          githubId: `pr-${prNumber}-opened`
        });
        
        if (exists) {
          console.log(`[GitHub] Activity already exists for PR #${prNumber} opened, skipping`);
          return;
        }
        
        try {
          await adminDb.collection('githubActivity').add({
            projectId,
            repositoryFullName: payload.repository.full_name,
            activityType: 'pull_request_opened',
            title: pr.title,
            githubUsername,
            branch: branchName,
            githubUrl: prUrl,
            githubId: `pr-${prNumber}-opened`,
            avatarUrl: payload.sender.avatar_url,
            createdAt: Timestamp.now()
          });
          
          console.log(`[GitHub] Stored PR opened activity: #${prNumber} by ${githubUsername}`);
        } catch (error) {
          console.error(`[GitHub] Error storing PR opened activity #${prNumber}:`, error);
        }
      }
      
      if (payload.action === 'closed' && pr.merged) {
        // Check for duplicate
        const exists = await checkActivityExists({
          projectId,
          activityType: 'pull_request_merged',
          githubId: `pr-${prNumber}-merged`
        });
        
        if (exists) {
          console.log(`[GitHub] Activity already exists for PR #${prNumber} merged, skipping`);
          return;
        }
        
        try {
          await adminDb.collection('githubActivity').add({
            projectId,
            repositoryFullName: payload.repository.full_name,
            activityType: 'pull_request_merged',
            title: pr.title,
            githubUsername,
            branch: pr.base?.ref,
            githubUrl: prUrl,
            githubId: `pr-${prNumber}-merged`,
            avatarUrl: payload.sender.avatar_url,
            createdAt: Timestamp.now()
          });
          
          console.log(`[GitHub] Stored PR merged activity: #${prNumber} by ${githubUsername}`);
          
          // Try to match task for merged PR
          const isMainBranch = pr.base?.ref === 'main' || pr.base?.ref === 'master';
          
          if (isMainBranch) {
            const prTitle = pr.title;
            const prBody = pr.body || '';
            
            try {
              await taskServiceAdmin.matchTaskForMerge(projectId, prTitle, prBody, githubUsername);
            } catch (error) {
              console.error(`[GitHub] Error matching task for merged PR #${prNumber}:`, error);
            }
          }
        } catch (error) {
          console.error(`[GitHub] Error storing PR merged activity #${prNumber}:`, error);
        }
      }
    }
  },

  async processIssueEvent(payload: WebhookPayload, projectId: string): Promise<void> {
    console.log(`[GitHub] Processing issue event (action: ${payload.action}) for project ${projectId}`);
    await this.storeWebhookEvent(projectId, 'issues', payload);
    
    if (payload.issue) {
      const issue = payload.issue;
      const issueNumber = issue.number;
      const issueUrl = issue.html_url;
      const githubUsername = issue.user.login;
      
      // Check if member of project
      const isMember = await isProjectMember(projectId, githubUsername);
      if (!isMember) {
        console.log(`[GitHub] Skipping issue #${issueNumber} - user ${githubUsername} not a project member`);
        return;
      }
      
      if (payload.action === 'opened') {
        // Check for duplicate
        const exists = await checkActivityExists({
          projectId,
          activityType: 'issue_opened',
          githubId: `issue-${issueNumber}-opened`
        });
        
        if (exists) {
          console.log(`[GitHub] Activity already exists for issue #${issueNumber} opened, skipping`);
          return;
        }
        
        try {
          await adminDb.collection('githubActivity').add({
            projectId,
            repositoryFullName: payload.repository.full_name,
            activityType: 'issue_opened',
            title: issue.title,
            githubUsername,
            githubUrl: issueUrl,
            githubId: `issue-${issueNumber}-opened`,
            avatarUrl: payload.sender.avatar_url,
            createdAt: Timestamp.now()
          });
          
          console.log(`[GitHub] Stored issue opened activity: #${issueNumber} by ${githubUsername}`);
        } catch (error) {
          console.error(`[GitHub] Error storing issue opened activity #${issueNumber}:`, error);
        }
      } else if (payload.action === 'closed') {
        // Check for duplicate
        const exists = await checkActivityExists({
          projectId,
          activityType: 'issue_closed',
          githubId: `issue-${issueNumber}-closed`
        });
        
        if (exists) {
          console.log(`[GitHub] Activity already exists for issue #${issueNumber} closed, skipping`);
          return;
        }
        
        try {
          await adminDb.collection('githubActivity').add({
            projectId,
            repositoryFullName: payload.repository.full_name,
            activityType: 'issue_closed',
            title: issue.title,
            githubUsername: payload.sender.login,
            githubUrl: issueUrl,
            githubId: `issue-${issueNumber}-closed`,
            avatarUrl: payload.sender.avatar_url,
            createdAt: Timestamp.now()
          });
          
          console.log(`[GitHub] Stored issue closed activity: #${issueNumber} by ${payload.sender.login}`);
        } catch (error) {
          console.error(`[GitHub] Error storing issue closed activity #${issueNumber}:`, error);
        }
      }
    }
  },

  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }
};
