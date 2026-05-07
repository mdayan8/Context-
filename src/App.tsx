import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal as TerminalIcon, 
  Brain, 
  Map, 
  FileText, 
  Share2, 
  ChevronRight, 
  Folder, 
  File, 
  Cpu, 
  Zap,
  Github,
  Monitor,
  Code
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "./lib/utils";
import { GoogleGenAI } from "@google/genai";

interface TerminalLine {
  type: "input" | "output" | "error" | "success";
  content: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [paths, setPaths] = useState<string[]>([]);
  const [tree, setTree] = useState<any>({});
  const [logs, setLogs] = useState<TerminalLine[]>([]);
  const [brain, setBrain] = useState<any>(null);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "brain" | "summary">("map");

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addLog = (type: TerminalLine["type"], content: string) => {
    setLogs(prev => [...prev, { type, content }]);
  };

  const handleScan = async () => {
    setLoading("scanning");
    addLog("input", "contextos map");
    addLog("output", "Scanning repository structure...");
    try {
      const res = await fetch("/api/scan");
      const data = await res.json();
      setPaths(data.paths);
      
      // Build tree for visual display
      const newTree: any = {};
      data.paths.forEach((p: string) => {
        const parts = p.split("/");
        let current = newTree;
        parts.forEach((part, i) => {
          if (!current[part]) {
            current[part] = i === parts.length - 1 ? { type: "file" } : { type: "folder", children: {} };
          }
          current = current[part].children || current[part];
        });
      });
      setTree(newTree);

      addLog("success", `Mapped ${data.paths.length} files successfully.`);
      setActiveTab("map");
    } catch (e) {
      addLog("error", "Failed to scan repository.");
    } finally {
      setLoading(null);
    }
  };

