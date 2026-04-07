import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronLeft, ChevronRight, Terminal as TerminalIcon, Settings, Command, SplitSquareHorizontal, Trash2 } from 'lucide-react';
import { globalEventBus, useFileSystem, useToast } from 'sdkwork-ide-commons';
import { useTranslation } from 'react-i18next';

interface TerminalTab {
  id: string;
  title: string;
  profileId: string;
  cwd: string;
  history: (string | React.ReactNode)[];
  commandHistory: string[];
  historyIndex: number;
}

interface TerminalPageProps {
  terminalRequest?: { path?: string; command?: string; timestamp: number };
  projectId?: string | null;
}

const TERMINAL_PROFILES = [
  { id: 'powershell', title: 'Windows PowerShell', icon: <TerminalIcon size={14} className="text-[#3b78ff]" />, shortcut: 'Ctrl+Shift+1', defaultCwd: 'C:\\Users\\Developer\\sdkwork-ide' },
  { id: 'cmd', title: 'Command Prompt', icon: <TerminalIcon size={14} className="text-gray-300" />, shortcut: 'Ctrl+Shift+2', defaultCwd: 'C:\\Users\\Developer\\sdkwork-ide' },
  { id: 'ubuntu', title: 'Ubuntu-22.04', icon: <TerminalIcon size={14} className="text-[#e95420]" />, shortcut: 'Ctrl+Shift+3', defaultCwd: '~/sdkwork-ide' },
  { id: 'bash', title: 'Git Bash', icon: <TerminalIcon size={14} className="text-[#f14e32]" />, shortcut: 'Ctrl+Shift+4', defaultCwd: '~/sdkwork-ide' },
  { id: 'node', title: 'Node.js', icon: <TerminalIcon size={14} className="text-[#33bc33]" />, shortcut: 'Ctrl+Shift+5', defaultCwd: '' },
  { id: 'codex', title: 'Codex', icon: <TerminalIcon size={14} className="text-[#007acc]" />, shortcut: 'Ctrl+Shift+6', defaultCwd: '~/sdkwork-ide' },
  { id: 'claude', title: 'Claude Code', icon: <TerminalIcon size={14} className="text-[#d97757]" />, shortcut: 'Ctrl+Shift+7', defaultCwd: '~/sdkwork-ide' },
  { id: 'gemini', title: 'Gemini', icon: <TerminalIcon size={14} className="text-[#1a73e8]" />, shortcut: 'Ctrl+Shift+8', defaultCwd: '~/sdkwork-ide' },
  { id: 'opencode', title: 'OpenCode', icon: <TerminalIcon size={14} className="text-[#10a37f]" />, shortcut: 'Ctrl+Shift+9', defaultCwd: '~/sdkwork-ide' },
];

const getPrefix = (profileId: string, cwd: string) => {
  switch (profileId) {
    case 'powershell': return `PS ${cwd}> `;
    case 'cmd': return `${cwd}> `;
    case 'ubuntu': return `developer@ubuntu:${cwd}$ `;
    case 'bash': return `developer@MINGW64 ${cwd} $ `;
    case 'node': return `> `;
    default: return `> `;
  }
};

const getPrefixColor = (profileId: string) => {
  switch (profileId) {
    case 'powershell': return 'text-[#16c60c]';
    case 'ubuntu': return 'text-[#8ae234]';
    case 'bash': return 'text-[#8ae234]';
    case 'node': return 'text-[#33bc33]';
    default: return 'text-[#cccccc]';
  }
};

