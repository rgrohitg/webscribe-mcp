import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Github, Terminal, Copy, Check, ChevronRight, Menu, X, Box, 
  Command, BookOpen, Layout, Server, Cloud, Tag, ArrowLeft, FileText, Code, RefreshCw
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
  },
  {
    id: 'sk-5',
    name: 'claude-code-refactor',
    description: 'Select a file or directory and apply massive context-aware refactoring using Claude.',
    platform: 'Claude',
    version: '3.1.1',
    author: 'code-wizards',
    downloads: '21k',
    command: 'pip install claude-code-refactor',
    categories: ['Frontend', 'Backend']
  },
  {
    id: 'sk-6',
    name: 'aws-lambda-scaffold',
    description: 'Quickly scaffold, test, and deploy serverless functions to AWS using Claude.',
    platform: 'Claude',
    version: '1.4.2',
    author: 'serverless-guru',
    downloads: '9.2k',
    command: 'pip install aws-lambda-scaffold',
    categories: ['AWS', 'Backend']
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'docs'
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlatform, setActivePlatform] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedId, setCopiedId] = useState(null);
  const searchInputRef = useRef(null);

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

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.querySelector('input').focus();
    }
  }, [searchOpen]);

  const handleCopy = (id, command) => {
    navigator.clipboard.writeText(command);
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
      {/* COMPACT HEADER BANNER */}
      <section className="py-6 px-6 border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 mb-1 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-zinc-400" />
              The Developer Exchange
            </h1>
            <p className="text-sm text-zinc-500 max-w-xl">
              Discover, install, and execute verified plug-and-play skills for Claude Code and GitHub directly from your terminal.
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
                aria-label="Copy installation command"
              >
                {copiedId === 'global' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT WITH SIDEBAR */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Categories Sidebar */}
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
                    isActive 
                      ? 'bg-zinc-100 text-zinc-900' 
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                  {cat.id}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Skills Grid Area */}
        <div className="flex-1">
          {/* Top Filters & Count */}
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
                    activePlatform === filter 
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Grid */}
          {filteredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSkills.map((skill) => (
                <div 
                  key={skill.id} 
                  className="group bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-zinc-300 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      {skill.platform === 'GitHub' ? (
                        <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                          <Github className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                          <Terminal className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">{skill.platform}</span>
                        <h3 className="font-semibold text-zinc-900 leading-none truncate max-w-[180px]" title={skill.name}>{skill.name}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-zinc-500 mb-6 flex-grow leading-relaxed">
                    {skill.description}
                  </p>

                  {/* Categories Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {skill.categories.map(cat => (
                       <span key={cat} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                         {cat}
                       </span>
                    ))}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                      <span>v{skill.version}</span>
                      <span>{skill.downloads} dl</span>
                    </div>
                    
                    {/* Copy Command Box */}
                    <div 
                      className="flex items-center justify-between bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md px-3 py-2 cursor-pointer transition-colors group/cmd"
                      onClick={() => handleCopy(skill.id, skill.command)}
                    >
                      <code className="text-xs font-mono text-zinc-600 truncate mr-2">
                        {skill.command}
                      </code>
                      {copiedId === skill.id ? (
                        <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover/cmd:text-zinc-700 transition-colors flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white border border-zinc-200 border-dashed rounded-xl">
              <Box className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-zinc-900">No skills found</h3>
              <p className="text-sm text-zinc-500 mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );

  const renderDocs = () => (
    <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
      {/* Docs Sidebar */}
      <aside className="lg:w-64 flex-shrink-0">
        <button 
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Exchange
        </button>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 px-3">Documentation</h3>
        <nav className="space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-900">
            <BookOpen className="w-4 h-4 text-zinc-900" /> Getting Started
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
            <Terminal className="w-4 h-4 text-zinc-400" /> CLI Reference
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
            <Code className="w-4 h-4 text-zinc-400" /> Writing Skills
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
            <FileText className="w-4 h-4 text-zinc-400" /> API Schema
          </a>
        </nav>
      </aside>

      {/* Docs Content */}
      <div className="flex-1 max-w-3xl prose prose-zinc">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-4">Getting Started</h1>
        <p className="text-zinc-600 text-lg mb-8">
          The Exchange CLI allows you to seamlessly integrate community-built skills into your Claude Code and GitHub pipelines.
        </p>
        
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mt-8 mb-4">Installation</h2>
        <div className="bg-zinc-900 rounded-lg p-4 mb-6 flex justify-between items-center">
          <code className="text-sm font-mono text-zinc-100">pip install exchange-cli</code>
          <button 
            onClick={() => handleCopy('doc-install', 'pip install exchange-cli')}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {copiedId === 'doc-install' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mt-8 mb-4">Basic Usage</h2>
        <p className="text-zinc-600 mb-4">Once installed, you can search, install, and execute skills directly from your terminal:</p>
        
        <div className="bg-zinc-900 rounded-lg p-5 space-y-3 font-mono text-sm">
          <div className="text-zinc-400"># Search for a skill</div>
          <div className="text-zinc-100">$ exchange search "react components"</div>
          <br/>
          <div className="text-zinc-400"># Install a skill</div>
          <div className="text-zinc-100">$ exchange install sk-3</div>
          <br/>
          <div className="text-zinc-400"># Execute with Claude</div>
          <div className="text-zinc-100">$ claude --use claude-react-generator</div>
        </div>

        <div className="mt-12 p-6 bg-zinc-50 border border-zinc-200 rounded-xl">
          <h3 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-500" /> Ready to build your own?
          </h3>
          <p className="text-sm text-zinc-600 mb-4">Learn how to write a <code className="bg-zinc-200 px-1 py-0.5 rounded text-zinc-800 text-xs">skill.yaml</code> manifest and publish it to the community.</p>
          <button className="text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-md transition-colors">
            View Author Guide
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col">
      
      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 font-medium tracking-tight text-lg cursor-pointer"
            onClick={() => setCurrentView('home')}
          >
            <RefreshCw className="w-5 h-5 text-zinc-800" />
            <span>Exchange</span>
          </div>

          {/* Right Nav */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button 
                onClick={() => setCurrentView('home')} 
                className={`${currentView === 'home' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'} transition-colors`}
              >
                Explore
              </button>
              <button 
                onClick={() => setCurrentView('docs')} 
                className={`${currentView === 'docs' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'} transition-colors`}
              >
                Documentation
              </button>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 transition-colors">Publish</a>
            </nav>

            {/* Expandable Search */}
            <div 
              ref={searchInputRef}
              className={`flex items-center relative transition-all duration-300 ease-in-out ${
                searchOpen ? 'w-64 bg-zinc-100 rounded-full px-3 py-1.5' : 'w-8 bg-transparent'
              }`}
            >
              <button 
                onClick={() => {
                  if(currentView !== 'home') setCurrentView('home');
                  setSearchOpen(true);
                }}
                className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <input
                type="text"
                placeholder="Search skills..."
                className={`bg-transparent outline-none text-sm transition-all duration-300 ease-in-out placeholder:text-zinc-400 ${
                  searchOpen ? 'w-full ml-2 opacity-100' : 'w-0 opacity-0 pointer-events-none'
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {searchOpen && searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button className="md:hidden text-zinc-500">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* DYNAMIC VIEW RENDERING */}
      <div className="flex-grow">
        {currentView === 'home' ? renderHome() : renderDocs()}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500 flex-shrink-0 mt-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <RefreshCw className="w-4 h-4 text-zinc-400" />
          <span className="font-medium text-zinc-900">Exchange</span>
        </div>
        <p>© 2026 Exchange Marketplace. Open source platform.</p>
      </footer>
    </div>
  );
}
