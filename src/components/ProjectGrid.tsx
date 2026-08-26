import React, { useState } from 'react';
import { 
  FolderGit2, 
  ExternalLink, 
  Globe, 
  GitBranch, 
  Cloud, 
  FileText, 
  Play, 
  Database, 
  Plus, 
  Star, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Terminal,
  Zap,
  Filter
} from 'lucide-react';
import { ProjectItem, Environment, ProjectLink } from '../types';
import { soundFx } from '../services/soundFx';

interface ProjectGridProps {
  projects: ProjectItem[];
  onAddProject: (project: ProjectItem) => void;
  onToggleStar: (id: string) => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  onAddProject,
  onToggleStar
}) => {
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Form State for new project
  const [newProject, setNewProject] = useState<Partial<ProjectItem>>({
    name: '',
    tagline: '',
    category: 'Fullstack',
    env: 'production',
    status: 'operational',
    tags: [],
    links: [{ label: 'Live App', url: '', type: 'web' }],
    description: ''
  });
  const [tagInput, setTagInput] = useState<string>('');

  const envs: { label: string; value: string }[] = [
    { label: 'All Environments', value: 'all' },
    { label: 'Production', value: 'production' },
    { label: 'Staging', value: 'staging' },
    { label: 'Development', value: 'development' },
    { label: 'Infra & Internal', value: 'infra' }
  ];

  const categories = ['all', 'Fullstack', 'AI & LLM', 'Backend API', 'Cloud Infra', 'DevOps & CI/CD'];

  const filteredProjects = projects.filter(p => {
    const matchesEnv = selectedEnv === 'all' || p.env === selectedEnv;
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      p.name.toLowerCase().includes(q) || 
      p.tagline.toLowerCase().includes(q) || 
      p.tags.some(t => t.toLowerCase().includes(q));
    return matchesEnv && matchesCat && matchesSearch;
  });

  const getLinkIcon = (type: ProjectLink['type']) => {
    switch (type) {
      case 'web': return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'repo': return <GitBranch className="w-3.5 h-3.5 text-slate-300" />;
      case 'cloud': return <Cloud className="w-3.5 h-3.5 text-blue-400" />;
      case 'docs': return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'ci': return <Play className="w-3.5 h-3.5 text-emerald-400" />;
      case 'db': return <Database className="w-3.5 h-3.5 text-purple-400" />;
      default: return <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const item: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: newProject.name,
      tagline: newProject.tagline || 'Custom Service Endpoint',
      category: (newProject.category as any) || 'Fullstack',
      env: (newProject.env as Environment) || 'production',
      status: 'operational',
      latency: Math.floor(Math.random() * 30) + 10,
      tags: tags.length ? tags : ['Custom'],
      links: (newProject.links || []).filter(l => l.url.trim().length > 0),
      updatedAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
      description: newProject.description || '',
      starred: false
    };

    soundFx.playDeploySuccess();
    onAddProject(item);
    setIsCreateOpen(false);
    setNewProject({
      name: '',
      tagline: '',
      category: 'Fullstack',
      env: 'production',
      status: 'operational',
      tags: [],
      links: [{ label: 'Live App', url: '', type: 'web' }],
      description: ''
    });
    setTagInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter projects..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>

          {/* Environment Pills */}
          <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
            {envs.map(env => (
              <button
                key={env.value}
                onClick={() => {
                  soundFx.playClick(800);
                  setSelectedEnv(env.value);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  selectedEnv === env.value 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,242,254,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {env.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills & Add Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-cyan-500/50"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>

          <button
            onClick={() => {
              soundFx.playClick(950);
              setIsCreateOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-3.5 py-1.5 rounded-xl text-xs transition shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProjects.map((project) => {
          const isProd = project.env === 'production';
          const isDegraded = project.status === 'degraded';
          const isDown = project.status === 'down';

          return (
            <div
              key={project.id}
              className="group relative flex flex-col justify-between glass-panel hover:bg-slate-900/80 rounded-2xl p-5 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(0,242,254,0.12)] hover:-translate-y-0.5"
            >
              <div>
                {/* Card Header: Category, Status, Star */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300 font-medium">
                      {project.category}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                      isProd 
                        ? 'bg-purple-950/60 text-purple-300 border-purple-500/30' 
                        : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                    }`}>
                      {project.env}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status Dot */}
                    <div className="flex items-center space-x-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/5 font-mono text-[10px]">
                      <span className={`relative flex h-2 w-2`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isDown ? 'bg-rose-400' : isDegraded ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          isDown ? 'bg-rose-500' : isDegraded ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                      </span>
                      <span className={`${isDown ? 'text-rose-400' : isDegraded ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {project.latency ? `${project.latency}ms` : 'UP'}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleStar(project.id)}
                      className={`p-1 rounded hover:bg-white/10 transition ${
                        project.starred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${project.starred ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Project Title & Tagline */}
                <h3 className="text-base font-bold text-white font-heading group-hover:text-cyan-300 transition">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {project.tagline}
                </p>

                {/* Description */}
                {project.description && (
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 border-l border-white/10 pl-2 italic">
                    {project.description}
                  </p>
                )}

                {/* Tech Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 text-slate-400 border border-white/5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Links Grid */}
              <div className="mt-5 pt-3 border-t border-white/5">
                <div className="text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
                  Quick Access Endpoints:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/40 text-xs font-mono transition shadow-sm"
                      onClick={() => soundFx.playClick(1100)}
                    >
                      {getLinkIcon(link.type)}
                      <span>{link.label}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0d121f] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white font-heading mb-4 flex items-center space-x-2">
              <FolderGit2 className="w-5 h-5 text-cyan-400" />
              <span>Register New Project / Endpoint</span>
            </h2>

            <form onSubmit={handleSaveNew} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. Vector RAG Microservice"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Tagline / Summary</label>
                <input
                  type="text"
                  value={newProject.tagline}
                  onChange={(e) => setNewProject({ ...newProject, tagline: e.target.value })}
                  placeholder="e.g. Fast Semantic Search with Pinecone & BigQuery"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Category</label>
                  <select
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="Fullstack">Fullstack</option>
                    <option value="AI & LLM">AI & LLM</option>
                    <option value="Backend API">Backend API</option>
                    <option value="Cloud Infra">Cloud Infra</option>
                    <option value="DevOps & CI/CD">DevOps & CI/CD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Environment</label>
                  <select
                    value={newProject.env}
                    onChange={(e) => setNewProject({ ...newProject, env: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                    <option value="infra">Infra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Primary URL Endpoint</label>
                <input
                  type="url"
                  value={newProject.links?.[0]?.url || ''}
                  onChange={(e) => setNewProject({
                    ...newProject,
                    links: [{ label: 'Live App', url: e.target.value, type: 'web' }]
                  })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Docker, Go, CloudRun, Auth"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
