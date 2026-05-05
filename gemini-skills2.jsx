import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Github, Terminal, Copy, Check, ChevronRight, Menu, X, Box, 
  Command, BookOpen, Layout, Server, Cloud, Tag, ArrowLeft, FileText, Code, RefreshCw,
  CheckCircle2, Circle, Clock, AlertCircle, PlayCircle
} from 'lucide-react';

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
    name: 'claude-pr-reviewer',
    description: 'Automatically analyze and review GitHub Pull Requests using Claude 3.5 Sonnet.',
    platform: 'Claude',
    version: '1.2.4',
    author: 'ai-tools-inc',
    downloads: '12k',
    command: 'pip install claude-pr-reviewer',
    categories: ['Backend', 'DevOps']
  },
  {
    id: 'sk-2',
    name: 'gh-repo-scaffold',
    description: 'Instantly scaffold complex repository structures and CI/CD pipelines via GitHub CLI.',
    platform: 'GitHub',
    version: '2.0.1',
    author: 'devops-ninja',
    downloads: '8.4k',
    command: 'pip install gh-repo-scaffold',
    categories: ['DevOps', 'Backend']
  },
  {
    id: 'sk-3',
    name: 'claude-react-generator',
    description: 'Generate accessible, highly-styled React components from text descriptions.',
    platform: 'Claude',
    version: '1.0.5',
    author: 'ui-wizards',
    downloads: '25k',
    command: 'pip install claude-react-generator',
    categories: ['Frontend']
  },
  {
    id: 'sk-4',
    name: 'aws-s3-deployer',
    description: 'A GitHub skill to instantly bundle and deploy frontend assets to an S3 bucket.',
    platform: 'GitHub',
    version: '3.2.0',
    author: 'cloud-ops',
    downloads: '4.1k',
    command: 'pip install aws-s3-deployer',
    categories: ['AWS', 'Frontend']
  }
];

