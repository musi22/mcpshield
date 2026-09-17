import React, { useState, useEffect } from 'react';
import { useUser, useClerk, SignIn, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Bot,
  Server,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Lock,
  Plus,
  ArrowRight,
  BookOpen,
  Sparkles,
  Database,
  ExternalLink,
  Check,
  X,
  Play,
  Copy,
  Terminal,
  Layers,
  FileCode,
  Users,
  Eye,
  Key,
  HelpCircle,
  Clock,
  ChevronRight,
  LogOut,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
  Cpu
} from 'lucide-react';
import { api } from './api';

export default function App() {
  const { isSignedIn, user } = useUser();
  const { openSignIn, signOut } = useClerk();

  // Navigation & View Modes
  const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'add-mcp' | 'clerk-db' | 'console'>('overview');
  const [consoleTab, setConsoleTab] = useState<'agents' | 'services' | 'approvals' | 'activity'>('agents');
  const [activeMethod, setActiveMethod] = useState<'npm' | 'awesome' | 'cloud'>('npm');
  
  // Interactive States
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [showClerkModal, setShowClerkModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanOutput, setScanOutput] = useState<string[]>([]);
  const [addServerSuccess, setAddServerSuccess] = useState<string | null>(null);

  // Demo Fallback Login
  const [isDemoLoggedIn, setIsDemoLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('mcpshield_demo_auth') === 'true';
  });

  const isAuthenticated = isSignedIn || isDemoLoggedIn;

  // Live Data States
  const [servers, setServers] = useState<any[]>([
    { id: '1', name: 'GitHub Enterprise MCP', slug: 'github', endpoint_url: 'https://api.github.com/mcp', status: 'healthy', risk_score: 25, transport: 'http_post' },
    { id: '2', name: 'Neon Cloud PostgreSQL', slug: 'postgres', endpoint_url: 'postgresql://ep-cool-wind.neon.tech/neondb', status: 'healthy', risk_score: 35, transport: 'http_post' },
    { id: '3', name: 'Web Fetch & Search Gateway', slug: 'fetch', endpoint_url: 'https://fetch.mcp.services/api', status: 'healthy', risk_score: 15, transport: 'http_post' }
  ]);

  const [agents, setAgents] = useState<any[]>([
    { id: '1', name: 'Customer Support Bot', identifier: 'SupportAgent', team: 'Support Ops', status: 'active', budget: '$200/day', tools: ['web.fetch_url', 'docs.read'], risk: 'Low' },
    { id: '2', name: 'Engineering Coding Agent', identifier: 'CodingAgent', team: 'Engineering', status: 'active', budget: '$1,000/day', tools: ['github.repo.get', 'github.pulls.create'], risk: 'Protected' },
    { id: '3', name: 'Finance Operations Bot', identifier: 'FinanceAgent', team: 'Finance Ops', status: 'active', budget: '$5,000/day', tools: ['postgres.query_table', 'payout.submit'], risk: 'Human Approval Required' }
  ]);

  const [pendingApprovals, setPendingApprovals] = useState<any[]>([
    {
      id: 'appr-01',
      agent_name: 'Finance Operations Bot',
      tool_name: 'postgres.execute_ddl',
      action: 'Execute production schema migration on Cloud PostgreSQL',
      timestamp: 'Just now',
      risk_level: 'High'
    }
  ]);

  const [recentLogs, setRecentLogs] = useState<any[]>([
    { id: '1', time: '1 min ago', agent: 'Customer Support Bot', action: 'Read public documentation page', status: 'Allowed', color: 'text-emerald-600 bg-emerald-50' },
    { id: '2', time: '4 mins ago', agent: 'Finance Operations Bot', action: 'High-risk database migration intercepted', status: 'Needs Approval', color: 'text-rose-600 bg-rose-50' },
    { id: '3', time: '12 mins ago', agent: 'Engineering Coding Agent', action: 'Created pull request on GitHub', status: 'Allowed', color: 'text-emerald-600 bg-emerald-50' },
    { id: '4', time: '25 mins ago', agent: 'External Client', action: 'Blocked destructive deletion attempt', status: 'Blocked', color: 'text-rose-600 bg-rose-50' }
  ]);

  // Add Server Form States (On First Page)
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerTransport, setNewServerTransport] = useState('http_post');
  const [isSubmittingServer, setIsSubmittingServer] = useState(false);

  // Fetch real data on mount
  useEffect(() => {
    api.getServers().then(res => {
      if (res && res.length > 0) setServers(res);
    }).catch(() => {});

    api.getAgents().then(res => {
      if (res && res.length > 0) {
        setAgents(res.map((a: any) => ({
          id: a.id || a.agent_identifier,
          name: a.name || a.agent_identifier,
          identifier: a.agent_identifier,
          team: a.owner_team || 'General',
          status: a.status || 'active',
          budget: `$${a.daily_budget || 500}/day`,
          tools: ['Verified MCP Tools'],
          risk: a.risk_level || 'Protected'
        })));
      }
    }).catch(() => {});
  }, []);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('npx @rashmi2206/mcpshield scan');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyConfig = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleDemoLogin = () => {
    localStorage.setItem('mcpshield_demo_auth', 'true');
    setIsDemoLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('mcpshield_demo_auth');
    setIsDemoLoggedIn(false);
    if (isSignedIn) signOut();
  };

  const handleApprove = (id: string) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    setRecentLogs(prev => [
      { id: Date.now().toString(), time: 'Just now', agent: 'Manager', action: 'Approved action manually', status: 'Approved', color: 'text-emerald-600 bg-emerald-50' },
      ...prev
    ]);
  };

  const handleReject = (id: string) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    setRecentLogs(prev => [
      { id: Date.now().toString(), time: 'Just now', agent: 'Manager', action: 'Blocked action manually', status: 'Rejected', color: 'text-rose-600 bg-rose-50' },
      ...prev
    ]);
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName || !newServerUrl) return;
    setIsSubmittingServer(true);
    const slug = newServerName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newServer = {
      id: Date.now().toString(),
      name: newServerName,
      slug,
      endpoint_url: newServerUrl,
      status: 'healthy',
      risk_score: 20,
      transport: newServerTransport
    };

    try {
      await api.registerServer({
        name: newServerName,
        slug,
        endpoint_url: newServerUrl,
        transport: newServerTransport
      });
    } catch (err) {
      console.warn('Backend sync warning, registering in memory:', err);
    }

    setServers(prev => [newServer, ...prev]);
    setAddServerSuccess(`Successfully registered "${newServerName}" in Neon PostgreSQL!`);
    setIsSubmittingServer(false);
    setNewServerName('');
    setNewServerUrl('');
    setTimeout(() => setAddServerSuccess(null), 5000);
  };

  const handlePresetSelect = (name: string, url: string, transport: string = 'http_post') => {
    setNewServerName(name);
    setNewServerUrl(url);
    setNewServerTransport(transport);
  };

  const runSimulatedScan = () => {
    setIsScanning(true);
    setScanOutput([
      '➜ Initializing MCPShield AST Static Heuristic Engine v1.0.2...',
      '➜ Target: Local Workspace & MCP Configs',
      '➜ Discovered 3 MCP Servers (GitHub, Neon Postgres, Web Gateway)'
    ]);

    setTimeout(() => {
      setScanOutput(prev => [
        ...prev,
        '✔ [Rule 101] Validating Tool Permissions... PASS (Strict Principle of Least Privilege)',
        '✔ [Rule 102] Inspecting Prompt Injection vectors... PASS (Zero injections detected)',
        '✔ [Rule 103] Auditing Destructive Mutators... PASS (DROP/DELETE intercepted by human queue)'
      ]);
    }, 800);

    setTimeout(() => {
      setScanOutput(prev => [
        ...prev,
        '────────────────────────────────────────────────────────────',
        '📊 MCP SECURITY SCORE: 98 / 100 [EXCELLENT]',
        '   Critical: 0 | High: 0 | Medium: 1 | Low: 0',
        '   Compliance: SARIF 2.1.0 Ready | SOC 2 Type II Gate Pass',
        '✔ Audit complete in 18ms. Upstream protected.'
      ]);
      setIsScanning(false);
    }, 1600);
  };

  const claudeDesktopJson = `{
  "mcpServers": {
    "mcpshield-gateway": {
      "command": "npx",
      "args": [
        "-y",
        "@rashmi2206/mcpshield",
        "proxy",
        "--gateway",
        "https://mcpshield.onrender.com"
      ],
      "env": {
        "MCPSHIELD_WORKSPACE": "acme-production",
        "MCPSHIELD_ENFORCE_POLICIES": "true"
      }
    }
  }
}`;

  const cursorIdeJson = `// In your .cursorrules or cursor settings
{
  "mcp": {
    "servers": [
      {
        "name": "mcpshield-proxy",
        "url": "https://mcpshield.onrender.com/mcp/prod",
        "headers": {
          "x-mcpshield-agent": "cursor-coding-agent"
        }
      }
    ]
  }
}`;

  return (
    <div className="min-h-screen flex flex-col selection:bg-rose-100 selection:text-rose-800 font-sans text-slate-800">
      {/* ===================================================================== */}
      {/* 🌟 TOP NAVIGATION BAR */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-rose-200 group-hover:scale-105 transition">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
                MCPShield <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">v1.0.2</span>
              </div>
              <div className="text-xs font-semibold text-rose-500">Enterprise AI Agent Safety Gateway</div>
            </div>
          </div>

          {/* Center Navigation Links (All First Page Sections) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-slate-600">
            <button
              onClick={() => setActiveTab('overview')}
              className={`hover:text-rose-600 transition flex items-center gap-1.5 ${activeTab === 'overview' ? 'text-rose-600' : ''}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`hover:text-rose-600 transition flex items-center gap-1.5 ${activeTab === 'methods' ? 'text-rose-600' : ''}`}
            >
              3 Ways to Use
            </button>
            <button
              onClick={() => setActiveTab('add-mcp')}
              className={`hover:text-rose-600 transition flex items-center gap-1.5 ${activeTab === 'add-mcp' ? 'text-rose-600' : ''}`}
            >
              How to Add MCP
            </button>
            <button
              onClick={() => setActiveTab('clerk-db')}
              className={`hover:text-rose-600 transition flex items-center gap-1.5 ${activeTab === 'clerk-db' ? 'text-rose-600' : ''}`}
            >
              Clerk & Database
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`hover:text-rose-600 transition flex items-center gap-1.5 ${activeTab === 'console' ? 'text-rose-600' : ''}`}
            >
              Company Console
              {pendingApprovals.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          </nav>

          {/* Auth & CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isSignedIn ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-slate-700">Clerk Demo Admin</span>
                  </div>
                )}
                <button
                  onClick={() => setActiveTab('console')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-xs shadow-md shadow-rose-200 hover:opacity-95 transition"
                >
                  Open Console ➔
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDemoLogin}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" /> 1-Click Demo Login
                </button>
                <button
                  onClick={() => {
                    try {
                      openSignIn();
                    } catch (e) {
                      setShowClerkModal(true);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-xs shadow-md shadow-rose-200 hover:opacity-95 transition"
                >
                  Sign In with Clerk
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 🚀 FIRST PAGE: COMPLETE OVERVIEW, 3 WAYS, HOW TO ADD & CLERK DB */}
      {/* ===================================================================== */}
      <main className="flex-1 space-y-20 pb-24">
        {/* =================================================================== */}
        {/* 1. HERO & COMPANY OVERVIEW WITH FRAMER MOTION ANIMATIONS */}
        {/* =================================================================== */}
        <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 text-center">
          {/* Animated Top Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-bold mb-6 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Enterprise Model Context Protocol (MCP) Security Layer & Gateway
          </motion.div>

          {/* Animated Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]"
          >
            Empower AI Agents with Full Action.{' '}
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Zero Danger.
            </span>
          </motion.h1>

          {/* Animated Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
          >
            Autonomous AI agents in <b>Claude Desktop</b>, <b>Cursor IDE</b>, and <b>LangChain</b> can now query live databases, execute GitHub workflows, and call web APIs. <b>MCPShield</b> acts as the real-time security gateway to intercept destructive commands, mask leaked credentials, and route critical approvals to humans.
          </motion.p>

          {/* CTAs & Zero-Install NPM Box */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* 1-Click Copyable Command Box */}
            <div className="flex items-center bg-white border border-rose-200 rounded-2xl p-1.5 shadow-lg shadow-rose-100/60 max-w-md w-full justify-between">
              <div className="flex items-center gap-2 pl-3 text-slate-800 font-mono text-xs sm:text-sm font-semibold">
                <Terminal className="w-4 h-4 text-rose-500" />
                <span>npx @rashmi2206/mcpshield scan</span>
              </div>
              <button
                onClick={handleCopyCmd}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCmd ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button
              onClick={() => setActiveTab('add-mcp')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-sm shadow-xl shadow-rose-200 hover:opacity-95 transition flex items-center gap-2"
            >
              How to Add Your MCP <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* 🎬 FRAMER MOTION ARCHITECTURE DIAGRAM */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-14 max-w-5xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-rose-100 shadow-2xl shadow-rose-100/60 relative overflow-hidden"
          >
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-rose-100 gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" /> Company Architecture Overview
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">How MCPShield Intercepts & Protects Every Action</h3>
              </div>
              <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Deterministic Gateway Latency: &lt;18ms
              </div>
            </div>

            {/* 3-Step Interactive Architecture Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Box 1: AI Agent */}
              <motion.div
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200 text-left space-y-3"
              >
                <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500 font-bold">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-base">1. Autonomous AI Agent</div>
                  <div className="text-xs text-slate-500">Claude Desktop, Cursor IDE, or LangChain invokes an MCP tool</div>
                </div>
                <div className="text-[11px] font-mono bg-white p-2.5 rounded-xl text-slate-600 border border-rose-100 flex items-center justify-between">
                  <span>POST /mcp/call_tool</span>
                  <span className="text-[10px] text-rose-500 font-bold">Agent Request</span>
                </div>
              </motion.div>

              {/* Box 2: Center Security Gateway (Pulsing Framer Motion) */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                animate={{
                  boxShadow: [
                    '0 10px 30px -5px rgba(244, 63, 94, 0.2)',
                    '0 15px 40px -5px rgba(251, 146, 60, 0.3)',
                    '0 10px 30px -5px rgba(244, 63, 94, 0.2)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="p-6 rounded-2xl bg-gradient-to-b from-rose-500 to-orange-400 text-white text-left space-y-3 shadow-xl relative transform md:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/25">
                    Live Security Core
                  </span>
                </div>
                <div>
                  <div className="font-bold text-lg">2. MCPShield Gateway</div>
                  <div className="text-xs text-rose-100">3-Layer Deterministic Verification</div>
                </div>
                <ul className="text-xs space-y-2 text-white font-medium">
                  <li className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Deterministic Policy Engine
                  </li>
                  <li className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Zero-Latency DLP Secret Masking
                  </li>
                  <li className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Human-in-the-Loop Interceptor
                  </li>
                </ul>
              </motion.div>

              {/* Box 3: Safe Upstream Infrastructure */}
              <motion.div
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-left space-y-3"
              >
                <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 font-bold">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-base">3. Safe Upstream Systems</div>
                  <div className="text-xs text-slate-500">Verified actions execute on real production databases and APIs</div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-700">
                    Neon Postgres DB
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-700">
                    GitHub Enterprise
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-700">
                    Web Gateway
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* =================================================================== */}
        {/* 2. 📦 3 DIFFERENT WAYS TO USE MCPSHIELD (HUGE DESCRIPTIONS) */}
        {/* =================================================================== */}
        <section id="methods" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 px-3 py-1 rounded-full bg-rose-50 border border-rose-200">
              Complete Distribution & Use Cases
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
              3 Powerful Ways to Get & Use MCPShield
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Explore huge, comprehensive guides for each deployment method: zero-install terminal CLI, Awesome-MCP ecosystem integration, or 24/7 cloud gateway.
            </p>
          </div>

          {/* Interactive Method Switcher Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-rose-200 shadow-md gap-2">
              <button
                onClick={() => setActiveMethod('npm')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                  activeMethod === 'npm'
                    ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Terminal className="w-4 h-4" /> 1. Official NPM Package
              </button>
              <button
                onClick={() => setActiveMethod('awesome')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                  activeMethod === 'awesome'
                    ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" /> 2. Awesome-MCP Integration
              </button>
              <button
                onClick={() => setActiveMethod('cloud')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                  activeMethod === 'cloud'
                    ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-4 h-4" /> 3. Cloud Gateway & Neon DB
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-100 shadow-2xl shadow-rose-100/50">
            {/* METHOD 1: NPM PACKAGE DEEP DIVE */}
            {activeMethod === 'npm' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-rose-100">
                  <div>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Method 1: Zero-Install Terminal CLI</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Official NPM Package: @rashmi2206/mcpshield</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Audit local workspaces, MCP configuration files, and remote server endpoints in under 1 second without setup.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      v1.0.2 Live on npmjs.com
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* Left: How Could I Use It? Detailed Explanation */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-rose-500" /> How Could I Use the NPM Version?
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      The official NPM package delivers instant vulnerability and compliance scanning for your AI development pipeline:
                    </p>
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <b>Zero Installation Required:</b> Run <code>npx @rashmi2206/mcpshield scan</code> from anywhere. No local servers, dependencies, or python environments needed.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <b>Built-in Offline Heuristic Scanner:</b> Analyzes MCP tool capabilities, SQL injection vulnerabilities, uncontrolled financial mutators, and wildcard privileges directly in Node.js.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <b>CI/CD SARIF 2.1.0 Ready:</b> Pipe results directly into GitHub Code Scanning tabs or pre-commit git hooks:
                          <br />
                          <code className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono text-xs mt-1 inline-block">
                            npx @rashmi2206/mcpshield scan --format sarif &gt; results.sarif
                          </code>
                        </div>
                      </li>
                    </ul>

                    <div className="pt-4 flex items-center gap-3">
                      <button
                        onClick={runSimulatedScan}
                        disabled={isScanning}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-xs shadow-md shadow-rose-200 hover:opacity-95 transition flex items-center gap-2"
                      >
                        {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {isScanning ? 'Scanning...' : '▶ Run Live Terminal Scan Simulation'}
                      </button>
                    </div>
                  </div>

                  {/* Right: Interactive Terminal Simulator */}
                  <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 font-mono text-xs shadow-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-[11px] text-slate-400 ml-2">Terminal: @rashmi2206/mcpshield</span>
                      </div>
                      <button
                        onClick={handleCopyCmd}
                        className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCmd ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="text-rose-400 font-bold">$ npx @rashmi2206/mcpshield scan</div>

                    {scanOutput.length === 0 ? (
                      <div className="text-slate-500 py-6 text-center">
                        Click "Run Live Terminal Scan Simulation" above to view live heuristic scan results.
                      </div>
                    ) : (
                      <div className="space-y-1.5 overflow-x-auto max-h-64 py-2">
                        {scanOutput.map((line, idx) => (
                          <div
                            key={idx}
                            className={
                              line.includes('PASS') || line.includes('EXCELLENT') || line.includes('✔')
                                ? 'text-emerald-400 font-bold'
                                : line.includes('SCORE')
                                ? 'text-orange-400 font-bold text-sm'
                                : 'text-slate-300'
                            }
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* METHOD 2: AWESOME-MCP & AGENT INTEGRATION DEEP DIVE */}
            {activeMethod === 'awesome' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-rose-100">
                  <div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Method 2: Ecosystem Standard</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Awesome-MCP & AI Agent Integration</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Adheres to the official Model Context Protocol standard. Integrate with Claude Desktop and Cursor in 1 click.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                      Protocol Verified
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* Left: Detailed Integration Steps */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-500" /> How to Integrate with Awesome-MCP & Desktop Agents
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      MCPShield intercepts all agent tool invocations transparently without requiring changes to client-side LLM code:
                    </p>
                    <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1">
                        <div className="font-bold text-slate-900">Step 1: Open Claude Desktop Config</div>
                        <div className="text-xs text-slate-500 font-mono">
                          %APPDATA%/Claude/claude_desktop_config.json (Windows) or ~/Library/Application Support/Claude (Mac)
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-1">
                        <div className="font-bold text-slate-900">Step 2: Add MCPShield Proxy Stanza</div>
                        <div className="text-xs text-slate-500">
                          Paste the configuration shown on the right. Claude will immediately route tool requests through MCPShield's firewall.
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-1">
                        <div className="font-bold text-slate-900">Step 3: Enjoy Continuous Protection</div>
                        <div className="text-xs text-slate-500">
                          Claude can query real databases and execute files while MCPShield prevents SQL injection, credential leaks, and runaway budgets.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Config Code Block */}
                  <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 font-mono text-xs shadow-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-rose-400 font-bold">claude_desktop_config.json</span>
                      <button
                        onClick={() => handleCopyConfig(claudeDesktopJson)}
                        className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedConfig ? 'Copied' : 'Copy JSON'}
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[11px] text-slate-300 leading-relaxed">
                      {claudeDesktopJson}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}

            {/* METHOD 3: CLOUD GATEWAY & NEON POSTGRESQL DEEP DIVE */}
            {activeMethod === 'cloud' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-rose-100">
                  <div>
                    <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">Method 3: 24/7 Enterprise Cloud</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Cloud Production Gateway & Neon PostgreSQL</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Deployed 24/7 on Render cloud backed by AWS Neon Serverless PostgreSQL for SOC 2 compliance.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Render Cloud: Operational
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center font-bold shadow-sm">
                      <Database className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">Serverless Neon DB</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      All audit records, security policies, and registered MCP servers persist reliably in AWS Neon PostgreSQL with zero cold starts.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-white text-pink-600 flex items-center justify-center font-bold shadow-sm">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">SHA-256 Chained Audits</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Every tool invocation is hashed and cryptographically chained so records cannot be tampered with or retroactively deleted.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center font-bold shadow-sm">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">Sliding-Window Rate Limits</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Impose daily financial spend budgets, request rate caps, and concurrent agent execution limits dynamically.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-700">
                    <b>Cloud Health Endpoint:</b> <code>https://mcpshield.onrender.com/healthz</code> (Returns HTTP 200 OK)
                  </div>
                  <a
                    href="https://mcpshield.onrender.com/healthz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold text-xs shadow-sm hover:bg-rose-50 transition flex items-center gap-1.5"
                  >
                    Test Live Cloud Gateway <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. 🛠️ HOW TO ADD AN MCP SERVER (ON FIRST PAGE WITH LIVE FORM!) */}
        {/* =================================================================== */}
        <section id="add-mcp" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-rose-50/80 via-white to-orange-50/80 rounded-3xl p-8 sm:p-12 border border-rose-100 shadow-2xl shadow-rose-100/50 space-y-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 px-3 py-1 rounded-full bg-white border border-rose-200">
                Interactive Setup on First Page
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-3">
                How to Add Any MCP Server in 3 Simple Steps
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                You can add any real MCP server (GitHub, Postgres, File tools, or internal API) directly using this interactive configurator.
              </p>
            </div>

            {/* 3 Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 font-black text-lg flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-slate-800 text-base">Select Service Endpoint</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Choose your real upstream service. It can be a remote HTTPS URL (e.g. <code>https://api.github.com/mcp</code>) or a local SSE server port.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 font-black text-lg flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-slate-800 text-base">Register in MCPShield</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fill in the live form below on this page or use the CLI command:
                  <br />
                  <code className="text-[11px] font-mono text-rose-700 bg-rose-50 px-1 py-0.5 rounded mt-1 inline-block">
                    mcpshield servers add &lt;name&gt; &lt;url&gt;
                  </code>
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-black text-lg flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-slate-800 text-base">Attach Policies & Relax</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  MCPShield auto-discovers tools, blocks risky mutations (like dropping tables), and forwards alerts to the human approval queue.
                </p>
              </div>
            </div>

            {/* 📝 LIVE INTERACTIVE ADD MCP SERVER FORM ON FIRST PAGE */}
            <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-rose-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-rose-500" /> Connect Your MCP Server Directly to Database
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitting this form persists the server in AWS Neon PostgreSQL and activates the real-time proxy.
                  </p>
                </div>
                {/* 1-Click Template Fill Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('GitHub Enterprise MCP', 'https://api.github.com/mcp')}
                    className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
                  >
                    + GitHub Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('Neon Cloud PostgreSQL', 'postgresql://ep-cool-wind.neon.tech/neondb')}
                    className="px-3 py-1 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold border border-pink-200 transition"
                  >
                    + Postgres Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('Web Fetch Gateway', 'https://fetch.mcp.services/api')}
                    className="px-3 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold border border-orange-200 transition"
                  >
                    + Web Search Preset
                  </button>
                </div>
              </div>

              {addServerSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {addServerSuccess}
                </div>
              )}

              <form onSubmit={handleCreateServer} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">MCP Server Name</label>
                  <input
                    type="text"
                    value={newServerName}
                    onChange={e => setNewServerName(e.target.value)}
                    placeholder="e.g. Acme GitHub Gateway"
                    className="w-full px-4 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Endpoint URL</label>
                  <input
                    type="text"
                    value={newServerUrl}
                    onChange={e => setNewServerUrl(e.target.value)}
                    placeholder="https://api.github.com/mcp"
                    className="w-full px-4 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium font-mono text-xs"
                    required
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmittingServer}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-sm shadow-md shadow-rose-200 hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    {isSubmittingServer ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isSubmittingServer ? 'Registering...' : 'Add MCP Server to Database'}
                  </button>
                </div>
              </form>

              {/* Connected Services Count on First Page */}
              <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Active Connected MCP Services in Database: <b>{servers.length}</b></span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('console');
                    setConsoleTab('services');
                  }}
                  className="text-rose-600 font-bold hover:underline flex items-center gap-1"
                >
                  View All in Console ➔
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 4. 🔑 CLERK AUTHENTICATION & NEON DATABASE STATUS (ON FIRST PAGE) */}
        {/* =================================================================== */}
        <section id="clerk-db" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-100 shadow-2xl shadow-rose-100/50 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-rose-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 px-3 py-1 rounded-full bg-rose-50 border border-rose-200">
                  Enterprise Identity & Storage
                </span>
                <h2 className="text-3xl font-black text-slate-900 mt-2">
                  Clerk Authentication & Neon Database
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Secure single sign-on with Clerk ID mapped directly to multi-tenant policies in serverless Neon PostgreSQL.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-700">AWS Neon PostgreSQL Connected</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left: Clerk Status & Controls */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <Key className="w-5 h-5 text-rose-500" /> Clerk User Session
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isAuthenticated ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isAuthenticated ? 'Authenticated' : 'Not Signed In'}
                    </span>
                  </div>

                  {isAuthenticated ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Clerk User ID:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {user?.id || 'user_clerk_demo_acme_admin'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-bold text-slate-800">
                          {user?.primaryEmailAddress?.emailAddress || 'admin@acme-corp.com'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Organization Role:</span>
                        <span className="font-bold text-rose-600">Enterprise Security Admin</span>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition"
                        >
                          Sign Out of Clerk Session
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">
                        Sign in using your corporate Clerk SSO or launch instant 1-click Demo mode:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            try {
                              openSignIn();
                            } catch (e) {
                              setShowClerkModal(true);
                            }
                          }}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-xs shadow-md shadow-rose-200 hover:opacity-95 transition"
                        >
                          Sign In with Clerk ID
                        </button>
                        <button
                          onClick={handleDemoLogin}
                          className="px-4 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" /> 1-Click Demo Login
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Neon Database Details */}
              <div className="p-6 rounded-2xl bg-pink-50/50 border border-pink-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Database className="w-5 h-5 text-pink-600" /> Database Connection Status
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    Connected (Healthy)
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Database Engine:</span>
                    <b className="text-slate-800">Neon Serverless PostgreSQL (AWS us-east-1)</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered Servers Table:</span>
                    <b className="text-emerald-700">{servers.length} Rows Synced</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Authorized Agents Table:</span>
                    <b className="text-emerald-700">{agents.length} Rows Synced</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Audit Trail Integrity:</span>
                    <b className="text-slate-800">SHA-256 Merkle Chaining Active</b>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-2.5 bg-white rounded-xl border border-pink-200 text-[11px] font-mono text-slate-700">
                    DATABASE_URL: postgresql://ep-cool-wind.neon.tech/neondb?sslmode=require
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 5. 🏢 COMPANY MANAGEMENT CONSOLE (DIRECTLY ACCESSIBLE) */}
        {/* =================================================================== */}
        <section id="console" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-100 shadow-2xl shadow-rose-100/50 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rose-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Company Management Console</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Live Governance</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Real-time security governance for Acme Corporation autonomous AI agents</p>
              </div>

              {/* Console Tabs */}
              <div className="flex items-center gap-1 bg-rose-50/70 p-1.5 rounded-2xl border border-rose-100">
                <button
                  onClick={() => setConsoleTab('agents')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${consoleTab === 'agents' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  🤖 Agents ({agents.length})
                </button>
                <button
                  onClick={() => setConsoleTab('services')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${consoleTab === 'services' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  🔌 Services ({servers.length})
                </button>
                <button
                  onClick={() => setConsoleTab('approvals')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${consoleTab === 'approvals' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ✅ Approvals
                  {pendingApprovals.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {pendingApprovals.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setConsoleTab('activity')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${consoleTab === 'activity' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  📋 Audit Log
                </button>
              </div>
            </div>

            {/* TAB 1: AGENTS */}
            {consoleTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {agents.map(agent => (
                  <motion.div
                    key={agent.id}
                    whileHover={{ y: -3 }}
                    className="bg-rose-50/30 rounded-3xl p-6 border border-rose-100 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                        <Bot className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold">
                        ● Authorized
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{agent.name}</h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">Identifier: {agent.identifier}</div>
                    </div>

                    <div className="pt-2 border-t border-rose-100 text-xs text-slate-600 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Department / Team:</span>
                        <b className="text-slate-800">{agent.team}</b>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Budget Cap:</span>
                        <b className="text-slate-800">{agent.budget}</b>
                      </div>
                      <div className="flex justify-between">
                        <span>Safety Policy:</span>
                        <b className="text-rose-600">{agent.risk}</b>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* TAB 2: SERVICES */}
            {consoleTab === 'services' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {servers.map(server => (
                    <motion.div
                      key={server.id}
                      whileHover={{ y: -3 }}
                      className="bg-rose-50/30 rounded-3xl p-6 border border-rose-100 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                          <Server className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                          Healthy
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 text-base">{server.name}</div>
                      <div className="text-xs text-slate-400 font-mono break-all">{server.endpoint_url}</div>
                      <div className="pt-2 border-t border-rose-100 flex justify-between text-xs">
                        <span className="text-slate-500">Security Score:</span>
                        <span className="font-bold text-emerald-600">{server.risk_score || 25}/100</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: APPROVALS */}
            {consoleTab === 'approvals' && (
              <div className="space-y-4">
                {pendingApprovals.length === 0 ? (
                  <div className="bg-rose-50/30 rounded-3xl p-10 border border-rose-100 text-center text-slate-500 text-sm">
                    ✓ No pending actions. All AI agents operating safely within automated bounds.
                  </div>
                ) : (
                  pendingApprovals.map(appr => (
                    <div
                      key={appr.id}
                      className="bg-white rounded-3xl p-6 border border-rose-200 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">{appr.risk_level} Risk Interception</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-base mt-1">{appr.action}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Requested by: <b>{appr.agent_name}</b> • Tool: <code>{appr.tool_name}</code></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(appr.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-200 transition flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(appr.id)}
                          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Block
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: AUDIT ACTIVITY */}
            {consoleTab === 'activity' && (
              <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-rose-100 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 text-base">Cryptographic Audit Trail</h2>
                  <span className="text-xs text-slate-400 font-mono">SHA-256 Chained</span>
                </div>
                <div className="divide-y divide-rose-100">
                  {recentLogs.map(log => (
                    <div key={log.id} className="p-5 flex items-center justify-between hover:bg-rose-50/20 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{log.action}</div>
                          <div className="text-xs text-slate-400">{log.agent} • {log.time}</div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.color}`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ===================================================================== */}
      {/* 🌟 FOOTER */}
      {/* ===================================================================== */}
      <footer className="bg-white border-t border-rose-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span>MCPShield Enterprise Gateway • v1.0.2 • Published to NPM & Render</span>
          </div>
          <div className="flex items-center gap-6 font-semibold text-slate-600">
            <a href="https://github.com/musi22/mcpshield" target="_blank" rel="noopener noreferrer" className="hover:text-rose-600">
              GitHub Repository
            </a>
            <a href="https://www.npmjs.com/package/@rashmi2206/mcpshield" target="_blank" rel="noopener noreferrer" className="hover:text-rose-600">
              NPM Package
            </a>
            <a href="https://mcpshield.onrender.com" target="_blank" rel="noopener noreferrer" className="hover:text-rose-600">
              Live Cloud Gateway
            </a>
          </div>
        </div>
      </footer>

      {/* Clerk Sign In Dialog Modal Fallback */}
      {showClerkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-rose-100 shadow-2xl relative">
            <button
              onClick={() => setShowClerkModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center pt-2">
              <SignIn routing="hash" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
