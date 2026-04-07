export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface Attachment {
  id: string;
  type: 'file' | 'code_snippet' | 'terminal_output' | 'image';
  name: string;
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
  };
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  name?: string; // For tool calls
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  attachments?: Attachment[];
}

export interface FileContext {
  path: string;
  content: string;
  language: string;
  selection?: {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
  };
  diagnostics?: {
    severity: 'error' | 'warning' | 'info' | 'hint';
    message: string;
    line: number;
    column: number;
  }[];
  symbols?: {
    name: string;
    kind: string;
    range: { startLine: number; endLine: number };
  }[];
  relatedFiles?: string[]; // Files imported by or importing this file
}

export interface ChatContext {
  workspaceId?: string;
  projectId?: string;
  threadId?: string;
  sessionId?: string;
  workspaceRoot?: string;
  currentFile?: FileContext;
  openFiles?: FileContext[];
  recentFiles?: string[];
  terminalOutput?: string;
  gitState?: {
    branch: string;
    modifiedFiles: string[];
    untrackedFiles: string[];
    commitHash?: string;
  };
  workspaceState?: {
    isIndexing: boolean;
    indexedFilesCount: number;
    totalFilesCount: number;
  };
  environment?: {
    os: string;
    editor: string;
    version: string;
    shell?: string;
  };
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  tools?: Tool[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  signal?: AbortSignal;
  context?: ChatContext;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }[];
}

export interface IChatSession {
  id: string;
  projectId: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface IChatThread {
  id: string;
  sessionId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ICodeEngineConfig {
  endpoint: string;
  apiKey?: string;
  organization?: string;
  project?: string;
  version?: string;
}

export interface IChatEngine {
  name: string;
  version: string;
  
  // Initialization
  initialize?(config: ICodeEngineConfig): Promise<void>;
  
  // Core generation
  sendMessage(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  sendMessageStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatStreamChunk, void, unknown>;
  
  // Session & Thread Management (Optional, if engine manages state remotely)
  createSession?(projectId: string): Promise<IChatSession>;
  getSession?(sessionId: string): Promise<IChatSession | null>;
  createThread?(sessionId: string, title?: string): Promise<IChatThread>;
  getThread?(threadId: string): Promise<IChatThread | null>;
  addMessageToThread?(threadId: string, message: ChatMessage): Promise<void>;
  
  // Context Management
  updateContext?(context: ChatContext): void;
  
  // Tool Execution Callback (if engine delegates tool execution to IDE)
  onToolCall?(toolCall: ToolCall): Promise<string>;
}
