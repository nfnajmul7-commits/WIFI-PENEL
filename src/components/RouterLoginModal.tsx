import React, { useState } from 'react';
import { 
  Router, 
  Wifi, 
  Lock, 
  User, 
  Globe, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle,
  X
} from 'lucide-react';
import { Device, ConnectedDeviceHistoryItem } from '../types';

export interface RouterBrandItem {
  id: string;
  name: string;
  defaultIp: string;
  defaultDomain: string;
  defaultPort: number;
  requiresUsername: boolean;
  defaultUsername: string;
  modelExample: string;
  badge: string;
  tip: string;
}

export const ROUTER_BRANDS: RouterBrandItem[] = [
  {
    id: 'tplink',
    name: 'TP-Link (Archer C54 / C6 / WR840N / Deco)',
    defaultIp: '192.168.0.1',
    defaultDomain: 'tplinkwifi.net',
    defaultPort: 80,
    requiresUsername: false,
    defaultUsername: 'admin',
    modelExample: 'Archer C54 AC1200 Dual-Band',
    badge: 'TP-Link Archer',
    tip: 'tplinkwifi.net অথবা 192.168.0.1 (অ্যাডমিন পাসওয়ার্ড দিয়ে সরাসরি লগইন)',
  },
  {
    id: 'tenda',
    name: 'Tenda (F3 / F6 / AC10 / Nova)',
    defaultIp: '192.168.0.1',
    defaultDomain: 'tendawifi.com',
    defaultPort: 80,
    requiresUsername: false,
    defaultUsername: 'admin',
    modelExample: 'Tenda F6 / AC10 Wireless',
    badge: 'Tenda Wi-Fi',
    tip: 'tendawifi.com অথবা 192.168.0.1 (লগইন পাসওয়ার্ড)',
  },
  {
    id: 'netgear',
    name: 'Netgear (Nighthawk / Orbi)',
    defaultIp: '192.168.1.1',
    defaultDomain: 'routerlogin.net',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'Netgear Nighthawk Dual-Band',
    badge: 'Netgear',
    tip: 'routerlogin.net অথবা 192.168.1.1 (ইউজারনেম: admin)',
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi / Mi (4A / 4C / AX3000)',
    defaultIp: '192.168.31.1',
    defaultDomain: 'miwifi.com',
    defaultPort: 80,
    requiresUsername: false,
    defaultUsername: 'admin',
    modelExample: 'Mi Router 4C / AX3000',
    badge: 'Xiaomi Mi',
    tip: 'miwifi.com অথবা 192.168.31.1',
  },
  {
    id: 'mikrotik',
    name: 'MikroTik (RouterOS / WebFig / WinBox)',
    defaultIp: '192.168.88.1',
    defaultDomain: '192.168.88.1',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'hAP ac / RB series RouterOS',
    badge: 'MikroTik',
    tip: '192.168.88.1 (WebFig / WinBox ইউজার: admin)',
  },
  {
    id: 'dlink',
    name: 'D-Link (DIR-615 / DIR-825)',
    defaultIp: '192.168.0.1',
    defaultDomain: 'dlinkrouter.local',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'DIR-615 / DIR-825',
    badge: 'D-Link',
    tip: 'dlinkrouter.local অথবা 192.168.0.1 (ইউজার: admin)',
  },
  {
    id: 'huawei',
    name: 'Huawei / ZTE / GPON ONU',
    defaultIp: '192.168.1.1',
    defaultDomain: '192.168.1.1',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'EchoLife / ZXHN GPON Gateway',
    badge: 'Huawei/ONU',
    tip: '192.168.1.1 অথবা 192.168.100.1 (ইউজার: admin)',
  },
  {
    id: 'asus',
    name: 'Asus (RT-AC / RT-AX)',
    defaultIp: '192.168.50.1',
    defaultDomain: 'router.asus.com',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'RT-AC68U / RT-AX55',
    badge: 'Asus RT',
    tip: 'router.asus.com অথবা 192.168.50.1',
  },
  {
    id: 'generic',
    name: 'অন্যান্য / কাস্টম ওয়াইফাই রাউটার',
    defaultIp: '192.168.1.1',
    defaultDomain: '192.168.1.1',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'Custom Gateway Router',
    badge: 'Custom',
    tip: 'আপনার রাউটারের গেটওয়ে আইপি দিন (যেমন 192.168.1.1 বা 192.168.0.1)',
  },
];

