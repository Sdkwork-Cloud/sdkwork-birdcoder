import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from 'sdkwork-ide-ui';
import { useToast } from 'sdkwork-ide-commons';
import { SettingsProps } from './types';

export function ConfigSettings({ settings, updateSetting }: SettingsProps) {
  const { addToast } = useToast();

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-[#0e0e11]">
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '0ms' }}>
        <h1 className="text-2xl font-semibold text-white mb-2">Config</h1>
        <div className="text-sm text-gray-400 mb-8">
          Configure approval policy and sandbox settings. <a href="#" className="text-blue-400 hover:underline">Learn more.</a>
        </div>
        
        <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden mb-8">
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <div className="relative flex-1 max-w-[200px]">
              <select className="appearance-none bg-transparent text-sm text-white outline-none cursor-pointer w-full font-medium">
                <option>User config</option>
              </select>
              <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <Button variant="link" className="h-auto p-0 text-gray-300 hover:text-white" onClick={() => addToast('Opening config.toml in editor...', 'info')}>
              Open config.toml <span className="text-xs ml-1">↗</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <div className="text-white font-medium">Approval policy</div>
              <div className="text-sm text-gray-500">Choose when Codex asks for approval</div>
            </div>
            <div className="relative">
              <select 
                value={settings.approvalPolicy}
                onChange={(e) => updateSetting('approvalPolicy', e.target.value)}
                className="appearance-none bg-[#0e0e11] border border-white/10 rounded-lg px-4 py-2 pr-10 text-sm text-white outline-none hover:border-gray-500 cursor-pointer w-64"
              >
                <option>On request</option>
                <option>Always</option>
                <option>Never</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-white font-medium">Sandbox settings</div>
              <div className="text-sm text-gray-500">Choose how much Codex can do when running commands</div>
            </div>
            <div className="relative">
              <select 
                value={settings.sandboxSettings}
                onChange={(e) => updateSetting('sandboxSettings', e.target.value)}
                className="appearance-none bg-[#0e0e11] border border-white/10 rounded-lg px-4 py-2 pr-10 text-sm text-white outline-none hover:border-gray-500 cursor-pointer w-64"
              >
                <option>Read only</option>
                <option>Read and write</option>
                <option>Full access</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <h2 className="text-lg font-medium text-white mb-2">Import external agent config</h2>
        <div className="text-sm text-gray-400 mb-4">Detect and import migratable settings from another agent.</div>
        
        <div className="bg-[#18181b] rounded-xl border border-white/10 p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Import Configuration</div>
            <div className="text-sm text-gray-500">Select a JSON file containing agent settings.</div>
          </div>
          <div className="relative">
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".json" onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addToast('Configuration imported successfully!', 'success');
              }
            }} />
            <Button variant="outline">
              Select File
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
