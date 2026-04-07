import { IProject, IThread, IMessage } from 'sdkwork-ide-types';

export interface IProjectService {
  /**
   * Retrieves all projects and their associated threads.
   * @param workspaceId Optional workspace ID to filter projects.
   */
  getProjects(workspaceId?: string): Promise<IProject[]>;

  /**
   * Creates a new project.
   * @param workspaceId The ID of the workspace.
   * @param name The name of the new project.
   */
  createProject(workspaceId: string, name: string): Promise<IProject>;

  /**
   * Creates a new thread within a specific project.
   * @param projectId The ID of the project.
   * @param name The name of the new thread.
   */
  createThread(projectId: string, name: string): Promise<IThread>;

  /**
   * Renames a project.
   */
  renameProject(projectId: string, name: string): Promise<void>;

  /**
   * Updates a project.
   */
  updateProject(projectId: string, updates: Partial<IProject>): Promise<void>;

  /**
   * Deletes a project.
   */
  deleteProject(projectId: string): Promise<void>;

  /**
   * Renames a thread.
   */
  renameThread(projectId: string, threadId: string, name: string): Promise<void>;

  /**
   * Updates a thread.
   */
  updateThread(projectId: string, threadId: string, updates: Partial<IThread>): Promise<void>;

  /**
   * Forks a thread.
   */
  forkThread(projectId: string, threadId: string, newName?: string): Promise<IThread>;

  /**
   * Deletes a thread.
   */
  deleteThread(projectId: string, threadId: string): Promise<void>;

  /**
   * Adds a message to a thread.
   */
  addMessage(projectId: string, threadId: string, message: Omit<IMessage, 'id'>): Promise<IMessage>;

  /**
   * Edits a message in a thread.
   */
  editMessage(projectId: string, threadId: string, messageId: string, updates: Partial<IMessage>): Promise<void>;

  /**
   * Deletes a message from a thread.
   */
  deleteMessage(projectId: string, threadId: string, messageId: string): Promise<void>;
}
