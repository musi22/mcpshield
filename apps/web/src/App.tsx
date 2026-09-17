import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bot,
  Server,
  CheckCircle2,
  AlertTriangle,
  Activity,
  History,
  Lock,
  Plus,
  ArrowRight,
  BookOpen,
  LogOut,
  Sparkles,
  Database,
  ExternalLink,
  Check,
  X,
  Play,
  RotateCw,
  Search,
  Key,
  HelpCircle,
  FileCode,
  Users
} from 'lucide-react';
import { api } from './api';

export default function App() {
  // Navigation & Authentication
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('mcpshield_auth') === 'true';
  });
  const [currentView, setCurrentView] = useState<'dashboard' | 'learning'>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'agents' | 'services' | 'approvals'>('overview');

  // Login Form States
  const [email, setEmail] = useState('admin@acme.ai');
  const [password, setPassword] = useState('admin12345!');
  const [loginError, setLoginError] = useState('');

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
      action: 'Run schema alteration on customer database',
      amount: null,
      timestamp: 'Just now',
      risk_level: 'High'
    }
  ]);

  const [recentLogs, setRecentLogs] = useState<any[]>([
    { id: '1', time: '1 min ago', agent: 'Customer Support Bot', action: 'Fetched documentation page', status: 'Allowed', color: 'text-emerald-600 bg-emerald-50' },
    { id: '2', time: '4 mins ago', agent: 'Finance Operations Bot', action: 'Database schema change intercepted', status: 'Needs Approval', color: 'text-rose-600 bg-rose-50' },
    { id: '3', time: '12 mins ago', agent: 'Engineering Coding Agent', action: 'Created pull request on github', status: 'Allowed', color: 'text-emerald-600 bg-emerald-50' },
    { id: '4', time: '25 mins ago', agent: 'External Crawler', action: 'Blocked destructive deletion attempt', status: 'Blocked', color: 'text-rose-600 bg-rose-50' }
  ]);

  // Add Server Modal
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');

  // Fetch real data on mount
  useEffect(() => {
    if (isLoggedIn) {
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
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem('mcpshield_auth', 'true');
      setIsLoggedIn(true);
      setCurrentView('dashboard');
      setLoginError('');
    } else {
      setLoginError('Please enter both email and password.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mcpshield_auth');
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  const handleApprove = (id: string) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    setRecentLogs(prev => [
      { id: Date.now().toString(), time: 'Just now', agent: 'Manager', action: 'Approved high-risk action manually', status: 'Approved', color: 'text-emerald-600 bg-emerald-50' },
      ...prev
    ]);
  };

  const handleReject = (id: string) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    setRecentLogs(prev => [
      { id: Date.now().toString(), time: 'Just now', agent: 'Manager', action: 'Rejected high-risk action manually', status: 'Rejected', color: 'text-rose-600 bg-rose-50' },
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

  // =========================================================================
  // VIEW 1: LEARNING & INTEGRATION PATHWAY
  // =========================================================================
  if (currentView === 'learning') {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-8 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center shadow-lg shadow-rose-200">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">MCPShield Learning Guide</h1>
              <p className="text-sm text-slate-500">How real companies secure autonomous AI agents in 3 simple steps</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-white border border-rose-200 text-slate-700 font-semibold text-sm shadow-sm hover:bg-rose-50 transition flex items-center gap-2"
          >
            {isLoggedIn ? 'Return to Dashboard' : 'Go to Login'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Step Visual Guide */}
        <div className="mt-10 space-y-8">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-50 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 font-black text-xl flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800">What is an AI Agent & MCP?</h2>
              <p className="text-slate-600 leading-relaxed">
                When companies use tools like <b>Claude Desktop</b>, <b>Cursor</b>, or autonomous AI workers, the AI needs to read company files, check databases, or run tasks. It does this through <b>Model Context Protocol (MCP)</b>.
              </p>
              <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 text-sm text-orange-900">
                ⚠️ <b>The Risk:</b> Without a shield, an AI agent with access to a database could accidentally delete customer data or execute an unauthorized financial refund if it hallucinates.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-50 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 font-black text-xl flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-3 flex-1">
              <h2 className="text-xl font-bold text-slate-800">How MCPShield Acts as Your Company Firewall</h2>
              <p className="text-slate-600 leading-relaxed">
                Instead of connecting your AI agent directly to your backend, you point it to <b>MCPShield</b>. Every single action is inspected in under 20 milliseconds:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
                  <div className="font-bold text-rose-700 mb-1">🛡️ Hard Guardrails</div>
                  <div className="text-xs text-slate-600">Enforces rules like: Never allow database drops or refunds over $100.</div>
                </div>
                <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-100">
                  <div className="font-bold text-pink-700 mb-1">🔒 Secret Masking</div>
                  <div className="text-xs text-slate-600">Automatically hides API keys, passwords, and customer PII from the AI model.</div>
                </div>
                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100">
                  <div className="font-bold text-orange-700 mb-1">👤 Manager Approval</div>
                  <div className="text-xs text-slate-600">High-risk actions pause until a human manager clicks "Approve" in this dashboard.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-50 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-black text-xl flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-3 flex-1">
              <h2 className="text-xl font-bold text-slate-800">How Anyone Connects an Agent in 60 Seconds</h2>
              <p className="text-slate-600 leading-relaxed">
                In your agent's config (e.g. Claude Desktop or Cursor), simply add your MCPShield gateway URL:
              </p>
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
                <pre>{`{
  "mcpServers": {
    "company-shield": {
      "url": "https://mcpshield.onrender.com/mcp/prod/github"
    }
  }
}`}</pre>
              </div>
              <p className="text-xs text-slate-500">
                That's it! Your AI agent is now 100% governed, monitored, and protected by MCPShield.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <button
            onClick={() => {
              if (!isLoggedIn) {
                setEmail('admin@acme.ai');
                setPassword('admin12345!');
                localStorage.setItem('mcpshield_auth', 'true');
                setIsLoggedIn(true);
              }
              setCurrentView('dashboard');
            }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-base shadow-xl shadow-rose-200 hover:opacity-95 transition transform hover:-translate-y-0.5"
          >
            Launch Live Management Console 🚀
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CLEAN, BEAUTIFUL LOGIN SCREEN (Default when logged out)
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Logo & Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-orange-400 shadow-xl shadow-rose-200 mb-4 transform hover:rotate-3 transition">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">MCPShield</h1>
            <p className="text-sm font-medium text-rose-600 mt-1">Enterprise AI Agent Safety & Governance Console</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-2xl shadow-rose-100/60">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Company Sign In</h2>
            <p className="text-xs text-slate-500 mb-6">Log in to view authorized agents, policies, and pending approvals.</p>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-sm shadow-lg shadow-rose-200 hover:opacity-95 transition"
              >
                Sign In to Console
              </button>
            </form>

            {/* 1-Click Demo Shortcut */}
            <div className="mt-5 pt-5 border-t border-rose-100 text-center">
              <button
                onClick={() => {
                  setEmail('admin@acme.ai');
                  setPassword('admin12345!');
                  localStorage.setItem('mcpshield_auth', 'true');
                  setIsLoggedIn(true);
                  setCurrentView('dashboard');
                }}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-orange-500" /> Instant 1-Click Demo Access
              </button>
            </div>
          </div>

          {/* Dedicated Learning Pathway Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentView('learning')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-600 transition"
            >
              <BookOpen className="w-4 h-4 text-rose-500" />
              New to MCP? View the Interactive Learning Guide
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: SIMPLIFIED, INTUITIVE BUSINESS DASHBOARD (Logged In)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center shadow-md shadow-rose-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg text-slate-800 leading-tight">MCPShield</div>
              <div className="text-[11px] font-semibold text-rose-500">Acme Corporation</div>
            </div>
          </div>

          {/* 4 Clean Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-rose-50/60 p-1 rounded-2xl border border-rose-100">
            <button
              onClick={() => setDashboardTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${dashboardTab === 'overview' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              🏢 Company Overview
            </button>
            <button
              onClick={() => setDashboardTab('agents')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${dashboardTab === 'agents' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              🤖 Company Agents ({agents.length})
            </button>
            <button
              onClick={() => setDashboardTab('services')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${dashboardTab === 'services' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              🔌 Connected Services ({servers.length})
            </button>
            <button
              onClick={() => setDashboardTab('approvals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${dashboardTab === 'approvals' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📋 Approvals & Activity
              {pendingApprovals.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('learning')}
              className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" /> Guide
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-rose-100">
              <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-200 to-orange-200 text-rose-800 font-bold text-xs flex items-center justify-center">
                A
              </span>
              <span className="text-xs font-semibold text-slate-700">admin@acme.ai</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* =================================================================== */}
        {/* TAB 1: COMPANY OVERVIEW */}
        {/* =================================================================== */}
        {dashboardTab === 'overview' && (
          <div className="space-y-8">
            {/* Status Banner */}
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xl shadow-rose-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">All Enterprise AI Agents Operating Safely</h2>
                  <p className="text-xs text-slate-500">Deterministic policies active • Data loss prevention enabled • Zero unauthorized breaches</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-800">Live Protection Active</span>
              </div>
            </div>

            {/* 4 Simple Metrics for Company Leaders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-lg shadow-rose-50">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authorized Agents</div>
                <div className="text-3xl font-black text-slate-800 mt-2">{agents.length}</div>
                <div className="text-xs text-rose-500 font-semibold mt-1">Support, Dev, Finance</div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-lg shadow-rose-50">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Backends</div>
                <div className="text-3xl font-black text-slate-800 mt-2">{servers.length}</div>
                <div className="text-xs text-orange-500 font-semibold mt-1">GitHub, Postgres, Web</div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-lg shadow-rose-50">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Protected Invocations</div>
                <div className="text-3xl font-black text-slate-800 mt-2">2,490</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">Checked in &lt;20ms latency</div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-lg shadow-rose-50">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attacks / Hazards Blocked</div>
                <div className="text-3xl font-black text-rose-600 mt-2">14</div>
                <div className="text-xs text-slate-500 font-semibold mt-1">Deletions & leaks prevented</div>
              </div>
            </div>

            {/* Pending Human Approval Spotlight (If any) */}
            {pendingApprovals.length > 0 && (
              <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-3xl p-6 border border-rose-200 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                    <h3 className="font-bold text-slate-800 text-base">Action Required: Pending Manager Approval</h3>
                  </div>
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">High Sensitivity</span>
                </div>

                {pendingApprovals.map(appr => (
                  <div key={appr.id} className="bg-white rounded-2xl p-5 border border-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{appr.agent_name} wants to:</div>
                      <div className="text-xs text-rose-600 font-semibold mt-0.5">{appr.action}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Tool: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{appr.tool_name}</code> • Requested {appr.timestamp}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(appr.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-200 transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(appr.id)}
                        className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick List: What is each agent doing? */}
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-lg shadow-rose-50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Which AI Agent has which access?</h3>
                  <p className="text-xs text-slate-500">Summary of all autonomous bots active in your enterprise</p>
                </div>
                <button
                  onClick={() => setDashboardTab('agents')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  Manage Agents <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {agents.map(agent => (
                  <div key={agent.id} className="p-5 rounded-2xl bg-rose-50/30 border border-rose-100 hover:border-rose-300 transition space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">{agent.team}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Active</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{agent.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {agent.identifier}</div>
                    </div>
                    <div className="pt-2 border-t border-rose-100/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Daily Cap: <b className="text-slate-700">{agent.budget}</b></span>
                      <span className="text-rose-600 font-semibold">{agent.risk}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: COMPANY AGENTS */}
        {/* =================================================================== */}
        {dashboardTab === 'agents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Authorized AI Agents</h2>
                <p className="text-xs text-slate-500">Manage permissions, daily spend caps, and safety tiers for your company's bots</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {agents.map(agent => (
                <div key={agent.id} className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xl shadow-rose-50/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-100 to-orange-100 text-rose-600 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
                      ● Active
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{agent.name}</h3>
                    <p className="text-xs text-slate-500">Owned by: <b>{agent.team}</b></p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-rose-100 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Daily Budget:</span>
                      <b className="text-slate-800">{agent.budget}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Tier:</span>
                      <b className="text-rose-600">{agent.risk}</b>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Permitted Tools:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tools.map((t: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: CONNECTED SERVICES */}
        {/* =================================================================== */}
        {dashboardTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Connected Services & MCP Backends</h2>
                <p className="text-xs text-slate-500">Real production endpoints registered and protected by MCPShield</p>
              </div>
              <button
                onClick={() => setShowAddServerModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-xs shadow-md shadow-rose-200 hover:opacity-95 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Connect New Service
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {servers.map(server => (
                <div key={server.id} className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xl shadow-rose-50/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-100 to-pink-100 text-orange-600 flex items-center justify-center">
                      <Server className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
                      ● Healthy
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{server.name}</h3>
                    <p className="text-xs text-slate-400 font-mono break-all mt-1">{server.endpoint_url}</p>
                  </div>

                  <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Risk Assessment:</span>
                    <span className="font-bold text-emerald-600">{server.risk_score || 25}/100 (Safe)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: APPROVALS & RECENT ACTIVITY */}
        {/* =================================================================== */}
        {dashboardTab === 'approvals' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Security Audit & Activity Log</h2>
              <p className="text-xs text-slate-500">Real-time tamper-evident event stream of all agent invocations</p>
            </div>

            <div className="bg-white rounded-3xl border border-rose-100 shadow-xl shadow-rose-50 overflow-hidden">
              <div className="divide-y divide-rose-100">
                {recentLogs.map(log => (
                  <div key={log.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-rose-50/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{log.action}</div>
                        <div className="text-xs text-slate-500">Agent: <b className="text-slate-700">{log.agent}</b> • {log.time}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.color}`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Server Modal */}
      {showAddServerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Connect New Real MCP Service</h3>
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
                  placeholder="e.g. Company Database or Google Drive"
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
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
