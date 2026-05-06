import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Github, Terminal, Copy, Check, ChevronRight, Menu, X, Box, 
  Command, BookOpen, Layout, Server, Cloud, Tag, ArrowLeft, FileText, Code, RefreshCw,
  CheckCircle2, Circle, Clock, AlertCircle, Sparkles, Download
} from 'lucide-react';

// --- CUSTOM TECH ICONS ---
const TechIcon = ({ techId, className }) => {
  switch (techId) {
    case 'react':
      return (
        <svg className={className} viewBox="-11.5 -10.23174 23 20.46348" fill="none">
          <circle cx="0" cy="0" r="2.05" fill="#149ECA"/>
          <g stroke="#149ECA" strokeWidth="1">
            <ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/>
          </g>
        </svg>
      );
    case 'python':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#3776AB">
          <path d="M12.022.02c-5.836 0-5.467 2.502-5.467 2.502l.008 2.614h5.58v1.17H6.26c-3.957 0-4.116 3.593-4.116 3.593s-.101 3.722 3.985 3.722h1.222v-1.761s-.044-2.52 2.504-2.52h3.94s2.4-.025 2.4-2.247V2.73s.25-2.71-4.173-2.71zm-2.784 1.954c.504 0 .914.41.914.914 0 .504-.41.914-.914.914-.504 0-.914-.41-.914-.914 0-.504.41-.914.914-.914zm9.914 7.272s-2.822-.026-2.822 2.247v4.354s.044 2.52-2.504 2.52H9.885v1.76s-.1 3.723 3.986 3.723c4.102 0 3.985-3.723 3.985-3.723s.16-3.593-3.795-3.593h-5.58v-1.17h5.882s5.468-.13 5.468-2.615V11.75s.035-2.503-4.993-2.503zm-4.1 8.847c.504 0 .914.41.914.914 0 .504-.41.914-.914.914-.504 0-.914-.41-.914-.914 0-.504.41-.914.914-.914z"/>
        </svg>
      );
    case 'aws':
      return (
        <svg className={className} viewBox="0 0 24 24">
          <path fill="#FF9900" d="M12.98 16.94c-2.58 0-4.9-.76-6.84-2.07-.3-.21-.36-.61-.13-.9l.06-.08c.2-.26.58-.32.86-.14 1.63 1.05 3.56 1.66 5.64 1.66 2.09 0 4.07-.63 5.65-1.74.28-.2.66-.16.87.09l.05.07c.23.29.18.71-.11.93-1.87 1.4-4.36 2.18-6.05 2.18zm3.08-2.5c-.24.16-.57.1-.73-.13-.48-.71-1.02-1.31-1.63-1.77-.23-.18-.24-.52-.01-.71.22-.2.56-.2.78 0 .68.58 1.3 1.25 1.84 2.03.14.2.1.48-.06.63l-.19.14z"/>
          <path fill="#232F3E" d="M11 9c0-1.6.8-2.5 2.2-2.5 1.5 0 2.2 1 2.2 2.5v3H14v-3c0-.8-.3-1.2-.8-1.2-.5 0-.8.4-.8 1.2v3h-1.4V9z"/>
        </svg>
      );
    case 'databricks':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#FF3621">
          <path d="M12.003.8L.595 6.697l11.408 5.897 11.402-5.897L12.003.8zm0 13.504l-11.408-5.897v4.5l11.408 5.898 11.402-5.898v-4.5l-11.402 5.897zm0 7.803l-11.408-5.898v4.5l11.408 5.897 11.402-5.897v-4.5l-11.402 5.898z"/>
        </svg>
      );
    case 'jira':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#0052CC">
          <path d="M22.5 11.24L12.76 1.5a1.056 1.056 0 0 0-1.5 0L1.5 11.24a1.056 1.056 0 0 0 0 1.5l9.76 9.76c.41.41 1.09.41 1.5 0l9.74-9.76a1.056 1.056 0 0 0 0-1.5zM12 21.05L3.43 12.48 12 3.91l8.57 8.57L12 21.05z"/><path d="M12 16.51L7.49 12 12 7.49 16.51 12 12 16.51z"/>
        </svg>
      );
    case 'bitbucket':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#0052CC">
          <path d="M1.38 2.08A1.33 1.33 0 0 0 0 3.39l2.87 15.65c.1.58.55 1.02 1.13 1.12l8.28 1.4 7.9-1.3c.57-.1 1.02-.54 1.12-1.12L24 3.4a1.32 1.32 0 0 0-1.38-1.31H1.38zm3.28 4.07h14.65l-1.74 8.71h-5.26l-.41-2.61H9.55l-.56 2.6H3.66l1-8.7z"/>
        </svg>
      );
    case 'github':
      return <Github className={className} color="#181717" />;
    default:
      return <Box className={className} color="#52525B" />;
  }
};

