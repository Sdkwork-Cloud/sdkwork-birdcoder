import React, { useState, useMemo } from 'react';
import { Search, Download, Star, LayoutTemplate, Plus, FolderPlus, Tag, Check, X, Globe, Cloud, User, ChevronRight, Filter } from 'lucide-react';
import { useProjects, useToast } from 'sdkwork-ide-commons';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
  author: string;
  downloads: string;
  stars: string;
  category: 'community' | 'saas' | 'mine';
}

const MOCK_TEMPLATES: Template[] = [
  // Community
  { id: 't1', title: 'Next.js Blog Starter', description: 'A modern blog starter with Next.js 14, App Router, Tailwind CSS, and MDX support.', icon: '📝', tags: ['Next.js', 'React', 'Tailwind'], author: 'Community', downloads: '12k', stars: '4.5k', category: 'community' },
  { id: 't2', title: 'Vue3 Admin Pro', description: 'Enterprise-level admin dashboard template built with Vue 3, Vite, and Element Plus.', icon: '📊', tags: ['Vue3', 'Admin', 'TypeScript'], author: 'Community', downloads: '8.2k', stars: '3.1k', category: 'community' },
  { id: 't3', title: 'Express API Boilerplate', description: 'Production-ready Node.js REST API boilerplate with Express, Mongoose, and JWT auth.', icon: '⚙️', tags: ['Node.js', 'Express', 'MongoDB'], author: 'Community', downloads: '15k', stars: '5.2k', category: 'community' },
  { id: 't4', title: 'React Native Expo', description: 'Cross-platform mobile app starter using React Native and Expo with navigation pre-configured.', icon: '📱', tags: ['React Native', 'Mobile', 'Expo'], author: 'Community', downloads: '9.5k', stars: '2.8k', category: 'community' },
  { id: 't9', title: 'Python FastAPI', description: 'High-performance API backend using FastAPI, SQLAlchemy, and Alembic.', icon: '🐍', tags: ['Python', 'FastAPI', 'Backend'], author: 'Community', downloads: '11k', stars: '4.1k', category: 'community' },
  { id: 't11', title: 'SvelteKit E-commerce', description: 'Lightweight and fast e-commerce storefront built with SvelteKit and Stripe.', icon: '🛍️', tags: ['Svelte', 'E-commerce', 'Stripe'], author: 'Community', downloads: '3.4k', stars: '1.2k', category: 'community' },
  { id: 't12', title: 'Go Microservice', description: 'Standardized Go microservice template with gRPC, structured logging, and metrics.', icon: '🐹', tags: ['Go', 'Microservices', 'gRPC'], author: 'Community', downloads: '6.7k', stars: '2.9k', category: 'community' },
  
  // Sdkwork SaaS
  { id: 't5', title: 'Sdkwork ERP Base', description: 'Official Sdkwork enterprise resource planning base template with multi-tenant architecture.', icon: '🏢', tags: ['SaaS', 'ERP', 'Multi-tenant'], author: 'Sdkwork', downloads: '5.1k', stars: '1.2k', category: 'saas' },
  { id: 't6', title: 'AI Agent Scaffolding', description: 'Quickly build and deploy AI agents with built-in LLM integrations and memory management.', icon: '🤖', tags: ['AI', 'LLM', 'Agent'], author: 'Sdkwork', downloads: '18k', stars: '6.5k', category: 'saas' },
  { id: 't7', title: 'E-commerce Core', description: 'High-performance e-commerce storefront template with cart, checkout, and payment integrations.', icon: '🛒', tags: ['E-commerce', 'Stripe', 'Next.js'], author: 'Sdkwork', downloads: '7.3k', stars: '2.4k', category: 'saas' },
  { id: 't10', title: 'Microservices Gateway', description: 'API Gateway template for microservices architecture with rate limiting and auth.', icon: '🚪', tags: ['Microservices', 'Gateway', 'Docker'], author: 'Sdkwork', downloads: '4.2k', stars: '1.8k', category: 'saas' },
  { id: 't13', title: 'Data Analytics Dashboard', description: 'Real-time data analytics dashboard with D3.js, WebSockets, and advanced charting.', icon: '📈', tags: ['Analytics', 'D3.js', 'WebSockets'], author: 'Sdkwork', downloads: '8.9k', stars: '3.4k', category: 'saas' },
  
  // Mine
  { id: 't8', title: 'My Personal Portfolio', description: 'My custom portfolio template with dark mode and smooth animations.', icon: '🎨', tags: ['Portfolio', 'Framer Motion'], author: 'Me', downloads: '0', stars: '0', category: 'mine' },
  { id: 't14', title: 'Internal Tool Base', description: 'Base template for all internal company tools with pre-configured auth and UI components.', icon: '🧰', tags: ['Internal', 'React', 'Tailwind'], author: 'Me', downloads: '0', stars: '0', category: 'mine' },
];

const ALL_TAGS = Array.from(new Set(MOCK_TEMPLATES.flatMap(t => t.tags))).sort();

interface TemplatesPageProps {
  workspaceId?: string;
  onProjectCreated?: (projectId: string) => void;
}

