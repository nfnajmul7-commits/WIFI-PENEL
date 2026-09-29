import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  ShieldAlert, 
  Clock, 
  Smartphone, 
  Laptop, 
  Tv, 
  Gamepad2, 
  Tablet, 
  CheckCircle2, 
  ArrowLeft, 
  RefreshCw, 
  Radio, 
  Lock, 
  Unlock, 
  Calendar,
  Hourglass,
  Layers,
  Network,
  Share2,
  Check,
  Activity
} from 'lucide-react';
import { Device, ConnectedRouterNode } from '../types';

interface MobileSimulatorProps {
  devices: Device[];
  onToggleBlock: (deviceId: string) => void;
  onSetSchedule: (deviceId: string, expiryIso: string | null) => void;
  currentTime: Date;
  onRefresh: () => void;
  clientConnectedVia: ConnectedRouterNode;
  onSwitchClientNetwork: (node: ConnectedRouterNode) => void;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  devices,
  onToggleBlock,
  onSetSchedule,
  currentTime,
  onRefresh,
  clientConnectedVia,
  onSwitchClientNetwork,
}) => {
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'schedule'>('dashboard');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'main' | 'secondary' | 'blocked'>('all');
  
  // Schedule screen form state
  const [preset, setPreset] = useState<'1_hour' | '24_hours' | '7_days' | '30_days' | 'custom'>('24_hours');
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  useEffect(() => {
    const nextDay = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
    setCustomDateTime(nextDay.toISOString().slice(0, 16));
  }, [currentTime]);

  // Verified device counts
  const verifiedOnlineDevices = devices.filter((d) => d.isOnline);
  const totalVerifiedCount = verifiedOnlineDevices.length;
  const mainRouterCount = verifiedOnlineDevices.filter((d) => d.connectedRouter === 'main').length;
  const secondaryRouterCount = verifiedOnlineDevices.filter((d) => d.connectedRouter === 'secondary').length;
  const blockedCount = devices.filter((d) => d.status === 'blocked').length;

  const filteredDevices = devices.filter((d) => {
    if (filter === 'main') return d.connectedRouter === 'main';
    if (filter === 'secondary') return d.connectedRouter === 'secondary';
    if (filter === 'blocked') return d.status === 'blocked';
    return true;
  });

  const getDeviceIcon = (category: string) => {
    switch (category) {
      case 'laptop': return <Laptop className="w-5 h-5" />;
      case 'tv': return <Tv className="w-5 h-5" />;
      case 'gaming': return <Gamepad2 className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      default: return <Smartphone className="w-5 h-5" />;
    }
  };

  const calculateRemaining = (expiryStr: string | null) => {
    if (!expiryStr) return null;
    const expiry = new Date(expiryStr);
    const diff = expiry.getTime() - currentTime.getTime();
    if (diff <= 0) return 'Expired';
    const totalSecs = Math.floor(diff / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const handleOpenSchedule = (dev: Device) => {
    setSelectedDeviceId(dev.id);
    if (dev.expiry) {
      setPreset('custom');
      setCustomDateTime(new Date(dev.expiry).toISOString().slice(0, 16));
    } else {
      setPreset('24_hours');
    }
    setActiveScreen('schedule');
  };

  const handleApplySchedule = () => {
    if (!selectedDevice) return;
    let targetExpiry: Date;

    if (preset === 'custom') {
      if (!customDateTime) {
        setFeedbackMsg({ text: 'Please pick a valid date & time', type: 'error' });
        return;
      }
      targetExpiry = new Date(customDateTime);
    } else {
      const hoursMap = {
        '1_hour': 1,
        '24_hours': 24,
        '7_days': 24 * 7,
        '30_days': 24 * 30,
      };
      targetExpiry = new Date(currentTime.getTime() + hoursMap[preset] * 60 * 60 * 1000);
    }

    if (targetExpiry <= currentTime) {
      setFeedbackMsg({ text: 'Target time must be in the future', type: 'error' });
      return;
    }

    onSetSchedule(selectedDevice.id, targetExpiry.toISOString());
    setFeedbackMsg({ 
      text: `Schedule set for ${selectedDevice.name}! Will auto-block at ${targetExpiry.toLocaleTimeString()}`, 
      type: 'success' 
    });
    setTimeout(() => {
      setFeedbackMsg(null);
      setActiveScreen('dashboard');
    }, 1200);
  };

  const handleClearSchedule = () => {
    if (!selectedDevice) return;
    onSetSchedule(selectedDevice.id, null);
    setFeedbackMsg({ text: `Removed limit for ${selectedDevice.name}`, type: 'info' });
    setTimeout(() => {
      setFeedbackMsg(null);
      setActiveScreen('dashboard');
    }, 900);
  };

  return (
    <div className="flex flex-col items-center justify-center p-1 w-full max-w-sm mx-auto">
      {/* Network Switcher Toggle (Simulating Mobile Phone roaming between Routers) */}
      <div className="w-full mb-2 bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Network className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-medium">Phone Connected To:</span>
        </div>
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => onSwitchClientNetwork('main')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              clientConnectedVia === 'main'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Main Router
          </button>
          <button
            onClick={() => onSwitchClientNetwork('secondary')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              clientConnectedVia === 'secondary'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2nd Router (AP)
          </button>
        </div>
      </div>

      {/* Mobile Device Chassis Frame */}
      <div className="relative w-[380px] h-[780px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
        {/* Top Camera Notch & Speaker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center gap-2">
          <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-slate-800 rounded-full border border-slate-700"></div>
        </div>

        {/* Screen Container */}
        <div className="w-full h-full bg-slate-900 rounded-[34px] overflow-hidden flex flex-col text-slate-100 font-sans select-none border border-slate-800 relative">
          {/* Status Bar */}
          <div className="h-9 px-6 pt-2 flex items-center justify-between text-xs text-slate-400 font-medium z-20 bg-slate-900/90 backdrop-blur-sm">
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-semibold ${
                clientConnectedVia === 'secondary' ? 'text-purple-400' : 'text-emerald-400'
              }`}>
                {clientConnectedVia === 'secondary' ? '2nd AP (5GHz)' : 'Main Wi-Fi'}
              </span>
              <Wifi className="w-3.5 h-3.5 text-slate-300" />
              <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-[1px]"></div>
              </div>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedbackMsg && (
            <div 
              className={`absolute top-11 left-4 right-4 z-40 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 ${
                feedbackMsg.type === 'success' 
                  ? 'bg-emerald-600/95 text-white border border-emerald-400' 
                  : feedbackMsg.type === 'error'
                  ? 'bg-rose-600/95 text-white border border-rose-400'
                  : 'bg-blue-600/95 text-white border border-blue-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* SCREEN 1: DASHBOARD */}
          {activeScreen === 'dashboard' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Flutter App Header */}
              <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl border ${
                    clientConnectedVia === 'secondary' 
                      ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' 
                      : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  }`}>
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                      NetGuard Multi-Router
                    </h1>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      {clientConnectedVia === 'secondary' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                          Via 2nd AP <span className="text-slate-500">➔ Main (192.168.1.1)</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Direct Main Gateway (192.168.1.1)
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRefresh}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Verify all connected devices"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Verified Total Connected Banner (Ans: সব মিলিয়ে কতজন কানেক্ট রয়েছে সেটি নিশ্চিত করবে) */}
              <div className="mx-3 mt-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-purple-950/70 border border-blue-500/30 shadow-sm">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-blue-300 text-[11px] font-bold">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>মোট নিশ্চিত কানেক্টেড ডিভাইস (Verified):</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    {totalVerifiedCount} টি অনলাইন
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-[10px]">
                  <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">মেইন রাউটার (Main):</span>
                    <span className="font-bold text-blue-400 font-mono">{mainRouterCount} টি</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">সেকেন্ড রাউটার (2nd):</span>
                    <span className="font-bold text-purple-400 font-mono">{secondaryRouterCount} টি</span>
                  </div>
                </div>
              </div>

              {/* Cross-Router Status Pill */}
              {clientConnectedVia === 'secondary' && (
                <div className="mx-3 mt-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 flex items-center gap-1.5">
                  <Share2 className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>সেকেন্ড রাউটার থেকে মেইন রাউটার সরাসরি কন্ট্রোল হচ্ছে।</span>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="px-3 pt-2 pb-1.5 flex gap-1 border-b border-slate-800/60 overflow-x-auto no-scrollbar">
                {[
                  { key: 'all', label: `সব (${totalVerifiedCount})` },
                  { key: 'main', label: `মেইন (${mainRouterCount})` },
                  { key: 'secondary', label: `২য় রাউটার (${secondaryRouterCount})` },
                  { key: 'blocked', label: `ব্লক (${blockedCount})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors ${
                      filter === tab.key 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Device List Scroll Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredDevices.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-slate-500">
                    <ShieldAlert className="w-8 h-8 mb-2 stroke-1" />
                    <p className="text-xs">No devices found in this filter.</p>
                  </div>
                ) : (
                  filteredDevices.map((device) => {
                    const isBlocked = device.status === 'blocked';
                    const remainingStr = calculateRemaining(device.expiry);
                    const isSecondary = device.connectedRouter === 'secondary';

                    return (
                      <div
                        key={device.id}
                        className={`p-2.5 rounded-2xl border transition-all ${
                          isBlocked 
                            ? 'bg-rose-950/20 border-rose-900/50' 
                            : device.expiry 
                            ? 'bg-slate-800/80 border-amber-500/40' 
                            : 'bg-slate-800/80 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <div className={`p-2 rounded-xl mt-0.5 ${
                              isBlocked 
                                ? 'bg-rose-500/20 text-rose-400' 
                                : isSecondary
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {getDeviceIcon(device.category)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-xs font-bold text-slate-100 truncate max-w-[130px]">
                                  {device.name}
                                </h3>
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                                  isBlocked 
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {isBlocked ? 'BLOCKED' : 'ONLINE'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                IP: {device.ip}
                              </p>
                              <p className="text-[9px] text-slate-500 font-mono">
                                MAC: {device.mac}
                              </p>
                            </div>
                          </div>

                          {/* Connected Router Badge */}
                          <div className="text-right">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border inline-block ${
                              isSecondary
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            }`}>
                              {isSecondary ? '২য় রাউটার' : 'মেইন রাউটার'}
                            </span>
                            <div className="text-[8px] text-slate-500 font-mono mt-0.5">
                              {device.lastPingMs}ms • {device.connectionType.replace('_', ' ')}
                            </div>
                          </div>
                        </div>

                        {/* Scheduled Countdown Badge */}
                        {device.expiry && (
                          <div className="mt-2 py-1 px-2 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1 text-amber-400">
                              <Hourglass className="w-3 h-3 animate-spin" />
                              <span>Valid:</span>
                            </div>
                            <span className="font-mono font-bold text-amber-300">
                              {remainingStr}
                            </span>
                          </div>
                        )}

                        {/* Actions Row */}
                        <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between gap-1.5">
                          <button
                            onClick={() => handleOpenSchedule(device)}
                            className="flex-1 py-1 px-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-blue-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <Clock className="w-3 h-3" />
                            {device.expiry ? 'সময় পরিবর্তন' : 'টাইম-ব্লক সেট'}
                          </button>

                          <button
                            onClick={() => onToggleBlock(device.id)}
                            className={`py-1 px-2.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                              isBlocked 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                            }`}
                          >
                            {isBlocked ? (
                              <>
                                <Unlock className="w-3 h-3" />
                                আনব্লক
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                ব্লক করুন
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SCREEN 2: SCHEDULE / EXPIRY PICKER */}
          {activeScreen === 'schedule' && selectedDevice && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setActiveScreen('dashboard')}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-white">সময় সীমা নির্ধারণ</h2>
                  <p className="text-[10px] text-slate-400">মেইন রাউটার ফায়ারওয়ালে স্বয়ংক্রিয় ব্লক</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
                    {getDeviceIcon(selectedDevice.category)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{selectedDevice.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">MAC: {selectedDevice.mac}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      সংযুক্ত: {selectedDevice.connectedRouter === 'secondary' ? 'সেকেন্ড রাউটার' : 'মেইন রাউটার'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    দ্রুত মেয়াদ সিলেক্ট করুন (Preset):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: '1_hour', label: '১ ঘণ্টা', sub: 'পরীক্ষা বা হোমওয়ার্ক' },
                      { key: '24_hours', label: '২৪ ঘণ্টা', sub: '১ দিনের ইন্টারনেট পাস' },
                      { key: '7_days', label: '৭ দিন', sub: '১ সপ্তাহের লিমিট' },
                      { key: '30_days', label: '৩০ দিন', sub: '১ মাসের বিলিং চক্র' },
                    ].map((item) => {
                      const isSelected = preset === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setPreset(item.key as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected 
                              ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500' 
                              : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-xs font-bold text-white flex items-center justify-between">
                            <span>{item.label}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPreset('custom')}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      preset === 'custom' 
                        ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500' 
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="text-xs font-bold text-white">কাস্টম তারিখ ও সময় (Custom Date)</div>
                        <div className="text-[10px] text-slate-400">নির্দিষ্ট তারিখ/সময় পর্যন্ত বৈধ থাকবে</div>
                      </div>
                    </div>
                    {preset === 'custom' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                  </button>

                  {preset === 'custom' && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2">
                      <label className="text-[11px] text-slate-300 block">
                        মেয়াদ শেষ হওয়ার সময়:
                      </label>
                      <input
                        type="datetime-local"
                        value={customDateTime}
                        onChange={(e) => setCustomDateTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    মেইন গেটওয়ে স্বয়ংক্রিয় অ্যাকশন
                  </div>
                  <p className="text-[10px] leading-relaxed">
                    ডিভাইসটি সেকেন্ড রাউটার বা মেইন রাউটার—যেকোনোটির সাথেই সংযুক্ত থাকুক না কেন, মেয়াদ শেষ হলেই মেইন গেটওয়ে এর ম্যাক অ্যাড্রেস <code className="text-amber-300">iptables DROP</code> করে দিবে।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
                <button
                  onClick={handleApplySchedule}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Clock className="w-4 h-4" />
                  টাইম-ব্লকিং শিডিউল চালু করুন
                </button>

                {selectedDevice.expiry && (
                  <button
                    onClick={handleClearSchedule}
                    className="w-full py-2 px-4 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
                  >
                    টাইম লিমিট মুছে দিন (সীমাহীন রাখুন)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Android / iOS Home Indicator */}
          <div className="h-5 flex items-center justify-center bg-slate-900">
            <div className="w-28 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
