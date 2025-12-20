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
    author: {
      name: string;
      email: string;
      username?: string;
    };
    timestamp: string;
  }>;
  pull_request?: {
    id: number;
    title: string;
    body?: string;
    state: string;
    merged?: boolean;
    base?: {
      ref: string;
    };
    user: {
      login: string;
    };
    created_at: string;
    updated_at: string;
  };
  issue?: {
    id: number;
    title: string;
    state: string;
    user: {
      login: string;
    };
    created_at: string;
  };
}

export const githubService = {
  async findProjectByRepo(owner: string, repo: string): Promise<string | null> {
    const projectsSnapshot = await getDoc(doc(db, 'projects', 'index'));
    return null;
  },

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
    await this.storeWebhookEvent(projectId, 'push', payload);
    
    if (payload.commits && payload.commits.length > 0) {
      const branchRef = payload.ref || '';
      const branchName = branchRef.replace('refs/heads/', '');
      const isMainBranch = branchName === 'main' || branchName === 'master';
      
      console.log('Push Event - Branch:', branchName, 'Is Main:', isMainBranch);
      
      for (const commit of payload.commits) {
        const githubUsername = commit.author.username || payload.sender.login;
        const commitMessage = commit.message;
        
        try {
          await taskServiceAdmin.matchTaskForCommit(
            projectId, 
            commitMessage, 
            githubUsername,
            isMainBranch
          );
        } catch (error) {
          console.error('Error matching task for commit:', error);
        }
      }
    }
  },

  async processPullRequestEvent(payload: WebhookPayload, projectId: string): Promise<void> {
    await this.storeWebhookEvent(projectId, 'pull_request', payload);
    
    if (payload.pull_request && payload.action === 'closed' && payload.pull_request.merged) {
      const isMainBranch = payload.pull_request.base?.ref === 'main' || 
                          payload.pull_request.base?.ref === 'master';
      
      if (isMainBranch) {
        const githubUsername = payload.pull_request.user.login;
        const prTitle = payload.pull_request.title;
        const prBody = payload.pull_request.body || '';
        
        try {
          await taskServiceAdmin.matchTaskForMerge(projectId, prTitle, prBody, githubUsername);
        } catch (error) {
          console.error('Error matching task for merge:', error);
        }
      }
    }
  },

  async processIssueEvent(payload: WebhookPayload, projectId: string): Promise<void> {
    await this.storeWebhookEvent(projectId, 'issues', payload);
  },

  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }
};
