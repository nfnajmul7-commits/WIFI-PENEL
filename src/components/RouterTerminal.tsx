import React, { useState } from 'react';
import { 
  Terminal, 
  FastForward, 
  RotateCcw, 
  ShieldCheck, 
  Flame, 
  Server, 
  Cpu, 
  Activity, 
  Plus, 
  Wifi, 
  Clock, 
  Layers,
  ArrowRight,
  Trash2,
  Network,
  Share2,
  SearchCheck,
  CheckCircle2
} from 'lucide-react';
import { Device, RouterLog, ConnectedRouterNode } from '../types';

interface RouterTerminalProps {
  devices: Device[];
  logs: RouterLog[];
  currentTime: Date;
  onFastForward: (hours: number) => void;
  onResetTime: () => void;
  onAddMockDevice: (name: string, ip: string, mac: string, category: any, routerNode: ConnectedRouterNode) => void;
  onClearLogs: () => void;
  onVerifyArpSweep: () => void;
}

export const RouterTerminal: React.FC<RouterTerminalProps> = ({
  devices,
  logs,
  currentTime,
  onFastForward,
  onResetTime,
  onAddMockDevice,
  onClearLogs,
  onVerifyArpSweep,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevName, setNewDevName] = useState('');
  const [newDevCategory, setNewDevCategory] = useState<'mobile' | 'laptop' | 'tv' | 'gaming' | 'tablet'>('mobile');
  const [newDevRouter, setNewDevRouter] = useState<ConnectedRouterNode>('main');

  const blockedDevices = devices.filter((d) => d.status === 'blocked');
  const onlineDevices = devices.filter((d) => d.isOnline);
  const mainRouterDevices = onlineDevices.filter((d) => d.connectedRouter === 'main');
  const secondaryRouterDevices = onlineDevices.filter((d) => d.connectedRouter === 'secondary');

  const handleCreateMockDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;

    const randomOctet = Math.floor(Math.random() * 200) + 20;
    const ip = `192.168.1.${randomOctet}`;
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const mac = `00:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;

    onAddMockDevice(newDevName.trim(), ip, mac, newDevCategory, newDevRouter);
    setNewDevName('');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Banner: Dual-Router Topology & Hardware Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Dual-Router Network Architecture
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  MESH / AP BRIDGE ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                মেইন গেটওয়ে (192.168.1.1) ➔ সেকেন্ড রাউটার AP (192.168.1.2 / 192.168.2.1)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onVerifyArpSweep}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              title="Run active ARP & ICMP scan to verify connected count"
            >
              <SearchCheck className="w-3.5 h-3.5" />
              ARP ভেরিফিকেশন স্ক্যান
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন ডিভাইস যুক্ত করুন
            </button>
          </div>
        </div>

        {/* Dual-Router Node Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Main Router Node */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-blue-500/30 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">মেইন রাউটার (Gateway)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                  Primary
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                IP: 192.168.1.1 • DHCP & iptables Engine
              </p>
              <p className="text-[10px] text-emerald-400 font-mono">
                কানেক্টেড: <strong className="text-white">{mainRouterDevices.length}</strong> টি ডিভাইস
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-500 font-mono">
              Role: Master Firewall
            </div>
          </div>

          {/* Secondary Router Node */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-purple-500/30 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">সেকেন্ড রাউটার (Extender / AP)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                  Secondary
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                IP: 192.168.1.2 • Bridge / Access Point Mode
              </p>
              <p className="text-[10px] text-purple-400 font-mono">
                কানেক্টেড: <strong className="text-white">{secondaryRouterDevices.length}</strong> টি ডিভাইস
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-500 font-mono">
              Control: Bridged to Master
            </div>
          </div>
        </div>

        {/* Real-time System Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>মোট নিশ্চিত ডিভাইস</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
              {onlineDevices.length} টি অনলাইন (Verified)
            </div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>FastAPI Cron Worker</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
              লুপ চলছে (প্রতি ১০ সেকেন্ডে)
            </div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Forward Table Drops</span>
              <Flame className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xs font-mono font-bold text-rose-400 mt-1">
              {blockedDevices.length} টি MAC ব্লকড
            </div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>ভার্চুয়াল টাইম</span>
              <Clock className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xs font-mono font-bold text-white mt-1 truncate">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Time Machine: Fast-Forward Controls to Test Auto-Blocking */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-2xl p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
              <FastForward className="w-4 h-4 text-indigo-400" />
              টাইম মেশিন (স্বয়ংক্রিয় ব্লক টেস্ট)
            </div>
            <p className="text-[11px] text-slate-400">
              ভার্চুয়াল সময় এগিয়ে দিয়ে সেকেন্ড রাউটার ও মেইন রাউটারের ডিভাইসের স্বয়ংক্রিয় ব্লক পরীক্ষা করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onFastForward(1)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-all"
            >
              +১ ঘণ্টা
            </button>
            <button
              onClick={() => onFastForward(24)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-all"
            >
              +১ দিন
            </button>
            <button
              onClick={() => onFastForward(24 * 7)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-all"
            >
              +৭ দিন
            </button>
            <button
              onClick={() => onFastForward(24 * 30)}
              className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-medium transition-all"
            >
              +৩০ দিন (১ মাস)
            </button>
            <button
              onClick={onResetTime}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all"
              title="Reset Virtual Clock"
            >
              <RotateCcw className="w-3 h-3" />
              রিসেট
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: iptables Table vs Live Daemon Log Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[360px]">
        {/* Active Firewall Rules List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                মেইন গেটওয়ে iptables DROP রুলস
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Chain: FORWARD
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2">
            {blockedDevices.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                কোনো ড্রপ রুল নেই। মেইন ও সেকেন্ড রাউটারের সব ডিভাইস ইন্টারনেটে যুক্ত।
              </div>
            ) : (
              blockedDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-2.5 bg-rose-950/20 border border-rose-900/50 rounded-xl text-xs font-mono flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-rose-900/50 text-[10px] text-rose-200">
                        DROP
                      </span>
                      <span>{dev.mac}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {dev.name} ({dev.ip}) • {dev.connectedRouter === 'secondary' ? 'সংযুক্ত: ২য় রাউটার' : 'সংযুক্ত: মেইন রাউটার'}
                    </div>
                    {dev.expiry && (
                      <div className="text-[10px] text-amber-400/90 mt-0.5">
                        মেয়াদোত্তীর্ণ: {new Date(dev.expiry).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            রুল এক্সিকিউশন: <br />
            <code className="text-rose-400/80">
              iptables -I FORWARD -m mac --mac-source &lt;MAC&gt; -j DROP
            </code>
          </div>
        </div>

        {/* Live Terminal & Daemon Activity Log (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col font-mono shadow-inner">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                FastAPI Daemon & Dual-Router কনসোল
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">
                {logs.length} events logged
              </span>
              <button
                onClick={onClearLogs}
                className="p-1 text-slate-500 hover:text-slate-300 rounded"
                title="Clear console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Log Stream */}
          <div className="flex-1 overflow-y-auto mt-2.5 space-y-1.5 text-xs pr-1">
            {logs.map((log) => {
              const colorClass =
                log.level === 'action'
                  ? 'text-rose-400'
                  : log.level === 'warn'
                  ? 'text-amber-400'
                  : log.level === 'error'
                  ? 'text-red-500'
                  : 'text-emerald-400';

              return (
                <div key={log.id} className="leading-relaxed hover:bg-slate-900/60 p-1 rounded transition-colors">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-slate-500 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`text-[10px] font-bold uppercase shrink-0 ${colorClass}`}>
                      [{log.level}]
                    </span>
                    <span className="text-slate-300 font-semibold truncate">
                      {log.command}
                    </span>
                  </div>
                  {log.output && (
                    <div className="pl-6 text-[11px] text-slate-400 whitespace-pre-wrap">
                      ↳ {log.output}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Add New Mock Device */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">সিমুলেটেড নতুন ডিভাইস যুক্ত করুন</h3>
            <p className="text-xs text-slate-400 mb-4">
              ডিভাইসটি কোন রাউটারের সাথে সংযুক্ত হবে (মেইন রাউটার নাকি সেকেন্ড রাউটার) তা সিলেক্ট করুন।
            </p>

            <form onSubmit={handleCreateMockDevice} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">ডিভাইসের নাম (Device Name)</label>
                <input
                  type="text"
                  placeholder="যেমন: Samsung Galaxy S24, Office Laptop..."
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ডিভাইস টাইপ</label>
                <select
                  value={newDevCategory}
                  onChange={(e) => setNewDevCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="mobile">Smartphone (মোবাইল)</option>
                  <option value="tablet">Tablet / iPad (ট্যাবলেট)</option>
                  <option value="laptop">Laptop / PC (কম্পিউটার)</option>
                  <option value="gaming">Gaming Console (প্লে-স্টেশন)</option>
                  <option value="tv">Smart TV (স্মার্ট টিভি)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">সংযুক্ত রাউটার নির্বাচন করুন (Connected Router)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDevRouter('main')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      newDevRouter === 'main'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    মেইন রাউটার (Gateway)
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDevRouter('secondary')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      newDevRouter === 'secondary'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    সেকেন্ড রাউটার (AP)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  সংযুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
