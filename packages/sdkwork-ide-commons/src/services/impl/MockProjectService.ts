import { IProject, IThread, IMessage } from 'sdkwork-ide-types';
import { IProjectService } from '../interfaces/IProjectService';

const MOCK_PROJECTS: IProject[] = [
  { id: 'p1', workspaceId: 'ws-1', name: 'BirdCoder V1', createdAt: Date.now(), updatedAt: Date.now(), sessions: [], threads: [
    { id: 't1', name: 'Fix npm install errors', time: '2 mins ago', createdAt: Date.now(), updatedAt: Date.now(), messages: [
      { id: 'm1', role: 'user', content: 'Can you fix the npm install errors in package.json?', timestamp: Date.now() },
      { id: 'm2', role: 'assistant', content: 'I have updated the `package.json` to fix the dependency conflicts. Please review the changes.', timestamp: Date.now(), fileChanges: [
        { path: '/package.json', additions: 5, deletions: 2, originalContent: '{\n  "name": "my-app",\n  "dependencies": {\n    "react": "^17.0.2"\n  }\n}', content: '{\n  "name": "my-app",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}' }
      ]}
    ]},
    { id: 't2', name: 'Add authentication', time: '1 hour ago', createdAt: Date.now(), updatedAt: Date.now() },
    { id: 't3', name: 'Initial setup', time: '2 days ago', createdAt: Date.now(), updatedAt: Date.now() }
  ]},
  { id: 'p2', workspaceId: 'ws-1', name: 'E-commerce Dashboard', createdAt: Date.now(), updatedAt: Date.now(), sessions: [], threads: [
    { id: 't4', name: 'Update chart colors', time: '3 hours ago', createdAt: Date.now(), updatedAt: Date.now() },
    { id: 't5', name: 'Fix layout bug', time: '1 day ago', createdAt: Date.now(), updatedAt: Date.now() }
  ]},
  { id: 'p3', workspaceId: 'ws-2', name: 'Personal Portfolio', createdAt: Date.now(), updatedAt: Date.now(), sessions: [], threads: [
    { id: 't6', name: 'Add dark mode', time: '5 days ago', createdAt: Date.now(), updatedAt: Date.now() }
  ]}
];

export class MockProjectService implements IProjectService {
  private projects: IProject[] = [...MOCK_PROJECTS];

  async getProjects(workspaceId?: string): Promise<IProject[]> {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        if (workspaceId) {
          resolve(this.projects.filter(p => p.workspaceId === workspaceId));
        } else {
          resolve([...this.projects]);
        }
      }, 100);
    });
  }

  async createProject(workspaceId: string, name: string): Promise<IProject> {
    const newProject: IProject = {
      id: `p${Date.now()}`,
      workspaceId,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sessions: [],
      threads: []
    };
    this.projects.push(newProject);
    return newProject;
  }

  async createThread(projectId: string, name: string): Promise<IThread> {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const newThread: IThread = {
      id: `t${Date.now()}`,
      name,
      time: 'Just now',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    project.threads.push(newThread);
    return newThread;
  }

  async renameProject(projectId: string, name: string): Promise<void> {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.name = name;
    }
  }

  async updateProject(projectId: string, updates: Partial<IProject>): Promise<void> {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      Object.assign(project, updates);
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    this.projects = this.projects.filter(p => p.id !== projectId);
  }

  async renameThread(projectId: string, threadId: string, name: string): Promise<void> {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      const thread = project.threads.find(t => t.id === threadId);
      if (thread) {
        thread.name = name;
      }
    }
  }

  async updateThread(projectId: string, threadId: string, updates: Partial<IThread>): Promise<void> {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      const thread = project.threads.find(t => t.id === threadId);
      if (thread) {
        Object.assign(thread, updates);
      }
    }
  }

  async forkThread(projectId: string, threadId: string, newName?: string): Promise<IThread> {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const thread = project.threads.find(t => t.id === threadId);
    if (!thread) throw new Error(`Thread ${threadId} not found`);

    const forkedThread: IThread = {
      ...thread,
      id: `t${Date.now()}`,
      name: newName || `${thread.name} (Fork)`,
      messages: thread.messages ? thread.messages.map(m => ({ ...m, id: `m${Date.now()}-${Math.random().toString(36).substr(2, 9)}` })) : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      time: 'Just now'
    };

    project.threads.push(forkedThread);
    return forkedThread;
  }

  async deleteThread(projectId: string, threadId: string): Promise<void> {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.threads = project.threads.filter(t => t.id !== threadId);
    }
  }

  async addMessage(projectId: string, threadId: string, message: Omit<IMessage, 'id'>): Promise<IMessage> {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    const thread = project.threads.find(t => t.id === threadId);
    if (!thread) throw new Error(`Thread ${threadId} not found`);

    const newMessage: IMessage = {
      ...message,
      id: `m${Date.now()}`
    };
    if (!thread.messages) {
      thread.messages = [];
    }
    thread.messages.push(newMessage);
    return newMessage;
  }

  async editMessage(projectId: string, threadId: string, messageId: string, updates: Partial<IMessage>): Promise<void> {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;
    const thread = project.threads.find(t => t.id === threadId);
    if (!thread || !thread.messages) return;
    const message = thread.messages.find(m => m.id === messageId);
    if (message) {
      Object.assign(message, updates);
    }
  }

  async deleteMessage(projectId: string, threadId: string, messageId: string): Promise<void> {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;
    const thread = project.threads.find(t => t.id === threadId);
    if (!thread || !thread.messages) return;
    thread.messages = thread.messages.filter(m => m.id !== messageId);
  }
}