// --- CATEGORY & MOCK DATA ---
const CATEGORIES = [
  { id: 'All', icon: Tag },
  { id: 'Frontend', icon: Layout },
  { id: 'Backend', icon: Server },
  { id: 'AWS', icon: Cloud },
  { id: 'DevOps', icon: Terminal },
];

const SKILLS = [
  {
    id: 'sk-1',
    name: 'react-component-gen',
    description: 'Generate accessible, highly-styled React components directly from text descriptions.',
    techId: 'react',
    techName: 'React',
    platforms: ['Claude', 'GitHub'],
    version: '1.0.5',
    author: 'ui-wizards',
    downloads: '25k',
    command: 'pip install react-component-gen',
    categories: ['Frontend']
  },
  {
    id: 'sk-2',
    name: 'databricks-batch-probe',
    description: 'Runs regression checks against Databricks batch pipelines across S3 and Delta tables.',
    techId: 'databricks',
    techName: 'Databricks',
    platforms: ['Claude'],
    version: '2.1.0',
    author: 'data-platform',
    downloads: '14k',
    command: 'pip install databricks-batch-probe',
    categories: ['Backend']
  },
  {
    id: 'sk-3',
    name: 'python-api-builder',
    description: 'Scaffolds complete FastAPI services with built-in Pydantic validation and JWT auth.',
    techId: 'python',
    techName: 'Python',
    platforms: ['Claude', 'GitHub'],
    version: '3.0.2',
    author: 'backend-guild',
    downloads: '42k',
    command: 'pip install python-api-builder',
    categories: ['Backend']
  },
  {
    id: 'sk-4',
    name: 'aws-lambda-scaffold',
    description: 'Quickly scaffold, test, and deploy serverless functions via AWS SAM and CloudFormation.',
    techId: 'aws',
    techName: 'AWS',
    platforms: ['GitHub'],
    version: '1.4.2',
    author: 'serverless-guru',
    downloads: '9.2k',
    command: 'pip install aws-lambda-scaffold',
    categories: ['AWS', 'Backend']
  },
  {
    id: 'sk-5',
    name: 'jira-issue-manager',
    description: 'Automated labeling, assignment, and status transitions of Jira tickets via natural language.',
    techId: 'jira',
    techName: 'Jira',
    platforms: ['Claude', 'GitHub'],
    version: '4.1.0',
    author: 'agile-ops',
    downloads: '31k',
    command: 'pip install jira-issue-manager',
    categories: ['DevOps']
  },
  {
    id: 'sk-6',
    name: 'bitbucket-pipeline-wiz',
    description: 'Diagnose and automatically resolve failing steps in Bitbucket CI/CD pipelines.',
    techId: 'bitbucket',
    techName: 'Bitbucket',
    platforms: ['Claude'],
    version: '1.0.1',
    author: 'infra-team',
    downloads: '5.6k',
    command: 'pip install bitbucket-pipeline-wiz',
    categories: ['DevOps']
  }
];