export function TemplatesPage({ workspaceId, onProjectCreated }: TemplatesPageProps) {
  const [activeTab, setActiveTab] = useState<'community' | 'saas' | 'mine'>('community');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  
  const { createProject } = useProjects(workspaceId || '');
  const { addToast } = useToast();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredTemplates = useMemo(() => {
    return MOCK_TEMPLATES.filter(t => {
      const matchesTab = t.category === activeTab;
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => t.tags.includes(tag));
      
      return matchesTab && matchesSearch && matchesTags;
    });
  }, [activeTab, searchQuery, selectedTags]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) {
      addToast('No active workspace selected', 'error');
      return;
    }
    
    setIsCreating(true);
    try {
      const newProject = await createProject(projectName || selectedTemplate?.title || 'New Project');
      addToast(`Project created from template ${selectedTemplate?.title}`, 'success');
      setSelectedTemplate(null);
      if (onProjectCreated) {
        onProjectCreated(newProject.id);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to create project', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0e0e11] text-gray-300 font-sans relative">
      {/* Header */}
      <div className="flex flex-col border-b border-white/10 bg-[#18181b]/50 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <LayoutTemplate size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-100 tracking-tight">Template Market</h1>
              <p className="text-xs text-gray-400 mt-0.5">Bootstrap your next project with production-ready templates</p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center px-6 gap-8 overflow-x-auto custom-scrollbar">
          {[
            { id: 'community', label: 'Community', icon: Globe },
            { id: 'saas', label: 'Sdkwork SaaS', icon: Cloud },
            { id: 'mine', label: 'My Templates', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedTags([]); }}
                className={`relative py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  isActive ? 'text-emerald-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-gray-500'} />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* SaaS Banner */}
          {activeTab === 'saas' && (
            <div className="mb-4 relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-900/10 to-emerald-900/5 border border-blue-500/10 px-4 py-3 flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 shrink-0 relative z-10">
                <Cloud className="text-blue-400" size={16} />
              </div>
              <div className="relative z-10 flex-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    Sdkwork SaaS Cloud
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 uppercase tracking-wider border border-blue-500/20">Official</span>
                  </h2>
                  <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
                  <p className="text-blue-200/60 text-xs hidden sm:block truncate max-w-2xl">
                    Enterprise-grade templates with built-in best practices and multi-tenant architecture.
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/5 to-transparent blur-xl rounded-full pointer-events-none" />
            </div>
          )}

          {/* Search & Filters */}
          <div className="mb-6 flex flex-col gap-3">
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates, frameworks, and boilerplates..." 
                className="w-full bg-[#0e0e11]/50 border border-white/10 rounded-xl py-3 pl-11 pr-11 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-sm focus:bg-[#0e0e11]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-sm p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Tag Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs mr-1 shrink-0 font-medium uppercase tracking-wider">
                <Filter size={12} />
                <span>Filters:</span>
              </div>
              {ALL_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                      isSelected 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10' 
                        : 'bg-[#18181b]/50 text-gray-400 border-white/5 hover:border-white/10 hover:bg-[#18181b] hover:text-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {selectedTags.length > 0 && (
                <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
                  <button 
                    onClick={() => setSelectedTags([])}
                    className="shrink-0 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Template Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTemplates.map((template, index) => (
                <div 
                  key={template.id} 
                  className="flex flex-col bg-[#18181b]/40 border border-white/5 hover:border-white/10 hover:bg-[#18181b]/80 rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Hover Overlay Action */}
                  <div className="absolute inset-0 bg-[#0e0e11]/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <button 
                      onClick={() => {
                        setSelectedTemplate(template);
                        setProjectName(template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg"
                    >
                      <FolderPlus size={18} />
                      Create Project
                    </button>
                  </div>

                  <div className="flex items-start justify-between mb-5 relative z-0">
                    <div className="w-14 h-14 rounded-xl bg-[#0e0e11] border border-white/10 flex items-center justify-center text-3xl shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      {template.icon}
                    </div>
                    {template.category === 'saas' && (
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold tracking-wider rounded border border-blue-500/20">
                        Official
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-gray-100 font-medium text-base mb-2 line-clamp-1 relative z-0">{template.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1 relative z-0">{template.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4 relative z-0">
                    {template.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-[#0e0e11] border border-white/10 rounded-md text-xs text-gray-400">
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-white/10 relative z-0">
                    <span className="truncate max-w-[100px]">{template.author}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1" title="Downloads">
                        <Download size={12} />
                        <span>{template.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Stars">
                        <Star size={12} />
                        <span>{template.stars}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-[#18181b]/50 border border-white/10 rounded-2xl flex items-center justify-center text-gray-500 mb-4">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-200 mb-2">No templates found</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                We couldn't find any templates matching your criteria. Try adjusting your search query or removing some filters.
              </p>
              {selectedTags.length > 0 && (
                <button 
                  onClick={() => setSelectedTags([])}
                  className="mt-6 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0e0e11]">
              <h2 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                <FolderPlus size={18} className="text-emerald-400" />
                Create Project
              </h2>
              <button 
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-500 hover:text-gray-300 p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-4 p-4 bg-[#0e0e11] rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-white/10 flex items-center justify-center text-xl shrink-0">
                  {selectedTemplate.icon}
                </div>
                <div>
                  <h3 className="text-gray-200 font-medium text-sm">{selectedTemplate.title}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Based on {selectedTemplate.author} template</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Project Name</label>
                <input 
                  type="text" 
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={selectedTemplate.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                  className="w-full bg-[#0e0e11] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Location</label>
                <div className="flex items-center bg-[#0e0e11] border border-white/10 rounded-lg overflow-hidden focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
                  <span className="px-3 py-2 text-gray-500 text-sm border-r border-white/10 bg-[#18181b] select-none">~/workspace/</span>
                  <input 
                    type="text" 
                    required
                    defaultValue={selectedTemplate.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                    className="w-full bg-transparent px-3 py-2 text-sm text-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4 rounded border border-[#555] bg-[#0e0e11] group-hover:border-emerald-500 transition-colors">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <Check size={12} className="text-emerald-400 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">Initialize Git repository</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4 rounded border border-[#555] bg-[#0e0e11] group-hover:border-emerald-500 transition-colors">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <Check size={12} className="text-emerald-400 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">Install dependencies automatically</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                <button 
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium transition-all shadow-sm"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Project
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
