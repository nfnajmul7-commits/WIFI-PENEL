/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Terminal, 
  Clock, 
  Radio, 
  Server, 
  Plus, 
  Calendar, 
  Lock, 
  Unlock, 
  AlertCircle, 
  CheckCircle2, 
  Hourglass, 
  FastForward, 
  RotateCcw, 
  Search, 
  Laptop, 
  Tv, 
  Gamepad2, 
  Tablet, 
  Code2, 
  Network, 
  Trash2, 
  Sparkles,
  Flame,
  Check,
  X,
  Share2
} from 'lucide-react';
import { Device, RouterLog, ConnectedRouterNode } from './types';
import { CodeExplorer } from './components/CodeExplorer';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { GitHubActionsModal } from './components/GitHubActionsModal';
import { MobileSimulator } from './components/MobileSimulator';

const INITIAL_DEVICES: Device[] = [
  {
    id: '1',
    name: 'সাকিবের মোবাইল (Samsung S24)',
    ip: '192.168.1.104',
    mac: '3C:22:FB:9E:44:A1',
    status: 'active',
    category: 'mobile',
    manufacturer: 'Samsung Electronics',
    connectedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    // 15 minutes left so the user can easily observe auto-blocking!
    expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    bandwidthUsageMb: 850,
    connectedRouter: 'main',
    connectionType: '5G_WiFi',
    isOnline: true,
    lastPingMs: 4,
  },
  {
    id: '2',
    name: 'গেস্ট মোবাইল (iPhone 15)',
    ip: '192.168.1.125',
    mac: '28:CF:E9:12:44:88',
    status: 'active',
    category: 'mobile',
    manufacturer: 'Apple Inc.',
    connectedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    // 24 hours permission
    expiry: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    bandwidthUsageMb: 240,
    connectedRouter: 'secondary', // Connected to Second Router
    connectionType: '5G_WiFi',
    isOnline: true,
    lastPingMs: 6,
  },
  {
    id: '3',
    name: 'ছোট ভাইয়ের ট্যাব (iPad Air)',
    ip: '192.168.1.110',
    mac: '70:28:8B:11:C3:59',
    status: 'active',
    category: 'tablet',
    manufacturer: 'Apple Inc.',
    connectedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    // 7 days permission
    expiry: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    bandwidthUsageMb: 1400,
    connectedRouter: 'secondary',
    connectionType: '2.4G_WiFi',
    isOnline: true,
    lastPingMs: 8,
  },
  {
    id: '4',
    name: 'অফিস ল্যাপটপ (MacBook Pro)',
    ip: '192.168.1.101',
    mac: 'F0:18:98:4C:77:20',
    status: 'active',
    category: 'laptop',
    manufacturer: 'Apple Inc.',
    connectedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    expiry: null, // Unlimited
    bandwidthUsageMb: 11400,
    connectedRouter: 'main',
    connectionType: '5G_WiFi',
    isOnline: true,
    lastPingMs: 3,
  },
  {
    id: '5',
    name: 'পুরোনো ফোন (Pixel 7)',
    ip: '192.168.1.109',
    mac: '5E:8B:F2:3A:99:02',
    status: 'blocked',
    category: 'mobile',
    manufacturer: 'Google LLC',
    connectedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    expiry: new Date(Date.now() - 3600000 * 2).toISOString(), // Expired
    bandwidthUsageMb: 320,
    connectedRouter: 'main',
    connectionType: '2.4G_WiFi',
    isOnline: true,
    lastPingMs: 12,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'manager' | 'firewall' | 'code' | 'guide'>('manager');
  const [managerViewMode, setManagerViewMode] = useState<'dashboard' | 'mobile'>('dashboard');
  const [clientConnectedVia, setClientConnectedVia] = useState<ConnectedRouterNode>('main');
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked' | 'timed'>('all');

  // Modal States
  const [selectedDeviceForPermission, setSelectedDeviceForPermission] = useState<Device | null>(null);
  const [permissionPreset, setPermissionPreset] = useState<'1_hour' | '24_hours' | '7_days' | '15_days' | '30_days' | 'custom'>('24_hours');
  const [customExpiryInput, setCustomExpiryInput] = useState<string>('');
  
  // Add new device modal state
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceCategory, setNewDeviceCategory] = useState<'mobile' | 'laptop' | 'tablet' | 'tv' | 'gaming'>('mobile');
  const [newDeviceRouter, setNewDeviceRouter] = useState<ConnectedRouterNode>('main');
  const [newDeviceDuration, setNewDeviceDuration] = useState<'1_day' | '7_days' | '30_days' | 'custom'>('7_days');
  const [newDeviceCustomExpiry, setNewDeviceCustomExpiry] = useState('');

  // GitHub actions guide modal
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' | 'block' } | null>(null);

  // Router Logs
  const [logs, setLogs] = useState<RouterLog[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'info',
      command: '[SYSTEM] NetGuard Router Time-Permission Daemon Active',
      output: 'Gateway 192.168.1.1 online. Background expiry engine checking MAC tables every 1s.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 30000).toISOString(),
      level: 'action',
      command: 'iptables -I FORWARD -m mac --mac-source 5E:8B:F2:3A:99:02 -j DROP',
      output: 'Auto-Blocked: "পুরোনো ফোন (Pixel 7)" validity expired at 01:53:00. Traffic dropped.',
    },
  ]);

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  // Initialize custom date time picker default to tomorrow
  useEffect(() => {
    const tomorrow = new Date(currentTime.getTime() + 24 * 3600 * 1000);
    setCustomExpiryInput(tomorrow.toISOString().slice(0, 16));
    setNewDeviceCustomExpiry(tomorrow.toISOString().slice(0, 16));
  }, [currentTime]);

  // Real-time Clock progression & Automated Time-Blocking Engine
  useEffect(() => {
    const timer = setInterval(() => {
      const nextTime = new Date(currentTimeRef.current.getTime() + 1000);
      setCurrentTime(nextTime);

      // Check if any device reached or passed its expiry time
      setDevices((prevDevices) => {
        let hasChanges = false;
        const updated = prevDevices.map((dev) => {
          if (dev.status === 'active' && dev.expiry) {
            const expTime = new Date(dev.expiry);
            if (expTime <= nextTime) {
              hasChanges = true;
              // Trigger Auto-Block on Router Firewall
              setLogs((prevLogs) => [
                {
                  id: `log-${Date.now()}`,
                  timestamp: nextTime.toISOString(),
                  level: 'action',
                  command: `[AUTO-BLOCK] iptables -I FORWARD -m mac --mac-source ${dev.mac} -j DROP`,
                  output: `স্বয়ংক্রিয় ব্লক: "${dev.name}" এর নির্ধারিত মেয়াদ (${expTime.toLocaleTimeString()}) শেষ হয়েছে! ইন্টারনেট অ্যাক্সেস বন্ধ।`,
                  deviceId: dev.id,
                  mac: dev.mac,
                  routerNode: dev.connectedRouter,
                },
                ...prevLogs.slice(0, 49),
              ]);

              // Show Toast Alert
              setToastMessage({
                text: `⚠️ [অটো-ব্লক] "${dev.name}" এর ব্যবহারের মেয়াদ শেষ হওয়ায় স্বয়ংক্রিয়ভাবে ব্লক করা হয়েছে!`,
                type: 'block',
              });

              return {
                ...dev,
                status: 'blocked' as const,
              };
            }
          }
          return dev;
        });

        return hasChanges ? updated : prevDevices;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format Remaining Countdown Time
  const getRemainingTime = (expiryIso: string | null) => {
    if (!expiryIso) return null;
    const exp = new Date(expiryIso);
    const diffMs = exp.getTime() - currentTime.getTime();
    if (diffMs <= 0) return { text: 'মেয়াদ শেষ (Expired)', isExpired: true };

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return { text: `${days} দিন ${hours} ঘণ্টা ${minutes} মি.`, isExpired: false };
    if (hours > 0) return { text: `${hours} ঘণ্টা ${minutes} মি. ${seconds} সে.`, isExpired: false };
    return { text: `${minutes} মিনিট ${seconds} সেকেন্ড`, isExpired: false };
  };

  // Handler: Set / Grant Time-Permission
  const handleSavePermission = () => {
    if (!selectedDeviceForPermission) return;

    let targetExpiry: Date;
    if (permissionPreset === 'custom') {
      if (!customExpiryInput) {
        alert('অনুগ্রহ করে সঠিক তারিখ ও সময় নির্বাচন করুন');
        return;
      }
      targetExpiry = new Date(customExpiryInput);
    } else {
      const hoursMap = {
        '1_hour': 1,
        '24_hours': 24,
        '7_days': 24 * 7,
        '15_days': 24 * 15,
        '30_days': 24 * 30,
      };
      targetExpiry = new Date(currentTime.getTime() + hoursMap[permissionPreset] * 3600 * 1000);
    }

    if (targetExpiry <= currentTime) {
      alert('মেয়াদ অবশ্যই ভবিষ্যতের কোনো তারিখ/সময় হতে হবে!');
      return;
    }

    const expiryIso = targetExpiry.toISOString();

    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === selectedDeviceForPermission.id) {
          // If was previously blocked, unblock it now that it has new permission!
          if (d.status === 'blocked') {
            setLogs((prevLogs) => [
              {
                id: `log-${Date.now()}`,
                timestamp: currentTime.toISOString(),
                level: 'info',
                command: `iptables -D FORWARD -m mac --mac-source ${d.mac} -j DROP`,
                output: `নতুন অনুমতি সক্রিয়: "${d.name}" এর ফায়ারওয়াল ড্রপ তুলে নেওয়া হয়েছে। মেয়াদ: ${targetExpiry.toLocaleString()}`,
              },
              ...prevLogs.slice(0, 49),
            ]);
          }

          return {
            ...d,
            status: 'active' as const,
            expiry: expiryIso,
          };
        }
        return d;
      })
    );

    setToastMessage({
      text: `✅ "${selectedDeviceForPermission.name}" কে ${targetExpiry.toLocaleDateString()} (${targetExpiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) পর্যন্ত ইন্টারনেট অনুমতি দেওয়া হয়েছে! মেয়াদ শেষে অটো-ব্লক হবে।`,
      type: 'success',
    });

    setSelectedDeviceForPermission(null);
  };

  // Handler: Remove Expiry (Allow Unlimited)
  const handleRemoveExpiry = (dev: Device) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === dev.id ? { ...d, expiry: null, status: 'active' as const } : d))
    );
    setToastMessage({
      text: `"${dev.name}" এর মেয়াদের সীমাবদ্ধতা মুছে সীমাহীন (Unlimited) করা হয়েছে।`,
      type: 'success',
    });
    setSelectedDeviceForPermission(null);
  };

  // Handler: Instant Manual Toggle Block
  const handleToggleManualBlock = (dev: Device) => {
    const nextStatus = dev.status === 'active' ? 'blocked' : 'active';
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === dev.id) {
          return {
            ...d,
            status: nextStatus,
            expiry: nextStatus === 'active' ? null : d.expiry,
          };
        }
        return d;
      })
    );

    const cmd = nextStatus === 'blocked' 
      ? `iptables -I FORWARD -m mac --mac-source ${dev.mac} -j DROP`
      : `iptables -D FORWARD -m mac --mac-source ${dev.mac} -j DROP`;

    setLogs((prevLogs) => [
      {
        id: `log-${Date.now()}`,
        timestamp: currentTime.toISOString(),
        level: nextStatus === 'blocked' ? 'action' : 'info',
        command: cmd,
        output: `অ্যাডমিন অ্যাকশন: "${dev.name}" (${dev.mac}) কে ম্যানুয়ালি ${nextStatus === 'blocked' ? 'ব্লক' : 'আনব্লক'} করা হয়েছে।`,
        deviceId: dev.id,
        mac: dev.mac,
      },
      ...prevLogs.slice(0, 49),
    ]);

    setToastMessage({
      text: nextStatus === 'blocked' 
        ? `🔒 "${dev.name}" কে এখনই রাউটারে ব্লক করা হয়েছে!` 
        : `🔓 "${dev.name}" কে আনব্লক করা হয়েছে।`,
      type: nextStatus === 'blocked' ? 'block' : 'success',
    });
  };

  const handleToggleBlockById = (deviceId: string) => {
    const dev = devices.find((d) => d.id === deviceId);
    if (dev) handleToggleManualBlock(dev);
  };

  const handleSetScheduleFromSimulator = (deviceId: string, expiryIso: string | null) => {
    const dev = devices.find((d) => d.id === deviceId);
    if (!dev) return;

    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === deviceId) {
          if (d.status === 'blocked' && expiryIso) {
            setLogs((prevLogs) => [
              {
                id: `log-${Date.now()}`,
                timestamp: currentTime.toISOString(),
                level: 'info',
                command: `iptables -D FORWARD -m mac --mac-source ${d.mac} -j DROP`,
                output: `নতুন অনুমতি সক্রিয়: "${d.name}" এর ফায়ারওয়াল ড্রপ তুলে নেওয়া হয়েছে।`,
              },
              ...prevLogs.slice(0, 49),
            ]);
          }
          return {
            ...d,
            expiry: expiryIso,
            status: expiryIso ? ('active' as const) : d.status,
          };
        }
        return d;
      })
    );

    if (expiryIso) {
      const expDate = new Date(expiryIso);
      setToastMessage({
        text: `✅ "${dev.name}" কে ${expDate.toLocaleDateString()} (${expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) পর্যন্ত অনুমতি দেওয়া হয়েছে!`,
        type: 'success',
      });
    } else {
      setToastMessage({
        text: `"${dev.name}" এর মেয়াদ সীমাহীন করা হয়েছে।`,
        type: 'success',
      });
    }
  };

  const handleRefreshDevices = () => {
    setToastMessage({
      text: 'সংযুক্ত সব মোবাইল ডিভাইস ও রাউটার স্ট্যাটাস সফলভাবে রিফ্রেশ করা হয়েছে।',
      type: 'success',
    });
  };

  // Handler: Delete Device
  const handleDeleteDevice = (id: string, name: string) => {
    if (confirm(`আপনি কি "${name}" ডিভাইসটিকে তালিকা থেকে মুছে ফেলতে চান?`)) {
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setToastMessage({ text: `"${name}" কে তালিকা থেকে মুছে ফেলা হয়েছে।`, type: 'warn' });
    }
  };

  // Handler: Add New Device with Permission
  const handleAddNewDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    let targetExpiry: Date | null = null;
    if (newDeviceDuration === 'custom' && newDeviceCustomExpiry) {
      targetExpiry = new Date(newDeviceCustomExpiry);
    } else if (newDeviceDuration === '1_day') {
      targetExpiry = new Date(currentTime.getTime() + 24 * 3600 * 1000);
    } else if (newDeviceDuration === '7_days') {
      targetExpiry = new Date(currentTime.getTime() + 7 * 24 * 3600 * 1000);
    } else if (newDeviceDuration === '30_days') {
      targetExpiry = new Date(currentTime.getTime() + 30 * 24 * 3600 * 1000);
    }

    const randomOctet = Math.floor(Math.random() * 180) + 30;
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const mac = `D4:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;

    const newDev: Device = {
      id: `${Date.now()}`,
      name: newDeviceName.trim(),
      ip: `192.168.1.${randomOctet}`,
      mac,
      status: 'active',
      category: newDeviceCategory,
      manufacturer: 'Mobile Device',
      connectedAt: currentTime.toISOString(),
      expiry: targetExpiry ? targetExpiry.toISOString() : null,
      bandwidthUsageMb: 12,
      connectedRouter: newDeviceRouter,
      connectionType: '5G_WiFi',
      isOnline: true,
      lastPingMs: 5,
    };

    setDevices((prev) => [newDev, ...prev]);

    setLogs((prevLogs) => [
      {
        id: `log-${Date.now()}`,
        timestamp: currentTime.toISOString(),
        level: 'info',
        command: `[DHCP & PERMIT] Granted access to ${newDev.name} (${mac})`,
        output: targetExpiry 
          ? `অনুমোদিত মেয়াদ: ${targetExpiry.toLocaleDateString()} ${targetExpiry.toLocaleTimeString()} পর্যন্ত। নির্ধারিত সময়ে অটো-ব্লক সক্রিয় থাকবে।`
          : 'সীমাহীন অনুমতি দেওয়া হয়েছে।',
      },
      ...prevLogs.slice(0, 49),
    ]);

    setToastMessage({
      text: `🎉 "${newDev.name}" সফলভাবে যুক্ত হয়েছে এবং অনুমতি সক্রিয় করা হয়েছে!`,
      type: 'success',
    });

    setNewDeviceName('');
    setIsAddDeviceOpen(false);
  };

  // Time Machine: Fast-Forward
  const handleFastForward = (hours: number) => {
    const advanced = new Date(currentTime.getTime() + hours * 3600 * 1000);
    setCurrentTime(advanced);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: advanced.toISOString(),
        level: 'warn',
        command: `[TIME MACHINE] সময় +${hours} ঘণ্টা এগিয়ে নেওয়া হয়েছে (${advanced.toLocaleString()})`,
        output: 'স্বয়ংক্রিয় ব্যাকগ্রাউন্ড ডেমোন সব ডিভাইসের মেয়াদ স্ক্যান করছে...',
      },
      ...prev.slice(0, 49),
    ]);
  };

  // Reset Time
  const handleResetTime = () => {
    const realNow = new Date();
    setCurrentTime(realNow);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: realNow.toISOString(),
        level: 'info',
        command: `[TIME MACHINE] বর্তমান রিয়েল টাইমে রিসেট করা হয়েছে: ${realNow.toLocaleString()}`,
        output: 'System time synchronized.',
      },
      ...prev.slice(0, 49),
    ]);
  };

  // Filtered devices
  const filteredDevices = devices.filter((dev) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = dev.name.toLowerCase().includes(q) || dev.ip.includes(q) || dev.mac.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterStatus === 'active') return dev.status === 'active';
    if (filterStatus === 'blocked') return dev.status === 'blocked';
    if (filterStatus === 'timed') return dev.expiry !== null && dev.status === 'active';
    return true;
  });

  const activeCount = devices.filter((d) => d.status === 'active').length;
  const blockedCount = devices.filter((d) => d.status === 'blocked').length;
  const timedCount = devices.filter((d) => d.expiry !== null && d.status === 'active').length;

  const getDeviceIcon = (category: string) => {
    switch (category) {
      case 'laptop': return <Laptop className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      case 'tv': return <Tv className="w-5 h-5" />;
      case 'gaming': return <Gamepad2 className="w-5 h-5" />;
      default: return <Smartphone className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Main Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Main Description */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-blue-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">
                  NetGuard রাউটার ম্যানেজার
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  অটো-ব্লক সিস্টেম চালু
                </span>
              </div>
              <p className="text-xs text-slate-400">
                নির্দিষ্ট তারিখ পর্যন্ত মোবাইল ব্যবহারের অনুমতি দিন ➔ মেয়াদ শেষে অটো-ব্লক
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('manager')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'manager'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              ডিভাইস অনুমতি ও নিয়ন্ত্রণ
            </button>

            <button
              onClick={() => setActiveTab('firewall')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'firewall'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              রাউটার ফায়ারওয়াল ({blockedCount})
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'guide'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              সেটআপ গাইড
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              সোর্স কোড
            </button>
          </div>
        </div>
      </header>

      {/* Floating / Top Alert Toast */}
      {toastMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-3 w-full animate-in fade-in slide-in-from-top-2">
          <div className={`p-3 rounded-2xl flex items-center justify-between shadow-lg text-xs font-medium border ${
            toastMessage.type === 'block' 
              ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
              : toastMessage.type === 'warn'
              ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
              : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              {toastMessage.type === 'block' ? (
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* ======================= TAB 1: DEVICE PERMISSION MANAGER ======================= */}
        {activeTab === 'manager' && (
          <div className="space-y-5">
            {/* Quick Hero Banner with Purpose Statement */}
            <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>রাউটার কন্ট্রোল ও মোবাইল ডিভাইস অনুমতি প্যানেল</span>
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-white">
                  মোবাইল ব্যবহারের নির্দিষ্ট তারিখ নির্ধারণ করুন — মেয়াদ শেষে স্বয়ংক্রিয় ব্লক (Auto-Block)
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  নিচের যেকোনো মোবাইলের <strong>"অনুমতি ও মেয়াদ দিন"</strong> বাটনে ক্লিক করে নির্দিষ্ট তারিখ ও সময় (যেমন ৩ দিন, ৭ দিন, বা ১ মাস) সেট করুন। মেয়াদ শেষ হওয়ামাত্র রাউটার তার ইন্টারনেট অ্যাক্সেস সম্পূর্ণ বন্ধ (DROP) করে দিবে।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* View Mode Toggle: Dashboard vs Mobile App */}
                <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => setManagerViewMode('dashboard')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      managerViewMode === 'dashboard'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    ড্যাশবোর্ড ভিউ
                  </button>
                  <button
                    onClick={() => setManagerViewMode('mobile')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      managerViewMode === 'mobile'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    মোবাইল অ্যাপ মোড
                  </button>
                </div>

                <button
                  onClick={() => setIsAddDeviceOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  নতুন মোবাইল অনুমতি দিন
                </button>
              </div>
            </div>

            {/* 3-Step Simple Guide Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/30">
                  ১
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">মোবাইল ডিভাইস নির্বাচন করুন</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    তালিকায় থাকা মোবাইল থেকে বেছে নিন অথবা নতুন মোবাইল যুক্ত করে অনুমতি দিন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/30">
                  ২
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">নির্দিষ্ট শেষ তারিখ নির্ধারণ করুন</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ৩ দিন, ৭ দিন, ১৫ দিন, ৩০ দিন বা ক্যালেন্ডার থেকে নির্দিষ্ট যেকোনো তারিখ নির্বাচন করুন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-500/30">
                  ৩
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">মেয়াদান্তে অটো-ব্লক (Auto Block)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    নির্দিষ্ট তারিখ পার হওয়ামাত্র রাউটার এর ইন্টারনেট সম্পূর্ণ বন্ধ (DROP) করে দেবে!
                  </p>
                </div>
              </div>
            </div>

            {/* ================= VIEW MODE 1: SMARTPHONE APP SIMULATOR ================= */}
            {managerViewMode === 'mobile' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
                {/* Left: Mobile Simulator Chassis */}
                <div className="lg:col-span-6 flex flex-col items-center">
                  <div className="w-full max-w-sm mb-3 px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-400" />
                      লাইভ মোবাইল অ্যাপ স্ক্রিন
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      সরাসরি টেস্ট করুন
                    </span>
                  </div>

                  <MobileSimulator
                    devices={devices}
                    onToggleBlock={handleToggleBlockById}
                    onSetSchedule={handleSetScheduleFromSimulator}
                    currentTime={currentTime}
                    onRefresh={handleRefreshDevices}
                    clientConnectedVia={clientConnectedVia}
                    onSwitchClientNetwork={setClientConnectedVia}
                  />
                </div>

                {/* Right: Live Router Status & Time-Block Fast-Forward Testing */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Time Machine for Auto-Block Testing */}
                  <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 rounded-3xl p-5 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                        <FastForward className="w-4 h-4 text-indigo-400" />
                        <span>টাইম মেশিন (অটো-ব্লক পরীক্ষা করার জন্য সময় এগিয়ে দিন):</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ঘড়ি: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      নিচের বাটন চেপে ভার্চুয়াল সময় এগিয়ে দিন। মোবাইলে নির্ধারিত তারিখ/সময় পার হওয়ামাত্রই অ্যাপের ভেতরে এবং রাউটারে স্বয়ংক্রিয়ভাবে ব্লক (Auto Block) হয়ে যাবে!
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleFastForward(1)}
                        className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all"
                      >
                        +১ ঘণ্টা
                      </button>
                      <button
                        onClick={() => handleFastForward(24)}
                        className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all"
                      >
                        +১ দিন
                      </button>
                      <button
                        onClick={() => handleFastForward(24 * 7)}
                        className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all"
                      >
                        +৭ দিন
                      </button>
                      <button
                        onClick={() => handleFastForward(24 * 30)}
                        className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all"
                      >
                        +৩০ দিন (১ মাস)
                      </button>
                      <button
                        onClick={handleResetTime}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        রিসেট
                      </button>
                    </div>
                  </div>

                  {/* Summary of Active Permissions */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        নির্ধারিত মেয়াদের মোবাইল তালিকা
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {timedCount} টি ডিভাইসে মেয়াদ সেট করা
                      </span>
                    </div>

                    <div className="space-y-2">
                      {devices.filter(d => d.expiry).map(dev => {
                        const remaining = getRemainingTime(dev.expiry);
                        const isBlocked = dev.status === 'blocked';
                        return (
                          <div key={dev.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{dev.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                  isBlocked ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {isBlocked ? 'ব্লকড' : 'সক্রিয়'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                শেষ তারিখ: {new Date(dev.expiry!).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[11px] font-bold font-mono ${
                                isBlocked ? 'text-rose-400' : 'text-amber-400'
                              }`}>
                                {remaining?.text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Router Firewall Commands Log */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <Flame className="w-4 h-4" />
                        <span>রাউটার ফায়ারওয়াল লাইভ অ্যাকশন (iptables DROP):</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        গেটওয়ে 192.168.1.1
                      </span>
                    </div>

                    <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800/80 font-mono text-[11px] space-y-2 max-h-56 overflow-y-auto">
                      {logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="pb-2 border-b border-slate-900/90 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className={log.level === 'action' ? 'text-rose-400 font-bold' : 'text-blue-400'}>
                              {log.level.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-amber-300 font-semibold truncate">{log.command}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">{log.output}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= VIEW MODE 2: FULL DASHBOARD ================= */
              <div className="space-y-5">
                {/* KPI Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>মোট সংযুক্ত ডিভাইস</span>
                      <Smartphone className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{devices.length} টি</div>
                    <div className="text-[10px] text-slate-400 mt-1">সব রাউটার মিলিয়ে</div>
                  </div>

                  <div className="bg-slate-900/90 border border-emerald-500/20 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>অনুমতি চালু (সক্রিয়)</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400">{activeCount} টি</div>
                    <div className="text-[10px] text-emerald-400/80 mt-1">ইন্টারনেট চলছে</div>
                  </div>

                  <div className="bg-slate-900/90 border border-amber-500/20 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>মেয়াদ নির্ধারিত (Timed)</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400">{timedCount} টি</div>
                    <div className="text-[10px] text-amber-400/80 mt-1">মেয়াদ শেষে অটো-ব্লক হবে</div>
                  </div>

                  <div className="bg-slate-900/90 border border-rose-500/20 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>ব্লকড ডিভাইস (Blocked)</span>
                      <Lock className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-2xl font-black text-rose-400">{blockedCount} টি</div>
                    <div className="text-[10px] text-rose-400/80 mt-1">ইন্টারনেট ড্রপ করা আছে</div>
                  </div>
                </div>

            {/* Time Machine: Fast-Forward Testing Bar (Eye-opening for testing auto-blocking!) */}
            <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border border-indigo-500/30 rounded-2xl p-4 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <FastForward className="w-4 h-4 text-indigo-400" />
                    <span>টাইম মেশিন (অটো-ব্লক পরীক্ষা করার জন্য সময় এগিয়ে দিন):</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ভার্চুয়াল সময় এগিয়ে দিয়ে তাৎক্ষণিকভাবে দেখুন কীভাবে নির্ধারিত সময় পার হওয়ামাত্র ডিভাইস স্বয়ংক্রিয়ভাবে ব্লক হয়ে যায়!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleFastForward(1)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all"
                  >
                    +১ ঘণ্টা
                  </button>
                  <button
                    onClick={() => handleFastForward(24)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all"
                  >
                    +১ দিন
                  </button>
                  <button
                    onClick={() => handleFastForward(24 * 7)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all"
                  >
                    +৭ দিন
                  </button>
                  <button
                    onClick={() => handleFastForward(24 * 30)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all"
                  >
                    +৩০ দিন (১ মাস)
                  </button>
                  <button
                    onClick={handleResetTime}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
                    title="রিয়েল টাইমে রিসেট করুন"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    রিসেট
                  </button>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {[
                  { key: 'all', label: `সব ডিভাইস (${devices.length})` },
                  { key: 'timed', label: `মেয়াদ নির্ধারিত (${timedCount})` },
                  { key: 'active', label: `সক্রিয় (${activeCount})` },
                  { key: 'blocked', label: `ব্লকড (${blockedCount})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterStatus(f.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      filterStatus === f.key
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ডিভাইসের নাম, IP বা MAC খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Devices Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
                  <Smartphone className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-400">কোনো ডিভাইস পাওয়া যায়নি</h3>
                  <p className="text-xs text-slate-500">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
                </div>
              ) : (
                filteredDevices.map((dev) => {
                  const isBlocked = dev.status === 'blocked';
                  const remaining = getRemainingTime(dev.expiry);

                  return (
                    <div
                      key={dev.id}
                      className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                        isBlocked
                          ? 'bg-rose-950/20 border-rose-900/60'
                          : dev.expiry
                          ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/20'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-2xl ${
                              isBlocked 
                                ? 'bg-rose-500/20 text-rose-400' 
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {getDeviceIcon(dev.category)}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white truncate max-w-[170px]">
                                {dev.name}
                              </h3>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                IP: {dev.ip}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                MAC: {dev.mac}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isBlocked 
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {isBlocked ? 'ব্লকড (BLOCKED)' : 'অনুমতি চালু'}
                            </span>
                          </div>
                        </div>

                        {/* Connected Router Pill */}
                        <div className="flex items-center justify-between text-[11px] bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Share2 className="w-3 h-3 text-purple-400" />
                            {dev.connectedRouter === 'secondary' ? 'সেকেন্ড রাউটার AP' : 'মেইন গেটওয়ে'}
                          </span>
                          <span className="font-mono text-slate-300">
                            {dev.connectionType.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Permission & Expiry Box (The Core User Feature!) */}
                        <div className={`p-3 rounded-2xl border ${
                          isBlocked 
                            ? 'bg-rose-950/30 border-rose-900/50' 
                            : dev.expiry 
                            ? 'bg-amber-950/30 border-amber-500/30' 
                            : 'bg-slate-950 border-slate-800'
                        }`}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold flex items-center gap-1.5">
                              <Calendar className={`w-3.5 h-3.5 ${
                                isBlocked ? 'text-rose-400' : dev.expiry ? 'text-amber-400' : 'text-slate-400'
                              }`} />
                              <span>বৈধতার মেয়াদ:</span>
                            </span>

                            {dev.expiry ? (
                              <span className="text-[11px] font-mono font-bold text-white">
                                {new Date(dev.expiry).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">সীমাহীন (Unlimited)</span>
                            )}
                          </div>

                          {dev.expiry && (
                            <div className="mt-1.5 flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px]">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Hourglass className="w-3 h-3 text-amber-400 animate-spin" />
                                বাকি সময়:
                              </span>
                              <span className={`font-mono font-bold ${
                                remaining?.isExpired ? 'text-rose-400' : 'text-amber-300'
                              }`}>
                                {remaining?.text}
                              </span>
                            </div>
                          )}

                          {isBlocked && (
                            <div className="mt-1 text-[10px] text-rose-300 font-semibold">
                              ⚠️ মেয়াদ উত্তীর্ণ হওয়ায় ইন্টারনেট অটোমেটিক ব্লক রয়েছে।
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                        {/* Grant / Set Permission Button */}
                        <button
                          onClick={() => {
                            setSelectedDeviceForPermission(dev);
                            if (dev.expiry) {
                              setPermissionPreset('custom');
                              setCustomExpiryInput(new Date(dev.expiry).toISOString().slice(0, 16));
                            } else {
                              setPermissionPreset('24_hours');
                            }
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {dev.expiry ? 'মেয়াদ পরিবর্তন' : 'অনুমতি দিন'}
                        </button>

                        {/* Instant Block / Unblock Toggle */}
                        <button
                          onClick={() => handleToggleManualBlock(dev)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            isBlocked
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                          title={isBlocked ? 'এখনই আনব্লক করুন' : 'এখনই ব্লক করুন'}
                        >
                          {isBlocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              আনব্লক
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              ব্লক
                            </>
                          )}
                        </button>

                        {/* Delete Device */}
                        <button
                          onClick={() => handleDeleteDevice(dev.id, dev.name)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    )}

        {/* ======================= TAB 2: ROUTER FIREWALL & LOGS ======================= */}
        {activeTab === 'firewall' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      রাউটার ফায়ারওয়াল ড্রপ টেবিল (iptables FORWARD DROP)
                    </h2>
                    <p className="text-xs text-slate-400">
                      যেসব মোবাইল ডিভাইসের মেয়াদ শেষ হয়েছে বা অ্যাডমিন ব্লক করেছেন তাদের লাইভ প্যাকেট ড্রপ রুলস
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold">
                  {blockedCount} টি ডিভাইস ব্লকড
                </div>
              </div>

              {/* Blocked MACs List */}
              <div className="space-y-2">
                {devices.filter((d) => d.status === 'blocked').length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    বর্তমানে কোনো ডিভাইস ব্লক করা নেই। সব ডিভাইস ইন্টারনেটে যুক্ত।
                  </div>
                ) : (
                  devices.filter((d) => d.status === 'blocked').map((d) => (
                    <div
                      key={d.id}
                      className="p-3 bg-slate-950 rounded-2xl border border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 font-bold text-[10px]">
                            DROP
                          </span>
                          <span className="text-white font-bold">{d.name}</span>
                          <span className="text-rose-400">({d.mac})</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          IP: {d.ip} • সংযুক্ত: {d.connectedRouter === 'secondary' ? 'সেকেন্ড রাউটার AP' : 'মেইন গেটওয়ে'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleManualBlock(d)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        আনব্লক ও অনুমতি দিন
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Console Logs */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  ফায়ারওয়াল লাইভ এক্সিকিউশন হিস্ট্রি
                </h3>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto space-y-2 font-mono text-xs">
                  {logs.map((l) => (
                    <div key={l.id} className="text-slate-300">
                      <span className="text-slate-500">[{new Date(l.timestamp).toLocaleTimeString()}]</span>{' '}
                      <span className={l.level === 'action' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        [{l.level.toUpperCase()}]
                      </span>{' '}
                      <span className="text-amber-300">{l.command}</span>
                      <div className="text-[11px] text-slate-400 pl-4 mt-0.5">↳ {l.output}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: SETUP GUIDE ======================= */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            <ArchitectureGuide />
          </div>
        )}

        {/* ======================= TAB 4: SOURCE CODE ======================= */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <CodeExplorer />
          </div>
        )}
      </main>

      {/* ======================= MODAL: SET TIME-PERMISSION (মেয়াদ নির্ধারণ) ======================= */}
      {selectedDeviceForPermission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ইন্টারনেট ব্যবহারের মেয়াদ নির্ধারণ</h3>
                  <p className="text-xs text-slate-400">মেয়াদ শেষ হওয়া মাত্রই স্বয়ংক্রিয়ভাবে ব্লক হয়ে যাবে</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeviceForPermission(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Device Info */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                {getDeviceIcon(selectedDeviceForPermission.category)}
              </div>
              <div>
                <strong className="text-white block text-sm">{selectedDeviceForPermission.name}</strong>
                <span className="text-slate-400 font-mono">
                  MAC: {selectedDeviceForPermission.mac} • IP: {selectedDeviceForPermission.ip}
                </span>
              </div>
            </div>

            {/* Presets Grid */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                কত সময়ের জন্য অনুমতি দিতে চান? (Select Duration):
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: '1_hour', label: '১ ঘণ্টা', sub: 'পরীক্ষা বা হোমওয়ার্ক' },
                  { key: '24_hours', label: '১ দিন (২৪ ঘণ্টা)', sub: 'দৈনিক গেস্ট পাস' },
                  { key: '7_days', label: '৭ দিন (১ সপ্তাহ)', sub: 'সাপ্তাহিক অনুমতি' },
                  { key: '15_days', label: '১৫ দিন (অর্ধ মাস)', sub: 'অর্ধ মাসিক মেয়াদ' },
                  { key: '30_days', label: '৩০ দিন (১ মাস)', sub: 'মাসিক বিলিং সাইকেল' },
                  { key: 'custom', label: 'নির্দিষ্ট তারিখ ও সময়', sub: 'ক্যালেন্ডার থেকে সিলেক্ট' },
                ].map((item) => {
                  const isSelected = permissionPreset === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPermissionPreset(item.key as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Date Time Picker if 'custom' is selected */}
            {permissionPreset === 'custom' && (
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-blue-500/40 space-y-2">
                <label className="text-xs font-semibold text-blue-300 block">
                  ক্যালেন্ডার থেকে শেষ তারিখ ও সময় নির্ধারণ করুন:
                </label>
                <input
                  type="datetime-local"
                  value={customExpiryInput}
                  onChange={(e) => setCustomExpiryInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleSavePermission}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                অনুমতি কার্যকর করুন (Save & Activate)
              </button>

              {selectedDeviceForPermission.expiry && (
                <button
                  onClick={() => handleRemoveExpiry(selectedDeviceForPermission)}
                  className="w-full py-2 px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  মেয়াদ তুলে দিন (সীমাহীন/Unlimited করুন)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD NEW DEVICE WITH PERMISSION ======================= */}
      {isAddDeviceOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                নতুন মোবাইল ডিভাইস অনুমতি দিন
              </h3>
              <button onClick={() => setIsAddDeviceOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewDeviceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">ডিভাইসের নাম (কার মোবাইল?)</label>
                <input
                  type="text"
                  placeholder="যেমন: তানভীরের ফোন, গেস্টের ল্যাপটপ..."
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">ডিভাইস টাইপ</label>
                <select
                  value={newDeviceCategory}
                  onChange={(e) => setNewDeviceCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="mobile">Smartphone (মোবাইল)</option>
                  <option value="tablet">Tablet / iPad (ট্যাবলেট)</option>
                  <option value="laptop">Laptop / PC (কম্পিউটার)</option>
                  <option value="tv">Smart TV (স্মার্ট টিভি)</option>
                  <option value="gaming">Gaming Console (প্লে-স্টেশন)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">সংযুক্ত রাউটার নির্বাচন</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDeviceRouter('main')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      newDeviceRouter === 'main'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    মেইন রাউটার (Gateway)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDeviceRouter('secondary')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      newDeviceRouter === 'secondary'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    সেকেন্ড রাউটার AP
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">ব্যবহারের মেয়াদের অনুমতি</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: '1_day', label: '১ দিন (২৪ ঘণ্টা)' },
                    { key: '7_days', label: '৭ দিন (১ সপ্তাহ)' },
                    { key: '30_days', label: '৩০ দিন (১ মাস)' },
                    { key: 'custom', label: 'কাস্টম তারিখ' },
                  ].map((dur) => (
                    <button
                      key={dur.key}
                      type="button"
                      onClick={() => setNewDeviceDuration(dur.key as any)}
                      className={`p-2 rounded-xl border text-center font-semibold text-xs ${
                        newDeviceDuration === dur.key
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>

                {newDeviceDuration === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="datetime-local"
                      value={newDeviceCustomExpiry}
                      onChange={(e) => setNewDeviceCustomExpiry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDeviceOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
                >
                  অনুমতি নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          NetGuard Router Management & Automated Device Time-Blocking System • FastAPI + Flutter + iptables Engine
        </p>
      </footer>

      {/* GitHub Actions Modal */}
      <GitHubActionsModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />
    </div>
  );
}
