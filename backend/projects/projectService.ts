import { collection, addDoc, doc, getDoc, getDocs, query, where, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ProjectData {
  name: string;
  description?: string;
  githubRepoUrl: string;
  githubOwner: string;
  githubRepo: string;
  memberEmails: string[];
  createdBy: string;
  createdAt: Timestamp;
  members: string[];
  status: 'Active' | 'On Hold' | 'Archived';
  progress: number;
  deadlineAt?: Timestamp;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  githubRepoUrl: string;
  memberEmails: string[];
  createdBy: string;
  deadlineInDays?: number;
}

export const projectService = {
  parseGithubUrl(url: string): { owner: string; repo: string } | null {
    const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(githubRegex);
    
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
      };
    }
    
    return null;
  },

  async validateMemberEmails(emails: string[]): Promise<{ valid: string[]; invalid: string[] }> {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const email of emails) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userId = querySnapshot.docs[0].id;
        valid.push(userId);
      } else {
        invalid.push(email);
      }
    }

    return { valid, invalid };
  },

  async createProject(input: CreateProjectInput): Promise<{ id: string; invalidEmails: string[] }> {
    const githubDetails = this.parseGithubUrl(input.githubRepoUrl);
    
    if (!githubDetails) {
      throw new Error('Invalid GitHub repository URL');
    }

    const { valid: memberIds, invalid: invalidEmails } = await this.validateMemberEmails(input.memberEmails);

    const allMembers = [...new Set([input.createdBy, ...memberIds])];

    let deadlineAt = undefined;
    if (input.deadlineInDays && input.deadlineInDays > 0) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + input.deadlineInDays);
      deadlineAt = Timestamp.fromDate(deadline);
    }

    const projectData: Omit<ProjectData, 'createdAt'> & { createdAt: any } = {
      name: input.name,
      description: input.description || '',
      githubRepoUrl: input.githubRepoUrl,
      githubOwner: githubDetails.owner,
      githubRepo: githubDetails.repo,
      memberEmails: input.memberEmails,
      createdBy: input.createdBy,
      members: allMembers,
      status: 'Active',
      progress: 0,
      createdAt: serverTimestamp(),
      ...(deadlineAt && { deadlineAt })
    };

    const docRef = await addDoc(collection(db, 'projects'), projectData);

    return { id: docRef.id, invalidEmails };
  },

  async getProject(projectId: string): Promise<ProjectData | null> {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as ProjectData;
    }

    return null;
  },

  async getUserProjects(userId: string): Promise<Array<ProjectData & { id: string }>> {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as ProjectData
    }));
  },

  async updateProjectProgress(projectId: string, progress: number): Promise<void> {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, { progress });
  },

  async updateProjectStatus(projectId: string, status: 'Active' | 'On Hold' | 'Archived'): Promise<void> {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, { status });
  },

  async addProjectMember(projectId: string, userId: string): Promise<void> {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentMembers = docSnap.data().members || [];
      if (!currentMembers.includes(userId)) {
        await updateDoc(docRef, {
          members: [...currentMembers, userId]
        });
      }
    }
  }
};
