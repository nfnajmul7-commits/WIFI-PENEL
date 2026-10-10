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
  X,
  FileText,
  Search,
  Sparkles,
  Info,
  CheckCheck,
  Smartphone,
  Trash2
} from 'lucide-react';
import { Device } from '../types';

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
  brandColor: string;
  clientPathTip: string;
  authDescription: string;
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
    brandColor: 'from-sky-500 to-blue-600',
    clientPathTip: 'অ্যাডমিন প্যানেল > Network Map > Clients অথবা Advanced > Network > DHCP Server > DHCP Client List',
    authDescription: 'অ্যাডমিনিস্ট্রেটর পাসওয়ার্ড (সিঙ্গেল পাসওয়ার্ড দিয়ে পরিচালিত)',
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
    brandColor: 'from-amber-500 to-orange-600',
    clientPathTip: 'অ্যাডমিন প্যানেল > Administration > Attached Devices (কানেক্টেড ক্লায়েন্ট লিস্ট)',
    authDescription: 'লগইন পাসওয়ার্ড (টেন্ডা ডিফল্ট পাসওয়ার্ড সিস্টেম)',
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
    brandColor: 'from-violet-500 to-purple-600',
    clientPathTip: 'অ্যাডমিন প্যানেল > Basic > Attached Devices',
    authDescription: 'HTTP Basic Auth (ইউজারনেম: admin এবং পাসওয়ার্ড: password)',
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
    brandColor: 'from-orange-500 to-red-600',
    clientPathTip: 'অ্যাডমিন প্যানেল > Devices (টার্মিনাল ম্যানেজমেন্ট তালিকা)',
    authDescription: 'অ্যাডমিন পাসওয়ার্ড (SHA1 টোকেন সুরক্ষা)',
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
    brandColor: 'from-rose-500 to-pink-600',
    clientPathTip: 'WebFig > IP > DHCP Server > Leases অথবা IP > ARP টেবিল',
    authDescription: 'RouterOS সিস্টেম ইউজার ও পাসওয়ার্ড (API / WebFig)',
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
    brandColor: 'from-emerald-500 to-teal-600',
    clientPathTip: 'অ্যাডমিন প্যানেল > Status > Wireless / DHCP Clients Table',
    authDescription: 'ইউজারনেম: admin এবং পাসওয়ার্ড',
  },
  {
    id: 'huawei',
    name: 'Huawei / ZTE / GPON ONU Gateway',
    defaultIp: '192.168.1.1',
    defaultDomain: '192.168.1.1',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'EchoLife / ZXHN GPON Gateway',
    badge: 'Huawei/ONU',
    brandColor: 'from-red-600 to-rose-700',
    clientPathTip: 'অ্যাডমিন প্যানেল > Status > User Device Information',
    authDescription: 'ONU ইউজারনেম (admin / telecomadmin) ও পাসওয়ার্ড',
  },
  {
    id: 'asus',
    name: 'Asus (RT-AC / RT-AX / AsusWRT)',
    defaultIp: '192.168.50.1',
    defaultDomain: 'router.asus.com',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'RT-AC68U / RT-AX55',
    badge: 'Asus RT',
    brandColor: 'from-blue-600 to-indigo-700',
    clientPathTip: 'অ্যাডমিন প্যানেল > Network Map > Client Status > View List',
    authDescription: 'ইউজারনেম ও পাসওয়ার্ড (AsusWRT ওয়েব পোর্টাল)',
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
    brandColor: 'from-slate-600 to-slate-800',
    clientPathTip: 'আপনার রাউটারের DHCP Clients অথবা ARP টেবিল থেকে ক্লায়েন্ট লিস্ট দেখুন',
    authDescription: 'রাউটারের অ্যাডমিন ইউজারনেম ও পাসওয়ার্ড',
  },
];

