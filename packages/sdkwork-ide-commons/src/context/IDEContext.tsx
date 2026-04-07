import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { IWorkspaceService } from '../services/interfaces/IWorkspaceService';
import { IProjectService } from '../services/interfaces/IProjectService';
import { IFileSystemService } from '../services/interfaces/IFileSystemService';
import { IAuthService } from '../services/interfaces/IAuthService';
import { MockWorkspaceService } from '../services/impl/MockWorkspaceService';
import { MockProjectService } from '../services/impl/MockProjectService';
import { MockFileSystemService } from '../services/impl/MockFileSystemService';
import { MockAuthService } from '../services/impl/MockAuthService';
import { IChatEngine } from 'sdkwork-ide-chat';
import { CodexChatEngine } from 'sdkwork-ide-chat-codex';
import { ClaudeChatEngine } from 'sdkwork-ide-chat-claude';
import { OpenCodeChatEngine } from 'sdkwork-ide-chat-opencode';

export interface IIDEContext {
  workspaceService: IWorkspaceService;
  projectService: IProjectService;
  fileSystemService: IFileSystemService;
  authService: IAuthService;
  chatEngine: IChatEngine;
  setChatEngine: (engine: IChatEngine) => void;
  switchChatEngine: (name: string) => void;
}

// Default to Mocks if no provider is used
const defaultContext: IIDEContext = {
  workspaceService: new MockWorkspaceService(),
  projectService: new MockProjectService(),
  fileSystemService: new MockFileSystemService(),
  authService: new MockAuthService(),
  chatEngine: new CodexChatEngine(),
  setChatEngine: () => {},
  switchChatEngine: () => {},
};

const IDEContext = createContext<IIDEContext>(defaultContext);

export interface IDEProviderProps {
  children: ReactNode;
  workspaceService?: IWorkspaceService;
  projectService?: IProjectService;
  fileSystemService?: IFileSystemService;
  authService?: IAuthService;
  initialChatEngine?: IChatEngine;
}

export const IDEProvider: React.FC<IDEProviderProps> = ({
  children,
  workspaceService = defaultContext.workspaceService,
  projectService = defaultContext.projectService,
  fileSystemService = defaultContext.fileSystemService,
  authService = defaultContext.authService,
  initialChatEngine = defaultContext.chatEngine,
}) => {
  const [chatEngine, setChatEngine] = useState<IChatEngine>(initialChatEngine);

  const switchChatEngine = useCallback((name: string) => {
    switch (name.toLowerCase()) {
      case 'codex':
        setChatEngine(new CodexChatEngine());
        break;
      case 'claude':
        setChatEngine(new ClaudeChatEngine());
        break;
      case 'opencode':
        setChatEngine(new OpenCodeChatEngine());
        break;
      default:
        console.warn(`Unknown chat engine: ${name}, falling back to Codex`);
        setChatEngine(new CodexChatEngine());
    }
  }, []);

  return (
    <IDEContext.Provider value={{ workspaceService, projectService, fileSystemService, authService, chatEngine, setChatEngine, switchChatEngine }}>
      {children}
    </IDEContext.Provider>
  );
};

export const useIDEServices = () => useContext(IDEContext);