export function TerminalPage({ terminalRequest, projectId }: TerminalPageProps) {
  const { t } = useTranslation();
  const { files, createFile, createFolder, deleteFile, deleteFolder, renameNode, refreshFiles } = useFileSystem(projectId || null);

  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 't1',
      title: 'Windows PowerShell',
      profileId: 'powershell',
      cwd: 'C:\\Users\\Developer\\sdkwork-ide',
      history: [
        'Windows PowerShell',
        'Copyright (C) Microsoft Corporation. All rights reserved.',
        '',
        'Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows',
        ''
      ],
      commandHistory: [],
      historyIndex: 0
    }
  ]);
  const [activeTabIds, setActiveTabIds] = useState<string[]>(['t1']);
  const [focusedPaneIndex, setFocusedPaneIndex] = useState<number>(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({ 't1': '' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);
  const { addToast } = useToast();
  
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const terminalEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    
    resizeObserver.observe(container);
    
    // Also observe children additions/removals
    const mutationObserver = new MutationObserver(() => {
      checkScroll();
    });
    
    mutationObserver.observe(container, { childList: true, subtree: true });

    window.addEventListener('resize', checkScroll);
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeTabElement = scrollContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeTabElement) {
        const container = scrollContainerRef.current;
        const tabLeft = activeTabElement.offsetLeft;
        const tabRight = tabLeft + activeTabElement.offsetWidth;
        const containerLeft = container.scrollLeft;
        const containerRight = containerLeft + container.clientWidth;

        if (tabLeft < containerLeft) {
          container.scrollTo({ left: tabLeft - 20, behavior: 'smooth' });
        } else if (tabRight > containerRight) {
          container.scrollTo({ left: tabRight - container.clientWidth + 20, behavior: 'smooth' });
        }
      }
    }
  }, [activeTabIds, focusedPaneIndex]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = 200;
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const scrollToBottom = (tabId: string) => {
    terminalEndRefs.current[tabId]?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    activeTabIds.forEach(id => scrollToBottom(id));
  }, [tabs, activeTabIds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSplitTerminal = () => {
    if (activeTabIds.length >= 2) {
      addToast(t('terminal.maximumSplitPanes'), 'info');
      return;
    }
    
    const currentTab = tabs.find(t => t.id === activeTabIds[focusedPaneIndex]);
    const profile = TERMINAL_PROFILES.find(p => p.id === currentTab?.profileId) || TERMINAL_PROFILES[0];
    
    const newId = `t${Date.now()}`;
    let initialHistory: (string | React.ReactNode)[] = [];
    
    if (profile.id === 'powershell') {
      initialHistory = [
        'Windows PowerShell',
        'Copyright (C) Microsoft Corporation. All rights reserved.',
        '',
        'Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows',
        ''
      ];
    } else if (profile.id === 'cmd') {
      initialHistory = [
        'Microsoft Windows [Version 10.0.22631.3296]',
        '(c) Microsoft Corporation. All rights reserved.',
        ''
      ];
    } else if (profile.id === 'ubuntu') {
      initialHistory = [
        'Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.133.1-microsoft-standard-WSL2 x86_64)',
        '',
        ' * Documentation:  https://help.ubuntu.com',
        ' * Management:     https://landscape.canonical.com',
        ' * Support:        https://ubuntu.com/advantage',
        ''
      ];
    } else if (profile.id === 'node') {
      initialHistory = [
        'Welcome to Node.js v20.11.0.',
        'Type ".help" for more information.',
      ];
    } else if (profile.id === 'codex' || profile.id === 'claude' || profile.id === 'gemini' || profile.id === 'opencode') {
      initialHistory = [
        `Welcome to ${profile.title} CLI`,
        `Type "help" to see available commands.`,
        ''
      ];
    }

    setTabs(prev => [...prev, {
      id: newId,
      title: profile.title,
      profileId: profile.id,
      cwd: currentTab?.cwd || profile.defaultCwd,
      history: initialHistory,
      commandHistory: [],
      historyIndex: 0
    }]);
    setInputValues(prev => ({ ...prev, [newId]: '' }));
    setActiveTabIds(prev => [...prev, newId]);
    setFocusedPaneIndex(activeTabIds.length);
    addToast(t('terminal.terminalSplit'), 'success');
  };

  const handleAddTab = (profile = TERMINAL_PROFILES[0]) => {
    const newId = `t${Date.now()}`;
    let initialHistory: (string | React.ReactNode)[] = [];
    
    if (profile.id === 'powershell') {
      initialHistory = [
        'Windows PowerShell',
        'Copyright (C) Microsoft Corporation. All rights reserved.',
        '',
        'Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows',
        ''
      ];
    } else if (profile.id === 'cmd') {
      initialHistory = [
        'Microsoft Windows [Version 10.0.22631.3296]',
        '(c) Microsoft Corporation. All rights reserved.',
        ''
      ];
    } else if (profile.id === 'ubuntu') {
      initialHistory = [
        'Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.133.1-microsoft-standard-WSL2 x86_64)',
        '',
        ' * Documentation:  https://help.ubuntu.com',
        ' * Management:     https://landscape.canonical.com',
        ' * Support:        https://ubuntu.com/advantage',
        ''
      ];
    } else if (profile.id === 'node') {
      initialHistory = [
        'Welcome to Node.js v20.11.0.',
        'Type ".help" for more information.',
      ];
    } else if (profile.id === 'codex' || profile.id === 'claude' || profile.id === 'gemini' || profile.id === 'opencode') {
      initialHistory = [
        `Welcome to ${profile.title} CLI`,
        `Type "help" to see available commands.`,
        ''
      ];
    }

    setTabs(prev => [...prev, {
      id: newId,
      title: profile.title,
      profileId: profile.id,
      cwd: profile.defaultCwd,
      history: initialHistory,
      commandHistory: [],
      historyIndex: 0
    }]);
    setInputValues(prev => ({ ...prev, [newId]: '' }));
    
    setActiveTabIds(prev => {
      const newIds = [...prev];
      newIds[focusedPaneIndex] = newId;
      return newIds;
    });
    setIsDropdownOpen(false);
    addToast(t('terminal.openedNewTab', { title: profile.title }), 'success');
  };

  useEffect(() => {
    const handleNewTerminal = () => {
      handleAddTab();
    };
    globalEventBus.on('splitTerminal', handleSplitTerminal);
    globalEventBus.on('newTerminal', handleNewTerminal);

    return () => {
      globalEventBus.off('splitTerminal', handleSplitTerminal);
      globalEventBus.off('newTerminal', handleNewTerminal);
    };
  }, [activeTabIds, focusedPaneIndex, tabs, handleAddTab]);

  const [processedTimestamp, setProcessedTimestamp] = useState<number>(0);

  useEffect(() => {
    if ((terminalRequest?.path || terminalRequest?.command) && terminalRequest.timestamp !== processedTimestamp) {
      setProcessedTimestamp(terminalRequest.timestamp);
      const targetTabId = activeTabIds[focusedPaneIndex];
      setTabs(prev => prev.map(tab => {
        if (tab.id === targetTabId) {
          let newHistory = [...tab.history];
          let newCwd = tab.cwd;
          
          if (terminalRequest.path) {
            newCwd = terminalRequest.path;
            const cdCommand = `${getPrefix(tab.profileId, tab.cwd)}cd ${terminalRequest.path}`;
            if (newHistory[newHistory.length - 1] !== cdCommand) {
              newHistory.push(cdCommand);
            }
          }
          
          if (terminalRequest.command) {
            const cmd = `${getPrefix(tab.profileId, newCwd)}${terminalRequest.command}`;
            newHistory.push(cmd);
            newHistory.push(t('terminal.executing', { command: terminalRequest.command }));
          }
          
          return { ...tab, history: newHistory, cwd: newCwd };
        }
        return tab;
      }));
    }
  }, [terminalRequest, activeTabIds, focusedPaneIndex, processedTimestamp]);

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      
      setActiveTabIds(prevIds => {
        let newIds = [...prevIds];
        const index = newIds.indexOf(id);
        if (index !== -1) {
          if (newTabs.length > 0) {
            newIds[index] = newTabs[newTabs.length - 1].id;
          } else {
            newIds.splice(index, 1);
          }
        }
        if (focusedPaneIndex >= newIds.length) {
          setFocusedPaneIndex(Math.max(0, newIds.length - 1));
        }
        return newIds;
      });
      
      if (newTabs.length === 0) {
        setTimeout(() => handleAddTab(TERMINAL_PROFILES[0]), 0);
      }
      
      return newTabs;
    });
    setContextMenu(null);
    addToast(t('terminal.tabClosed'), 'info');
  };

  const handleCloseOtherTabs = (id: string) => {
    setTabs(prev => prev.filter(t => t.id === id));
    setActiveTabIds([id]);
    setFocusedPaneIndex(0);
    setContextMenu(null);
    addToast(t('terminal.otherTabsClosed'), 'info');
  };

  const handleCloseTabsToRight = (id: string) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === id);
      if (index === -1) return prev;
      const newTabs = prev.slice(0, index + 1);
      
      setActiveTabIds(prevIds => {
        const newIds = prevIds.filter(activeId => newTabs.some(t => t.id === activeId));
        if (newIds.length === 0) newIds.push(id);
        setFocusedPaneIndex(Math.min(focusedPaneIndex, newIds.length - 1));
        return newIds;
      });
      
      return newTabs;
    });
    setContextMenu(null);
    addToast(t('terminal.tabsToRightClosed'), 'info');
  };

  const handleDuplicateTab = (id: string) => {
    const tabToDuplicate = tabs.find(t => t.id === id);
    if (tabToDuplicate) {
      const profile = TERMINAL_PROFILES.find(p => p.id === tabToDuplicate.profileId) || TERMINAL_PROFILES[0];
      handleAddTab(profile);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + 224 > window.innerWidth) {
      x = window.innerWidth - 224 - 10;
    }
    if (y + 150 > window.innerHeight) {
      y = window.innerHeight - 150 - 10;
    }
    
    setContextMenu({ x, y, tabId: id });
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, tabId: string) => {
    const activeTab = tabs.find(t => t.id === tabId);
    if (!activeTab) return;

    const currentInputValue = inputValues[tabId] || '';

    // Handle Ctrl+C
    if (e.ctrlKey && e.key === 'c') {
      if (window.getSelection()?.toString() === '') {
        setTabs(prev => prev.map(tab => {
          if (tab.id === tabId) {
            const newHistory = [...tab.history, (
              <div key={Date.now()} className="flex items-start">
                <span className={`shrink-0 ${getPrefixColor(tab.profileId)}`}>{getPrefix(tab.profileId, tab.cwd)}</span>
                <span className="ml-2 whitespace-pre-wrap">{currentInputValue}^C</span>
              </div>
            )];
            return { ...tab, history: newHistory };
          }
          return tab;
        }));
        setInputValues(prev => ({ ...prev, [tabId]: '' }));
        e.preventDefault();
      }
      return;
    }

    // Handle Ctrl+L (Clear)
    if (e.ctrlKey && e.key === 'l') {
      setTabs(prev => prev.map(tab => tab.id === tabId ? { ...tab, history: [] } : tab));
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      const cmd = currentInputValue.trim();
      setInputValues(prev => ({ ...prev, [tabId]: '' }));
      
      // 1. Update state immediately to show the command
      setTabs(prev => prev.map(tab => {
        if (tab.id === tabId) {
          const newHistory = [...tab.history, (
            <div key={Date.now()} className="flex items-start">
              <span className={`shrink-0 ${getPrefixColor(tab.profileId)}`}>
                {getPrefix(tab.profileId, tab.cwd)}
              </span>
              <span className="ml-2 whitespace-pre-wrap">{currentInputValue}</span>
            </div>
          )];
          const newCommandHistory = cmd ? [...tab.commandHistory, cmd] : tab.commandHistory;
          return { ...tab, history: newHistory, commandHistory: newCommandHistory, historyIndex: newCommandHistory.length };
        }
        return tab;
      }));

      if (!cmd) return;

      // 2. Execute command
      if (cmd === 'clear' || cmd === 'cls') {
        setTabs(prev => prev.map(tab => tab.id === tabId ? { ...tab, history: [] } : tab));
        return;
      }

      if (cmd.startsWith('cd ')) {
        setTabs(prev => prev.map(tab => {
          if (tab.id === tabId) {
            let newCwd = tab.cwd;
            const target = cmd.substring(3).trim();
            if (target === '..') {
              const parts = tab.cwd.split(/[/\\]/);
              if (parts.length > 1) {
                parts.pop();
                newCwd = parts.join(tab.cwd.includes('\\') ? '\\' : '/');
                if (newCwd.endsWith(':')) newCwd += '\\';
              }
            } else if (target === '~') {
              newCwd = tab.profileId === 'ubuntu' || tab.profileId === 'bash' ? '~/sdkwork-ide' : 'C:\\Users\\Developer\\sdkwork-ide';
            } else {
              const sep = tab.cwd.includes('\\') ? '\\' : '/';
              newCwd = tab.cwd.endsWith(sep) ? `${tab.cwd}${target}` : `${tab.cwd}${sep}${target}`;
            }
            return { ...tab, cwd: newCwd };
          }
          return tab;
        }));
        return;
      }

      if (window.__TAURI__) {
        try {
          const { Command } = await import('@tauri-apps/plugin-shell');
          const output = await Command.create('sh', ['-c', `cd "${activeTab.cwd}" && ${cmd}`]).execute();
          
          setTabs(prev => prev.map(tab => {
            if (tab.id === tabId) {
              const newHistory = [...tab.history];
              if (output.stdout) newHistory.push(output.stdout);
              if (output.stderr) newHistory.push(<span className="text-red-400">{output.stderr}</span>);
              return { ...tab, history: newHistory };
            }
            return tab;
          }));
          
          // Refresh file system if command might have changed it
          if (cmd.startsWith('touch ') || cmd.startsWith('mkdir ') || cmd.startsWith('rm ') || cmd.startsWith('mv ') || cmd.startsWith('cp ')) {
            refreshFiles();
          }
        } catch (err) {
          setTabs(prev => prev.map(tab => {
            if (tab.id === tabId) {
              return { ...tab, history: [...tab.history, <span className="text-red-400">{t('terminal.error', { error: String(err) })}</span>] };
            }
            return tab;
          }));
        }
      } else {
        // Fallback mock
        setTabs(prev => prev.map(tab => {
          if (tab.id === tabId) {
            const newHistory = [...tab.history];
            if (cmd === 'ls' || cmd === 'dir') {
              if (tab.profileId === 'powershell' || tab.profileId === 'cmd') {
                newHistory.push(' Volume in drive C has no label.');
                newHistory.push(' Volume Serial Number is ABCD-1234');
                newHistory.push('');
                newHistory.push(` Directory of ${tab.cwd}`);
                newHistory.push('');
                newHistory.push('03/16/2026  01:29 PM    <DIR>          .');
                newHistory.push('03/16/2026  01:29 PM    <DIR>          ..');
                newHistory.push('03/16/2026  01:29 PM    <DIR>          src');
                newHistory.push('03/16/2026  01:29 PM    <DIR>          packages');
                newHistory.push('03/16/2026  01:29 PM               812 package.json');
              } else {
                newHistory.push(
                  <div className="flex gap-4 mt-1 mb-1" key={`ls-${Date.now()}`}>
                    <span className="text-[#3b78ff] font-bold">src</span>
                    <span className="text-[#3b78ff] font-bold">packages</span>
                    <span className="text-[#cccccc]">package.json</span>
                    <span className="text-[#cccccc]">README.md</span>
                    <span className="text-[#3b78ff] font-bold">node_modules</span>
                  </div>
                );
              }
            } else if (cmd === 'pwd') {
              newHistory.push(tab.cwd);
            } else if (cmd === 'whoami') {
              newHistory.push(tab.profileId === 'ubuntu' || tab.profileId === 'bash' ? 'developer' : 'desktop-abc1234\\developer');
            } else if (cmd.startsWith('echo ')) {
              newHistory.push(cmd.substring(5));
            } else if (cmd.startsWith('touch ')) {
              const target = cmd.substring(6).trim();
              if (target) {
                createFile(target);
              }
            } else if (cmd.startsWith('mkdir ')) {
              const target = cmd.substring(6).trim();
              if (target) {
                createFolder(target);
              }
            } else if (cmd.startsWith('rm ')) {
              const target = cmd.substring(3).trim();
              if (target) {
                if (target.includes('-rf ') || target.includes('-r ')) {
                  const actualTarget = target.replace('-rf ', '').replace('-r ', '').trim();
                  deleteFolder(actualTarget);
                } else {
                  deleteFile(target);
                }
              }
            } else if (cmd.startsWith('mv ')) {
              const parts = cmd.substring(3).trim().split(' ');
              if (parts.length === 2) {
                renameNode(parts[0], parts[1]);
              }
            } else if (cmd === 'date') {
              newHistory.push(new Date().toString());
            } else if (tab.profileId === 'node') {
               if (cmd === '.help') {
                 newHistory.push('.break    Sometimes you get stuck, this gets you out');
                 newHistory.push('.clear    Alias for .break');
                 newHistory.push('.editor   Enter editor mode');
                 newHistory.push('.exit     Exit the REPL');
                 newHistory.push('.help     Print this help message');
                 newHistory.push('.load     Load JS from a file into the REPL session');
                 newHistory.push('.save     Save all evaluated commands in this REPL session to a file');
               } else {
                 newHistory.push(`Uncaught ReferenceError: ${cmd} is not defined`);
               }
            } else {
              newHistory.push(t('terminal.commandNotFound', { command: cmd }));
            }
            return { ...tab, history: newHistory };
          }
          return tab;
        }));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeTab.commandHistory.length > 0 && activeTab.historyIndex > 0) {
        const newIndex = activeTab.historyIndex - 1;
        setInputValues(prev => ({ ...prev, [tabId]: activeTab.commandHistory[newIndex] }));
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, historyIndex: newIndex } : t));
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeTab.historyIndex < activeTab.commandHistory.length - 1) {
        const newIndex = activeTab.historyIndex + 1;
        setInputValues(prev => ({ ...prev, [tabId]: activeTab.commandHistory[newIndex] }));
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, historyIndex: newIndex } : t));
      } else if (activeTab.historyIndex === activeTab.commandHistory.length - 1) {
        const newIndex = activeTab.commandHistory.length;
        setInputValues(prev => ({ ...prev, [tabId]: '' }));
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, historyIndex: newIndex } : t));
      }
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabIds[focusedPaneIndex]);

  const getTabIcon = (title: string) => {
    const profile = TERMINAL_PROFILES.find(p => p.title === title);
    return profile ? profile.icon : <TerminalIcon size={14} className="text-gray-400 shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0e0e11] text-gray-300 font-mono text-sm min-w-0">
      {/* Windows Terminal Style Tab Bar */}
      <div className="flex items-end bg-[#0e0e11] pt-1.5 px-2 border-b border-white/5 shrink-0 relative z-20 w-full overflow-hidden min-w-0">
        
        {canScrollLeft && (
          <button 
            className="flex items-center justify-center w-6 h-8 mb-[1px] text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0 z-10"
            onClick={() => scrollTabs('left')}
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-end gap-[2px] overflow-x-auto shrink min-w-0 scroll-smooth relative [&::-webkit-scrollbar]:hidden" 
          style={{ scrollbarWidth: 'none' }}
        >
          {tabs.map((tab, idx) => {
            const isActive = activeTabIds.includes(tab.id);
            const isFocused = activeTabIds[focusedPaneIndex] === tab.id;
            return (
            <div 
              key={tab.id}
              data-active={isActive}
              title={tab.title}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              className={`group flex items-center gap-2 px-3 h-8 flex-1 min-w-[140px] max-w-[240px] rounded-t-md cursor-pointer select-none transition-colors relative shrink-0 ${
                isActive 
                  ? `bg-[#18181b] text-white z-10` 
                  : 'bg-transparent text-gray-400 hover:bg-white/5'
              }`}
              onClick={() => {
                setActiveTabIds(prev => {
                  const newIds = [...prev];
                  newIds[focusedPaneIndex] = tab.id;
                  return newIds;
                });
              }}
            >
              {isActive && <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-md ${isFocused ? 'bg-[#60A5FA]' : 'bg-gray-600'}`} />}
              {isActive && <div className="absolute -bottom-px left-0 right-0 h-px bg-[#18181b] z-20" />}
              {getTabIcon(tab.title)}
              <span className="text-[12px] truncate flex-1">{tab.title}</span>
              <div 
                className={`flex items-center justify-center w-5 h-5 rounded hover:bg-white/10 transition-colors ${isActive ? 'text-gray-300 hover:text-white opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}
                onClick={(e) => handleCloseTab(e, tab.id)}
              >
                <X size={14} />
              </div>
            </div>
          )})}
        </div>

        {canScrollRight && (
          <button 
            className="flex items-center justify-center w-6 h-8 mb-[1px] text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0 z-10"
            onClick={() => scrollTabs('right')}
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* Add Tab & Dropdown Buttons */}
        <div className="relative flex items-center ml-1 mb-0.5 h-7 gap-0.5 shrink-0" ref={dropdownRef}>
          <button 
            className="flex items-center justify-center w-8 h-full rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:bg-white/10"
            onClick={() => handleAddTab(TERMINAL_PROFILES[0])}
            title={t('terminal.addTab')}
          >
            <Plus size={16} />
          </button>
          <button 
            className={`flex items-center justify-center w-6 h-full rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:bg-white/10 ${isDropdownOpen ? 'bg-white/10 text-white' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            title={t('terminal.openSpecificProfile')}
          >
            <ChevronDown size={14} />
          </button>

          {/* Windows Terminal Style Dropdown Menu */}
          {isDropdownOpen && (
            <div 
              className="absolute top-full right-0 mt-1 z-50 w-64 p-1.5 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-100 origin-top-right font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {TERMINAL_PROFILES.map((profile) => (
                <div 
                  key={profile.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-white/10 cursor-pointer group rounded-md transition-colors"
                  onClick={() => handleAddTab(profile)}
                >
                  <div className="flex items-center gap-3">
                    {profile.icon}
                    <span className="text-[13px] text-gray-200 group-hover:text-white">{profile.title}</span>
                  </div>
                  <span className="text-[11px] text-gray-500">{profile.shortcut}</span>
                </div>
              ))}
              <div className="h-px bg-white/10 my-1.5 mx-2" />
              <div 
                className="flex items-center justify-between px-3 py-2 hover:bg-white/10 cursor-pointer group rounded-md transition-colors"
                onClick={() => { setIsDropdownOpen(false); handleSplitTerminal(); }}
              >
                <div className="flex items-center gap-3">
                  <SplitSquareHorizontal size={14} className="text-gray-400" />
                  <span className="text-[13px] text-gray-200 group-hover:text-white">{t('terminal.splitTerminal')}</span>
                </div>
                <span className="text-[11px] text-gray-500">Alt+Shift+D</span>
              </div>
              <div 
                className="flex items-center justify-between px-3 py-2 hover:bg-white/10 cursor-pointer group rounded-md transition-colors"
                onClick={() => { setIsDropdownOpen(false); globalEventBus.emit('openSettings'); }}
              >
                <div className="flex items-center gap-3">
                  <Settings size={14} className="text-gray-400" />
                  <span className="text-[13px] text-gray-200 group-hover:text-white">{t('terminal.settings')}</span>
                </div>
                <span className="text-[11px] text-gray-500">Ctrl+,</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 w-48 p-1.5 bg-[#18181b]/95 backdrop-blur-2xl border border-white/10 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-100 origin-top-left font-sans"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="flex items-center px-3 py-2 hover:bg-white/10 cursor-pointer rounded-md transition-colors text-[13px] text-gray-200 hover:text-white"
            onClick={(e) => handleCloseTab(e, contextMenu.tabId)}
          >
            {t('terminal.closeTab')}
          </div>
          <div 
            className="flex items-center px-3 py-2 hover:bg-white/10 cursor-pointer rounded-md transition-colors text-[13px] text-gray-200 hover:text-white"
            onClick={() => handleCloseOtherTabs(contextMenu.tabId)}
          >
            {t('terminal.closeOtherTabs')}
          </div>
          <div 
            className="flex items-center px-3 py-2 hover:bg-white/10 cursor-pointer rounded-md transition-colors text-[13px] text-gray-200 hover:text-white"
            onClick={() => handleCloseTabsToRight(contextMenu.tabId)}
          >
            {t('terminal.closeTabsToRight')}
          </div>
          <div className="h-px bg-white/10 my-1 mx-2" />
          <div 
            className="flex items-center px-3 py-2 hover:bg-white/10 cursor-pointer rounded-md transition-colors text-[13px] text-gray-200 hover:text-white"
            onClick={() => handleDuplicateTab(contextMenu.tabId)}
          >
            {t('terminal.duplicateTab')}
          </div>
        </div>
      )}

      {/* Terminal Content - Split Panes */}
      <div className="flex-1 flex overflow-hidden">
        {activeTabIds.map((tabId, index) => {
          const tab = tabs.find(t => t.id === tabId);
          if (!tab) return null;
          
          return (
            <div 
              key={`${tabId}-${index}`}
              className={`flex-1 flex flex-col overflow-y-auto bg-[#18181b] text-[#cccccc] text-[14px] leading-relaxed [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#4b4b4b] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#6b6b6b] selection:bg-[#ffffff40] ${index > 0 ? 'border-l border-white/10' : ''}`}
              style={{ fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace" }}
              onClick={() => {
                setFocusedPaneIndex(index);
                inputRefs.current[tabId]?.focus();
              }}
            >
              <div className="flex-1 p-4">
                {tab.history.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap break-all">{line}</div>
                ))}
                <div className="flex items-start mt-1">
                  <span className={`shrink-0 ${getPrefixColor(tab.profileId)}`}>
                    {getPrefix(tab.profileId, tab.cwd)}
                  </span>
                  <input 
                    ref={el => { inputRefs.current[tabId] = el; }}
                    type="text"
                    value={inputValues[tabId] || ''}
                    onChange={e => setInputValues(prev => ({ ...prev, [tabId]: e.target.value }))}
                    onKeyDown={e => handleKeyDown(e, tabId)}
                    className="flex-1 bg-transparent outline-none text-white ml-2 caret-white"
                    autoFocus={index === focusedPaneIndex}
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <div ref={el => { terminalEndRefs.current[tabId] = el; }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