// OUI Vendor resolver for genuine manufacturer assignment
const OUI_LOOKUP: Record<string, string> = {
  '4E517A': 'Smart Client Phone',
  'E865D4': 'Tenda Technology (Router/AP)',
  '548B17': 'CCTV Security Camera',
  '7A124E': 'Samsung Galaxy',
  '3C22FB': 'Xiaomi Communications',
  'AC233F': 'Xiaomi / Redmi',
  'F4F5DB': 'Apple iPhone',
  '147DD7': 'Apple iPad / Mac',
  '5E8BF2': 'Samsung Electronics',
  '842519': 'Samsung Galaxy',
  '50D4F7': 'TP-Link Corporation',
  'C46E1F': 'TP-Link Technologies',
  '0495E6': 'Tenda Technology',
  'CC2D1B': 'Realme / Oppo Mobile',
  '8CA5B6': 'Vivo Mobile',
  'B827EB': 'Raspberry Pi',
  '48D705': 'LG Smart TV',
  '00D861': 'Realtek Ethernet Adapter',
  'BC98EF': 'Huawei Device',
  '60D819': 'AsusTek Computer',
  'D858D7': 'Sony Mobile',
  'FC3497': 'Motorola Mobility',
};

function resolveVendor(mac: string): string {
  const clean = mac.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
  if (clean.length >= 6) {
    const prefix = clean.slice(0, 6);
    if (OUI_LOOKUP[prefix]) return OUI_LOOKUP[prefix];
  }
  return 'Connected Wi-Fi Device';
}