  const handleBrain = async () => {
    setLoading("brain");
    addLog("input", "contextos brain");
    addLog("output", "Synthesizing repository intelligence...");
    try {
      const metaRes = await fetch("/api/meta");
      const { packageJson, metadata } = await metaRes.json();

      const prompt = `Based on the following package.json and metadata.json, generate a "repository brain" in JSON format. 
      Include "personality" (e.g. "Minimalist", "Enterprise"), "complexityScore" (1-10), "keyDependencies", and "suggestedOptimizations" (array of strings).
      Return ONLY valid JSON.
      
      Package JSON: ${JSON.stringify(packageJson)}
      Metadata: ${JSON.stringify(metadata)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const jsonStr = response.text?.trim() || "{}";
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      const brainData = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse" };
      
      setBrain(brainData);
      addLog("success", "Brain generated. Insights available.");
      setActiveTab("brain");
    } catch (e) {
      addLog("error", "Failed to generate brain: " + (e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleSummarize = async () => {
    setLoading("summarize");
    addLog("input", "contextos summarize");
    addLog("output", "Generating semantic architecture summary...");
    try {
      const readRes = await fetch("/api/read-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: paths.slice(0, 10) })
      });
      const { contents } = await readRes.json();
      
      const contextStr = contents.map((c: any) => `File: ${c.path}\n\n${c.content.slice(0, 2000)}`).join("\n\n---\n\n");
      const prompt = `Analyze this repository and provide a concise architectural summary (context.md style). Focus on core purpose, tech stack, and entry points.\n\n${contextStr}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      setSummary(response.text || "No summary generated.");
      addLog("success", "context.md generated.");
      setActiveTab("summary");
    } catch (e) {
      addLog("error", "Failed to summarize.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans bg-bg-main text-slate-300 overflow-hidden">
      {/* Header Navigation */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-bg-alt">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-lime-400 rounded-md flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-black rotate-45"></div>
          </div>
          <span className="font-mono font-bold tracking-tight text-white flex items-center gap-2">
            contextOS <span className="text-lime-400 opacity-80 text-xs">v1.0.0</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-lime-400'}`}></div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Engine: {loading ? 'Processing...' : 'Ready'}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-white/10 hidden md:block"></div>
          <div className="flex gap-4">
            <a href="#" className="text-xs font-medium hover:text-white cursor-pointer transition-colors">Docs</a>
            <a href="https://github.com" target="_blank" className="text-xs font-medium hover:text-white cursor-pointer transition-colors flex items-center gap-1">
              <Github className="w-3 h-3" /> GitHub
            </a>
            <span className="text-xs font-medium text-lime-400">v.open-source</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden">
        {/* Sidebar: Command Console (Desktop only) */}
        <aside className="hidden lg:flex lg:col-span-3 border-r border-white/5 bg-[#0D0F14]/50 p-6 flex-col gap-8">
          <section>
            <h3 className="mono-label mb-4">Core Commands</h3>
            <div className="space-y-2">
              <CommandItem 
                cmd="contextos map"
                icon={<Map className="w-4 h-4" />} 
                label="Map Architecture" 
                shortcut="CTRL+M" 
                onClick={handleScan}
                loading={loading === "scanning"}
              />
              <CommandItem 
                cmd="contextos brain"
                icon={<Brain className="w-4 h-4" />} 
                label="Generate Brain" 
                shortcut="CTRL+B" 
                onClick={handleBrain}
                loading={loading === "brain"}
              />
              <CommandItem 
                cmd="contextos summarize"
                icon={<FileText className="w-4 h-4" />} 
                label="Summarize Repo" 
                shortcut="CTRL+S" 
                onClick={handleSummarize}
                loading={loading === "summarize"}
              />
              <CommandItem 
                cmd="contextos export"
                icon={<Share2 className="w-4 h-4" />} 
                label="Export Context" 
                shortcut="CTRL+E" 
              />
            </div>
          </section>

          <section className="mt-auto">
            <div className="p-4 rounded-xl bg-gradient-to-br from-lime-400/10 to-transparent border border-lime-400/20">
              <p className="text-xs text-white font-medium mb-1 flex items-center gap-2">
                <Zap className="w-3 h-3 text-lime-400" />
                Open Source Power
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Building a shared memory for LLMs. Portable context for any repository.
              </p>
            </div>
          </section>
        </aside>

        {/* Center: Main View & Terminal */}
        <section className="flex-1 lg:col-span-6 bg-black relative flex flex-col overflow-hidden">
          {/* Mobile Commands (Visible only on small screens) */}
          <div className="lg:hidden flex overflow-x-auto p-3 gap-2 border-b border-white/5 bg-bg-alt/50 scrollbar-none">
            <button onClick={handleScan} className="flex-none px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest border border-white/5">Map</button>
            <button onClick={handleBrain} className="flex-none px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest border border-white/5">Brain</button>
            <button onClick={handleSummarize} className="flex-none px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest border border-white/5">Summary</button>
            <button className="flex-none px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest border border-white/5">Export</button>
          </div>

          {/* Tabs */}
          <div className="h-12 border-b border-white/5 flex items-center px-2 gap-0 bg-bg-alt/30 overflow-x-auto scrollbar-none">
            <TabItem active={activeTab === "map"} onClick={() => setActiveTab("map")} label="Architecture" icon={<Map className="w-3.5 h-3.5" />} />
            <TabItem active={activeTab === "brain"} onClick={() => setActiveTab("brain")} label="Intelligence" icon={<Brain className="w-3.5 h-3.5" />} />
            <TabItem active={activeTab === "summary"} onClick={() => setActiveTab("summary")} label="context.md" icon={<FileText className="w-3.5 h-3.5" />} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-white/5">
            <AnimatePresence mode="wait">
              {activeTab === "map" && (
                <motion.div 
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {paths.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                       <div className="glass p-4 sm:p-6 rounded-lg overflow-y-auto max-h-[400px]">
                          <h4 className="font-medium text-white mb-4 flex items-center gap-2 sticky top-0 bg-bg-alt/80 backdrop-blur-sm py-2">
                            <Monitor className="w-4 h-4 text-lime-400" />
                            File Architecture
                          </h4>
                          <div className="font-mono text-sm text-slate-500">
                             <RecursiveTree data={tree} />
                          </div>
                       </div>
                    </div>
                  ) : (
                    <EmptyState 
                      icon={<Map className="w-12 h-12 text-slate-800" />} 
                      title="No architecture map" 
                      description="Initialize contextOS map to visualize your repository structure."
                      action={handleScan}
                      actionLabel="contextos map"
                    />
                  )}
                </motion.div>
              )}

              {activeTab === "brain" && (
                <motion.div 
                  key="brain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {brain ? (
                    <div className="space-y-6">
                      <div className="glass p-6 sm:p-8 rounded-2xl relative overflow-hidden bg-gradient-to-br from-lime-400/5 to-transparent">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                           <Brain className="w-32 h-32 text-lime-400" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Memory Synthesis</h2>
                        <p className="text-slate-400 mb-8 max-w-lg text-xs sm:text-sm">
                          Deep semantic extraction from architectural patterns and dependency graphs.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                           <div>
                             <label className="mono-label block mb-1">Repo Personality</label>
                             <span className="text-lg sm:text-xl font-medium text-lime-400 italic underline decoration-lime-400/30 underline-offset-4 decoration-2">{brain.personality || "Architectural Core"}</span>
                           </div>
                           <div>
                             <label className="mono-label block mb-1">Complexity</label>
                             <div className="flex items-center gap-3">
                                <span className="text-xl sm:text-2xl font-bold text-white">{brain.complexityScore || "7.5"}</span>
                                <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-lime-400" style={{ width: `${(Number(brain.complexityScore) || 7.5) * 10}%` }}></div>
                                </div>
                             </div>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass p-6 rounded-lg">
                          <h4 className="mono-label mb-4">Core Insights</h4>
                          <ul className="space-y-3">
                            {(brain.suggestedOptimizations || []).slice(0, 3).map((opt: string, i: number) => (
                              <li key={i} className="text-[11px] sm:text-xs text-slate-400 flex gap-3 leading-relaxed">
                                <span className="text-lime-400">→</span>
                                {opt}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="glass p-6 rounded-lg">
                          <h4 className="mono-label mb-4">Tech Indicators</h4>
                          <div className="flex flex-wrap gap-2">
                            {(brain.keyDependencies || ["TypeScript", "ESM", "Vite"]).map((dep: string) => (
                              <span key={dep} className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-slate-400 border border-white/5 uppercase">
                                {dep}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState 
                      icon={<Brain className="w-12 h-12 text-slate-800" />} 
                      title="Brain not found" 
                      description="Generate repo intelligence to reveal complexity and optimizations."
                      action={handleBrain}
                      actionLabel="contextos brain"
                    />
                  )}
                </motion.div>
              )}

              {activeTab === "summary" && (
                <motion.div 
                  key="summary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="prose prose-invert prose-xs sm:prose-sm max-w-none glass p-6 sm:p-8 rounded-lg overflow-y-auto"
                >
                  {summary ? (
                    <div className="markdown-body text-slate-400">
                      <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                  ) : (
                    <EmptyState 
                      icon={<FileText className="w-12 h-12 text-slate-800" />} 
                      title="context.md missing" 
                      description="Create a semantic summary for token-optimized LLM context."
                      action={handleSummarize}
                      actionLabel="contextos summarize"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Terminal (Bottom) */}
          <div className="h-48 sm:h-64 border-t border-white/5 bg-[#14161B] flex flex-col shadow-2xl">
            <div className="flex items-center px-4 py-2 bg-[#1C1E26] border-b border-white/5">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
              <span className="mx-auto text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest truncate px-2">
                contextos — shell
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 font-mono text-xs sm:text-sm space-y-2 overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
              {logs.length === 0 && (
                <div className="text-slate-600 italic text-xs">$ _</div>
              )}
              {logs.map((log, i) => (
                <div key={i} className={cn(
                  "flex gap-3",
                  log.type === "input" && "text-lime-400",
                  log.type === "output" && "text-slate-500",
                  log.type === "error" && "text-red-400",
                  log.type === "success" && "text-blue-400"
                )}>
                  {log.type === "input" && <span>$</span>}
                  <p className="whitespace-pre-wrap leading-relaxed">{log.content}</p>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-white/50 animate-pulse">
                  <span className="w-2 h-2 bg-lime-400 rounded-full"></span>
                  <span>Processing...</span>
                </div>
              )}
              <div ref={terminalEndRef} />
              {!loading && <div className="text-white">$ <span className="w-1.5 h-4 bg-white inline-block animate-pulse align-middle"></span></div>}
            </div>
          </div>
        </section>

        {/* Right Sidebar: Repo Intelligence (Desktop only) */}
        <aside className="hidden lg:flex lg:col-span-3 border-l border-white/5 bg-bg-alt/50 p-6 flex-col gap-8 overflow-y-auto">
          <div>
            <h3 className="mono-label mb-4">Repo Metadata</h3>
            <div className="bg-white/5 rounded-xl p-5 border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Complexity</span>
                <span className="text-xs text-white font-mono">{brain?.complexityScore || "0.0"}</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 transition-all duration-1000" style={{ width: `${(Number(brain?.complexityScore) || 0) * 10}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-600">
                <span>0.0</span>
                <span>SYSTEM MAX 10.0</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mono-label mb-4">Context Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-mono text-white tracking-tighter">72%</span>
                <span className="text-[10px] text-green-400 uppercase font-bold tracking-wider">Compression</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tokens optimized for semantic clarity. High signal-to-noise ratio detected.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="flex items-center justify-between mb-4">
               <h3 className="mono-label">System State</h3>
               <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]"></div>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-mono">
                 <span className="text-slate-500">MEMORY_LOADED</span>
                 <span className="text-white">104MB</span>
               </div>
               <div className="flex justify-between text-[10px] font-mono">
                 <span className="text-slate-500">VECTOR_STORE</span>
                 <span className="text-white">LOCAL</span>
               </div>
             </div>
          </div>
        </aside>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 px-6 bg-lime-400 flex items-center justify-between text-black text-[10px] font-bold">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
            READY
          </span>
          <span className="opacity-60">MEMORY_LOADED</span>
          <span className="opacity-60 tracking-widest uppercase">contextOS_Engine_v1.0</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="animate-pulse">SCAN_ACTIVE</span>
          <div className="flex items-center gap-1.5">
            <Github className="w-3 h-3" />
            GH/CONTEXTOS
          </div>
        </div>
      </footer>
    </div>
  );
}

function RecursiveTree({ data }: { data: any }) {
  return (
    <div className="pl-4 border-l border-white/5">
      {Object.entries(data).map(([name, value]: [string, any]) => (
        <div key={name} className="py-1">
          {value.type === "folder" ? (
            <details open className="group">
              <summary className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors list-none select-none">
                <ChevronRight className="w-3 h-3 text-slate-600 group-open:rotate-90 transition-transform" />
                <Folder className="w-3.5 h-3.5 text-lime-400/40 group-open:text-lime-400/70" />
                <span className="group-open:text-white">{name}</span>
              </summary>
              <div className="mt-1">
                <RecursiveTree data={value.children} />
              </div>
            </details>
          ) : (
            <div className="flex items-center gap-2 pl-5 text-slate-500 hover:text-lime-400/80 cursor-pointer py-0.5 transition-colors group">
              <File className="w-3 h-3 opacity-30 group-hover:opacity-100" />
              <span>{name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CommandItem({ icon, label, shortcut, onClick, loading, cmd }: { icon: React.ReactNode, label: string, shortcut: string, onClick?: () => void, loading?: boolean, cmd: string }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-3 bg-white/5 rounded border border-white/5 group hover:border-lime-400/30 cursor-pointer transition-all",
        loading && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex flex-col gap-1">
        <code className={cn("text-sm transition-colors", loading ? "text-slate-500" : "text-white/80 group-hover:text-lime-400")}>{cmd}</code>
      </div>
      <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
        {loading ? "..." : shortcut}
      </span>
    </div>
  );
}

function TabItem({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 h-full text-[10px] uppercase font-bold tracking-widest transition-all relative overflow-hidden",
        active 
          ? "text-white" 
          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      {icon}
      {label}
      {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-lime-400" />}
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="glass p-6 rounded-2xl flex items-center justify-between group hover:border-lime-400/30 transition-colors">
      <div>
        <label className="mono-label block mb-1">{title}</label>
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-lime-400 transition-colors">
        {icon}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, action, actionLabel }: { icon: React.ReactNode, title: string, description: string, action?: () => void, actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
      <div className="mb-6 p-6 bg-white/5 rounded-full border border-white/5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-500 text-xs mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <button 
          onClick={action}
          className="bg-lime-400 hover:bg-lime-300 text-black px-6 py-2 rounded font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-lime-900/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
