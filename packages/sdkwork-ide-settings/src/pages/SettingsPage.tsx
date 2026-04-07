import React, { useState } from 'react';
import { useAuth } from 'sdkwork-ide-commons';
import { SkillsPage } from 'sdkwork-ide-skills';
import {
  SettingsTab,
  SettingsSidebar,
  GeneralSettings,
  AppearanceSettings,
  ConfigSettings,
  PersonalizationSettings,
  MCPSettings,
  GitSettings,
  EnvironmentSettings,
  WorktreeSettings,
  ArchivedSettings
} from '../components';

interface SettingsPageProps {
  onBack?: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { logout } = useAuth();
  
  // Settings state
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('sdkwork_settings');
    return saved ? JSON.parse(saved) : {
      defaultOpenTarget: 'VS Code',
      agentEnvironment: 'Windows native',
      integratedTerminalShell: 'PowerShell',
      language: 'Auto-detect',
      threadDetails: 'Steps with code commands',
      requireCtrlEnter: false,
      followUpBehavior: 'Queue',
      turnCompletionNotification: 'Only when app is unfocused',
      enablePermissionNotifications: true,
      theme: 'Dark',
      usePointerCursor: false,
      uiFontSize: '13',
      codeFontSize: '12',
      approvalPolicy: 'On request',
      sandboxSettings: 'Read only',
      codeSnippetStyle: 'Auto',
      showLineNumbers: true,
      wordWrap: true,
      minimap: false,
      gitAutoFetch: true,
      gitCommitMessageGeneration: true,
      gitDefaultBranch: 'main',
      envNodeVersion: 'v20.x (LTS)',
      envPackageManager: 'pnpm',
      worktreeLocation: '../.worktrees',
      worktreeAutoCleanup: false,
      codeDevelopmentEngine: 'codex',
      lightThemeName: 'Codex Light',
      lightAccent: '#0285FF',
      lightBackground: '#FFFFFF',
      lightForeground: '#0D0D0D',
      lightUiFont: '-apple-system, BlinkMacSystemFont',
      lightCodeFont: 'ui-monospace, SFMono-Regular',
      lightTranslucent: true,
      lightContrast: 45,
      darkThemeName: 'Codex Dark',
      darkAccent: '#339CFF',
      darkBackground: '#181818',
      darkForeground: '#FFFFFF',
      darkUiFont: '-apple-system, BlinkMacSystemFont',
      darkCodeFont: 'ui-monospace, SFMono-Regular',
      darkTranslucent: true,
      darkContrast: 60,
    };
  });

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('sdkwork_settings', JSON.stringify(newSettings));
  };

  const renderContent = () => {
    const props = { settings, updateSetting };
    switch (activeTab) {
      case 'general':
        return <GeneralSettings {...props} />;
      case 'appearance':
        return <AppearanceSettings {...props} />;
      case 'config':
        return <ConfigSettings {...props} />;
      case 'personalization':
        return <PersonalizationSettings {...props} />;
      case 'mcp':
        return <MCPSettings {...props} />;
      case 'git':
        return <GitSettings {...props} />;
      case 'environment':
        return <EnvironmentSettings {...props} />;
      case 'worktree':
        return <WorktreeSettings {...props} />;
      case 'archived':
        return <ArchivedSettings />;
      case 'skills':
        return (
          <div className="flex-1 bg-[#0e0e11] overflow-hidden relative">
            <SkillsPage />
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            {activeTab} settings not available...
          </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0e0e11]">
      <SettingsSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onBack={onBack} 
        onLogout={logout} 
      />
      {renderContent()}
    </div>
  );
}