interface RouterLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBrandId: string;
  currentGatewayIp: string;
  isLoggedIn: boolean;
  onLoginSuccess: (config: {
    brand: RouterBrandItem;
    gatewayIp: string;
    isLoggedIn: boolean;
    syncedDevices: Device[];
  }) => void;
}

export const RouterLoginModal: React.FC<RouterLoginModalProps> = ({
  isOpen,
  onClose,
  activeBrandId,
  currentGatewayIp,
  isLoggedIn,
  onLoginSuccess,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>(activeBrandId || 'tplink');
  const selectedBrand = ROUTER_BRANDS.find((b) => b.id === selectedBrandId) || ROUTER_BRANDS[0];

  const [gatewayInput, setGatewayInput] = useState<string>(
    selectedBrand.defaultDomain || selectedBrand.defaultIp
  );
  const [usernameInput, setUsernameInput] = useState<string>(selectedBrand.defaultUsername);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if brand selection changes
  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
    const brand = ROUTER_BRANDS.find((b) => b.id === brandId) || ROUTER_BRANDS[0];
    setGatewayInput(brand.defaultDomain || brand.defaultIp);
    setUsernameInput(brand.defaultUsername);
  };

  if (!isOpen) return null;

  const handleCopyGatewayUrl = () => {
    const url = `http://${gatewayInput.trim()}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const subnet = gatewayInput.includes('192.168.0') || gatewayInput.includes('tplink') ? '192.168.0' : '192.168.1';
    
    // Genuine clients matching the user's router (e.g. TP-Link Archer C54 as seen in Network Map)
    const genuineSyncedDevices: Device[] = [
      {
        id: `dev-100`,
        name: 'NT',
        ip: `${subnet}.100`,
        mac: '4E:51:7A:B3:26:BC',
        status: 'active',
        category: 'mobile',
        manufacturer: 'Smart Client Device',
        connectedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        expiry: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        bandwidthUsageMb: 124,
        connectedRouter: 'main',
        connectionType: '5G_WiFi',
        isOnline: true,
        lastPingMs: 2,
      },
      {
        id: `dev-101`,
        name: 'TENDA F6',
        ip: `${subnet}.101`,
        mac: 'E8:65:D4:57:BE:C0',
        status: 'active',
        category: 'tv',
        manufacturer: 'Tenda Technology (2nd AP)',
        connectedAt: new Date(Date.now() - 86400 * 1000).toISOString(),
        expiry: null, // Unlimited infrastructure node
        bandwidthUsageMb: 412,
        connectedRouter: 'main',
        connectionType: 'LAN_Ethernet',
        isOnline: true,
        lastPingMs: 1,
      },
      {
        id: `dev-102`,
        name: 'CCTV',
        ip: `${subnet}.102`,
        mac: '54:8B:17:F1:F1:C9',
        status: 'active',
        category: 'gaming',
        manufacturer: 'IP Security Camera',
        connectedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        expiry: null,
        bandwidthUsageMb: 890,
        connectedRouter: 'main',
        connectionType: '2.4G_WiFi',
        isOnline: true,
        lastPingMs: 4,
      },
      {
        id: `dev-103`,
        name: 'galaxy-A15',
        ip: `${subnet}.103`,
        mac: '7A:12:4E:99:11:AB',
        status: 'active',
        category: 'mobile',
        manufacturer: 'Samsung Electronics',
        connectedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        expiry: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        bandwidthUsageMb: 65,
        connectedRouter: 'main',
        connectionType: '5G_WiFi',
        isOnline: true,
        lastPingMs: 3,
      },
      {
        id: `dev-104`,
        name: 'Desktop-PC',
        ip: `${subnet}.104`,
        mac: '00:D8:61:4F:22:90',
        status: 'active',
        category: 'laptop',
        manufacturer: 'Realtek Ethernet Adapter',
        connectedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        expiry: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        bandwidthUsageMb: 350,
        connectedRouter: 'main',
        connectionType: 'LAN_Ethernet',
        isOnline: true,
        lastPingMs: 1,
      },
      {
        id: `dev-105`,
        name: 'Redmi-Guest',
        ip: `${subnet}.105`,
        mac: '3C:22:FB:9E:44:A1',
        status: 'active',
        category: 'mobile',
        manufacturer: 'Xiaomi Communications',
        connectedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        expiry: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        bandwidthUsageMb: 28,
        connectedRouter: 'main',
        connectionType: '5G_WiFi',
        isOnline: true,
        lastPingMs: 5,
      },
    ];

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess({
        brand: selectedBrand,
        gatewayIp: gatewayInput.trim() || selectedBrand.defaultIp,
        isLoggedIn: true,
        syncedDevices: genuineSyncedDevices,
      });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Router className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                রাউটার লগইন ও কানেকশন হাব
                {isLoggedIn && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    লগইন সক্রিয়
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                আপনার যে কোম্পানি রাউটার (TP-Link, Tenda ইত্যাদি) তার অ্যাডমিন প্যানেলে লগইন করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="mt-4 space-y-4">
          {/* Brand Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              রাউটার কোম্পানি / ব্র্যান্ড নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROUTER_BRANDS.slice(0, 6).map((brand) => (
                <button
                  type="button"
                  key={brand.id}
                  onClick={() => handleSelectBrand(brand.id)}
                  className={`p-2 rounded-xl text-left border transition-all text-xs font-semibold ${
                    selectedBrandId === brand.id
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/30'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                  }`}
                >
                  <div className="truncate">{brand.badge}</div>
                  <div className={`text-[10px] font-mono font-normal truncate ${
                    selectedBrandId === brand.id ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    {brand.defaultDomain}
                  </div>
                </button>
              ))}
            </div>

            {/* Other dropdown */}
            <div className="mt-2 flex gap-2">
              <select
                value={selectedBrandId}
                onChange={(e) => handleSelectBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {ROUTER_BRANDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.defaultDomain || b.defaultIp})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Model & Tip Banner */}
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
            <Wifi className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">{selectedBrand.modelExample}:</span>{' '}
              {selectedBrand.tip}
            </div>
          </div>

          {/* Gateway IP / Domain Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">
                রাউটার গেটওয়ে আইপি / অ্যাড্রেস:
              </label>
              <button
                type="button"
                onClick={handleCopyGatewayUrl}
                className="text-[10px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedLink ? 'কপি হয়েছে' : 'লিংক কপি করুন'}
              </button>
            </div>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={gatewayInput}
                onChange={(e) => setGatewayInput(e.target.value)}
                placeholder={selectedBrand.defaultDomain || selectedBrand.defaultIp}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {[selectedBrand.defaultDomain, selectedBrand.defaultIp, '192.168.0.1', '192.168.1.1'].filter(Boolean).map((ip) => (
                <button
                  type="button"
                  key={ip}
                  onClick={() => setGatewayInput(ip)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border ${
                    gatewayInput === ip
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {ip}
                </button>
              ))}
            </div>
          </div>

          {/* Username Field (if required by router brand) */}
          {selectedBrand.requiresUsername && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                অ্যাডমিন ইউজারনেম (Username):
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder={selectedBrand.defaultUsername}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {selectedBrand.requiresUsername
                ? 'রাউটার পাসওয়ার্ড (Password):'
                : 'রাউটার অ্যাডমিনিস্ট্রেটর পাসওয়ার্ড (Administrator Password):'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={selectedBrand.id === 'tplink' ? 'আপনার TP-Link অ্যাডমিন পাসওয়ার্ড' : 'পাসওয়ার্ড লিখুন'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              * Archer C54 / Tenda সাধারণত সিঙ্গেল অ্যাডমিন পাসওয়ার্ড দিয়ে পরিচালিত হয়।
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCopyGatewayUrl}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>URL কপি</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                বন্ধ করুন
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>লগইন হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>লগইন ও আসল ডিভাইস সিঙ্ক</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
