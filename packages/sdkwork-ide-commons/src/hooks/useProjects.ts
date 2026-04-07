import { useState, useEffect, useMemo } from 'react';
import { IProject, IMessage, IThread } from 'sdkwork-ide-types';
import { useIDEServices } from '../context/IDEContext';

// Advanced fuzzy search algorithm with scoring
function fuzzyScore(pattern: string, str: string): number {
  if (!pattern) return 1;
  if (!str) return 0;
  
  let patternIdx = 0;
  let strIdx = 0;
  let score = 0;
  const patternLen = pattern.length;
  const strLen = str.length;

  while (patternIdx < patternLen && strIdx < strLen) {
    if (pattern[patternIdx].toLowerCase() === str[strIdx].toLowerCase()) {
      score += 10; // Base score for a match
      if (patternIdx === strIdx) {
        score += 5; // Bonus for exact position match
      }
      patternIdx++;
    }
    strIdx++;
  }

  return patternIdx === patternLen ? score : 0;
}

export function useProjects(workspaceId?: string) {
  const { projectService, chatEngine } = useIDEServices();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjects(workspaceId);
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setProjects([]); // Clear projects immediately when workspace changes
    fetchProjects();
  }, [workspaceId]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    
    const query = searchQuery.trim();
    const scoredProjects = projects.map(project => {
      const projectScore = fuzzyScore(query, project.name);
      
      const scoredThreads = project.threads.map(thread => ({
        thread,
        score: fuzzyScore(query, thread.name)
      })).filter(t => t.score > 0).sort((a, b) => b.score - a.score);
      
      const maxThreadScore = scoredThreads.length > 0 ? scoredThreads[0].score : 0;
      const totalScore = Math.max(projectScore, maxThreadScore);
      
      if (totalScore > 0) {
        return {
          project: { ...project, threads: scoredThreads.map(t => t.thread) },
          score: totalScore
        };
      }
      return null;
    }).filter(Boolean) as { project: IProject, score: number }[];

    return scoredProjects.sort((a, b) => b.score - a.score).map(p => p.project);
  }, [projects, searchQuery]);

  const createProject = async (name: string) => {
    if (!workspaceId) {
      setError('Workspace ID is required to create a project');
      throw new Error('Workspace ID is required to create a project');
    }
    try {
      const newProject = await projectService.createProject(workspaceId, name);
      await fetchProjects(); // Refresh list
      return newProject;
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      throw err;
    }
  };

  const createThread = async (projectId: string, name: string) => {
    try {
      const newThread = await projectService.createThread(projectId, name);
      await fetchProjects(); // Refresh list
      return newThread;
    } catch (err: any) {
      setError(err.message || 'Failed to create thread');
      throw err;
    }
  };

  const renameProject = async (projectId: string, name: string) => {
    try {
      await projectService.renameProject(projectId, name);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to rename project');
    }
  };

  const updateProject = async (projectId: string, updates: Partial<IProject>) => {
    try {
      await projectService.updateProject(projectId, updates);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
    }
  };

  const renameThread = async (projectId: string, threadId: string, name: string) => {
    try {
      await projectService.renameThread(projectId, threadId, name);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to rename thread');
    }
  };

  const updateThread = async (projectId: string, threadId: string, updates: Partial<IThread>) => {
    try {
      await projectService.updateThread(projectId, threadId, updates);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to update thread');
    }
  };

  const forkThread = async (projectId: string, threadId: string, newName?: string) => {
    try {
      const newThread = await projectService.forkThread(projectId, threadId, newName);
      await fetchProjects();
      return newThread;
    } catch (err: any) {
      setError(err.message || 'Failed to fork thread');
      throw err;
    }
  };

  const deleteThread = async (projectId: string, threadId: string) => {
    try {
      await projectService.deleteThread(projectId, threadId);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to delete thread');
    }
  };

  const addMessage = async (projectId: string, threadId: string, message: Omit<IMessage, 'id'>) => {
    try {
      const newMsg = await projectService.addMessage(projectId, threadId, message);
      await fetchProjects();
      return newMsg;
    } catch (err: any) {
      setError(err.message || 'Failed to add message');
      throw err;
    }
  };

  const editMessage = async (projectId: string, threadId: string, messageId: string, updates: Partial<IMessage>) => {
    try {
      await projectService.editMessage(projectId, threadId, messageId, updates);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to edit message');
    }
  };

  const deleteMessage = async (projectId: string, threadId: string, messageId: string) => {
    try {
      await projectService.deleteMessage(projectId, threadId, messageId);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to delete message');
    }
  };

  const sendMessage = async (projectId: string, threadId: string, content: string, context?: any) => {
    try {
      const newMsg = await projectService.addMessage(projectId, threadId, { role: 'user', content });
      await fetchProjects();
      
      const project = projects.find(p => p.id === projectId);
      const thread = project?.threads.find(t => t.id === threadId);
      
      if (thread) {
        const messages = thread.messages.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system' | 'tool',
          content: m.content,
          timestamp: Date.now()
        }));
        
        messages.push({
          id: newMsg.id,
          role: 'user',
          content,
          timestamp: Date.now()
        });

        const assistantMsg = await projectService.addMessage(projectId, threadId, { 
          role: 'assistant', 
          content: '' 
        });
        await fetchProjects();

        try {
          const stream = chatEngine.sendMessageStream(messages, { context });
          let fullContent = '';
          let fileChanges: any[] = [];
          let commands: any[] = [];
          let toolCalls: any[] = [];
          
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;

            let updated = false;
            if (delta.content) {
              fullContent += delta.content;
              updated = true;
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                toolCalls.push(tc);
                if (tc.function.name === 'edit_file') {
                  try {
                    const args = JSON.parse(tc.function.arguments);
                    fileChanges.push({
                      path: args.path,
                      content: args.content,
                      additions: args.content.split('\n').length,
                      deletions: 0
                    });
                    updated = true;
                  } catch (e) {}
                } else if (tc.function.name === 'run_command') {
                  try {
                    const args = JSON.parse(tc.function.arguments);
                    commands.push({
                      command: args.command,
                      status: 'success',
                      output: 'Command executed successfully.'
                    });
                    updated = true;
                  } catch (e) {}
                }
              }
            }

            if (updated) {
              await projectService.editMessage(projectId, threadId, assistantMsg.id, { 
                content: fullContent,
                tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
                fileChanges: fileChanges.length > 0 ? fileChanges : undefined,
                commands: commands.length > 0 ? commands : undefined
              });
              await fetchProjects();
            }
          }
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          await projectService.editMessage(projectId, threadId, assistantMsg.id, { content: "Error generating response." });
          await fetchProjects();
        }
      }
      
      return newMsg;
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      throw err;
    }
  };

  return {
    projects: filteredProjects,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    createProject,
    createThread,
    renameProject,
    updateProject,
    deleteProject,
    renameThread,
    updateThread,
    forkThread,
    deleteThread,
    addMessage,
    editMessage,
    deleteMessage,
    sendMessage,
    refreshProjects: fetchProjects
  };
}
