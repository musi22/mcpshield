import React, { useState, useEffect } from 'react';
import { useUser, useClerk, SignIn, UserButton } from '@clerk/clerk-react';
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
  LogOut
} from 'lucide-react';
import { api } from './api';

export default function App() {
  const { isSignedIn, user } = useUser();
  const { openSignIn, signOut } = useClerk();

  // Navigation & View Modes
  const [activeView, setActiveView] = useState<'landing' | 'console'>('landing');
  const [consoleTab, setConsoleTab] = useState<'agents' | 'services' | 'approvals' | 'activity'>('agents');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [showClerkModal, setShowClerkModal] = useState(false);

  // Demo Fallback Login
  const [isDemoLoggedIn, setIsDemoLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('mcpshield_demo_auth') === 'true';
  });

  const isAuthenticated = isSignedIn || isDemoLoggedIn;

  // Live Data States
  const [servers, setServers] = useState<any[]>([
    { id: '1', name: 'GitHub Enterprise MCP', slug: 'github', endpoint_url: 'https://api.github.com/mcp', status: 'healthy', risk_score: 25 },
    { id: '2', name: 'Neon Cloud PostgreSQL', slug: 'postgres', endpoint_url: 'postgresql://ep-cool-wind.neon.tech/neondb', status: 'healthy', risk_score: 35 },
    { id: '3', name: 'Web Fetch & Search Gateway', slug: 'fetch', endpoint_url: 'https://fetch.mcp.services/api', status: 'healthy', risk_score: 15 }
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

  // Add Server Modal
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');

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

  const handleDemoLogin = () => {
    localStorage.setItem('mcpshield_demo_auth', 'true');
    setIsDemoLoggedIn(true);
    setActiveView('console');
  };

  const handleLogout = () => {
    localStorage.removeItem('mcpshield_demo_auth');
    setIsDemoLoggedIn(false);
    if (isSignedIn) signOut();
    setActiveView('landing');
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

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName || !newServerUrl) return;
    const slug = newServerName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newServer = {
      id: Date.now().toString(),
      name: newServerName,
      slug,
      endpoint_url: newServerUrl,
      status: 'healthy',
      risk_score: 20
    };
    setServers(prev => [newServer, ...prev]);
    setShowAddServerModal(false);
    setNewServerName('');
    setNewServerUrl('');
    api.registerServer({ name: newServerName, slug, endpoint_url: newServerUrl, transport: 'http_post' }).catch(() => {});
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-rose-100 selection:text-rose-800 font-sans">
      {/* ===================================================================== */}
      {/* 🌟 TOP NAVIGATION BAR */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div
            onClick={() => setActiveView('landing')}
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

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#overview" onClick={() => setActiveView('landing')} className="hover:text-rose-600 transition">
              Overview
            </a>
            <a href="#three-ways" onClick={() => setActiveView('landing')} className="hover:text-rose-600 transition">
              3 Ways to Use
            </a>
            <a href="#how-to-add" onClick={() => setActiveView('landing')} className="hover:text-rose-600 transition">
              How to Add MCP
            </a>
            <button
              onClick={() => setActiveView('console')}
              className={`hover:text-rose-600 transition flex items-center gap-1.5 ${activeView === 'console' ? 'text-rose-600' : ''}`}
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
                    <span className="text-xs font-bold text-slate-700">Demo Company Admin</span>
                  </div>
                )}
                <button
                  onClick={() => setActiveView(activeView === 'console' ? 'landing' : 'console')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-xs shadow-md shadow-rose-200 hover:opacity-95 transition"
                >
                  {activeView === 'console' ? 'View Overview' : 'Open Console ➔'}
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
      {/* 🚀 VIEW 1: COMPLETE FIRST PAGE OVERVIEW & LANDING */}
      {/* ===================================================================== */}
      {activeView === 'landing' ? (
        <div className="flex-1 space-y-20 pb-20">
          {/* Hero Section */}
          <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 text-center">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-bold mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Official Model Context Protocol (MCP) Security Layer
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
              Give AI Agents Full Power.{' '}
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                With Zero Risk.
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Autonomous AI agents in <b>Claude Desktop</b>, <b>Cursor</b>, and <b>LangChain</b> can now query databases, call APIs, and edit files. <b>MCPShield</b> sits as a deterministic security firewall to prevent prompt injections, catastrophic deletions, and financial leaks.
            </p>

            {/* CTA Buttons & Zero-Install NPM Box */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Copyable NPM Command Box */}
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
                onClick={() => setActiveView('console')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-sm shadow-xl shadow-rose-200 hover:opacity-95 transition flex items-center gap-2"
              >
                Launch Company Console <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 🎬 Animated Graphic / Visual Flow */}
            <div className="mt-14 max-w-5xl mx-auto bg-white rounded-3xl p-8 border border-rose-100 shadow-2xl shadow-rose-100/50 relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-6 text-left flex items-center gap-2">
                <Activity className="w-4 h-4" /> Live Intermediary Security Architecture
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Box 1: AI Agent */}
                <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100 text-left space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-rose-500 font-bold">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">1. Autonomous AI Agent</div>
                    <div className="text-xs text-slate-500">Claude Desktop, Cursor, or Custom LLM calls an MCP tool</div>
                  </div>
                  <div className="text-[11px] font-mono bg-white p-2 rounded-lg text-slate-600 border border-rose-100">
                    POST /mcp/prod/database
                  </div>
                </div>

                {/* Box 2: MCPShield Firewall (Center Animated) */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-rose-500 to-orange-400 text-white text-left space-y-3 shadow-xl shadow-rose-200 relative transform md:scale-105">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                      &lt;20ms Latency
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-lg">2. MCPShield Gateway</div>
                    <div className="text-xs text-rose-100">3-Layer Real-Time Security Verification</div>
                  </div>
                  <ul className="text-xs space-y-1.5 text-white font-medium">
                    <li className="flex items-center gap-1.5">✓ Deterministic Policy Engine</li>
                    <li className="flex items-center gap-1.5">✓ Zero-Latency DLP Secret Mask</li>
                    <li className="flex items-center gap-1.5">✓ Human-in-the-Loop Interceptor</li>
                  </ul>
                </div>

                {/* Box 3: Safe Upstream */}
                <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-left space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 font-bold">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">3. Safe Upstream Systems</div>
                    <div className="text-xs text-slate-500">Inspected, verified action executes on real infrastructure</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white border border-emerald-100 text-[10px] font-bold text-emerald-700">GitHub API</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-emerald-100 text-[10px] font-bold text-emerald-700">Neon Postgres</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-emerald-100 text-[10px] font-bold text-emerald-700">Web Search</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 📦 3 DIFFERENT WAYS TO GET & USE MCPSHIELD */}
          {/* ================================================================= */}
          <section id="three-ways" className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 px-3 py-1 rounded-full bg-rose-50 border border-rose-200">
                Flexible Distribution
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
                3 Powerful Ways to Use MCPShield
              </h2>
              <p className="text-slate-500 text-sm sm:text-base mt-2">
                Whether you want an instant local terminal scanner, integration with the official Awesome-MCP catalog, or a 24/7 cloud gateway.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* WAY 1: Instant NPM CLI */}
              <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-50 flex flex-col justify-between space-y-6 hover:shadow-2xl hover:border-rose-200 transition">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Method 1: Zero-Install</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">Official NPM Package</h3>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Audit any local directory, MCP config, or remote server URL instantly from your terminal without installing software or configuring servers.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-2 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Scans for 25+ vulnerability classes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Emits SARIF 2.1.0 for GitHub CI/CD
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Runs anywhere: Mac, Linux, Windows
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs">
                  <code>npx @rashmi2206/mcpshield scan</code>
                </div>
              </div>

              {/* WAY 2: Awesome-MCP & Agent Integration */}
              <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-50 flex flex-col justify-between space-y-6 hover:shadow-2xl hover:border-rose-200 transition">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Method 2: Ecosystem Standard</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">Awesome-MCP & Agent Tools</h3>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Listed on the official community directory. Easily drop MCPShield into Claude Desktop or Cursor IDE to guard autonomous workflows.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-2 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified Awesome-MCP PR compliance
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Claude Desktop & Cursor 1-click config
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero client-side code changes needed
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between">
                  <span>Community Verified</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>

              {/* WAY 3: 24/7 Cloud Gateway & Neon PostgreSQL */}
              <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-50 flex flex-col justify-between space-y-6 hover:shadow-2xl hover:border-rose-200 transition">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">Method 3: Enterprise Cloud</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">Cloud Gateway & Neon DB</h3>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Deployed 24/7 on Render backed by AWS Neon Serverless PostgreSQL. Built for enterprise teams requiring SOC 2 immutable audit records.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-2 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dynamic sliding-window rate limiting
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cryptographic SHA-256 audit chaining
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-tenant workspaces & roles
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-pink-50 text-pink-800 rounded-xl text-xs font-bold flex items-center justify-between">
                  <span>Live on Render Cloud</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 🛠️ HOW TO ADD AN MCP SERVER IN 3 SIMPLE STEPS (ON FIRST PAGE) */}
          {/* ================================================================= */}
          <section id="how-to-add" className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-r from-rose-50/70 via-white to-orange-50/70 rounded-3xl p-8 sm:p-12 border border-rose-100 shadow-xl">
              <div className="max-w-3xl mb-10">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 px-3 py-1 rounded-full bg-white border border-rose-200">
                  Step-by-Step Setup
                </span>
                <h2 className="text-3xl font-black text-slate-900 mt-3">
                  How to Add Any MCP Server in 3 Simple Steps
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Connect any real service (GitHub, Postgres, File tools, or internal API) in under 2 minutes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-md space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 font-black text-lg flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Select Your MCP Server</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pick your real service endpoint. It can be a remote HTTPS URL (e.g. <code>https://api.github.com/mcp</code>) or a local SSE server port.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-md space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 font-black text-lg flex items-center justify-center">
                    2
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Register in MCPShield</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Use the Web Console button <b>"+ Connect Service"</b> or run the one-line CLI command:
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
                    MCPShield automatically scans the tools, blocks risky mutations (like table drops), and routes alerts to your manager approval queue.
                  </p>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="mt-8 pt-8 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600 font-medium">
                  Ready to connect your first real service?
                </div>
                <button
                  onClick={() => {
                    setActiveView('console');
                    setConsoleTab('services');
                    setShowAddServerModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-xs shadow-md shadow-rose-200 hover:opacity-95 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Your MCP Server Now
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* ===================================================================== */
        /* 🏢 VIEW 2: SIMPLIFIED COMPANY MANAGEMENT CONSOLE */
        /* ===================================================================== */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
          {/* Console Header Bar */}
          <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xl shadow-rose-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Company Management Console</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Protected</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Real-time governance for Acme Corporation autonomous AI agents</p>
            </div>

            {/* Navigation Tabs Inside Console */}
            <div className="flex items-center gap-1 bg-rose-50/70 p-1 rounded-2xl border border-rose-100">
              <button
                onClick={() => setConsoleTab('agents')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${consoleTab === 'agents' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🤖 Agents ({agents.length})
              </button>
              <button
                onClick={() => setConsoleTab('services')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${consoleTab === 'services' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🔌 Services ({servers.length})
              </button>
              <button
                onClick={() => setConsoleTab('approvals')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${consoleTab === 'approvals' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${consoleTab === 'activity' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                📋 Audit Log
              </button>
            </div>
          </div>

          {/* TAB 1: AGENTS */}
          {consoleTab === 'agents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {agents.map(agent => (
                  <div key={agent.id} className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xl shadow-rose-50 space-y-4">
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SERVICES */}
          {consoleTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-800">Active Real MCP Connectors</h2>
                <button
                  onClick={() => setShowAddServerModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-xs shadow-md shadow-rose-200 hover:opacity-95 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add MCP Server
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {servers.map(server => (
                  <div key={server.id} className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xl shadow-rose-50 space-y-3">
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: APPROVALS */}
          {consoleTab === 'approvals' && (
            <div className="space-y-6">
              <h2 className="font-bold text-lg text-slate-800">Pending Human Approvals</h2>
              {pendingApprovals.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-rose-100 text-center text-slate-400 text-sm">
                  ✓ No pending actions. All AI agents operating safely within automated bounds.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map(appr => (
                    <div key={appr.id} className="bg-white rounded-3xl p-6 border border-rose-200 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT ACTIVITY */}
          {consoleTab === 'activity' && (
            <div className="bg-white rounded-3xl border border-rose-100 shadow-xl shadow-rose-50 overflow-hidden">
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
      )}

      {/* ===================================================================== */}
      {/* ➕ MODAL: ADD REAL MCP SERVER */}
      {/* ===================================================================== */}
      {showAddServerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-rose-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Connect Real MCP Endpoint</h3>
              <button onClick={() => setShowAddServerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">Add any real server URL (HTTPS or local port) to protect it with MCPShield.</p>

            <form onSubmit={handleCreateServer} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Display Name</label>
                <input
                  type="text"
                  value={newServerName}
                  onChange={e => setNewServerName(e.target.value)}
                  placeholder="e.g. Company Database or GitHub Ops"
                  className="w-full px-4 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Endpoint URL</label>
                <input
                  type="text"
                  value={newServerUrl}
                  onChange={e => setNewServerUrl(e.target.value)}
                  placeholder="https://api.mycompany.com/mcp"
                  className="w-full px-4 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium font-mono text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddServerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white text-xs font-bold shadow-md shadow-rose-200 hover:opacity-95"
                >
                  Register Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
