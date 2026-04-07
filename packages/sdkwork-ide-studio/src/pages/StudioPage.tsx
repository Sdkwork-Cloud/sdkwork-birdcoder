import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Settings, Copy, Share, Upload, RotateCcw, Maximize2, CheckCircle2, Trash2, MapPin, Plus, ArrowUp, Edit, Code2, Download, Mic, Folder, FolderOpen, ChevronDown, ChevronRight, Check, Search, MessageSquare, X, Terminal, MonitorPlay, Zap, FileCode2, Globe, Lock, Monitor, Smartphone, Tablet, AppWindow, RefreshCw, ExternalLink } from 'lucide-react';
import { FileExplorer, FileNode, CodeEditor, DiffEditor, Button, UniversalChat, ResizeHandle, DevicePreview, DEVICE_MODELS } from 'sdkwork-ide-ui';
import { TerminalPage } from 'sdkwork-ide-terminal';
import { useProjects, useFileSystem, useToast, useIDEServices, useThreadActions } from 'sdkwork-ide-commons';
import { FileChange } from 'sdkwork-ide-types';
import { useTranslation } from 'react-i18next';

interface StudioPageProps {
  workspaceId?: string;
  projectId?: string;
  onProjectChange?: (projectId: string) => void;
}

export function StudioPage({ workspaceId, projectId, onProjectChange }: StudioPageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { switchChatEngine, fileSystemService } = useIDEServices();
  
  const [selectedModel, setSelectedModel] = useState('gpt-4o');

  useEffect(() => {
    switchChatEngine(selectedModel);
  }, [selectedModel, switchChatEngine]);

  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const { projects: filteredProjects, searchQuery: projectSearchQuery, setSearchQuery: setProjectSearchQuery, sendMessage, createProject, createThread, addMessage, editMessage, deleteMessage } = useProjects(workspaceId);
  const { addToast } = useToast();
  
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [menuActiveProjectId, setMenuActiveProjectId] = useState<string>('');
  
  const [viewingDiff, setViewingDiff] = useState<FileChange | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(256);
  const [terminalRequest, setTerminalRequest] = useState<{ path?: string; command?: string; timestamp: number }>();
  
  const [isRunTaskVisible, setIsRunTaskVisible] = useState(false);
  const [isRunConfigVisible, setIsRunConfigVisible] = useState(false);
  const [isDebugConfigVisible, setIsDebugConfigVisible] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isFindVisible, setIsFindVisible] = useState(false);
  const [isQuickOpenVisible, setIsQuickOpenVisible] = useState(false);
  const [quickOpenQuery, setQuickOpenQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{path: string, line: number, content: string}[]>([]);
  
  const [isAnalyzeModalVisible, setIsAnalyzeModalVisible] = useState(false);
  const [analyzeReport, setAnalyzeReport] = useState<{loc: number, emptyLines: number, imports: number, functions: number, classes: number, complexity: number, maintainability: number} | null>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [shareAccess, setShareAccess] = useState<'private' | 'public'>('private');

  const [previewPlatform, setPreviewPlatform] = useState<'web' | 'miniprogram' | 'app'>('web');
  const [previewWebDevice, setPreviewWebDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMpPlatform, setPreviewMpPlatform] = useState<'wechat' | 'douyin' | 'alipay'>('wechat');
  const [previewAppPlatform, setPreviewAppPlatform] = useState<'ios' | 'android' | 'harmony'>('ios');
  const [previewDeviceModel, setPreviewDeviceModel] = useState<string>('iphone-14-pro');
  const [previewIsLandscape, setPreviewIsLandscape] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('about:blank');
  
  // Determine the current project ID based on selected thread, or the prop
  const threadProjectId = filteredProjects.find(p => p.threads.some(t => t.id === selectedThreadId))?.id;
  const currentProjectId = threadProjectId || projectId || '';

  useEffect(() => {
    const handleOpenTerminal = (path?: string, command?: string) => {
      setIsTerminalOpen(true);
      setTerminalRequest({ path, command, timestamp: Date.now() });
    };
    const handleCloseTerminal = () => {
      setIsTerminalOpen(false);
    };
    const handleToggleTerminal = () => {
      setIsTerminalOpen(prev => !prev);
    };
    const handleSplitTerminal = () => {
      addToast(t('terminal.splitTerminalNotSupported'), 'info');
    };
    const handleTerminalRequest = (req: { path?: string; command?: string; timestamp: number }) => {
      setTerminalRequest(req);
      setIsTerminalOpen(true);
    };
    const handleSaveActiveFile = () => {
      // The file is auto-saved on change, but we can show a toast
      addToast(t('studio.fileSaved'), 'success');
    };
    const handleSaveAllFiles = () => {
      addToast(t('studio.allFilesSaved'), 'success');
    };
    const handlePreviousThread = () => {
      if (!selectedThreadId) return;
      const allThreads = filteredProjects.flatMap(p => p.threads);
      const currentIndex = allThreads.findIndex(t => t.id === selectedThreadId);
      if (currentIndex > 0) {
        setSelectedThreadId(allThreads[currentIndex - 1].id);
      }
    };
    const handleNextThread = () => {
      if (!selectedThreadId) return;
      const allThreads = filteredProjects.flatMap(p => p.threads);
      const currentIndex = allThreads.findIndex(t => t.id === selectedThreadId);
      if (currentIndex !== -1 && currentIndex < allThreads.length - 1) {
        setSelectedThreadId(allThreads[currentIndex + 1].id);
      }
    };
    const handleRevealInExplorer = async (path: string) => {
      try {
        if (window.__TAURI__) {
          const { open } = await import('@tauri-apps/plugin-shell');
          await open(path);
        } else {
          addToast(t('studio.revealedInExplorer', { path }), 'info');
        }
      } catch (e) {
        console.error('Failed to reveal in explorer', e);
        addToast(t('studio.revealedInExplorer', { path }), 'info');
      }
    };
    const handleCreateNewThread = async () => {
      if (currentProjectId) {
        try {
          const newThread = await createThread(currentProjectId, t('studio.newThread'));
          setSelectedThreadId(newThread.id);
          addToast(t('studio.newThreadCreated'), 'success');
        } catch (error) {
          console.error("Failed to create thread", error);
          addToast(t('studio.failedToCreateThread'), 'error');
        }
      } else {
        addToast(t('studio.pleaseSelectProject'), 'error');
      }
    };
    const handleRunTask = () => {
      setIsRunTaskVisible(true);
    };
    const handleStartDebugging = () => {
      setIsDebugConfigVisible(true);
    };
    const handleRunWithoutDebugging = () => {
      import('sdkwork-ide-commons').then(({ globalEventBus }) => {
        globalEventBus.emit('openTerminal');
        globalEventBus.emit('terminalRequest', { command: 'npm start', timestamp: Date.now() });
      });
      addToast(t('studio.startingApplication'), 'info');
    };
    const handleAddRunConfiguration = () => {
      setIsRunConfigVisible(true);
    };
    const handleToggleSidebar = () => setIsSidebarVisible(prev => !prev);
    const handleToggleDiffPanel = () => {
      setViewingDiff(prev => {
        if (prev) return null;
        addToast(t('studio.noActiveDiff'), 'info');
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
    
    import('sdkwork-ide-commons').then(({ globalEventBus }) => {
      globalEventBus.on('openTerminal', handleOpenTerminal);
      globalEventBus.on('closeTerminal', handleCloseTerminal);
      globalEventBus.on('toggleTerminal', handleToggleTerminal);
      globalEventBus.on('splitTerminal', handleSplitTerminal);
      globalEventBus.on('terminalRequest', handleTerminalRequest);
      globalEventBus.on('saveActiveFile', handleSaveActiveFile);
      globalEventBus.on('saveAllFiles', handleSaveAllFiles);
      globalEventBus.on('previousThread', handlePreviousThread);
      globalEventBus.on('nextThread', handleNextThread);
      globalEventBus.on('revealInExplorer', handleRevealInExplorer);
      globalEventBus.on('createNewThread', handleCreateNewThread);
      globalEventBus.on('runTask', handleRunTask);
      globalEventBus.on('startDebugging', handleStartDebugging);
      globalEventBus.on('runWithoutDebugging', handleRunWithoutDebugging);
      globalEventBus.on('addRunConfiguration', handleAddRunConfiguration);
      globalEventBus.on('toggleSidebar', handleToggleSidebar);
      globalEventBus.on('toggleDiffPanel', handleToggleDiffPanel);
      globalEventBus.on('findInFiles', handleFindInFiles);
      globalEventBus.on('openQuickOpen', handleOpenQuickOpen);
    });
    
    return () => {
      import('sdkwork-ide-commons').then(({ globalEventBus }) => {
        globalEventBus.off('openTerminal', handleOpenTerminal);
        globalEventBus.off('closeTerminal', handleCloseTerminal);
        globalEventBus.off('toggleTerminal', handleToggleTerminal);
        globalEventBus.off('splitTerminal', handleSplitTerminal);
        globalEventBus.off('terminalRequest', handleTerminalRequest);
        globalEventBus.off('saveActiveFile', handleSaveActiveFile);
        globalEventBus.off('saveAllFiles', handleSaveAllFiles);
        globalEventBus.off('previousThread', handlePreviousThread);
        globalEventBus.off('nextThread', handleNextThread);
        globalEventBus.off('revealInExplorer', handleRevealInExplorer);
        globalEventBus.off('createNewThread', handleCreateNewThread);
        globalEventBus.off('runTask', handleRunTask);
        globalEventBus.off('startDebugging', handleStartDebugging);
        globalEventBus.off('runWithoutDebugging', handleRunWithoutDebugging);
        globalEventBus.off('addRunConfiguration', handleAddRunConfiguration);
        globalEventBus.off('toggleSidebar', handleToggleSidebar);
        globalEventBus.off('toggleDiffPanel', handleToggleDiffPanel);
        globalEventBus.off('findInFiles', handleFindInFiles);
        globalEventBus.off('openQuickOpen', handleOpenQuickOpen);
      });
    };
  }, [selectedThreadId, filteredProjects, currentProjectId, createThread, addToast]);
  
  const [chatWidth, setChatWidth] = useState(450);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'message';
    id: string;
    parentId?: string;
  } | null>(null);

  // Sync the current project ID up to the AppContent state if it changes due to thread selection
  useEffect(() => {
    if (threadProjectId && threadProjectId !== projectId && onProjectChange) {
      onProjectChange(threadProjectId);
    }
  }, [threadProjectId, projectId, onProjectChange]);

  useEffect(() => {
    if (filteredProjects.length > 0) {
      if (!menuActiveProjectId || !filteredProjects.find(p => p.id === menuActiveProjectId)) {
        setMenuActiveProjectId(filteredProjects[0].id);
      }
      if (currentProjectId && !filteredProjects.find(p => p.id === currentProjectId)) {
        if (onProjectChange) {
          onProjectChange('');
        }
        setSelectedThreadId('');
      } else if (selectedThreadId && !filteredProjects.some(p => p.threads.some(t => t.id === selectedThreadId))) {
        setSelectedThreadId('');
      }
    } else {
      setMenuActiveProjectId('');
      if (currentProjectId && onProjectChange) {
        onProjectChange('');
      }
      setSelectedThreadId('');
    }
  }, [filteredProjects, menuActiveProjectId, currentProjectId, selectedThreadId, onProjectChange]);

  const [isSending, setIsSending] = useState(false);

  const currentThread = filteredProjects.find(p => p.id === currentProjectId)?.threads.find(t => t.id === selectedThreadId);
  const messages = currentThread?.messages || [];

  const { files, selectedFile, fileContent, selectFile, saveFile, saveFileContent, createFile, createFolder, deleteFile, deleteFolder, renameNode, searchFiles } = useFileSystem(currentProjectId);

  useThreadActions(currentProjectId, createThread, setSelectedThreadId);

  const handleToggleProjectMenu = () => {
    if (!showProjectMenu) {
      setMenuActiveProjectId(currentProjectId);
      setProjectSearchQuery('');
    }
    setShowProjectMenu(!showProjectMenu);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFile = (path: string) => {
    selectFile(path);
  };

  const handleAnalyzeCode = () => {
    if (!selectedFile || !fileContent) return;
    
    const lines = fileContent.split('\n');
    const loc = lines.length;
    const emptyLines = lines.filter(l => l.trim() === '').length;
    const imports = lines.filter(l => l.trim().startsWith('import ')).length;
    const functions = (fileContent.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]+)\s*=>/g) || []).length;
    const classes = (fileContent.match(/class\s+\w+/g) || []).length;
    
    // Simple cyclomatic complexity estimation (very naive)
    const complexityKeywords = (fileContent.match(/\b(if|while|for|case|catch|&&|\|\||\?)\b/g) || []).length;
    const estimatedComplexity = complexityKeywords + 1;
    
    let maintainability = 100;
    if (loc > 300) maintainability -= 10;
    if (estimatedComplexity > 20) maintainability -= 15;
    if (functions > 10) maintainability -= 5;
    
    setAnalyzeReport({
      loc,
      emptyLines,
      imports,
      functions,
      classes,
      complexity: estimatedComplexity,
      maintainability: Math.max(0, maintainability)
    });
    setIsAnalyzeModalVisible(true);
  };

  const getLanguageFromPath = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    return 'plaintext';
  };

  const handleEditMessage = (threadId: string, messageId: string) => {
    const thread = filteredProjects.flatMap(p => p.threads).find(t => t.id === threadId);
    const msg = thread?.messages?.find(m => m.id === messageId);
    if (msg) {
      setInputValue(msg.content);
    }
  };

  const handleDeleteMessage = async (threadId: string, messageId: string) => {
    setDeleteConfirmation({ type: 'message', id: messageId, parentId: threadId });
  };

  const executeDeleteMessage = async (threadId: string, messageId: string) => {
    const project = filteredProjects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      await deleteMessage(project.id, threadId, messageId);
      addToast(t('studio.messageDeleted'), 'success');
    }
  };

  const handleRegenerateMessage = async (threadId: string) => {
    const project = filteredProjects.find(p => p.threads.some(t => t.id === threadId));
    if (project) {
      const thread = project.threads.find(t => t.id === threadId);
      if (!thread) return;
      
      const userMessages = thread.messages.filter(m => m.role === 'user');
      if (userMessages.length === 0) return;
      
      const lastUserMsg = userMessages[userMessages.length - 1];
      
      setIsSending(true);
      try {
        const context = {
          workspaceId,
          projectId: project.id,
          threadId: thread.id
        };
        await sendMessage(project.id, threadId, lastUserMsg.content, context);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleRestoreMessage = async (threadId: string, messageId: string) => {
    const thread = filteredProjects.flatMap(p => p.threads).find(t => t.id === threadId);
    const msg = thread?.messages?.find(m => m.id === messageId);
    if (msg && msg.fileChanges) {
      for (const change of msg.fileChanges) {
        if (change.originalContent !== undefined) {
          await saveFileContent(change.path, change.originalContent);
        }
      }
      addToast(t('studio.restoredFiles'), 'success');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    let projectIdToUse = currentProjectId;
    let currentThreadId = selectedThreadId;

    if (!projectIdToUse) {
      if (filteredProjects.length === 0) {
        const newProject = await createProject(t('studio.newProject'));
        projectIdToUse = newProject.id;
        setMenuActiveProjectId(newProject.id);
      } else {
        projectIdToUse = filteredProjects[0].id;
      }
    }

    if (!currentThreadId) {
      const newTitle = inputValue.slice(0, 20) + (inputValue.length > 20 ? '...' : '');
      const newThread = await createThread(projectIdToUse, newTitle);
      currentThreadId = newThread.id;
      if (onProjectChange) onProjectChange(projectIdToUse);
      setSelectedThreadId(currentThreadId);
    }

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
  };

  return (
    <div className="flex h-full w-full bg-[#0e0e11] text-gray-300">
      {/* Secondary Sidebar (Chat Interface) */}
      {isSidebarVisible && (
        <>
          <div className="flex flex-col border-r border-white/10 bg-[#0e0e11] text-sm shrink-0 relative" style={{ width: chatWidth }}>
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-[#0e0e11]">
              <div className="relative" ref={projectMenuRef}>
                <button 
                  onClick={handleToggleProjectMenu}
                  className="flex items-center gap-2 px-2 py-1.5 -ml-2 rounded-lg hover:bg-white/5 transition-all text-gray-200 font-medium group"
                >
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center shadow-sm shrink-0">
                    <Code2 size={12} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {filteredProjects.find(p => p.id === currentProjectId)?.name || '-'}
                    </span>
                    <span className="text-gray-600 text-xs">/</span>
                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors truncate max-w-[150px]">
                      {filteredProjects.find(p => p.id === currentProjectId)?.threads.find(t => t.id === selectedThreadId)?.name || '-'}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${showProjectMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProjectMenu && (
              <div className="absolute top-full left-0 mt-2 w-[600px] bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-white/10 bg-[#0e0e11]/50 backdrop-blur-sm">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                    <input 
                      type="text" 
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      placeholder={t('studio.searchProjects')} 
                      className="w-full bg-[#0e0e11] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                    />
                  </div>
                </div>
                
                <div className="flex h-[360px]">
                  {/* Left Pane: Projects */}
                  <div className="w-[40%] border-r border-white/10 overflow-y-auto p-2 custom-scrollbar bg-[#0e0e11]/30 flex flex-col gap-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('studio.projects')}</div>
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map((project, idx) => {
                        const isMenuSelected = menuActiveProjectId === project.id;
                        const isActualSelected = currentProjectId === project.id;
                        return (
                          <button
                            key={project.id}
                            onClick={() => setMenuActiveProjectId(project.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group animate-in fade-in slide-in-from-left-2 fill-mode-both ${
                              isMenuSelected 
                                ? 'bg-white/5 text-gray-100 shadow-sm' 
                                : 'text-gray-400 hover:bg-white/5/60 hover:text-gray-200'
                            }`}
                            style={{ animationDelay: `${idx * 30}ms` }}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {isMenuSelected ? (
                                <FolderOpen size={14} className="text-blue-400 shrink-0" />
                              ) : (
                                <Folder size={14} className="text-gray-500 group-hover:text-gray-400 shrink-0" />
                              )}
                              <span className="truncate font-medium">{project.name}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {isActualSelected && <Check size={14} className="text-gray-500" />}
                              {isMenuSelected && <ChevronRight size={14} className="text-gray-500" />}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-gray-500 text-xs">
                        {t('studio.noProjectsFound')}
                      </div>
                    )}
                  </div>

                  {/* Right Pane: Threads */}
                  <div className="w-[60%] overflow-y-auto p-2 custom-scrollbar bg-[#0e0e11]/10 flex flex-col gap-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('studio.threads')}</div>
                    {filteredProjects.find(p => p.id === menuActiveProjectId)?.threads.map((thread, idx) => {
                      const isSelected = currentProjectId === menuActiveProjectId && selectedThreadId === thread.id;
                      return (
                        <button
                          key={thread.id}
                          onClick={() => {
                            if (onProjectChange) onProjectChange(menuActiveProjectId);
                            setSelectedThreadId(thread.id);
                            setShowProjectMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group animate-in fade-in slide-in-from-left-2 fill-mode-both ${
                            isSelected 
                              ? 'bg-blue-500/10 text-blue-400' 
                              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                          }`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <MessageSquare size={14} className={isSelected ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400 shrink-0'} />
                            <div className="flex flex-col items-start truncate">
                              <span className="truncate font-medium">{thread.name}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-blue-400/70' : 'text-gray-600 group-hover:text-gray-500'}`}>{thread.time}</span>
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex border-t border-white/10 bg-[#0e0e11]/80 backdrop-blur-sm">
                  <div className="w-[40%] p-2 border-r border-white/10 flex gap-1">
                    <button 
                      onClick={async () => {
                        try {
                          const newProject = await createProject(t('studio.newProject'));
                          if (onProjectChange) onProjectChange(newProject.id);
                          setMenuActiveProjectId(newProject.id);
                          addToast(t('studio.projectCreated'), 'success');
                        } catch (error) {
                          console.error("Failed to create project", error);
                          addToast(t('studio.failedToCreateProject'), 'error');
                        }
                      }}
                      className="flex items-center justify-center gap-2 flex-1 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all font-medium"
                      title={t('studio.newProject')}
                    >
                      <Plus size={12} />
                      {t('studio.new')}
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const { openLocalFolder } = await import('sdkwork-ide-commons');
                          const folderInfo = await openLocalFolder();
                          if (folderInfo) {
                            let projectName = t('studio.localFolder');
                            if (folderInfo.type === 'browser' && folderInfo.handle) {
                              projectName = folderInfo.handle.name;
                            } else if (folderInfo.type === 'tauri' && folderInfo.path) {
                              const parts = folderInfo.path.split(/[/\\]/);
                              projectName = parts[parts.length - 1] || t('studio.localFolder');
                            }
                            
                            const newProject = await createProject(projectName);
                            
                            if (fileSystemService && 'mountFolder' in fileSystemService) {
                              await (fileSystemService as any).mountFolder(newProject.id, folderInfo);
                            }
                            
                            if (onProjectChange) onProjectChange(newProject.id);
                            setMenuActiveProjectId(newProject.id);
                            addToast(t('studio.openedFolder', { name: projectName }), 'success');
                          }
                        } catch (error) {
                          console.error("Failed to open folder", error);
                          addToast(t('studio.failedToOpenFolder'), 'error');
                        }
                      }}
                      className="flex items-center justify-center gap-2 flex-1 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all font-medium"
                      title={t('studio.openFolder')}
                    >
                      <Folder size={12} />
                      {t('studio.open')}
                    </button>
                  </div>
                  <div className="w-[60%] p-2">
                    <button 
                      onClick={async () => {
                        if (!menuActiveProjectId) {
                          addToast(t('studio.pleaseSelectProject'), 'error');
                          return;
                        }
                        try {
                          const newThread = await createThread(menuActiveProjectId, t('studio.newThread'));
                          if (onProjectChange) onProjectChange(menuActiveProjectId);
                          setSelectedThreadId(newThread.id);
                          setShowProjectMenu(false);
                          addToast(t('studio.newThreadCreated'), 'success');
                          setTimeout(() => {
                            import('sdkwork-ide-commons').then(({ globalEventBus }) => {
                              globalEventBus.emit('focusChatInput');
                            });
                          }, 100);
                        } catch (error) {
                          console.error("Failed to create thread", error);
                          addToast(t('studio.failedToCreateThread'), 'error');
                        }
                      }}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-dashed border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all font-medium"
                    >
                      <Plus size={12} />
                      {t('studio.newThread')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">{t('studio.ranFor', { time: '335s' })}</div>
          </div>
        </div>

        <UniversalChat 
          chatId={selectedThreadId || undefined}
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleSendMessage}
          isSending={isSending}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          layout="sidebar"
          onViewChanges={(file) => {
            setViewingDiff(file);
            setActiveTab('code');
          }}
          onEditMessage={(msgId) => selectedThreadId && handleEditMessage(selectedThreadId, msgId)}
          onDeleteMessage={(msgId) => selectedThreadId && handleDeleteMessage(selectedThreadId, msgId)}
          onRegenerateMessage={() => selectedThreadId && handleRegenerateMessage(selectedThreadId)}
          onRestore={(msgId) => selectedThreadId && handleRestoreMessage(selectedThreadId, msgId)}
          onStop={() => setIsSending(false)}
          disabled={!currentProjectId}
          emptyState={
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                <Zap size={32} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">
                {currentProjectId ? t('studio.whatToBuild') : t('studio.selectProjectToStart')}
              </h2>
              <p className="text-gray-400 max-w-md text-[15px] leading-relaxed">
                {currentProjectId 
                  ? t('studio.buildDescription') 
                  : t('studio.selectProjectDescription')}
              </p>
            </div>
          }
        />
      </div>

      <ResizeHandle 
        direction="horizontal" 
        onResize={(delta) => setChatWidth(prev => Math.max(300, Math.min(800, prev + delta)))} 
      />
      </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-[#0e0e11] overflow-hidden">
        {isFindVisible && (
          <div className="absolute top-16 right-1/2 translate-x-1/2 w-[32rem] max-h-[80vh] flex flex-col bg-[#18181b] border border-white/10 rounded-lg shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
              <h3 className="text-sm font-medium text-gray-200">{t('studio.findInFiles')}</h3>
              <button onClick={() => setIsFindVisible(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 shrink-0">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={t('studio.searchPlaceholder')} 
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
                          addToast(t('studio.noResultsFound'), 'info');
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
                placeholder={t('studio.searchFilesByName')}
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
                        results.push({ path: nodePath, line: 1, content: t('studio.fileMatch') });
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
                {t('studio.noMatchingFiles')}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#0e0e11] shrink-0">
          <div className="flex items-center gap-4 text-sm">
            <div 
              className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-colors animate-in fade-in slide-in-from-top-2 fill-mode-both ${activeTab === 'preview' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}
              style={{ animationDelay: '0ms' }}
              onClick={() => setActiveTab('preview')}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'preview' ? 'bg-white' : 'bg-gray-500'}`}></div>
              {t('studio.preview')}
            </div>
            <div 
              className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-colors animate-in fade-in slide-in-from-top-2 fill-mode-both ${activeTab === 'code' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}
              style={{ animationDelay: '50ms' }}
              onClick={() => setActiveTab('code')}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'code' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
              {t('studio.code')}
            </div>
            
            {activeTab === 'preview' && (
              <div className="flex items-center bg-black/40 rounded-full px-3 py-1 border border-white/5 max-w-[200px] w-full overflow-hidden ml-2 animate-in fade-in slide-in-from-top-2 fill-mode-both" style={{ animationDelay: '100ms' }}>
                <span className="text-xs text-gray-500 truncate">{previewUrl}</span>
              </div>
            )}
            
            {activeTab === 'code' && selectedFile && !viewingDiff && (
              <div 
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-gray-300 text-sm ml-2 animate-in fade-in slide-in-from-top-2 fill-mode-both"
                style={{ animationDelay: '100ms' }}
              >
                <span className="text-yellow-400">{'{ }'}</span>
                <span>{selectedFile?.split('/').pop()}</span>
              </div>
            )}
            {activeTab === 'code' && viewingDiff && (
              <div 
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm ml-2 border border-blue-500/30 animate-in fade-in slide-in-from-top-2 fill-mode-both"
                style={{ animationDelay: '100ms' }}
              >
                <Edit size={14} />
                <span>Diff: {viewingDiff.path.split('/').pop()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            {activeTab === 'preview' && (
              <div className="flex items-center gap-4 mr-2 animate-in fade-in slide-in-from-top-2 fill-mode-both" style={{ animationDelay: '150ms' }}>
                {/* Platform Selector */}
                <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5">
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${previewPlatform === 'web' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setPreviewPlatform('web')}
                    title={t('studio.web')}
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${previewPlatform === 'miniprogram' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setPreviewPlatform('miniprogram')}
                    title={t('studio.miniprogram')}
                  >
                    <AppWindow size={14} />
                  </button>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${previewPlatform === 'app' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setPreviewPlatform('app')}
                    title={t('studio.app')}
                  >
                    <Smartphone size={14} />
                  </button>
                </div>

                <div className="w-px h-4 bg-white/10"></div>

                {/* Sub-platform Selector */}
                <div className="flex items-center gap-2">
                  {previewPlatform === 'web' && (
                    <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5">
                      <button
                        className={`p-1.5 rounded-full transition-colors ${previewWebDevice === 'desktop' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        onClick={() => setPreviewWebDevice('desktop')}
                        title={t('studio.desktop')}
                      >
                        <Monitor size={14} />
                      </button>
                      <button
                        className={`p-1.5 rounded-full transition-colors ${previewWebDevice === 'tablet' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        onClick={() => setPreviewWebDevice('tablet')}
                        title={t('studio.tablet')}
                      >
                        <Tablet size={14} />
                      </button>
                      <button
                        className={`p-1.5 rounded-full transition-colors ${previewWebDevice === 'mobile' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        onClick={() => setPreviewWebDevice('mobile')}
                        title={t('studio.mobile')}
                      >
                        <Smartphone size={14} />
                      </button>
                    </div>
                  )}

                  {previewPlatform === 'miniprogram' && (
                    <div className="flex items-center gap-2">
                      <select 
                        className="bg-black/40 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300 outline-none focus:border-blue-500/50 appearance-none"
                        value={previewMpPlatform}
                        onChange={(e) => setPreviewMpPlatform(e.target.value as any)}
                      >
                        <option value="wechat">{t('studio.wechat')}</option>
                        <option value="douyin">{t('studio.douyin')}</option>
                        <option value="alipay">{t('studio.alipay')}</option>
                      </select>
                      <select 
                        className="bg-black/40 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300 outline-none focus:border-blue-500/50 appearance-none"
                        value={previewDeviceModel}
                        onChange={(e) => setPreviewDeviceModel(e.target.value)}
                      >
                        {Object.entries(DEVICE_MODELS).map(([key, model]) => (
                          <option key={key} value={key}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {previewPlatform === 'app' && (
                    <div className="flex items-center gap-2">
                      <select 
                        className="bg-black/40 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300 outline-none focus:border-blue-500/50 appearance-none"
                        value={previewAppPlatform}
                        onChange={(e) => {
                          const newPlatform = e.target.value;
                          setPreviewAppPlatform(newPlatform as any);
                          // Auto-select a matching device model based on OS
                          if (newPlatform === 'ios') setPreviewDeviceModel('iphone-14-pro');
                          else if (newPlatform === 'android') setPreviewDeviceModel('pixel-7');
                          else if (newPlatform === 'harmony') setPreviewDeviceModel('mate-60');
                        }}
                      >
                        <option value="ios">iOS</option>
                        <option value="android">Android</option>
                        <option value="harmony">Harmony</option>
                      </select>
                      <select 
                        className="bg-black/40 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300 outline-none focus:border-blue-500/50 appearance-none"
                        value={previewDeviceModel}
                        onChange={(e) => setPreviewDeviceModel(e.target.value)}
                      >
                        {Object.entries(DEVICE_MODELS)
                          .filter(([_, model]) => model.os === previewAppPlatform)
                          .map(([key, model]) => (
                            <option key={key} value={key}>{model.name}</option>
                          ))}
                      </select>
                    </div>
                  )}

                  {previewPlatform !== 'web' || previewWebDevice !== 'desktop' ? (
                    <button
                      className={`p-1.5 rounded-full transition-colors border ${previewIsLandscape ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-black/40 text-gray-400 border-white/5 hover:bg-white/5 hover:text-gray-200'}`}
                      onClick={() => setPreviewIsLandscape(!previewIsLandscape)}
                      title={t('studio.rotateDevice')}
                    >
                      <RotateCcw size={14} className={previewIsLandscape ? '-rotate-90 transition-transform' : 'transition-transform'} />
                    </button>
                  ) : null}
                </div>

                <div className="w-px h-4 bg-white/10"></div>

                <div className="flex items-center gap-1">
                  <button 
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    onClick={() => setPreviewKey(k => k + 1)}
                    title={t('studio.refresh')}
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button 
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title={t('studio.openInNewTab')}
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'code' && selectedFile && !viewingDiff && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-xs text-blue-400 animate-in fade-in slide-in-from-top-2 fill-mode-both"
                style={{ animationDelay: '150ms' }}
                onClick={handleAnalyzeCode}
              >
                <Code2 size={14} className="mr-1" /> {t('studio.analyzeCode')}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 px-2 text-xs transition-colors animate-in fade-in slide-in-from-top-2 fill-mode-both ${isTerminalOpen ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300' : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'}`}
              style={{ animationDelay: '175ms' }}
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            >
              <Terminal size={14} className="mr-1.5" /> {t('studio.terminal')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-xs animate-in fade-in slide-in-from-top-2 fill-mode-both"
              style={{ animationDelay: '250ms' }}
              onClick={() => setShowShareModal(true)}
            >
              <Share size={14} className="mr-1" /> {t('studio.share')}
            </Button>
            <Button 
              size="sm" 
              className="h-8 bg-blue-600 hover:bg-blue-500 text-white text-xs animate-in fade-in slide-in-from-top-2 fill-mode-both shadow-sm shadow-blue-900/20"
              style={{ animationDelay: '300ms' }}
              onClick={() => setShowPublishModal(true)}
            >
              <Upload size={14} className="mr-1" /> {t('studio.publish')}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {activeTab === 'preview' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <DevicePreview 
                  url={previewUrl} 
                  platform={previewPlatform}
                  webDevice={previewWebDevice}
                  mpPlatform={previewMpPlatform}
                  appPlatform={previewAppPlatform}
                  deviceModel={previewDeviceModel}
                  isLandscape={previewIsLandscape}
                  refreshKey={previewKey}
                />
              </div>
            ) : (
              <div className="flex-1 flex h-full overflow-hidden">
                <FileExplorer 
                  files={files} 
                  selectedFile={selectedFile || undefined} 
                  basePath={`/workspace/${filteredProjects.find(p => p.id === currentProjectId)?.name || 'project'}`}
                  onSelectFile={(path) => {
                    setViewingDiff(null);
                    handleSelectFile(path);
                  }} 
                  onCreateFile={createFile}
                  onCreateFolder={createFolder}
                  onDeleteFile={deleteFile}
                  onDeleteFolder={deleteFolder}
                  onRenameNode={renameNode}
                />
                <div className="flex-1 h-full bg-[#0e0e11] flex flex-col">
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
                              addToast(t('studio.appliedChanges', { path: viewingDiff.path }), 'success');
                              setViewingDiff(null);
                            }
                          }}>
                            {t('studio.accept')}
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-xs border-white/10 hover:bg-white/10" onClick={() => setViewingDiff(null)}>
                            {t('studio.reject')}
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
                    <CodeEditor 
                      language={getLanguageFromPath(selectedFile)}
                      value={fileContent}
                      onChange={(val) => saveFile(val || '')}
                    />
                  ) : (
                    <div className="flex-1 h-full flex items-center justify-center text-gray-500">
                      {files.length === 0 ? t('studio.projectEmpty') : t('studio.selectFile')}
                    </div>
                  )}
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
            className={`border-white/10 shrink-0 flex flex-col bg-[#18181b] transition-all duration-300 ease-in-out overflow-hidden ${isTerminalOpen ? 'opacity-100 border-t' : 'h-0 opacity-0 border-t-0'}`}
            style={isTerminalOpen ? { height: terminalHeight } : {}}
          >
            <TerminalPage terminalRequest={terminalRequest} projectId={currentProjectId} />
          </div>

        </div>
      </div>

      {/* Analyze Code Modal */}
      {isAnalyzeModalVisible && analyzeReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
                <Code2 size={16} className="text-blue-400" />
                {t('studio.codeAnalysisReport')}
              </h3>
              <button onClick={() => setIsAnalyzeModalVisible(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">{t('studio.linesOfCode')}</div>
                  <div className="text-xl font-semibold text-gray-200">{analyzeReport.loc}</div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">{t('studio.emptyLines')}</div>
                  <div className="text-xl font-semibold text-gray-200">{analyzeReport.emptyLines}</div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">{t('studio.functions')}</div>
                  <div className="text-xl font-semibold text-gray-200">{analyzeReport.functions}</div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">{t('studio.classes')}</div>
                  <div className="text-xl font-semibold text-gray-200">{analyzeReport.classes}</div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">{t('studio.complexity')}</div>
                  <div className="text-xl font-semibold text-gray-200">{analyzeReport.complexity}</div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">{t('studio.maintainability')}</div>
                  <div className={`text-xl font-semibold ${analyzeReport.maintainability > 80 ? 'text-green-400' : analyzeReport.maintainability > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {analyzeReport.maintainability}/100
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => setIsAnalyzeModalVisible(false)}>
                  {t('studio.close')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Task Modal */}
      {isRunTaskVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-200">{t('studio.runTask')}</h3>
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
                  addToast(t('studio.runningDevTask'), 'info');
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
                  addToast(t('studio.runningBuildTask'), 'info');
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
                  addToast(t('studio.runningTestTask'), 'info');
                }}
              >
                <Terminal size={14} className="text-gray-500 group-hover:text-blue-400" />
                <div className="text-sm font-medium text-gray-300 group-hover:text-white">npm test</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Configuration Modal */}
      {isRunConfigVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-200">{t('studio.runConfig')}</h3>
              <button onClick={() => setIsRunConfigVisible(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('studio.name')}</label>
                <input type="text" defaultValue="Start Development Server" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('studio.command')}</label>
                <input type="text" defaultValue="npm run dev" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setIsRunConfigVisible(false)}>{t('studio.cancel')}</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => {
                  addToast(t('studio.configurationSaved'), 'success');
                  setIsRunConfigVisible(false);
                }}>{t('studio.save')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Configuration Modal */}
      {isDebugConfigVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-200">{t('studio.debugConfig')}</h3>
              <button onClick={() => setIsDebugConfigVisible(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('studio.name')}</label>
                <input type="text" defaultValue="Launch Chrome against localhost" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('studio.url')}</label>
                <input type="text" defaultValue="http://localhost:3000" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('studio.webRoot')}</label>
                <input type="text" defaultValue="${workspaceFolder}/src" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setIsDebugConfigVisible(false)}>{t('studio.cancel')}</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => {
                  addToast(t('studio.debugConfigurationSaved'), 'success');
                  setIsDebugConfigVisible(false);
                }}>{t('studio.save')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-2">
              {t('studio.delete')} {deleteConfirmation.type.charAt(0).toUpperCase() + deleteConfirmation.type.slice(1)}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {t('studio.deleteConfirm', { type: deleteConfirmation.type })}
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirmation(null)}
                className="border-white/10 text-gray-300 hover:bg-white/5"
              >
                {t('studio.cancel')}
              </Button>
              <Button 
                variant="default" 
                onClick={() => {
                  if (deleteConfirmation.type === 'message' && deleteConfirmation.parentId) {
                    executeDeleteMessage(deleteConfirmation.parentId, deleteConfirmation.id);
                  }
                  setDeleteConfirmation(null);
                }}
                className="bg-red-500 hover:bg-red-600 text-white border-transparent"
              >
                {t('studio.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-[#0e0e11] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#18181b]/50">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Share size={18} className="text-blue-400" />
                {t('studio.shareProject')}
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">{t('studio.accessLevel')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all ${shareAccess === 'private' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-[#18181b] border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'}`}
                    onClick={() => setShareAccess('private')}
                  >
                    <Lock size={24} />
                    <span className="text-sm font-medium">{t('studio.private')}</span>
                  </button>
                  <button 
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all ${shareAccess === 'public' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-[#18181b] border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'}`}
                    onClick={() => setShareAccess('public')}
                  >
                    <Globe size={24} />
                    <span className="text-sm font-medium">{t('studio.publicLink')}</span>
                  </button>
                </div>
              </div>

              {shareAccess === 'public' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-gray-300">{t('studio.publicLink')}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://ide.sdkwork.com/p/${currentProjectId || 'demo'}`}
                      className="flex-1 bg-[#0e0e11] border border-white/10 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    />
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(`https://ide.sdkwork.com/p/${currentProjectId || 'demo'}`);
                        addToast(t('studio.linkCopied'), 'success');
                      }}
                      className="bg-[#18181b] hover:bg-white/10 text-white border border-white/10"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {shareAccess === 'private' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-gray-300">{t('studio.inviteCollaborators')}</label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder={t('studio.emailAddress')} 
                      className="flex-1 bg-[#0e0e11] border border-white/10 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    />
                    <Button 
                      onClick={() => addToast(t('studio.invitationSent'), 'success')}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {t('studio.invite')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/5 bg-[#18181b]/30 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowShareModal(false)}>{t('studio.done')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-[#0e0e11] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#18181b]/50">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Upload size={18} className="text-blue-400" />
                {t('studio.publishToProduction')}
              </h3>
              <button 
                onClick={() => setShowPublishModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Globe size={20} className="text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-100">{t('studio.deployToVercel')}</h4>
                    <p className="text-xs text-blue-200/70 mt-1">{t('studio.deployDesc')}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">{t('studio.projectName')}</label>
                  <input 
                    type="text" 
                    defaultValue={filteredProjects.find(p => p.id === currentProjectId)?.name.toLowerCase().replace(/\s+/g, '-') || 'my-project'}
                    className="w-full bg-[#0e0e11] border border-white/10 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">{t('studio.environmentVariables')}</label>
                  <div className="p-3 rounded-md bg-[#0e0e11] border border-white/10 text-xs text-gray-500 font-mono">
                    {t('studio.noEnvVars')}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-[#18181b]/30 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPublishModal(false)}>{t('studio.cancel')}</Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-500 text-white"
                onClick={() => {
                  setShowPublishModal(false);
                  addToast(t('studio.deploymentStarted'), 'info');
                }}
              >
                {t('studio.deployProject')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