const MOCK_REVIEWS = [
  {
    id: 'rev-1',
    name: 'playwright-healer',
    author: 'QA Team',
    category: 'DevOps',
    submittedAt: '2 hours ago',
    description: 'Auto-fixes failing Playwright tests using error analysis and stack trace parsing.',
    notes: 'Update to existing skill. v2 adds component-level isolation. Please check against existing skill for trigger phrase conflicts.',
    platform: 'Claude',
    content: `---\nname: playwright-healer\ndescription: Activate when user reports failing\nPlaywright tests or asks to fix a test suite.\nversion: 2.0.0\n---\n\n## What this skill does\nAnalyses Playwright test failure output, identifies\nroot causes, applies targeted fixes.\n\n## Trigger conditions\n- User pastes test failure output\n- User asks "fix my tests" or similar\n- CI pipeline failure is mentioned`
  },
  {
    id: 'rev-2',
    name: 'databricks-batch-probe',
    author: 'Platform Team',
    category: 'Backend',
    submittedAt: '1 day ago',
    description: 'Regression test runner for Databricks batch pipelines spanning S3, Databricks, and Airflow.',
    notes: 'New skill. Tested against staging environment. No known conflicts.',
    platform: 'Terminal',
    content: `---\nname: databricks-batch-probe\ndescription: Activate when running batch pipeline\nregression tests or verifying data job outputs.\nversion: 1.0.0\n---\n\n## What this skill does\nRuns regression checks across batch pipeline\nstages: S3 input, Databricks job execution, etc.`
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'docs' | 'submit' | 'review'
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlatform, setActivePlatform] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const searchInputRef = useRef(null);

  // Submit Form State
  const [submitForm, setSubmitForm] = useState({
    name: '', platform: 'Claude', category: 'Frontend', description: '', trigger: '', mdContent: '', author: '', version: '1.0.0'
  });

  // Review State
  const [selectedReview, setSelectedReview] = useState(MOCK_REVIEWS[0]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Handle click outside to close search
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
    const matchesPlatform = activePlatform === 'All' || skill.platform === activePlatform;
    const matchesCategory = activeCategory === 'All' || skill.categories.includes(activeCategory);
    return matchesSearch && matchesPlatform && matchesCategory;
  });

  // --- VIEWS ---

  const renderHome = () => (
    <>
      <section className="py-6 px-6 border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 mb-1 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-zinc-400" />
              The Developer Exchange
            </h1>
            <p className="text-sm text-zinc-500 max-w-xl">
              Discover, install, and execute verified plug-and-play skills directly from your terminal.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button 
              onClick={() => setCurrentView('docs')}
              className="hidden sm:inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900 items-center gap-1 transition-colors mr-2"
            >
              Docs <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 bg-zinc-900 text-white px-4 py-2 rounded-lg font-mono text-sm shadow-sm w-full sm:w-auto">
              <span className="text-zinc-400">$</span>
              <span>pip install exchange-cli</span>
              <button 
                onClick={() => handleCopy('global', 'pip install exchange-cli')}
                className="ml-3 text-zinc-400 hover:text-white transition-colors"
              >
                {copiedId === 'global' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <div key={skill.id} className="group bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-zinc-300 transition-all duration-300 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                      {skill.platform === 'GitHub' ? <Github className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">{skill.platform}</span>
                      <h3 className="font-semibold text-zinc-900 leading-none truncate max-w-[180px]" title={skill.name}>{skill.name}</h3>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-zinc-500 mb-6 flex-grow leading-relaxed">{skill.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {skill.categories.map(cat => (
                     <span key={cat} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{cat}</span>
                  ))}
                </div>
                
                <div className="mt-auto pt-4 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                    <span>v{skill.version}</span>
                    <span>{skill.downloads} dl</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md px-3 py-2 cursor-pointer transition-colors group/cmd" onClick={() => handleCopy(skill.id, skill.command)}>
                    <code className="text-xs font-mono text-zinc-600 truncate mr-2">{skill.command}</code>
                    {copiedId === skill.id ? <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover/cmd:text-zinc-700 transition-colors flex-shrink-0" />}
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
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Form Column */}
        <div className="flex-1 space-y-8">
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
                  type="text" placeholder="e.g. aws-lambda-scaffold"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-mono"
                  value={submitForm.name} onChange={e => setSubmitForm({...submitForm, name: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900">Platform <span className="text-red-500">*</span></label>
                <select 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  value={submitForm.platform} onChange={e => setSubmitForm({...submitForm, platform: e.target.value})}
                >
                  <option value="Claude">Claude Code</option>
                  <option value="GitHub">GitHub CLI</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-900">Description <span className="text-red-500">*</span></label>
                <textarea 
                  rows={2} placeholder="One or two sentences explaining what this skill does."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 resize-none"
                  value={submitForm.description} onChange={e => setSubmitForm({...submitForm, description: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-900">Trigger Conditions</label>
                <input 
                  type="text" placeholder="e.g. 'when user asks to scaffold a lambda'"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  value={submitForm.trigger} onChange={e => setSubmitForm({...submitForm, trigger: e.target.value})}
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
            <p className="text-xs text-zinc-500 mt-2">This is the exact content injected into the context window upon execution.</p>
          </div>

          <div className="flex justify-end gap-3">
            <button className="px-5 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Save Draft
            </button>
            <button 
              onClick={() => {
                if(isNameValid && isDescValid && isMdValid) {
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
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                    {submitForm.platform === 'GitHub' ? <Github className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">{submitForm.platform}</span>
                    <h3 className="font-semibold text-zinc-900 leading-none truncate max-w-[150px]">
                      {submitForm.name || 'skill-name'}
                    </h3>
                  </div>
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

  const renderReview = () => (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-160px)] max-w-7xl mx-auto w-full border-x border-zinc-200 bg-white">
      {/* Review Sidebar List */}
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
              className={`p-4 border-b border-zinc-200 cursor-pointer transition-colors ${selectedReview.id === review.id ? 'bg-white border-l-4 border-l-zinc-900' : 'hover:bg-zinc-100 border-l-4 border-l-transparent'}`}
            >
              <h3 className="font-mono text-sm font-semibold text-zinc-900 truncate">{review.name}</h3>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{review.description}</p>
              <div className="flex items-center gap-3 mt-3 text-[10px] font-medium text-zinc-400">
                <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> {review.category}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {review.submittedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Review Panel */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-white">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-mono font-semibold tracking-tight text-zinc-900">{selectedReview.name}</h1>
              <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-zinc-600 max-w-2xl">{selectedReview.description}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => showToast("Changes requested")} className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">Request Changes</button>
            <button onClick={() => showToast(`Approved ${selectedReview.name}`)} className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800">Approve & Publish</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
            <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Author</span>
            <span className="text-sm font-medium text-zinc-900">{selectedReview.author}</span>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
            <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Platform</span>
            <span className="text-sm font-medium text-zinc-900">{selectedReview.platform}</span>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
            <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Category</span>
            <span className="text-sm font-medium text-zinc-900">{selectedReview.category}</span>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
            <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Version</span>
            <span className="text-sm font-medium text-zinc-900">1.0.0</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 border border-zinc-200 rounded-xl bg-white shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> SKILL.md Content
            </h3>
            <pre className="p-4 bg-zinc-900 text-zinc-300 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed border border-zinc-800">
              {selectedReview.content}
            </pre>
          </div>

          <div className="p-5 border border-amber-200 rounded-xl bg-amber-50/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Notes from Submitter
            </h3>
            <p className="text-sm text-amber-900">{selectedReview.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocs = () => (
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
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
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col">
      
      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
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

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            {toast}
          </div>
        </div>
      )}

      {/* DYNAMIC VIEW RENDERING */}
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
    </div>
  );
}
