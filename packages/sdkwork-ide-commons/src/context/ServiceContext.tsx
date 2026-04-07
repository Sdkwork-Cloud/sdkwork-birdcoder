import React, { createContext, useContext } from 'react';
import { IWorkspaceService } from '../services/interfaces/IWorkspaceService';
import { IProjectService } from '../services/interfaces/IProjectService';
import { IFileSystemService } from '../services/interfaces/IFileSystemService';
import { MockWorkspaceService } from '../services/impl/MockWorkspaceService';
import { MockProjectService } from '../services/impl/MockProjectService';
import { MockFileSystemService } from '../services/impl/MockFileSystemService';
import { IChatEngine } from 'sdkwork-ide-chat';
import { CodexChatEngine } from 'sdkwork-ide-chat-codex';

export interface IServices {
  workspaceService: IWorkspaceService;
  projectService: IProjectService;
  fileSystemService: IFileSystemService;
  chatEngine: IChatEngine;
}

// Default to mock services for now
const defaultServices: IServices = {
  workspaceService: new MockWorkspaceService(),
  projectService: new MockProjectService(),
  fileSystemService: new MockFileSystemService(),
  chatEngine: new CodexChatEngine(),
};

const ServiceContext = createContext<IServices>(defaultServices);

export function ServiceProvider({ children, services = defaultServices }: { children: React.ReactNode, services?: IServices }) {
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  return useContext(ServiceContext);
}