const MOCK_REVIEWS = [
  {
    id: 'rev-1',
    name: 'playwright-healer',
    author: 'QA Team',
    techId: 'react',
    techName: 'React',
    category: 'Testing',
    submittedAt: '2 hours ago',
    description: 'Auto-fixes failing Playwright component tests using error analysis and AST manipulation.',
    notes: 'Update to existing skill. v2 adds component-level isolation. Please check against existing skill for trigger phrase conflicts.',
    platforms: ['Claude', 'GitHub'],
    content: `---\nname: playwright-healer\ndescription: Activate when user reports failing\nPlaywright tests or asks to fix a test suite.\nversion: 2.0.0\n---\n\n## What this skill does\nAnalyses Playwright test failure output, identifies\nroot causes, applies targeted fixes.\n\n## Trigger conditions\n- User pastes test failure output\n- User asks "fix my tests" or similar\n- CI pipeline failure is mentioned`
  },
  {
    id: 'rev-2',
    name: 'databricks-sync',
    author: 'Platform Team',
    techId: 'databricks',
    techName: 'Databricks',
    category: 'Backend',
    submittedAt: '1 day ago',
    description: 'Synchronizes local PySpark jobs with Databricks remote clusters for fast iteration.',
    notes: 'New skill. Tested against staging environment. No known conflicts.',
    platforms: ['Terminal', 'GitHub'],
    content: `---\nname: databricks-sync\ndescription: Activate when user wants to run\nlocal PySpark code on a remote cluster.\nversion: 1.0.0\n---\n\n## What this skill does\nBundles local code, uploads to DBFS, and triggers\na remote execution using the Databricks REST API.`
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('home'); 
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlatform, setActivePlatform] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const searchInputRef = useRef(null);

  // --- DRAWER STATE ---
  const [drawerSkill, setDrawerSkill] = useState(null);
  const [drawerTab, setDrawerTab] = useState('Overview');
  const [drawerPlatform, setDrawerPlatform] = useState('');

  // Submit Form State
  const [submitForm, setSubmitForm] = useState({
    name: '', techId: 'react', platforms: ['Claude'], category: 'Frontend', description: '', trigger: '', mdContent: '', author: '', version: '1.0.0'
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (drawerSkill) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [drawerSkill]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        if (searchQuery === '') setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSkills = SKILLS.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = activePlatform === 'All' || skill.platforms.includes(activePlatform);
    const matchesCategory = activeCategory === 'All' || skill.categories.includes(activeCategory);
    return matchesSearch && matchesPlatform && matchesCategory;
  });

  const handlePlatformToggle = (platform) => {
    setSubmitForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform) 
        ? prev.platforms.filter(p => p !== platform) 
        : [...prev.platforms, platform]
    }));
  };

  // --- VIEWS ---

  const renderHome = () => (
    <>
      <section className="py-16 md:py-24 px-6 md:px-10 border-b border-zinc-200 bg-white flex flex-col items-center text-center">
        <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 mb-4">
          The Developer Exchange
        </h1>
        <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-8">
          Discover, install, and execute verified plug-and-play skills directly from your terminal.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <div className="flex items-center justify-center gap-3 bg-zinc-900 text-white px-5 py-3 rounded-lg font-mono text-sm shadow-sm w-full sm:w-auto">
            <span className="text-zinc-400">$</span>
            <span>pip install exchange-cli</span>
            <button 
              onClick={() => handleCopy('global', 'pip install exchange-cli')}
              className="ml-3 text-zinc-400 hover:text-white transition-colors"
            >
              {copiedId === 'global' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button 
            onClick={() => setCurrentView('docs')}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 transition-colors"
          >
            Read Docs <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <main className="w-full px-6 md:px-10 py-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
        <aside className="lg:w-56 flex-shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 px-3">Categories</h3>
          <nav className="space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                  {cat.id}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              {activeCategory === 'All' ? 'All Packages' : `${activeCategory} Packages`} 
              <span className="text-zinc-400 text-base font-normal ml-2">({filteredSkills.length})</span>
            </h2>
            <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200/50">
              {['All', 'Claude', 'GitHub'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivePlatform(filter)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activePlatform === filter ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredSkills.map((skill) => (
              <div 
                key={skill.id} 
                onClick={() => {
                  setDrawerSkill(skill);
                  setDrawerTab('Overview');
                  setDrawerPlatform(skill.platforms[0] || 'Claude');
                }}
                className="group bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-zinc-300 transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden"
              >
                
                {/* Header with Tech Icon & Supported Platforms */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-sm">
                      <TechIcon techId={skill.techId} className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">{skill.techName}</span>
                      <h3 className="font-semibold text-zinc-900 leading-none truncate max-w-[140px] xl:max-w-[120px] 2xl:max-w-[160px]" title={skill.name}>{skill.name}</h3>
                    </div>
                  </div>
                  
                  {/* Platform Support Badges */}
                  <div className="flex items-center gap-1">
                    {skill.platforms.map(p => (
                      <div key={p} className="w-6 h-6 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded text-zinc-500 shadow-sm" title={`Supports ${p}`}>
                        {p === 'Claude' ? <Sparkles className="w-3.5 h-3.5" /> : <Github className="w-3.5 h-3.5" />}
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-zinc-500 mb-6 flex-grow leading-relaxed">{skill.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {skill.categories.map(cat => (
                     <span key={cat} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{cat}</span>
                  ))}
                </div>
                
                {/* INTERACTIVE CARD FOOTER */}
                <div className="mt-auto pt-4 border-t border-zinc-100">
                  <div className="relative h-8 overflow-hidden rounded-md">
                    
                    {/* Default State: Stats */}
                    <div className="absolute inset-0 flex items-center justify-between text-xs text-zinc-500 transition-transform duration-300 group-hover:-translate-y-full px-1">
                      <span className="font-medium text-zinc-600">v{skill.version}</span>
                      <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5"/> {skill.downloads}</span>
                    </div>

                    {/* Hover State: Quick Install Command */}
                    <div 
                      className="absolute inset-0 flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 text-white rounded-md px-3 cursor-pointer transition-transform duration-300 translate-y-full group-hover:translate-y-0"
                      onClick={(e) => { 
                        e.stopPropagation(); // Prevents opening the drawer
                        handleCopy(skill.id, skill.command); 
                      }}
                    >
                      <code className="text-xs font-mono text-zinc-300 truncate mr-2">{skill.command}</code>
                      {copiedId === skill.id ? (
                        <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      )}
                    </div>

                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );

  const renderSubmit = () => {
    const isNameValid = submitForm.name.length > 2;
    const isDescValid = submitForm.description.length > 10;
    const isMdValid = submitForm.mdContent.length > 20;

    return (
      <div className="w-full px-6 md:px-10 py-12 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-8 max-w-4xl">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-2">Submit a skill</h1>
            <p className="text-zinc-500">Submitted skills go into the review queue. A maintainer will review and approve before publication.</p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900 mb-5 pb-4 border-b border-zinc-100">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Skill Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" placeholder="e.g. react-component-gen"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-mono"
                  value={submitForm.name} onChange={e => setSubmitForm({...submitForm, name: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Primary Technology <span className="text-red-500">*</span></label>
                <select 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  value={submitForm.techId} onChange={e => setSubmitForm({...submitForm, techId: e.target.value})}
                >
                  <option value="react">React</option>
                  <option value="python">Python</option>
                  <option value="aws">AWS</option>
                  <option value="databricks">Databricks</option>
                  <option value="jira">Jira</option>
                  <option value="bitbucket">Bitbucket</option>
                  <option value="github">GitHub</option>
                </select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-900">Supported Platforms <span className="text-red-500">*</span></label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input type="checkbox" className="rounded text-zinc-900 focus:ring-zinc-900" checked={submitForm.platforms.includes('Claude')} onChange={() => handlePlatformToggle('Claude')} />
                    Claude Code
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input type="checkbox" className="rounded text-zinc-900 focus:ring-zinc-900" checked={submitForm.platforms.includes('GitHub')} onChange={() => handlePlatformToggle('GitHub')} />
                    GitHub CLI
                  </label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-900">Description <span className="text-red-500">*</span></label>
                <textarea 
                  rows={2} placeholder="One or two sentences explaining what this skill does."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 resize-none"
                  value={submitForm.description} onChange={e => setSubmitForm({...submitForm, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900 mb-5 pb-4 border-b border-zinc-100">SKILL.md Content <span className="text-red-500">*</span></h2>
            <textarea 
              rows={8} placeholder="---\nname: your-skill\n---\n\n## What this does..."
              className="w-full bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg px-4 py-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-500"
              value={submitForm.mdContent} onChange={e => setSubmitForm({...submitForm, mdContent: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button className="px-5 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Save Draft
            </button>
            <button 
              onClick={() => {
                if(isNameValid && isDescValid && isMdValid && submitForm.platforms.length > 0) {
                  showToast("Skill submitted for review!");
                  setTimeout(() => setCurrentView('home'), 1500);
                } else {
                  showToast("Please fill out all required fields.");
                }
              }}
              className="px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Submit for Review
            </button>
          </div>
        </div>

        {/* Sidebar Column (Checklist & Preview) */}
        <aside className="lg:w-80 flex-shrink-0 space-y-8">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4 uppercase tracking-wider">Submission Checklist</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                {isNameValid ? <CheckCircle2 className="w-4 h-4 text-zinc-900" /> : <Circle className="w-4 h-4 text-zinc-300" />}
                <span className={isNameValid ? 'text-zinc-900 font-medium' : ''}>Skill name provided</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                {submitForm.platforms.length > 0 ? <CheckCircle2 className="w-4 h-4 text-zinc-900" /> : <Circle className="w-4 h-4 text-zinc-300" />}
                <span className={submitForm.platforms.length > 0 ? 'text-zinc-900 font-medium' : ''}>Platform selected</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                {isDescValid ? <CheckCircle2 className="w-4 h-4 text-zinc-900" /> : <Circle className="w-4 h-4 text-zinc-300" />}
                <span className={isDescValid ? 'text-zinc-900 font-medium' : ''}>Description written</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                {isMdValid ? <CheckCircle2 className="w-4 h-4 text-zinc-900" /> : <Circle className="w-4 h-4 text-zinc-300" />}
                <span className={isMdValid ? 'text-zinc-900 font-medium' : ''}>SKILL.md content added</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider px-1">Live Preview</h3>
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-sm">
                    <TechIcon techId={submitForm.techId} className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">{submitForm.techId}</span>
                    <h3 className="font-semibold text-zinc-900 leading-none truncate max-w-[130px]">
                      {submitForm.name || 'skill-name'}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {submitForm.platforms.map(p => (
                    <div key={p} className="w-5 h-5 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded text-zinc-500 shadow-sm">
                      {p === 'Claude' ? <Sparkles className="w-3 h-3" /> : <Github className="w-3 h-3" />}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-zinc-500 mb-4 flex-grow leading-relaxed line-clamp-3">
                {submitForm.description || 'Description will appear here when you type...'}
              </p>
              <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    );
  };

  const renderReview = () => {
    const selectedReviewData = selectedReview || MOCK_REVIEWS[0];

    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-160px)] w-full border-b border-zinc-200 bg-white">
        <div className="lg:w-80 border-r border-zinc-200 flex flex-col bg-zinc-50/50">
          <div className="p-4 border-b border-zinc-200 bg-white">
            <h2 className="font-semibold text-zinc-900">Review Queue</h2>
            <div className="flex items-center gap-4 mt-3 border-b border-zinc-200">
              <button className="text-sm font-medium text-zinc-900 border-b-2 border-zinc-900 pb-2 px-1">Pending <span className="ml-1 bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full text-[10px]">{MOCK_REVIEWS.length}</span></button>
              <button className="text-sm font-medium text-zinc-500 hover:text-zinc-900 pb-2 px-1">Processed</button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {MOCK_REVIEWS.map(review => (
              <div 
                key={review.id} 
                onClick={() => setSelectedReview(review)}
                className={`p-4 border-b border-zinc-200 cursor-pointer transition-colors ${selectedReviewData.id === review.id ? 'bg-white border-l-4 border-l-zinc-900' : 'hover:bg-zinc-100 border-l-4 border-l-transparent'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <TechIcon techId={review.techId} className="w-3.5 h-3.5 text-zinc-400" />
                  <h3 className="font-mono text-sm font-semibold text-zinc-900 truncate">{review.name}</h3>
                </div>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{review.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 lg:p-10 lg:px-12 overflow-y-auto bg-white">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 max-w-5xl">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-700">
                  <TechIcon techId={selectedReviewData.techId} className="w-4 h-4" />
                </div>
                <h1 className="text-2xl font-mono font-semibold tracking-tight text-zinc-900">{selectedReviewData.name}</h1>
                <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium uppercase tracking-wider ml-2">Pending</span>
              </div>
              <p className="text-zinc-600 max-w-2xl mt-4">{selectedReviewData.description}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => showToast("Changes requested")} className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">Request Changes</button>
              <button onClick={() => showToast(`Approved ${selectedReviewData.name}`)} className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800">Approve & Publish</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-5xl">
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
              <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Platforms</span>
              <div className="flex gap-2 mt-1.5">
                {selectedReviewData.platforms.map(p => (
                   <span key={p} className="text-xs font-medium text-zinc-700 flex items-center gap-1 bg-white border border-zinc-200 px-2 py-0.5 rounded">
                     {p === 'Claude' ? <Sparkles className="w-3 h-3" /> : <Github className="w-3 h-3" />} {p}
                   </span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
              <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Author</span>
              <span className="text-sm font-medium text-zinc-900">{selectedReviewData.author}</span>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
              <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Category</span>
              <span className="text-sm font-medium text-zinc-900">{selectedReviewData.category}</span>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
              <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Version</span>
              <span className="text-sm font-medium text-zinc-900">1.0.0</span>
            </div>
          </div>

          <div className="space-y-6 max-w-5xl">
            <div className="p-5 border border-zinc-200 rounded-xl bg-white shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> SKILL.md Content
              </h3>
              <pre className="p-4 bg-zinc-900 text-zinc-300 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed border border-zinc-800">
                {selectedReviewData.content}
              </pre>
            </div>

            <div className="p-5 border border-amber-200 rounded-xl bg-amber-50/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Notes from Submitter
              </h3>
              <p className="text-sm text-amber-900">{selectedReviewData.notes}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocs = () => (
    <div className="w-full px-6 md:px-10 py-12 flex flex-col lg:flex-row gap-12">
      <aside className="lg:w-64 flex-shrink-0">
        <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Exchange
        </button>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 px-3">Documentation</h3>
        <nav className="space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-900"><BookOpen className="w-4 h-4 text-zinc-900" /> Getting Started</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"><Terminal className="w-4 h-4 text-zinc-400" /> CLI Reference</a>
        </nav>
      </aside>

      <div className="flex-1 max-w-3xl prose prose-zinc">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-4">Getting Started</h1>
        <p className="text-zinc-600 text-lg mb-8">The Exchange CLI allows you to seamlessly integrate community-built skills into your pipelines.</p>
        <div className="bg-zinc-900 rounded-lg p-4 mb-6 flex justify-between items-center">
          <code className="text-sm font-mono text-zinc-100">pip install exchange-cli</code>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col relative">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex-shrink-0">
        <div className="w-full px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium tracking-tight text-lg cursor-pointer" onClick={() => setCurrentView('home')}>
            <RefreshCw className="w-5 h-5 text-zinc-800" />
            <span>Exchange</span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button onClick={() => setCurrentView('home')} className={`${currentView === 'home' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>Explore</button>
              <button onClick={() => setCurrentView('submit')} className={`${currentView === 'submit' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>Submit</button>
              <button onClick={() => setCurrentView('review')} className={`flex items-center gap-1.5 ${currentView === 'review' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>
                Review Queue 
                <span className="bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full text-[10px] leading-none">2</span>
              </button>
              <button onClick={() => setCurrentView('docs')} className={`${currentView === 'docs' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>Docs</button>
            </nav>

            <div ref={searchInputRef} className={`flex items-center relative transition-all duration-300 ease-in-out ${searchOpen ? 'w-64 bg-zinc-100 rounded-full px-3 py-1.5' : 'w-8 bg-transparent'}`}>
              <button onClick={() => { if(currentView !== 'home') setCurrentView('home'); setSearchOpen(true); }} className="p-1 text-zinc-500 hover:text-zinc-900">
                <Search className="w-4 h-4" />
              </button>
              <input type="text" placeholder="Search skills..." className={`bg-transparent outline-none text-sm transition-all duration-300 ease-in-out placeholder:text-zinc-400 ${searchOpen ? 'w-full ml-2 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchOpen && searchQuery && <button onClick={() => setSearchQuery('')} className="p-1 text-zinc-400 hover:text-zinc-700"><X className="w-3 h-3" /></button>}
            </div>
            <button className="md:hidden text-zinc-500"><Menu className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[110] animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            {toast}
          </div>
        </div>
      )}

      <div className="flex-grow flex flex-col">
        {currentView === 'home' && renderHome()}
        {currentView === 'submit' && renderSubmit()}
        {currentView === 'review' && renderReview()}
        {currentView === 'docs' && renderDocs()}
      </div>

      {currentView !== 'review' && (
        <footer className="border-t border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500 flex-shrink-0 mt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <RefreshCw className="w-4 h-4 text-zinc-400" />
            <span className="font-medium text-zinc-900">Exchange</span>
          </div>
          <p>© 2026 Exchange Marketplace. Open source platform.</p>
        </footer>
      )}

      {/* --- DRAWER COMPONENT --- */}
      {drawerSkill && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setDrawerSkill(null)}
          ></div>
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header Area */}
            <div className="p-6 md:p-8 border-b border-zinc-200 bg-zinc-50/50">
              <div className="flex justify-between items-start mb-6">
                
                {/* Platform Toggle */}
                <div className="flex p-1 bg-zinc-200/60 rounded-lg">
                  {drawerSkill.platforms.map(p => (
                    <button
                      key={p}
                      onClick={() => setDrawerPlatform(p)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                        drawerPlatform === p ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      {p === 'Claude' ? <Sparkles className="w-3 h-3" /> : <Github className="w-3 h-3" />}
                      {p === 'Claude' ? 'Claude Code' : 'GitHub Copilot'}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setDrawerSkill(null)} 
                  className="p-2 -m-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm flex-shrink-0">
                  <TechIcon techId={drawerSkill.techId} className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none mb-1">
                    {drawerSkill.name}
                  </h2>
                  <p className="text-sm text-zinc-500">v{drawerSkill.version} • {drawerSkill.downloads} downloads</p>
                </div>
              </div>

              <p className="text-zinc-600 mb-4 leading-relaxed">{drawerSkill.description}</p>
              
              <div className="flex items-center text-sm">
                <span className="text-zinc-500">Contributed by</span>
                <span className="ml-1.5 font-medium text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5 rounded-md shadow-sm">
                  {drawerSkill.author}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-zinc-200 px-6 md:px-8 bg-white flex-shrink-0 scrollbar-hide">
              {['Overview', 'Skills/Agent', 'Setup', 'Usage', 'Troubleshooting'].map(tab => (
                <button 
                  key={tab}
                  className={`py-4 px-2 mr-6 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    drawerTab === tab ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
                  }`}
                  onClick={() => setDrawerTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content Area */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white prose prose-zinc max-w-none">
              {drawerTab === 'Overview' && (
                <div className="animate-in fade-in">
                  <h3>About this skill</h3>
                  <p>This skill provides seamless integration for your workflow, allowing you to trigger complex tasks directly via natural language prompts inside <strong>{drawerPlatform === 'Claude' ? 'Claude Code' : 'GitHub Copilot'}</strong>.</p>
                  
                  <h4>Key Features</h4>
                  <ul>
                    <li>Zero-configuration setup for immediate use.</li>
                    <li>Context-aware execution reading from your local workspace.</li>
                    <li>Secure, local processing of commands.</li>
                    <li>Maintains strict {drawerSkill.techName} best practices.</li>
                  </ul>
                </div>
              )}

              {drawerTab === 'Skills/Agent' && (
                <div className="animate-in fade-in">
                  <h3>Agent Instructions</h3>
                  <p>When this package is installed, the following context is automatically injected into the agent's memory:</p>
                  <pre className="bg-zinc-900 text-zinc-300 p-4 rounded-xl text-xs font-mono">
                    {`---
name: ${drawerSkill.name}
description: Activate when the user interacts with ${drawerSkill.techName} components.
version: ${drawerSkill.version}
---

## What this does
It securely parses the environment and triggers the ${drawerSkill.name} CLI tools automatically.

## Trigger phrases
- "Initialize ${drawerSkill.techName}"
- "Run ${drawerSkill.name} pipeline"
- "Debug the current flow"`}
                  </pre>
                </div>
              )}

              {drawerTab === 'Setup' && (
                <div className="animate-in fade-in">
                  <h3>Installation</h3>
                  <p>Install the package globally via pip:</p>
                  <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-4">
                    <code className="text-zinc-100 font-mono text-sm">{drawerSkill.command}</code>
                    <button 
                      onClick={() => handleCopy('drawer-install', drawerSkill.command)}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      {copiedId === 'drawer-install' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <h4>Prerequisites</h4>
                  <ul>
                    <li>Python 3.9+ installed on your system.</li>
                    <li>{drawerPlatform === 'Claude' ? 'Claude Code CLI installed.' : 'GitHub CLI installed and authenticated.'}</li>
                    <li>Valid credentials for {drawerSkill.techName} operations.</li>
                  </ul>
                </div>
              )}

              {drawerTab === 'Usage' && (
                <div className="animate-in fade-in">
                  <h3>How to trigger</h3>
                  <p>Once installed, simply open your {drawerPlatform === 'Claude' ? 'Claude Code' : 'GitHub Copilot'} chat window and use natural language:</p>
                  
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center flex-shrink-0 text-xs">U</div>
                      <div className="bg-white border border-zinc-200 rounded-lg p-3 text-sm text-zinc-700 shadow-sm">
                        Hey, can you run the {drawerSkill.name} to check for errors?
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center flex-shrink-0">
                        {drawerPlatform === 'Claude' ? <Sparkles className="w-3.5 h-3.5" /> : <Github className="w-3.5 h-3.5" />}
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-lg p-3 text-sm text-zinc-700 shadow-sm">
                        I've triggered the skill. Here are the results of the execution...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'Troubleshooting' && (
                <div className="animate-in fade-in">
                  <h3>Common Issues</h3>
                  <div className="space-y-4">
                    <div className="border border-zinc-200 rounded-lg p-4">
                      <h4 className="font-semibold text-zinc-900 mt-0 mb-2 text-sm">Skill not triggering?</h4>
                      <p className="text-sm text-zinc-600 mb-0">Ensure the package is installed in the global Python environment, not just inside an isolated virtual environment.</p>
                    </div>
                    <div className="border border-zinc-200 rounded-lg p-4">
                      <h4 className="font-semibold text-zinc-900 mt-0 mb-2 text-sm">Authentication Errors</h4>
                      <p className="text-sm text-zinc-600 mb-0">If the skill fails to connect to {drawerSkill.techName}, verify that your environment variables (like API keys) are correctly exported before launching {drawerPlatform}.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
