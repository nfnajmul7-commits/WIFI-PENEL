/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Terminal, 
  Code2, 
  Network, 
  Send, 
  Radio, 
  Server, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Activity, 
  FastForward, 
  RotateCcw,
  Sparkles,
  Share2,
  SearchCheck
} from 'lucide-react';
import { Device, RouterLog, ConnectedRouterNode } from './types';
import { MobileSimulator } from './components/MobileSimulator';
import { RouterTerminal } from './components/RouterTerminal';
import { CodeExplorer } from './components/CodeExplorer';
import { ApiPlayground } from './components/ApiPlayground';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { GitHubActionsModal } from './components/GitHubActionsModal';

const INITIAL_DEVICES: Device[] = [
  {
    id: '1',
    name: "Kid's iPad Air",
    ip: '192.168.1.104',
    mac: '3C:22:FB:9E:44:A1',
    status: 'active',
    category: 'tablet',
    manufacturer: 'Apple Inc.',
    connectedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    bandwidthUsageMb: 840,
    connectedRouter: 'main',
    connectionType: '5G_WiFi',
    isOnline: true,
    lastPingMs: 4,
  },
  {
    id: '2',
    name: 'PlayStation 5',
    ip: '192.168.1.142',
    mac: '70:28:8B:11:C3:59',
    status: 'active',
    category: 'gaming',
    manufacturer: 'Sony Interactive',
    connectedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    expiry: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    bandwidthUsageMb: 2400,
    connectedRouter: 'main',
    connectionType: 'LAN_Ethernet',
    isOnline: true,
    lastPingMs: 2,
  },
  {
    id: '3',
    name: 'Samsung Smart TV 65"',
    ip: '192.168.1.118',
    mac: 'A4:50:46:D8:10:E2',
    status: 'active',
    category: 'tv',
    manufacturer: 'Samsung Electronics',
    connectedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    expiry: null,
    bandwidthUsageMb: 5200,
    connectedRouter: 'secondary', // Connected to Second Router AP
    connectionType: '5G_WiFi',
    isOnline: true,
    lastPingMs: 7,
  },
  {
    id: '4',
    name: 'MacBook Pro M3',
    ip: '192.168.1.101',
    mac: 'F0:18:98:4C:77:20',
    status: 'active',
    category: 'laptop',
    manufacturer: 'Apple Inc.',
    connectedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    expiry: null,
    bandwidthUsageMb: 11400,
    connectedRouter: 'secondary', // Connected to Second Router AP
    connectionType: '5G_WiFi',
    isOnline: true,
    lastPingMs: 5,
  },
  {
    id: '5',
    name: 'Guest iPhone 15',
    ip: '192.168.1.125',
    mac: '28:CF:E9:12:44:88',
    status: 'active',
    category: 'mobile',
    manufacturer: 'Apple Inc.',
    connectedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiry: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    bandwidthUsageMb: 180,
    connectedRouter: 'secondary', // Connected to Second Router AP
    connectionType: '2.4G_WiFi',
    isOnline: true,
    lastPingMs: 12,
  },
  {
    id: '6',
    name: 'Pixel 9 Pro (My Phone)',
    ip: '192.168.1.109',
    mac: '5E:8B:F2:3A:99:02',
    status: 'blocked',
    category: 'mobile',
    manufacturer: 'Google LLC',
    connectedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    expiry: new Date(Date.now() - 3600000 * 2).toISOString(),
    bandwidthUsageMb: 320,
    connectedRouter: 'main',
    connectionType: '5G_WiFi',
    isOnline: true,
    lastPingMs: 3,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'api' | 'guide'>('simulator');
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [clientConnectedVia, setClientConnectedVia] = useState<ConnectedRouterNode>('secondary'); // Start connected via 2nd Router to demonstrate user requirement!
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

  const [logs, setLogs] = useState<RouterLog[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'info',
      command: '[INIT] NetGuard Dual-Router Controller Started',
      output: 'Main Gateway: 192.168.1.1. Second Router AP Node: 192.168.1.2. Bridge mode OK.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 45000).toISOString(),
      level: 'info',
      command: '[VERIFY] Initial Multi-Router ARP Sweep complete',
      output: 'Detected 6 devices (3 on Main Gateway, 3 on Second Router AP). Ping verification: 100% active.',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 30000).toISOString(),
      level: 'action',
      command: 'iptables -I FORWARD -m mac --mac-source 5E:8B:F2:3A:99:02 -j DROP',
      output: 'Firewall drop active on Main Gateway for Pixel 9 Pro.',
    },
  ]);

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  // Real-time clock progression & Background Expiry Checker loop
  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = new Date(currentTimeRef.current.getTime() + 1000);
      setCurrentTime(newTime);

      // Check for expired devices (FastAPI background cron simulation)
      setDevices((prevDevices) => {
        let changed = false;
        const updated = prevDevices.map((dev) => {
          if (dev.status === 'active' && dev.expiry) {
            const exp = new Date(dev.expiry);
            if (exp <= newTime) {
              changed = true;
              const sourceRouterText = dev.connectedRouter === 'secondary' ? 'Second Router (AP)' : 'Main Gateway';

              setLogs((prevLogs) => [
                {
                  id: `log-${Date.now()}`,
                  timestamp: newTime.toISOString(),
                  level: 'action',
                  command: `[AUTO-CRON] iptables -I FORWARD -m mac --mac-source ${dev.mac} -j DROP`,
                  output: `Schedule expired. Auto-blocked '${dev.name}' (${dev.ip}) connected via ${sourceRouterText}. Applied at Main Gateway!`,
                  deviceId: dev.id,
                  mac: dev.mac,
                  routerNode: dev.connectedRouter,
                },
                ...prevLogs.slice(0, 49),
              ]);
              return {
                ...dev,
                status: 'blocked' as const,
              };
            }
          }
          return dev;
        });
        return changed ? updated : prevDevices;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handler: Manual Block / Unblock Toggle
  const handleToggleBlock = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id === deviceId) {
          const nextStatus = dev.status === 'active' ? 'blocked' : 'active';
          const cmd =
            nextStatus === 'blocked'
              ? `iptables -I FORWARD -m mac --mac-source ${dev.mac} -j DROP`
              : `iptables -D FORWARD -m mac --mac-source ${dev.mac} -j DROP`;

          const viaText = clientConnectedVia === 'secondary' 
            ? 'Command issued from Second Router (192.168.1.2) ➔ Executed on Main Gateway (192.168.1.1)' 
            : 'Command issued directly on Main Gateway';

          setLogs((prevLogs) => [
            {
              id: `log-${Date.now()}`,
              timestamp: currentTime.toISOString(),
              level: nextStatus === 'blocked' ? 'action' : 'info',
              command: cmd,
              output: `[CROSS-ROUTER CONTROL] ${viaText} for '${dev.name}' (${dev.ip}, MAC: ${dev.mac})`,
              deviceId: dev.id,
              mac: dev.mac,
            },
            ...prevLogs.slice(0, 49),
          ]);

          return {
            ...dev,
            status: nextStatus,
            expiry: nextStatus === 'active' ? null : dev.expiry,
          };
        }
        return dev;
      })
    );
  };

  // Handler: Set or Update Device Expiry Schedule
  const handleSetSchedule = (deviceId: string, expiryIso: string | null) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id === deviceId) {
          const updatedStatus = expiryIso ? 'active' : dev.status;
          const viaText = clientConnectedVia === 'secondary'
            ? 'Sent from Second Router AP ➔ Saved on Main Gateway SQLite DB'
            : 'Saved on Main Gateway SQLite DB';

          if (dev.status === 'blocked' && expiryIso) {
            setLogs((prevLogs) => [
              {
                id: `log-${Date.now()}`,
                timestamp: currentTime.toISOString(),
                level: 'info',
                command: `iptables -D FORWARD -m mac --mac-source ${dev.mac} -j DROP`,
                output: `${viaText}. Schedule set until ${new Date(expiryIso).toLocaleString()}. Unblocked '${dev.name}'.`,
              },
              ...prevLogs.slice(0, 49),
            ]);
          } else {
            setLogs((prevLogs) => [
              {
                id: `log-${Date.now()}`,
                timestamp: currentTime.toISOString(),
                level: 'info',
                command: `POST /api/devices/${dev.id}/schedule`,
                output: expiryIso 
                  ? `${viaText}: Expiry scheduled for '${dev.name}' until ${new Date(expiryIso).toLocaleString()}` 
                  : `${viaText}: Removed expiry limit for '${dev.name}'.`,
              },
              ...prevLogs.slice(0, 49),
            ]);
          }

          return {
            ...dev,
            expiry: expiryIso,
            status: updatedStatus,
          };
        }
        return dev;
      })
    );
  };

  // Handler: Active ARP & ICMP Ping Verification Sweep (সব মিলিয়ে কতজন কানেক্ট রয়েছে সেটি নিশ্চিত করবে)
  const handleVerifyArpSweep = () => {
    const online = devices.filter((d) => d.isOnline);
    const mainCount = online.filter((d) => d.connectedRouter === 'main').length;
    const secCount = online.filter((d) => d.connectedRouter === 'secondary').length;

    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: currentTime.toISOString(),
        level: 'info',
        command: '[ARP & PING SWEEP] arp-scan --interface=br-lan && ping -c 1',
        output: `VERIFIED TOTAL: ${online.length} active devices confirmed. Breakdown: Main Gateway = ${mainCount}, Second Router AP = ${secCount}. Stale leases = 0.`,
      },
      ...prev.slice(0, 49),
    ]);
  };

  // Handler: Fast-Forward Virtual Time Machine
  const handleFastForward = (hours: number) => {
    const advanced = new Date(currentTime.getTime() + hours * 3600 * 1000);
    setCurrentTime(advanced);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: advanced.toISOString(),
        level: 'warn',
        command: `[TIME MACHINE] Clock advanced +${hours} hours to ${advanced.toLocaleString()}`,
        output: 'Fast-forward executed. Background daemon verifying expiry schedules for both routers...',
      },
      ...prev.slice(0, 49),
    ]);
  };

  const handleResetTime = () => {
    const realNow = new Date();
    setCurrentTime(realNow);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: realNow.toISOString(),
        level: 'info',
        command: `[TIME MACHINE] Clock reset to real-time: ${realNow.toLocaleString()}`,
        output: 'Synchronized with system host clock.',
      },
      ...prev.slice(0, 49),
    ]);
  };

  const handleAddMockDevice = (
    name: string, 
    ip: string, 
    mac: string, 
    category: any, 
    routerNode: ConnectedRouterNode
  ) => {
    const newDev: Device = {
      id: `${Date.now()}`,
      name,
      ip,
      mac,
      status: 'active',
      category,
      manufacturer: 'Simulated Device',
      connectedAt: currentTime.toISOString(),
      expiry: null,
      bandwidthUsageMb: 45,
      connectedRouter: routerNode,
      connectionType: '5G_WiFi',
      isOnline: true,
      lastPingMs: routerNode === 'main' ? 4 : 8,
    };

    setDevices((prev) => [newDev, ...prev]);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: currentTime.toISOString(),
        level: 'info',
        command: `[DHCP / ARP] New client attached to ${routerNode === 'main' ? 'Main Gateway' : 'Second Router AP'}`,
        output: `'${name}' (${mac} ➔ ${ip}) registered in central network database.`,
      },
      ...prev.slice(0, 49),
    ]);
  };

  const verifiedOnlineCount = devices.filter((d) => d.isOnline).length;
  const mainCount = devices.filter((d) => d.isOnline && d.connectedRouter === 'main').length;
  const secondaryCount = devices.filter((d) => d.isOnline && d.connectedRouter === 'secondary').length;
  const blockedCount = devices.filter((d) => d.status === 'blocked').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-purple-600 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-blue-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">
                  NetGuard Dual-Router Manager
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-semibold border border-purple-500/30">
                  Main + 2nd Router Controller
                </span>
              </div>
              <p className="text-xs text-slate-400">
                সেকেন্ড রাউটার থেকে মেইন রাউটার নিয়ন্ত্রণ ও সর্বমোট সক্রিয় ডিভাইস যাচাইকরণ
              </p>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'simulator'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              লাইভ সিমুলেটর
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'guide'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              মাল্টি-রাউটার সেটআপ গাইড
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              সোর্স কোড
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'api'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              API টেস্ট
            </button>

            <button
              onClick={() => setIsGithubModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all border border-purple-400/40 animate-pulse"
              title="GitHub Actions এক্টিভেশন সমাধান"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Actions এক্টিভেশন গাইড
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-4">
        {/* Urgent GitHub Actions Troubleshooting Banner for User's Uploaded Screenshot */}
        <div 
          onClick={() => setIsGithubModalOpen(true)}
          className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-blue-950/80 border border-purple-500/40 hover:border-purple-400 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg cursor-pointer transition-all hover:bg-slate-900 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  আপনার রিপোজিটরির (<span className="text-purple-300 font-mono">WIFI-PENEL</span>) GitHub Actions এক্টিভ হচ্ছে না?
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  সমাধান প্রস্তুত
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                স্ক্রিনশটে প্রদর্শিত "Get started with GitHub Actions" সমস্যার ৪টি সহজ ধাপ ও সম্পূর্ণ প্রস্তুত YAML কোড পেতে এখানে ক্লিক করুন।
              </p>
            </div>
          </div>

          <button className="px-3.5 py-1.5 rounded-xl bg-purple-600 group-hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-md">
            <span>এক ক্লিকে সমাধান দেখুন</span>
            <span className="text-base leading-none">➔</span>
          </button>
        </div>
        {/* TAB 1: LIVE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            {/* Quick helper tip banner answering both questions directly */}
            <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900 border border-blue-900/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400 shrink-0">
                  <Share2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    সেকেন্ড রাউটার থেকে মেইন রাউটার কন্ট্রোল & নির্ভুল মোট ডিভাইস গণনা
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      সক্রিয়
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    বামে থাকা মোবাইলটি দেখুন: এটি <strong>সেকেন্ড রাউটারের সাথে সংযুক্ত</strong> থেকেই মেইন রাউটার ফায়ারওয়াল পরিচালনা করছে। মোট <strong>{verifiedOnlineCount} টি ডিভাইস নিশ্চিত (Verified)</strong> হয়েছে (মেইন রাউটারে {mainCount} টি + সেকেন্ড রাউটারে {secondaryCount} টি)।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  মোট নিশ্চিত: <strong>{verifiedOnlineCount} টি</strong>
                </div>
                <div className="px-2 py-1.5 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-300">
                  মেইন: <strong>{mainCount}</strong>
                </div>
                <div className="px-2 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300">
                  ২য় রাউটার: <strong>{secondaryCount}</strong>
                </div>
              </div>
            </div>

            {/* Split Screen: Left Flutter Mobile Simulator | Right Router Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 flex justify-center">
                <MobileSimulator
                  devices={devices}
                  onToggleBlock={handleToggleBlock}
                  onSetSchedule={handleSetSchedule}
                  currentTime={currentTime}
                  clientConnectedVia={clientConnectedVia}
                  onSwitchClientNetwork={(node) => {
                    setClientConnectedVia(node);
                    setLogs((prev) => [
                      {
                        id: `log-${Date.now()}`,
                        timestamp: currentTime.toISOString(),
                        level: 'info',
                        command: `[WIFI ROAM] Phone re-associated with ${node === 'main' ? 'Main Gateway (192.168.1.1)' : 'Second Router AP (192.168.1.2)'}`,
                        output: 'Cross-subnet API routing verified and ready.',
                      },
                      ...prev.slice(0, 49),
                    ]);
                  }}
                  onRefresh={() => {
                    handleVerifyArpSweep();
                  }}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col">
                <RouterTerminal
                  devices={devices}
                  logs={logs}
                  currentTime={currentTime}
                  onFastForward={handleFastForward}
                  onResetTime={handleResetTime}
                  onAddMockDevice={handleAddMockDevice}
                  onClearLogs={() => setLogs([])}
                  onVerifyArpSweep={handleVerifyArpSweep}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SETUP GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            <ArchitectureGuide />
          </div>
        )}

        {/* TAB 3: COMPLETE SOURCE CODE EXPLORER */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  সম্পূর্ণ সোর্স কোড রিপোজিটরি
                </h2>
                <p className="text-xs text-slate-400">
                  Python FastAPI ব্যাকএন্ড ও Flutter মোবাইল অ্যাপ্লিকেশনের সম্পূর্ণ প্রোডাকশন-রেডি কোড।
                </p>
              </div>
            </div>
            <CodeExplorer />
          </div>
        )}

        {/* TAB 4: API PLAYGROUND */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            <ApiPlayground
              devices={devices}
              onToggleBlock={handleToggleBlock}
              onSetSchedule={handleSetSchedule}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          NetGuard Multi-Router Management System • Main Gateway + Second Router AP • FastAPI + Flutter + iptables
        </p>
      </footer>

      {/* GitHub Actions Setup & Resolution Modal */}
      <GitHubActionsModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />
    </div>
  );
}