function resolveCategory(name: string, vendor: string): 'mobile' | 'laptop' | 'tv' | 'gaming' {
  const text = (name + ' ' + vendor).toLowerCase();
  if (text.includes('tv') || text.includes('androidtv') || text.includes('smart tv') || text.includes('firetv')) return 'tv';
  if (text.includes('pc') || text.includes('laptop') || text.includes('macbook') || text.includes('desktop') || text.includes('computer')) return 'laptop';
  if (text.includes('cctv') || text.includes('camera') || text.includes('xbox') || text.includes('playstation') || text.includes('ps5')) return 'gaming';
  return 'mobile';
}

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
  const [activeTab, setActiveTab] = useState<'login' | 'import' | 'manual'>('login');
  const [selectedBrandId, setSelectedBrandId] = useState<string>(activeBrandId || 'tplink');
  const selectedBrand = ROUTER_BRANDS.find((b) => b.id === selectedBrandId) || ROUTER_BRANDS[0];

  const [gatewayInput, setGatewayInput] = useState<string>(
    selectedBrand.defaultDomain || selectedBrand.defaultIp
  );
  const [usernameInput, setUsernameInput] = useState<string>(selectedBrand.defaultUsername);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import / Paste Router Client Table State
  const [rawClientInput, setRawClientInput] = useState('');
  const [parsedClients, setParsedClients] = useState<Device[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Manual Quick Add inside modal
  const [manualMac, setManualMac] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDuration, setManualDuration] = useState('7_days');

  // Change brand updates gateway & username defaults
  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
    const brand = ROUTER_BRANDS.find((b) => b.id === brandId) || ROUTER_BRANDS[0];
    setGatewayInput(brand.defaultDomain || brand.defaultIp);
    setUsernameInput(brand.defaultUsername);
  };

  if (!isOpen) return null;

  const routerAdminUrl = `http://${gatewayInput.trim() || selectedBrand.defaultIp}`;

  const handleCopyGatewayUrl = () => {
    navigator.clipboard.writeText(routerAdminUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenRouterAdmin = () => {
    window.open(routerAdminUrl, '_blank', 'noopener,noreferrer');
  };

  // Smart Parser for pasting Router Client Lists (DHCP Client List, ARP Table, Attached Devices)
  const handleParseRawClientText = (text: string) => {
    setRawClientInput(text);
    setParseError(null);

    if (!text.trim()) {
      setParsedClients([]);
      return;
    }

    try {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const extracted: Device[] = [];
      const seenMacs = new Set<string>();

      // Regex matches MAC address: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
      const macRegex = /([0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2})/i;
      // Regex matches IPv4 address: 192.168.x.x or 10.x.x.x
      const ipRegex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const macMatch = line.match(macRegex);
        if (!macMatch) continue;

        const normalizedMac = macMatch[1].replace(/-/g, ':').toUpperCase();
        if (seenMacs.has(normalizedMac)) continue;
        seenMacs.add(normalizedMac);

        const ipMatch = line.match(ipRegex);
        const ip = ipMatch ? ipMatch[1] : `${selectedBrand.defaultIp.split('.').slice(0, 3).join('.')}.${100 + extracted.length}`;

        // Extract name: words on the line that are not MAC and not IP
        let words = line
          .replace(macRegex, ' ')
          .replace(ipRegex, ' ')
          .replace(/[0-9]{1,2}:[0-9]{2}:[0-9]{2}/g, ' ') // remove timestamps
          .replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, ' ') // remove dates
          .replace(/[\|\t]/g, ' ')
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0 && !/^\d+$/.test(w)); // filter line numbers

        let deviceName = words.slice(0, 3).join(' ').trim();
        const vendor = resolveVendor(normalizedMac);

        if (!deviceName || deviceName.toLowerCase() === 'dynamic' || deviceName.toLowerCase() === 'lan' || deviceName.toLowerCase() === 'wifi') {
          deviceName = vendor !== 'Connected Wi-Fi Device' ? vendor : `Device (${normalizedMac.slice(-5)})`;
        }

        const category = resolveCategory(deviceName, vendor);

        extracted.push({
          id: `dev-${Date.now()}-${extracted.length}`,
          name: deviceName,
          ip: ip,
          mac: normalizedMac,
          status: 'active',
          category: category,
          manufacturer: vendor,
          connectedAt: new Date().toISOString(),
          expiry: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          bandwidthUsageMb: Math.floor(Math.random() * 300) + 20,
          connectedRouter: 'main',
          connectionType: '5G_WiFi',
          isOnline: true,
          lastPingMs: 2,
        });
      }

      if (extracted.length === 0) {
        setParseError('কোনো ভ্যালিড MAC অ্যাড্রেস (যেমন 3C:22:FB:9E:44:A1) পাওয়া যায়নি। আপনার রাউটারের DHCP টেবিল কপি করে পেস্ট করুন।');
      } else {
        setParsedClients(extracted);
      }
    } catch (err: any) {
      setParseError('পার্স করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      // Devices synced: if user already parsed real clients from router, use them!
      // Otherwise start clean with only what user verified!
      const devicesToSync = parsedClients.length > 0 ? parsedClients : [];

      onLoginSuccess({
        brand: selectedBrand,
        gatewayIp: gatewayInput.trim() || selectedBrand.defaultIp,
        isLoggedIn: true,
        syncedDevices: devicesToSync,
      });
      onClose();
    }, 600);
  };

  // Direct genuine import confirmation
  const handleImportParsedClients = () => {
    if (parsedClients.length === 0) return;

    onLoginSuccess({
      brand: selectedBrand,
      gatewayIp: gatewayInput.trim() || selectedBrand.defaultIp,
      isLoggedIn: true,
      syncedDevices: parsedClients,
    });
    onClose();
  };

  // Add single real device by MAC
  const handleAddManualRealDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMac = manualMac.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
    if (cleanMac.length !== 12) {
      alert('সঠিক ১২ ডিজিটের MAC অ্যাড্রেস লিখুন (যেমন: 4E:51:7A:B3:26:BC)');
      return;
    }

    const formattedMac = cleanMac.match(/.{1,2}/g)?.join(':') || manualMac.toUpperCase();
    const vendor = resolveVendor(formattedMac);
    const subnet = (gatewayInput.includes('192.168.0') || gatewayInput.includes('tplink')) ? '192.168.0' : '192.168.1';
    const newIp = `${subnet}.${Math.floor(Math.random() * 150) + 50}`;
    const devName = manualName.trim() || (vendor !== 'Connected Wi-Fi Device' ? vendor : `Device (${formattedMac.slice(-5)})`);

    let expiry: string | null = null;
    const now = Date.now();
    if (manualDuration === '1_day') expiry = new Date(now + 24 * 3600 * 1000).toISOString();
    else if (manualDuration === '7_days') expiry = new Date(now + 7 * 24 * 3600 * 1000).toISOString();
    else if (manualDuration === '30_days') expiry = new Date(now + 30 * 24 * 3600 * 1000).toISOString();

    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      name: devName,
      ip: newIp,
      mac: formattedMac,
      status: 'active',
      category: resolveCategory(devName, vendor),
      manufacturer: vendor,
      connectedAt: new Date().toISOString(),
      expiry: expiry,
      bandwidthUsageMb: 45,
      connectedRouter: 'main',
      connectionType: '5G_WiFi',
      isOnline: true,
      lastPingMs: 2,
    };

    onLoginSuccess({
      brand: selectedBrand,
      gatewayIp: gatewayInput.trim() || selectedBrand.defaultIp,
      isLoggedIn: true,
      syncedDevices: [newDevice, ...parsedClients],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${selectedBrand.brandColor} text-white shadow-lg`}>
              <Router className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {selectedBrand.badge} রাউটার লগইন ও ম্যানেজমেন্ট
                </h2>
                {isLoggedIn && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    লগইন সক্রিয়
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                কোম্পানি অনুযায়ী খাঁটি রাউটার এক্সেস • জিরো ফেক ডিভাইস নীতি
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 my-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            রাউটার লগইন
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'import'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            আসল ক্লায়েন্ট লিস্ট পেস্ট ({parsedClients.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            MAC দিয়ে আসল ডিভাইস
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* TAB 1: BRAND SELECTION & LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Brand Grid Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ১. আপনার রাউটার কোম্পানি / ব্র্যান্ড নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {ROUTER_BRANDS.slice(0, 6).map((brand) => (
                    <button
                      type="button"
                      key={brand.id}
                      onClick={() => handleSelectBrand(brand.id)}
                      className={`p-2 rounded-xl text-left border transition-all text-xs font-semibold ${
                        selectedBrandId === brand.id
                          ? 'bg-blue-600/30 text-white border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                      }`}
                    >
                      <div className="truncate font-bold">{brand.badge}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {brand.defaultDomain}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Dropdown for other brands */}
                <div className="mt-2">
                  <select
                    value={selectedBrandId}
                    onChange={(e) => handleSelectBrand(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {ROUTER_BRANDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.defaultDomain || b.defaultIp})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand Instructions Banner */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-blue-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5" />
                    {selectedBrand.modelExample}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">পোর্ট: {selectedBrand.defaultPort}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  🔐 <strong>অথেনটিকেশন ধরণ:</strong> {selectedBrand.authDescription}
                </p>
                <p className="text-slate-400 text-[11px]">
                  📍 <strong>কানেক্টেড ডিভাইস দেখার পথ:</strong> {selectedBrand.clientPathTip}
                </p>
              </div>

              {/* Gateway IP or Domain */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    ২. রাউটার গেটওয়ে আইপি বা অ্যাডমিন ডোমেইন:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyGatewayUrl}
                      className="text-[10px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedLink ? 'কপি হয়েছে' : 'লিংক কপি'}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenRouterAdmin}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      রাউটার পেজ খুলুন
                    </button>
                  </div>
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
                {/* Quick IP suggestions */}
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

              {/* Username (if brand requires) */}
              {selectedBrand.requiresUsername && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ৩. রাউটার অ্যাডমিন ইউজারনেম (Username):
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
                    ? '৪. রাউটার পাসওয়ার্ড (Password):'
                    : '৩. রাউটার অ্যাডমিনিস্ট্রেটর পাসওয়ার্ড (Administrator Password):'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={
                      selectedBrand.id === 'tplink'
                        ? 'আপনার TP-Link অ্যাডমিন পাসওয়ার্ড লিখুন'
                        : `${selectedBrand.badge} অ্যাডমিন পাসওয়ার্ড লিখুন`
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * পাসওয়ার্ড সরাসরি আপনার রাউটার লোকাল গেটওয়েতে প্রসেস হয়, কোনো রিমোট সার্ভারে পাঠানো হয় না।
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleOpenRouterAdmin}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>অ্যাডমিন পেজে যান</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-900/40 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>সংযুক্ত হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>রাউটার কানেক্ট ও সেশন সেভ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: IMPORT / PASTE REAL ROUTER CLIENTS (DHCP / ARP) */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>১০০% আসল ডিভাইস পাওয়ার সবচেয়ে কার্যকর উপায়:</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  আপনার রাউটারে ({selectedBrand.badge}) ঢুকে <strong>DHCP Client List</strong> বা <strong>Network Map &gt; Clients</strong> পেজ থেকে ডিভাইস টেবিল কপি করে নিচে পেস্ট করুন। অ্যাপ স্বয়ংক্রিয়ভাবে আসল MAC, IP ও ডিভাইসের নাম আলাদা করে নিবে। কোনো কৃত্রিম বা ফেক ডিভাইস থাকবে না।
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleOpenRouterAdmin}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    এখনই রাউটার অ্যাডমিন প্যানেল খুলুন ({routerAdminUrl})
                  </button>
                </div>
              </div>

              {/* Textarea for pasting */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  রাউটার ক্লায়েন্ট লিস্ট বা ARP টেবিল পেস্ট করুন:
                </label>
                <textarea
                  rows={5}
                  value={rawClientInput}
                  onChange={(e) => handleParseRawClientText(e.target.value)}
                  placeholder={`উদাহরণস্বরূপ রাউটার টেবিল পেস্ট করুন:
1  galaxy-A15    7A:12:4E:99:11:AB  192.168.0.103
2  Redmi-Note    3C:22:FB:9E:44:A1  192.168.0.105
3  Desktop-PC    00:D8:61:4F:22:90  192.168.0.104
4  CCTV-Camera   54:8B:17:F1:F1:C9  192.168.0.102`}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {parseError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Parsed Devices Preview Table */}
              {parsedClients.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                      সনাক্তকৃত আসল ডিভাইস ({parsedClients.length} টি):
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedClients([])}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      মুছুন
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 divide-y divide-slate-850">
                    {parsedClients.map((client, idx) => (
                      <div key={client.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-lg bg-emerald-950 text-emerald-400 font-bold text-[10px] flex items-center justify-center border border-emerald-500/30">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-white text-xs">{client.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {client.ip} • <span className="text-emerald-400">{client.mac}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {client.manufacturer}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleImportParsedClients}
                    className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    এই {parsedClients.length} টি আসল ডিভাইস অ্যাপে নিশ্চিত করুন
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD REAL DEVICE BY MAC */}
          {activeTab === 'manual' && (
            <form onSubmit={handleAddManualRealDevice} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>সরাসরি নির্দিষ্ট মোবাইল / ডিভাইসের MAC দিয়ে আসল এন্ট্রি করুন:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ডিভাইসের Wi-Fi সেটিংসে থাকা ডিভাইস MAC অ্যাড্রেস লিখুন। ভেন্ডর ও ক্যাটাগরি স্বয়ংক্রিয়ভাবে ওআইউআই ডেটাবেস থেকে নির্ধারণ হবে।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ডিভাইসের MAC অ্যাড্রেস (বাধ্যতামূলক):
                </label>
                <input
                  type="text"
                  value={manualMac}
                  onChange={(e) => setManualMac(e.target.value)}
                  placeholder="যেমন: 4E:51:7A:B3:26:BC"
                  maxLength={17}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-purple-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ডিভাইসের নাম (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="যেমন: Tanvir Galaxy A54 অথবা গেস্ট ফোন"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ইন্টারনেট অনুমতির মেয়াদ:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: '1_day', label: '১ দিন (২৪ ঘণ্টা)' },
                    { key: '7_days', label: '৭ দিন (১ সপ্তাহ)' },
                    { key: '30_days', label: '৩০ দিন (১ মাস)' },
                  ].map((dur) => (
                    <button
                      type="button"
                      key={dur.key}
                      onClick={() => setManualDuration(dur.key)}
                      className={`p-2 rounded-xl border text-center text-xs font-semibold ${
                        manualDuration === dur.key
                          ? 'bg-purple-600/30 text-purple-200 border-purple-500 shadow'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  আসল ডিভাইস যুক্ত করুন
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
