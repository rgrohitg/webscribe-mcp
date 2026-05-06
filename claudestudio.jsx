import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  LayoutGrid, 
  Wrench, 
  Book, 
  Settings, 
  Code2, 
  GitBranch, 
  Files, 
  Terminal as TerminalIcon, 
  Search, 
  User, 
  Plus, 
  ArrowUpRight, 
  Monitor, 
  Cpu, 
  Globe, 
  Database, 
  Layers, 
  Zap,
  ChevronRight,
  MoreHorizontal,
  Box,
  Command,
  History,
  X,
  RotateCcw,
  Clock,
  Sparkles,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Github,
  Slack,
  Cloud
} from 'lucide-react';

// --- Sub-Components ---

const SidebarIcon = ({ icon: Icon, active, onClick, label, hidden }) => {
  if (hidden) return null;
  return (
    <div className="relative group flex items-center justify-center w-full py-3">
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
          active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
            : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </button>
      <div className="absolute left-16 px-2 py-1 bg-zinc-800 text-zinc-200 text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] border border-zinc-700">
        {label}
      </div>
    </div>
  );
};

const ChatInterface = ({ messages, input, setInput, handleSend, fullWidth }) => (
  <div className="flex-1 flex flex-col h-full bg-[#09090b]">
    <div className="h-12 border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0 bg-[#09090b]">
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all">
          <Plus size={14} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">New Session</span>
        </button>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all">
          <Clock size={14} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">History</span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Sparkles size={12} className="text-blue-500" />
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sonnet 3.5</span>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
      {messages.map((m, i) => (
        <div key={i} className={`flex gap-3 ${m.role === 'assistant' ? 'bg-zinc-900/30 -mx-4 px-4 py-4 border-y border-zinc-800/20' : ''}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            m.role === 'assistant' ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {m.role === 'assistant' ? <Cpu size={14} /> : <User size={14} />}
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
              {m.role === 'assistant' ? 'Claude' : 'Developer'}
            </p>
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{m.content}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="p-4 shrink-0 border-t border-zinc-900 bg-[#09090b]">
      <div className={`${fullWidth ? 'max-w-3xl mx-auto' : 'w-full'}`}>
        <div className="relative bg-[#111113] border border-zinc-800 rounded-xl p-2 focus-within:border-zinc-700 transition-all shadow-xl">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type a command..."
            className="w-full bg-transparent border-none px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none min-h-[40px] max-h-32"
            rows={1}
          />
          <div className="flex items-center justify-between px-1 pb-1">
            <div className="flex gap-1">
              <button className="p-1.5 text-zinc-600 hover:text-zinc-400 rounded transition-colors"><Monitor size={14} /></button>
              <button className="p-1.5 text-zinc-600 hover:text-zinc-400 rounded transition-colors"><Layers size={14} /></button>
            </div>
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-3 py-1 bg-zinc-100 text-zinc-950 rounded-lg text-[10px] font-bold hover:bg-white disabled:opacity-30 transition-all flex items-center gap-1.5"
            >
              SEND <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [mode, setMode] = useState('basic'); 
  const [activePanel, setActivePanel] = useState('chat');
  const [panelVisible, setPanelVisible] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to Claude Studio. I am synchronized with your local file system. How can I help you build today?' }
  ]);
  const [input, setInput] = useState('');
  
  // Mock Data States
  const [installedSkills, setInstalledSkills] = useState(['web-search']);
  const [mcpTools, setMcpTools] = useState([
    { id: 'github', name: 'GitHub Connector', status: 'connected', icon: Github },
    { id: 'slack', name: 'Slack Messenger', status: 'connected', icon: Slack },
    { id: 'gdrive', name: 'Google Drive', status: 'disconnected', icon: Cloud }
  ]);
  const [knowledgeBase, setKnowledgeBase] = useState([
    { id: 'proj-docs', name: 'Project Wiki', size: '2.4 MB', type: 'Markdown' },
    { id: 'api-spec', name: 'API Specifications', size: '512 KB', type: 'JSON' },
    { id: 'legacy-code', name: 'Legacy Reference', size: '12 MB', type: 'Source' }
  ]);

  const toggleSkill = (id) => {
    setInstalledSkills(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "Task received. Investigating your local project structure to fulfill the request..." }]);
    }, 1000);
  };

  const togglePanel = (id) => {
    if (activePanel === id && panelVisible) {
      setPanelVisible(false);
    } else {
      setActivePanel(id);
      setPanelVisible(true);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* 1. FIXED ICON SIDEBAR */}
      <aside className="w-[64px] flex flex-col items-center border-r border-zinc-800 bg-[#09090b] z-50 pt-4 pb-2">
        <div className="mb-6">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-950 shadow-xl shadow-white/5">
            <Zap size={22} className="fill-current" />
          </div>
        </div>

        <div className="flex-1 w-full space-y-1">
          <SidebarIcon icon={MessageSquare} label="Chat" active={activePanel === 'chat'} onClick={() => togglePanel('chat')} />
          <SidebarIcon icon={LayoutGrid} label="Market" active={activePanel === 'market'} onClick={() => togglePanel('market')} />
          <SidebarIcon icon={Wrench} label="MCP" active={activePanel === 'tools'} onClick={() => togglePanel('tools')} />
          <SidebarIcon icon={Book} label="Knowledge" active={activePanel === 'docs'} onClick={() => togglePanel('docs')} />
          
          <div className="mx-4 my-4 border-t border-zinc-800/50" />
          
          <SidebarIcon icon={Files} label="Explorer" active={activePanel === 'explorer'} onClick={() => togglePanel('explorer')} hidden={mode === 'basic'} />
          <SidebarIcon icon={GitBranch} label="Git" active={activePanel === 'git'} onClick={() => togglePanel('git')} hidden={mode === 'basic'} />
          <SidebarIcon icon={TerminalIcon} label="Terminal" active={activePanel === 'terminal'} onClick={() => togglePanel('terminal')} hidden={mode === 'basic'} />
        </div>

        <div className="w-full space-y-1 mt-auto">
          <SidebarIcon icon={Settings} label="Settings" active={activePanel === 'settings'} onClick={() => togglePanel('settings')} />
          <div className="p-4 flex justify-center">
             <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">JD</div>
             </div>
          </div>
        </div>
      </aside>

      {/* 2. FLYOUT EXTENSION PANEL */}
      {panelVisible && (
        <aside className="w-[320px] flex flex-col bg-[#0c0c0e] border-r border-zinc-800 transition-all duration-300 animate-in slide-in-from-left-4 z-40">
          <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800/50 shrink-0">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {activePanel === 'market' ? 'Skill Marketplace' : activePanel === 'tools' ? 'MCP Connectors' : activePanel === 'docs' ? 'Knowledge Base' : activePanel}
            </h2>
            <button onClick={() => setPanelVisible(false)} className="text-zinc-500 hover:text-zinc-200"><X size={14} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {/* MARKETPLACE CONTENT */}
            {activePanel === 'market' && (
              <div className="space-y-4">
                <div className="relative group mb-4">
                  <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                  <input placeholder="Search skills..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-zinc-600 transition-colors" />
                </div>
                
                {[
                  { id: 'web-search', name: 'Web Search', desc: 'Browse the web for real-time data.', icon: Globe },
                  { id: 'image-gen', name: 'Image Studio', desc: 'Generate assets using Imagen 4.0.', icon: Layers },
                  { id: 'db-analyst', name: 'SQL Architect', desc: 'Visualize and optimize databases.', icon: Database },
                  { id: 'ui-builder', name: 'Tailwind Pro', desc: 'Craft modern UIs from prompts.', icon: Box }
                ].map(skill => (
                  <div key={skill.id} className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-all">
                    <div className="flex gap-3 items-start mb-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
                        <skill.icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-200 truncate">{skill.name}</p>
                        <p className="text-[10px] text-zinc-500 leading-tight mt-1">{skill.desc}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleSkill(skill.id)}
                      className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        installedSkills.includes(skill.id) 
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-red-900/20 hover:text-red-400 border border-zinc-700 hover:border-red-500/30' 
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {installedSkills.includes(skill.id) ? (
                        <><Trash2 size={12} /> Uninstall</>
                      ) : (
                        <><Download size={12} /> Install Skill</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* MCP TOOLS CONTENT */}
            {activePanel === 'tools' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-600/5 border border-blue-500/20 rounded-xl mb-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">MCP Active</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">3 tools are currently broadcasting context to the model.</p>
                </div>

                {mcpTools.map(tool => (
                  <div key={tool.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-zinc-400">
                      <tool.icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-zinc-300">{tool.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1 h-1 rounded-full ${tool.status === 'connected' ? 'bg-green-500' : 'bg-zinc-600'}`} />
                        <span className="text-[9px] text-zinc-600 uppercase font-bold">{tool.status}</span>
                      </div>
                    </div>
                    <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-600 hover:text-zinc-300">
                      <Settings size={14} />
                    </button>
                  </div>
                ))}
                
                <button className="w-full py-3 border border-dashed border-zinc-800 rounded-xl text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-all flex flex-col items-center gap-1">
                  <Plus size={16} />
                  <span className="text-[9px] font-bold uppercase">Add New Connector</span>
                </button>
              </div>
            )}

            {/* KNOWLEDGE BASE CONTENT */}
            {activePanel === 'docs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Indexed Items</span>
                  <button className="text-[9px] text-blue-500 hover:underline">Re-index all</button>
                </div>
                
                <div className="space-y-2">
                  {knowledgeBase.map(doc => (
                    <div key={doc.id} className="group p-3 bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/50 rounded-xl flex items-center gap-3 cursor-pointer transition-all">
                      <div className="w-8 h-8 rounded bg-zinc-950 flex items-center justify-center text-zinc-500 group-hover:text-blue-400 transition-colors">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-zinc-300 truncate">{doc.name}</p>
                        <p className="text-[9px] text-zinc-600 font-medium uppercase">{doc.size} • {doc.type}</p>
                      </div>
                      <CheckCircle2 size={14} className="text-green-600/50" />
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <p className="text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-tighter text-center">Sync Progress</p>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[85%]" />
                  </div>
                  <p className="text-[9px] text-zinc-600 mt-2 text-center">85% of workspace indexed for context.</p>
                </div>
              </div>
            )}

            {activePanel === 'explorer' && (
              <div className="p-2 text-xs text-zinc-500 italic">Project explorer content...</div>
            )}
          </div>
        </aside>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col bg-[#09090b] overflow-hidden">
        
        {/* HEADER */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xs font-bold tracking-tighter text-zinc-200">Claude Studio <span className="text-zinc-600 font-normal ml-2">v1.4.2</span></h1>
          </div>
          
          <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 shadow-inner">
            <button 
              onClick={() => { setMode('basic'); setPanelVisible(false); }}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${mode === 'basic' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Basic
            </button>
            <button 
              onClick={() => setMode('advanced')}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${mode === 'advanced' ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Advanced
            </button>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[9px] font-bold text-green-500 uppercase">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Sync
             </div>
             <MoreHorizontal size={16} className="text-zinc-600" />
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden">
          {mode === 'basic' ? (
            <ChatInterface messages={messages} input={input} setInput={setInput} handleSend={handleSend} fullWidth={true} />
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* MIDDLE: EDITOR */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800 bg-[#0c0c0e]">
                <div className="h-9 flex items-center bg-zinc-950 px-4 border-b border-zinc-800 justify-between shrink-0">
                  <div className="flex items-center gap-4 h-full">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest border-b-2 border-blue-500 h-full pt-1">
                      <Code2 size={12} className="text-blue-400" /> App.jsx
                    </div>
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">Styles.css</div>
                  </div>
                </div>
                <div className="flex-1 p-6 font-mono text-xs text-zinc-400 overflow-auto custom-scrollbar">
                  <pre><code className="block leading-relaxed">{`1  import { Studio } from 'claude-studio';\n2  \n3  export default function App() {\n4    return <Studio />;\n5  }`}</code></pre>
                </div>
                {/* TERMINAL */}
                <div className="h-[30%] min-h-[160px] bg-zinc-950 border-t border-zinc-800 flex flex-col shrink-0 p-3 font-mono text-[10px]">
                  <div className="text-zinc-600 mb-1">claude@studio:~/local-app$ npm run dev</div>
                  <div className="text-blue-400">Local: http://localhost:5173/</div>
                </div>
              </div>
              {/* RIGHT: CHAT */}
              <div className="w-[380px] shrink-0 flex flex-col bg-[#09090b]">
                <ChatInterface messages={messages} input={input} setInput={setInput} handleSend={handleSend} fullWidth={false} />
              </div>
            </div>
          )}
        </div>

        {/* STATUS BAR */}
        <footer className="h-6 border-t border-zinc-800 bg-[#09090b] flex items-center justify-between px-4 text-[9px] text-zinc-600 font-bold uppercase tracking-widest shrink-0">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 hover:text-zinc-400 cursor-pointer"><GitBranch size={10} /> main*</div>
              <div className="flex items-center gap-1 text-green-600"><div className="w-1 h-1 bg-green-600 rounded-full" /> Connected</div>
           </div>
           <div className="flex items-center gap-6 text-blue-500">
              <Zap size={10} className="fill-current" /> Studio AI Active
           </div>
        </footer>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        code, pre, .font-mono { font-family: 'JetBrains Mono', monospace; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .message-anim { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
