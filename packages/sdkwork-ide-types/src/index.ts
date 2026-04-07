declare global {
  interface Window {
    __TAURI__?: any;
  }
}

export type AppTab = 'code' | 'studio' | 'terminal' | 'settings' | 'auth' | 'user' | 'skills' | 'templates';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface IWorkspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
  content?: string;
  originalContent?: string;
}

export interface CommandExecution {
  command: string;
  status: 'running' | 'success' | 'error';
  output?: string;
}

export interface TaskProgress {
  total: number;
  completed: number;
}

export interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: number;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
  fileChanges?: FileChange[];
  commands?: CommandExecution[];
  taskProgress?: TaskProgress;
}

export interface IThread {
  id: string;
  sessionId?: string;
  name: string;
  time: string;
  createdAt?: number;
  updatedAt?: number;
  messages?: IMessage[];
  pinned?: boolean;
  archived?: boolean;
  unread?: boolean;
}

export interface ISession {
  id: string;
  projectId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
  threads: IThread[];
}

export interface IFileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: IFileNode[];
}

export interface IProject {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  path?: string;
  createdAt?: number;
  updatedAt?: number;
  sessions?: ISession[];
  threads: IThread[];
  archived?: boolean;
}
