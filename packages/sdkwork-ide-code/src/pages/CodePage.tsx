import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { useProjects, useFileSystem, useToast, useIDEServices, useThreadActions, openLocalFolder } from 'sdkwork-ide-commons';
import { UniversalChat, FileExplorer, CodeEditor, DiffEditor, Button, ResizeHandle } from 'sdkwork-ide-ui';
import { TerminalPage } from 'sdkwork-ide-terminal';
import { FileChange } from 'sdkwork-ide-types';
import { X, Zap, FolderPlus, FileCode2, Terminal, GitBranch, CheckCircle2, Search } from 'lucide-react';

interface CodePageProps {
  workspaceId?: string;
  projectId?: string;
  onProjectChange?: (projectId: string) => void;
}

export function CodePage({ workspaceId, projectId, onProjectChange }: CodePageProps) {
  const { 
    projects, 
    isLoading, 
    searchQuery,
    setSearchQuery,
    createProject, 
    createThread, 
    renameProject, 
    updateProject,
    deleteProject, 
    renameThread, 
    updateThread,
    deleteThread,
    addMessage,
    editMessage,
    deleteMessage,
    sendMessage,
    forkThread
  } = useProjects(workspaceId);

  const { addToast } = useToast();
  const { switchChatEngine, fileSystemService } = useIDEServices();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'editor'>('ai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  
  useEffect(() => {
    switchChatEngine(selectedModel);
  }, [selectedModel, switchChatEngine]);

  const [viewingDiff, setViewingDiff] = useState<FileChange | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalRequest, setTerminalRequest] = useState<{ path?: string; command?: string; timestamp: number }>();
  const [terminalHeight, setTerminalHeight] = useState(256);
  const [chatWidth, setChatWidth] = useState(400);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isFindVisible, setIsFindVisible] = useState(false);
  const [isQuickOpenVisible, setIsQuickOpenVisible] = useState(false);
  const [isRunConfigVisible, setIsRunConfigVisible] = useState(false);
  const [isDebugConfigVisible, setIsDebugConfigVisible] = useState(false);
  const [isRunTaskVisible, setIsRunTaskVisible] = useState(false);
  const [quickOpenQuery, setQuickOpenQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ path: string, line: number, content: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'thread' | 'project' | 'message';
    id: string;
    parentId?: string;
  } | null>(null);

  // Determine the current project ID based on selected thread, or the prop
  const threadProjectId = projects.find(p => p.threads.some(t => t.id === selectedThreadId))?.id;
  const currentProjectId = threadProjectId || projectId || '';

  // Sync the current project ID up to the AppContent state if it changes due to thread selection
  useEffect(() => {
    if (threadProjectId && threadProjectId !== projectId && onProjectChange) {
      onProjectChange(threadProjectId);
    }
  }, [threadProjectId, projectId, onProjectChange]);

  // Clear selectedThreadId if it's no longer in the current projects (e.g., workspace changed)
  useEffect(() => {
    if (selectedThreadId && !projects.some(p => p.threads.some(t => t.id === selectedThreadId))) {
      setSelectedThreadId(null);
    }
  }, [projects, selectedThreadId]);

  useEffect(() => {
    const handleCloseTerminal = () => setIsTerminalOpen(false);
    const handleOpenTerminal = (path?: string, command?: string) => {
      setIsTerminalOpen(true);
      setTerminalRequest({ path, command, timestamp: Date.now() });
    };
    const handleToggleTerminal = () => setIsTerminalOpen(prev => !prev);
    const handleToggleSidebar = () => setIsSidebarVisible(prev => !prev);
    const handleToggleDiffPanel = () => {
      setViewingDiff(prev => {
        if (prev) return null;
        addToast('No active diff to show', 'info');
        return null;
      });
    };
    const handleFindInFiles = () => {
      setIsFindVisible(true);
      setSearchResults([]);
    };
    const handleOpenQuickOpen = () => {
      setIsQuickOpenVisible(true);
      setQuickOpenQuery('');
    };
    const handlePreviousThread = () => {
      if (!selectedThreadId) return;
      const allThreads = projects.flatMap(p => p.threads);
      const currentIndex = allThreads.findIndex(t => t.id === selectedThreadId);
      if (currentIndex > 0) {
        setSelectedThreadId(allThreads[currentIndex - 1].id);
      }
    };
    const handleNextThread = () => {
      if (!selectedThreadId) return;
      const allThreads = projects.flatMap(p => p.threads);
      const currentIndex = allThreads.findIndex(t => t.id === selectedThreadId);
      if (currentIndex !== -1 && currentIndex < allThreads.length - 1) {
        setSelectedThreadId(allThreads[currentIndex + 1].id);
      }
    };
    const handleSaveActiveFile = () => {
      // The file is auto-saved on change, but we can show a toast
      addToast('File saved', 'success');
    };
    const handleSaveAllFiles = () => {
      addToast('All files saved', 'success');
    };
    const handleStartDebugging = () => {
      setIsDebugConfigVisible(true);
    };
    const handleRunWithoutDebugging = () => {
      import('sdkwork-ide-commons').then(({ globalEventBus }) => {
        globalEventBus.emit('openTerminal');
        globalEventBus.emit('terminalRequest', { command: 'npm start', timestamp: Date.now() });
      });
      addToast('Starting application...', 'info');
    };
    const handleAddRunConfiguration = () => {
      setIsRunConfigVisible(true);
    };
    const handleRunTask = () => {
      setIsRunTaskVisible(true);
    };
    const handleTerminalRequest = (req: { path?: string; command?: string; timestamp: number }) => {
      setTerminalRequest(req);
      setIsTerminalOpen(true);
    };
    const handleRevealInExplorer = async (path: string) => {
      try {
        if (window.__TAURI__) {
          const { open } = await import('@tauri-apps/plugin-shell');
          await open(path);
        } else {
          addToast(`Revealed in OS Explorer: ${path}`, 'info');
        }
      } catch (e) {
        console.error('Failed to reveal in explorer', e);
        addToast(`Revealed in OS Explorer: ${path}`, 'info');
      }
    };
    const handleCreateNewThread = async () => {
      if (currentProjectId) {
        try {
          const newThread = await createThread(currentProjectId, 'New Thread');
          setSelectedThreadId(newThread.id);
          addToast('New thread created', 'success');
        } catch (error) {
          console.error("Failed to create thread", error);
          addToast('Failed to create thread', 'error');
        }
      } else {
        addToast('Please select a project first', 'error');
      }
    };
    
    import('sdkwork-ide-commons').then(({ globalEventBus }) => {
      globalEventBus.on('closeTerminal', handleCloseTerminal);
      globalEventBus.on('openTerminal', handleOpenTerminal);
      globalEventBus.on('toggleTerminal', handleToggleTerminal);
      globalEventBus.on('toggleSidebar', handleToggleSidebar);
      globalEventBus.on('toggleDiffPanel', handleToggleDiffPanel);
      globalEventBus.on('findInFiles', handleFindInFiles);
      globalEventBus.on('openQuickOpen', handleOpenQuickOpen);
      globalEventBus.on('previousThread', handlePreviousThread);
      globalEventBus.on('nextThread', handleNextThread);
      globalEventBus.on('saveActiveFile', handleSaveActiveFile);
      globalEventBus.on('saveAllFiles', handleSaveAllFiles);
      globalEventBus.on('startDebugging', handleStartDebugging);
      globalEventBus.on('runWithoutDebugging', handleRunWithoutDebugging);
      globalEventBus.on('addRunConfiguration', handleAddRunConfiguration);
      globalEventBus.on('runTask', handleRunTask);
      globalEventBus.on('terminalRequest', handleTerminalRequest);
      globalEventBus.on('revealInExplorer', handleRevealInExplorer);
      globalEventBus.on('createNewThread', handleCreateNewThread);
    });
    return () => {
      import('sdkwork-ide-commons').then(({ globalEventBus }) => {
        globalEventBus.off('closeTerminal', handleCloseTerminal);
        globalEventBus.off('openTerminal', handleOpenTerminal);
        globalEventBus.off('toggleTerminal', handleToggleTerminal);
        globalEventBus.off('toggleSidebar', handleToggleSidebar);
        globalEventBus.off('toggleDiffPanel', handleToggleDiffPanel);
        globalEventBus.off('findInFiles', handleFindInFiles);
        globalEventBus.off('openQuickOpen', handleOpenQuickOpen);
        globalEventBus.off('previousThread', handlePreviousThread);
        globalEventBus.off('nextThread', handleNextThread);
        globalEventBus.off('saveActiveFile', handleSaveActiveFile);
        globalEventBus.off('saveAllFiles', handleSaveAllFiles);
        globalEventBus.off('startDebugging', handleStartDebugging);
        globalEventBus.off('runWithoutDebugging', handleRunWithoutDebugging);
        globalEventBus.off('addRunConfiguration', handleAddRunConfiguration);
        globalEventBus.off('runTask', handleRunTask);
        globalEventBus.off('terminalRequest', handleTerminalRequest);
        globalEventBus.off('revealInExplorer', handleRevealInExplorer);
        globalEventBus.off('createNewThread', handleCreateNewThread);
      });
    };
  }, [selectedThreadId, projects, currentProjectId, createThread, addToast]);

  const { files, selectedFile, fileContent, selectFile, saveFile, saveFileContent, createFile, createFolder, deleteFile, deleteFolder, renameNode, searchFiles, mountFolder } = useFileSystem(currentProjectId);

  const getLanguageFromPath = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    return 'plaintext';
  };

  useThreadActions(currentProjectId, createThread, setSelectedThreadId);

  const handleRenameThread = async (threadId: string, newName?: string) => {
    if (newName && newName.trim()) {
      const project = projects.find(p => p.threads.some(t => t.id === threadId));
      if (project) {
        await renameThread(project.id, threadId, newName.trim());
      }
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    setDeleteConfirmation({ type: 'thread', id: threadId });
  };

  const executeDeleteThread = async (threadId: string) => {
    const project = projects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      await deleteThread(project.id, threadId);
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
      }
      addToast('Thread deleted successfully', 'success');
    }
  };

  const handleRenameProject = async (projectId: string, newName?: string) => {
    if (newName && newName.trim()) {
      await renameProject(projectId, newName.trim());
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeleteConfirmation({ type: 'project', id: projectId });
  };

  const executeDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project && project.threads.some(t => t.id === selectedThreadId)) {
      setSelectedThreadId(null);
    }
    addToast('Project deleted successfully', 'success');
  };

  const handleNewProject = async () => {
    try {
      const newProject = await createProject('New Project');
      if (onProjectChange) onProjectChange(newProject.id);
      addToast('Project created successfully', 'success');
      return newProject.id;
    } catch (error) {
      console.error("Failed to create project", error);
      addToast('Failed to create project', 'error');
      return undefined;
    }
  };

  const handleOpenFolder = async () => {
    try {
      const folderInfo = await openLocalFolder();
      if (folderInfo) {
        let projectName = 'Local Folder';
        if (folderInfo.type === 'browser' && folderInfo.handle) {
          projectName = folderInfo.handle.name;
        } else if (folderInfo.type === 'tauri' && folderInfo.path) {
          const parts = folderInfo.path.split(/[/\\]/);
          projectName = parts[parts.length - 1] || 'Local Folder';
        }
        
        const newProject = await createProject(projectName);
        
        if (fileSystemService && 'mountFolder' in fileSystemService) {
          await (fileSystemService as any).mountFolder(newProject.id, folderInfo);
        }
        
        if (onProjectChange) onProjectChange(newProject.id);
        addToast(`Opened folder: ${projectName}`, 'success');
      }
    } catch (error) {
      console.error("Failed to open folder", error);
      addToast('Failed to open folder', 'error');
    }
  };

  const handleNewThreadInProject = async (projectId: string) => {
    try {
      const newThread = await createThread(projectId, 'New Thread');
      setSelectedThreadId(newThread.id);
      addToast('Thread created successfully', 'success');
      setTimeout(() => {
        import('sdkwork-ide-commons').then(({ globalEventBus }) => {
          globalEventBus.emit('focusChatInput');
        });
      }, 100);
    } catch (error) {
      console.error("Failed to create thread", error);
      addToast('Failed to create thread', 'error');
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      await updateProject(projectId, { archived: !project.archived });
      addToast(`${!project.archived ? 'Archived' : 'Unarchived'} project: ${project.name}`, 'info');
    }
  };

  const handleCopyWorkingDirectory = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      navigator.clipboard.writeText(`/workspace/${project.name}`);
      addToast(`Copied workspace directory: /workspace/${project.name}`, 'success');
    }
  };

  const handleOpenInTerminal = (projectId: string, command?: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      import('sdkwork-ide-commons').then(({ globalEventBus }) => {
        globalEventBus.emit('openTerminal', `/workspace/${project.name}`, command);
      });
      addToast(`Opened project in terminal: ${project.name}`, 'info');
    }
  };

  const handlePinThread = async (threadId: string) => {
    const project = projects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      const thread = project.threads.find(t => t.id === threadId);
      if (thread) {
        await updateThread(project.id, threadId, { pinned: !thread.pinned });
        addToast(`${!thread.pinned ? 'Pinned' : 'Unpinned'} thread: ${thread.name}`, 'success');
      }
    }
  };

  const handleArchiveThread = async (threadId: string) => {
    const project = projects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      await updateThread(project.id, threadId, { archived: true });
      addToast(`Archived thread: ${threadId}`, 'info');
    }
  };

  const handleMarkThreadUnread = async (threadId: string) => {
    const project = projects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      const thread = project.threads.find(t => t.id === threadId);
      if (thread) {
        await updateThread(project.id, threadId, { unread: !thread.unread });
        addToast(`Marked as ${!thread.unread ? 'unread' : 'read'}: ${thread.name}`, 'info');
      }
    }
  };

  const handleCopyThreadWorkingDirectory = (threadId: string) => {
    navigator.clipboard.writeText(`/workspace/thread/${threadId}`);
    addToast(`Copied thread workspace directory: /workspace/thread/${threadId}`, 'success');
  };

  const handleCopyThreadSessionId = (threadId: string) => {
    navigator.clipboard.writeText(threadId);
    addToast(`Copied session ID: ${threadId}`, 'success');
  };

  const handleCopyThreadDeeplink = (threadId: string) => {
    const link = `${window.location.origin}/thread/${threadId}`;
    navigator.clipboard.writeText(link);
    addToast(`Copied Deeplink: ${link}`, 'success');
  };

  const handleForkThreadLocal = async (threadId: string) => {
    const project = projects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      try {
        const newThread = await forkThread(project.id, threadId);
        setSelectedThreadId(newThread.id);
        addToast(`Forked to local: ${newThread.name}`, 'success');
      } catch (err) {
        addToast('Failed to fork thread', 'error');
      }
    }
  };

  const handleForkThreadNewTree = async (threadId: string) => {
    const project = projects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      try {
        const newThread = await forkThread(project.id, threadId, `${project.threads.find(t => t.id === threadId)?.name} (New Tree)`);
        setSelectedThreadId(newThread.id);
        addToast(`Forked to new worktree: ${newThread.name}`, 'success');
      } catch (err) {
        addToast('Failed to fork thread', 'error');
      }
    }
  };

  const handleEditMessage = (threadId: string, messageId: string) => {
    const thread = projects.flatMap(p => p.threads).find(t => t.id === threadId);
    const msg = thread?.messages?.find(m => m.id === messageId);
    if (msg) {
      setInputValue(msg.content);
    }
  };

  const handleDeleteMessage = async (threadId: string, messageId: string) => {
    setDeleteConfirmation({ type: 'message', id: messageId, parentId: threadId });
  };

  const executeDeleteMessage = async (threadId: string, messageId: string) => {
    const project = projects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      await deleteMessage(project.id, threadId, messageId);
      addToast('Message deleted successfully', 'success');
    }
  };

  const handleRegenerateMessage = async (threadId: string) => {
    const project = projects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      const thread = project.threads.find(t => t.id === threadId);
      if (thread && thread.messages && thread.messages.length > 0) {
        // Find the last user message
        const lastUserMsgIndex = [...thread.messages].reverse().findIndex(m => m.role === 'user');
        if (lastUserMsgIndex !== -1) {
          const actualIndex = thread.messages.length - 1 - lastUserMsgIndex;
          const lastUserMsg = thread.messages[actualIndex];
          
          // Delete all messages including the last user message
          for (let i = thread.messages.length - 1; i >= actualIndex; i--) {
            await deleteMessage(project.id, threadId, thread.messages[i].id);
          }
          
          // Resend the last user message content
          setIsSending(true);
          try {
            const context = {
              workspaceId,
              projectId: project.id,
              threadId: thread.id,
              currentFile: selectedFile ? {
                path: selectedFile,
                content: fileContent,
                language: getLanguageFromPath(selectedFile)
              } : undefined
            };
            await sendMessage(project.id, threadId, lastUserMsg.content, context);
          } finally {
            setIsSending(false);
          }
        }
      }
    }
  };

  const handleRestoreMessage = async (threadId: string, messageId: string) => {
    const thread = projects.flatMap(p => p.threads).find(t => t.id === threadId);
    const msg = thread?.messages?.find(m => m.id === messageId);
    if (msg && msg.fileChanges) {
      for (const change of msg.fileChanges) {
        if (change.originalContent !== undefined) {
          await saveFileContent(change.path, change.originalContent);
        } else {
          // If originalContent is undefined, it means the file was created in this message.
          // So restoring means deleting the file.
          await deleteFile(change.path);
        }
      }
      addToast('Restored files to previous state', 'success');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    let currentThreadId = selectedThreadId;
    let projectIdToUse = currentProjectId;

    if (!currentThreadId) {
      if (!projectIdToUse) {
        if (projects.length === 0) {
          const newProject = await createProject('New Project');
          projectIdToUse = newProject.id;
        } else {
          projectIdToUse = projects[0].id;
        }
      }
      const newTitle = inputValue.slice(0, 20) + (inputValue.length > 20 ? '...' : '');
      const newThread = await createThread(projectIdToUse, newTitle);
      currentThreadId = newThread.id;
      if (onProjectChange) onProjectChange(projectIdToUse);
      setSelectedThreadId(currentThreadId);
    }

    if (projectIdToUse && currentThreadId) {
      const content = inputValue;
      setInputValue('');
      setIsSending(true);
      try {
        const context = {
          workspaceId,
          projectId: projectIdToUse,
          threadId: currentThreadId,
          currentFile: selectedFile ? {
            path: selectedFile,
            content: fileContent,
            language: getLanguageFromPath(selectedFile)
          } : undefined
        };
        await sendMessage(projectIdToUse, currentThreadId, content, context);
      } finally {
        setIsSending(false);
      }
    }
  };

  const currentProject = projects.find(p => p.id === currentProjectId);
  const selectedThread = projects.flatMap(p => p.threads).find(t => t.id === selectedThreadId);

  const handleProjectSelect = (id: string | null) => {
    if (id && onProjectChange) {
      onProjectChange(id);
      // If the selected thread doesn't belong to the newly selected project, clear it
      if (selectedThreadId) {
        const threadBelongsToProject = projects.find(p => p.id === id)?.threads.some(t => t.id === selectedThreadId);
        if (!threadBelongsToProject) {
          setSelectedThreadId(null);
        }
      }
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0e0e11] text-gray-100 font-sans selection:bg-white/10 selection:text-white">
      {isSidebarVisible && (
        <>
          <Sidebar 
            width={sidebarWidth}
            projects={projects}
            selectedProjectId={currentProjectId}
            selectedThreadId={selectedThreadId}
            onSelectProject={handleProjectSelect}
            onSelectThread={setSelectedThreadId}
            onRenameThread={handleRenameThread}
            onDeleteThread={handleDeleteThread}
            onRenameProject={handleRenameProject}
            onDeleteProject={handleDeleteProject}
            onNewProject={handleNewProject}
            onOpenFolder={handleOpenFolder}
            onNewThreadInProject={handleNewThreadInProject}
            onArchiveProject={handleArchiveProject}
            onCopyWorkingDirectory={handleCopyWorkingDirectory}
            onOpenInTerminal={handleOpenInTerminal}
            onPinThread={handlePinThread}
            onArchiveThread={handleArchiveThread}
            onMarkThreadUnread={handleMarkThreadUnread}
            onCopyThreadWorkingDirectory={handleCopyThreadWorkingDirectory}
            onCopyThreadSessionId={handleCopyThreadSessionId}
            onCopyThreadDeeplink={handleCopyThreadDeeplink}
            onForkThreadLocal={handleForkThreadLocal}
            onForkThreadNewTree={handleForkThreadNewTree}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <ResizeHandle 
            direction="horizontal" 
            onResize={(delta) => setSidebarWidth(prev => Math.max(200, Math.min(600, prev + delta)))} 
          />
        </>
      )}

      <div className="flex-1 flex flex-col relative bg-[#0e0e11] shadow-[-4px_0_24px_-4px_rgba(0,0,0,0.5)] overflow-hidden">
        {isFindVisible && (
          <div className="absolute top-16 right-1/2 translate-x-1/2 w-[32rem] max-h-[80vh] flex flex-col bg-[#18181b] border border-white/10 rounded-lg shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
              <h3 className="text-sm font-medium text-gray-200">{t('app.findInFiles')}</h3>
              <button onClick={() => setIsFindVisible(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 shrink-0">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={t('app.searchPlaceholder')} 
                  className="w-full bg-[#0e0e11] border border-white/10 rounded-md px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const query = e.currentTarget.value;
                      if (!query.trim()) return;
                      setIsSearching(true);
                      try {
                        const results = await searchFiles(query);
                        setSearchResults(results);
                        if (results.length === 0) {
                          addToast(t('app.noResultsFound'), 'info');
                        }
                      } finally {
                        setIsSearching(false);
                      }
                    } else if (e.key === 'Escape') {
                      setIsFindVisible(false);
                    }
                  }}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
            {searchResults.length > 0 && (
              <div className="overflow-y-auto p-2 border-t border-white/5">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-md group flex flex-col gap-1"
                    onClick={() => {
                      selectFile(result.path);
                      setIsFindVisible(false);
                    }}
                  >
                    <div className="text-xs font-medium text-blue-400 group-hover:text-blue-300 truncate">
                      {result.path}:{result.line}
                    </div>
                    <div className="text-sm text-gray-300 truncate font-mono">
                      {result.content}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {isQuickOpenVisible && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[600px] bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center p-2 border-b border-white/10">
              <Search size={16} className="text-gray-400 ml-2" />
              <input
                type="text"
                autoFocus
                placeholder="Search files by name..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 px-3 py-1.5 placeholder:text-gray-500"
                value={quickOpenQuery}
                onChange={(e) => {
                  setQuickOpenQuery(e.target.value);
                  // Basic client-side filtering of files
                  const query = e.target.value.toLowerCase();
                  if (!query) {
                    setSearchResults([]);
                    return;
                  }
                  
                  const results: { path: string, line: number, content: string }[] = [];
                  const searchTree = (nodes: any[], currentPath: string = '') => {
                    for (const node of nodes) {
                      const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
                      if (node.type === 'file' && node.name.toLowerCase().includes(query)) {
                        results.push({ path: nodePath, line: 1, content: 'File match' });
                      }
                      if (node.children) {
                        searchTree(node.children, nodePath);
                      }
                    }
                  };
                  searchTree(files);
                  setSearchResults(results);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsQuickOpenVisible(false);
                  } else if (e.key === 'Enter' && searchResults.length > 0) {
                    selectFile(searchResults[0].path);
                    setIsQuickOpenVisible(false);
                  }
                }}
              />
              <button 
                className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsQuickOpenVisible(false)}
              >
                <X size={14} />
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto p-2">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-md group flex items-center gap-3"
                    onClick={() => {
                      selectFile(result.path);
                      setIsQuickOpenVisible(false);
                    }}
                  >
                    <FileCode2 size={14} className="text-gray-500 group-hover:text-blue-400" />
                    <div className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                      {result.path}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {quickOpenQuery && searchResults.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No files found matching "{quickOpenQuery}"
              </div>
            )}
          </div>
        )}

        {isRunConfigVisible && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-200">{t('app.runConfiguration')}</h3>
              <button onClick={() => setIsRunConfigVisible(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('app.name')}</label>
                <input type="text" defaultValue="Start Development Server" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('app.command')}</label>
                <input type="text" defaultValue="npm run dev" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setIsRunConfigVisible(false)}>{t('app.cancel')}</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => {
                  addToast(t('app.runningConfiguration'), 'info');
                  setIsRunConfigVisible(false);
                  import('sdkwork-ide-commons').then(({ globalEventBus }) => {
                    globalEventBus.emit('openTerminal');
                    globalEventBus.emit('terminalRequest', { command: 'npm run dev', timestamp: Date.now() });
                  });
                }}>{t('app.run')}</Button>
              </div>
            </div>
          </div>
        </div>
        )}

        {isDebugConfigVisible && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-200">{t('app.debugConfiguration')}</h3>
              <button onClick={() => setIsDebugConfigVisible(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('app.name')}</label>
                <input type="text" defaultValue="Launch Chrome against localhost" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('app.url')}</label>
                <input type="text" defaultValue="http://localhost:3000" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('app.webRoot')}</label>
                <input type="text" defaultValue="${workspaceFolder}/src" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setIsDebugConfigVisible(false)}>{t('app.cancel')}</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => {
                  addToast(t('app.debuggerAttachedMock'), 'success');
                  setIsDebugConfigVisible(false);
                  import('sdkwork-ide-commons').then(({ globalEventBus }) => {
                    globalEventBus.emit('openTerminal');
                    globalEventBus.emit('terminalRequest', { command: 'npm run dev', timestamp: Date.now() });
                  });
                }}>{t('app.startDebugging')}</Button>
              </div>
            </div>
          </div>
        </div>
        )}

        {isRunTaskVisible && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-200">{t('app.runTask')}</h3>
              <button onClick={() => setIsRunTaskVisible(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <button 
                className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-md group flex items-center gap-3 transition-colors"
                onClick={() => {
                  setIsRunTaskVisible(false);
                  import('sdkwork-ide-commons').then(({ globalEventBus }) => {
                    globalEventBus.emit('openTerminal');
                    globalEventBus.emit('terminalRequest', { command: 'npm run dev', timestamp: Date.now() });
                  });
                  addToast(t('app.runningDevTask'), 'info');
                }}
              >
                <Terminal size={14} className="text-gray-500 group-hover:text-blue-400" />
                <div className="text-sm font-medium text-gray-300 group-hover:text-white">npm run dev</div>
              </button>
              <button 
                className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-md group flex items-center gap-3 transition-colors"
                onClick={() => {
                  setIsRunTaskVisible(false);
                  import('sdkwork-ide-commons').then(({ globalEventBus }) => {
                    globalEventBus.emit('openTerminal');
                    globalEventBus.emit('terminalRequest', { command: 'npm run build', timestamp: Date.now() });
                  });
                  addToast(t('app.runningBuildTask'), 'info');
                }}
              >
                <Terminal size={14} className="text-gray-500 group-hover:text-blue-400" />
                <div className="text-sm font-medium text-gray-300 group-hover:text-white">npm run build</div>
              </button>
              <button 
                className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-md group flex items-center gap-3 transition-colors"
                onClick={() => {
                  setIsRunTaskVisible(false);
                  import('sdkwork-ide-commons').then(({ globalEventBus }) => {
                    globalEventBus.emit('openTerminal');
                    globalEventBus.emit('terminalRequest', { command: 'npm test', timestamp: Date.now() });
                  });
                  addToast(t('app.runningTestTask'), 'info');
                }}
              >
                <Terminal size={14} className="text-gray-500 group-hover:text-blue-400" />
                <div className="text-sm font-medium text-gray-300 group-hover:text-white">npm test</div>
              </button>
            </div>
          </div>
        </div>
        )}

        <TopBar currentProject={currentProject} selectedThread={selectedThread} activeTab={activeTab} setActiveTab={setActiveTab} isTerminalOpen={isTerminalOpen} setIsTerminalOpen={setIsTerminalOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'ai' ? (
            <UniversalChat 
              chatId={selectedThreadId || undefined}
              messages={selectedThread?.messages || []}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSendMessage={handleSendMessage}
              isSending={isSending}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              layout="main"
              onEditMessage={(msgId) => selectedThread && handleEditMessage(selectedThread.id, msgId)}
              onDeleteMessage={(msgId) => selectedThread && handleDeleteMessage(selectedThread.id, msgId)}
              onRegenerateMessage={() => selectedThread && handleRegenerateMessage(selectedThread.id)}
              onStop={() => setIsSending(false)}
              onViewChanges={(file) => {
                setViewingDiff(file);
                setActiveTab('editor');
              }}
              onRestore={(msgId) => selectedThread && handleRestoreMessage(selectedThread.id, msgId)}
              emptyState={
                <div className="flex-1 flex flex-col items-center justify-center pb-32 bg-[#0e0e11]">
                  <div className="mb-6 flex flex-col items-center max-w-md text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-6 border border-white/5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-500">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                      <Zap size={36} className="text-blue-400 relative z-10" />
                    </div>
                    <h1 className="text-3xl font-semibold text-white mb-3 tracking-tight animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '50ms' }}>
                      What do you want to build?
                    </h1>
                    <p className="text-[15px] text-gray-400 leading-relaxed animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '100ms' }}>
                      Describe your idea, ask a question, or paste some code to get started. I can help you write code, debug errors, or build entire features.
                    </p>
                  </div>
                </div>
              }
            />
          ) : (
            <div className="flex-1 flex h-full overflow-hidden">
              <FileExplorer 
                files={files} 
                selectedFile={selectedFile || undefined} 
                basePath={`/workspace/${projects.find(p => p.id === currentProjectId)?.name || 'project'}`}
                onSelectFile={(path) => {
                  setViewingDiff(null);
                  selectFile(path);
                }} 
                onCreateFile={createFile}
                onCreateFolder={createFolder}
                onDeleteFile={deleteFile}
                onDeleteFolder={deleteFolder}
                onRenameNode={renameNode}
              />
              <div className="flex-1 h-full bg-[#0e0e11] flex flex-col border-r border-white/10 relative">
                {viewingDiff ? (
                  <>
                    <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-[#18181b] shrink-0">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-gray-500">Diff:</span>
                        <span className="font-medium">{viewingDiff.path}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="h-6 text-xs bg-green-600 hover:bg-green-500 text-white" onClick={async () => {
                          if (viewingDiff) {
                            await saveFileContent(viewingDiff.path, viewingDiff.content || '');
                            addToast(`Applied changes to ${viewingDiff.path}`, 'success');
                            setViewingDiff(null);
                          }
                        }}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs border-white/10 hover:bg-white/10" onClick={() => setViewingDiff(null)}>
                          Reject
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 hover:bg-white/10" onClick={() => setViewingDiff(null)}>
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                    <DiffEditor 
                      language={getLanguageFromPath(viewingDiff.path)}
                      original={viewingDiff.originalContent || ''}
                      modified={viewingDiff.content || ''}
                      readOnly={true}
                    />
                  </>
                ) : selectedFile ? (
                  <>
                    <div className="h-10 flex items-center bg-[#18181b] border-b border-white/5 shrink-0 overflow-x-auto custom-scrollbar">
                      <div className="flex items-center h-full px-4 bg-[#18181b]/50 border-r border-white/5 text-sm text-gray-300 min-w-max group cursor-pointer border-t-2 border-t-blue-500">
                        <FileCode2 size={14} className="mr-2 text-blue-400" />
                        {selectedFile.split('/').pop()}
                        <button 
                          className="ml-3 p-0.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectFile('');
                          }}
                        >
                          <X size={14} className="text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    </div>
                    <CodeEditor 
                      language={getLanguageFromPath(selectedFile)}
                      value={fileContent}
                      onChange={(val) => saveFile(val || '')}
                    />
                  </>
                ) : (
                  <div className="flex-1 h-full flex flex-col items-center justify-center text-gray-500 animate-in fade-in zoom-in-95 duration-300 bg-[#0e0e11]">
                    {files.length === 0 ? (
                      <div className="flex flex-col items-center max-w-sm text-center">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-6 border border-white/5 shadow-2xl relative">
                          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                          <FolderPlus size={36} className="text-blue-400 relative z-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200 mb-3 tracking-tight">{t('app.projectIsEmpty')}</h3>
                        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                          {t('app.projectIsEmptyDesc')}
                        </p>
                        <Button 
                          onClick={() => {
                            import('sdkwork-ide-commons').then(({ globalEventBus }) => {
                              globalEventBus.emit('createRootFile');
                            });
                          }}
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        >
                          <FolderPlus size={16} className="mr-2" />
                          {t('app.createFirstFile')}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center max-w-sm text-center">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#18181b] to-[#0e0e11] flex items-center justify-center mb-6 border border-white/5 shadow-2xl relative">
                          <FileCode2 size={36} className="text-gray-500 relative z-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-300 mb-2 tracking-tight">{t('app.noFileSelected')}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {t('app.noFileSelectedDesc')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <ResizeHandle 
                direction="horizontal" 
                onResize={(delta) => setChatWidth(prev => Math.max(200, Math.min(800, prev - delta)))} 
              />
              <div className="flex flex-col shrink-0 bg-[#0e0e11]" style={{ width: chatWidth }}>
                <UniversalChat 
                  chatId={selectedThreadId || undefined}
                  messages={selectedThread?.messages || []}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onSendMessage={handleSendMessage}
                  isSending={isSending}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  layout="sidebar"
                  onViewChanges={(file) => setViewingDiff(file)}
                  onRestore={(msgId) => selectedThread && handleRestoreMessage(selectedThread.id, msgId)}
                  onEditMessage={(msgId) => selectedThread && handleEditMessage(selectedThread.id, msgId)}
                  onDeleteMessage={(msgId) => selectedThread && handleDeleteMessage(selectedThread.id, msgId)}
                  onRegenerateMessage={() => selectedThread && handleRegenerateMessage(selectedThread.id)}
                  onStop={() => setIsSending(false)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Terminal Panel */}
        {isTerminalOpen && (
          <ResizeHandle 
            direction="vertical" 
            onResize={(delta) => setTerminalHeight(prev => Math.max(100, Math.min(800, prev - delta)))} 
          />
        )}
        <div 
          className={`border-white/10 shrink-0 flex flex-col bg-[#18181b] transition-all duration-300 ease-in-out ${isTerminalOpen ? 'opacity-100 border-t' : 'h-0 opacity-0 border-t-0 overflow-hidden'}`}
          style={isTerminalOpen ? { height: terminalHeight } : {}}
        >
          <TerminalPage terminalRequest={terminalRequest} projectId={currentProjectId} />
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete {deleteConfirmation.type.charAt(0).toUpperCase() + deleteConfirmation.type.slice(1)}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete this {deleteConfirmation.type}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirmation(null)}
                className="border-white/10 text-gray-300 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={() => {
                  if (deleteConfirmation.type === 'thread') {
                    executeDeleteThread(deleteConfirmation.id);
                  } else if (deleteConfirmation.type === 'project') {
                    executeDeleteProject(deleteConfirmation.id);
                  } else if (deleteConfirmation.type === 'message' && deleteConfirmation.parentId) {
                    executeDeleteMessage(deleteConfirmation.parentId, deleteConfirmation.id);
                  }
                  setDeleteConfirmation(null);
                }}
                className="bg-red-500 hover:bg-red-600 text-white border-transparent"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}