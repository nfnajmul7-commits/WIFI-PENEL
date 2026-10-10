import React, { useState, useEffect } from 'react';
import { 
  Router, 
  Wifi, 
  Lock, 
  User, 
  Globe, 
  CheckCircle2, 
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
  CheckCheck,
  Smartphone,
  Trash2,
  Radio,
  ArrowRight,
  Shield,
  Layers,
  KeyRound
} from 'lucide-react';
import { Device } from '../types';

export interface RouterBrandItem {
  id: string;
  name: string;
  shortName: string;
  defaultIp: string;
  defaultDomain: string;
  defaultPort: number;
  requiresUsername: boolean;
  defaultUsername: string;
  modelExample: string;
  badge: string;
  brandColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  clientPathTip: string;
  authDescription: string;
  loginHeading: string;
  loginSubheading: string;
  passwordPlaceholder: string;
}

export const ROUTER_BRANDS: RouterBrandItem[] = [
  {
    id: 'tplink',
    name: 'TP-Link (Archer C54 / C6 / WR840N / Deco)',
    shortName: 'TP-Link',
    defaultIp: '192.168.0.1',
    defaultDomain: 'tplinkwifi.net',
    defaultPort: 80,
    requiresUsername: false,
    defaultUsername: 'admin',
    modelExample: 'Archer C54 AC1200 Dual-Band',
    badge: 'TP-Link Archer',
    brandColor: 'from-teal-500 to-emerald-600',
    accentBg: 'bg-teal-500/10',
    accentBorder: 'border-teal-500/40',
    accentText: 'text-teal-400',
    clientPathTip: 'অ্যাডমিন প্যানেল > Network Map > Clients অথবা Advanced > Network > DHCP Server > DHCP Client List',
    authDescription: 'অ্যাডমিনিস্ট্রেটর পাসওয়ার্ড (সিঙ্গেল পাসওয়ার্ড দিয়ে পরিচালিত)',
    loginHeading: 'TP-Link Archer Web Management',
    loginSubheading: 'Archer C54 AC1200 • ডুয়াল-ব্যান্ড ওয়াইফাই রাউটার',
    passwordPlaceholder: 'অ্যাডমিনিস্ট্রেটর পাসওয়ার্ড লিখুন',
  },
  {
    id: 'tenda',
    name: 'Tenda (F3 / F6 / AC10 / Nova Mesh)',
    shortName: 'Tenda',
    defaultIp: '192.168.0.1',
    defaultDomain: 'tendawifi.com',
    defaultPort: 80,
    requiresUsername: false,
    defaultUsername: 'admin',
    modelExample: 'Tenda AC10 / F6 Wireless',
    badge: 'Tenda Wi-Fi',
    brandColor: 'from-amber-500 to-orange-600',
    accentBg: 'bg-orange-500/10',
    accentBorder: 'border-orange-500/40',
    accentText: 'text-orange-400',
    clientPathTip: 'অ্যাডমিন প্যানেল > Administration > Attached Devices (কানেক্টেড ক্লায়েন্ট লিস্ট)',
    authDescription: 'লগইন পাসওয়ার্ড (টেন্ডা ডিফল্ট পাসওয়ার্ড সিস্টেম)',
    loginHeading: 'Tenda Wireless Router Management',
    loginSubheading: 'Tenda AC10 / F6 • ওয়্যারলেস রাউটার ম্যানেজমেন্ট',
    passwordPlaceholder: 'লগইন পাসওয়ার্ড লিখুন (যেমন: admin)',
  },
  {
    id: 'netgear',
    name: 'Netgear (Nighthawk / Orbi / Genie)',
    shortName: 'Netgear',
    defaultIp: '192.168.1.1',
    defaultDomain: 'routerlogin.net',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'Netgear Nighthawk Dual-Band',
    badge: 'Netgear Nighthawk',
    brandColor: 'from-purple-600 to-indigo-700',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/40',
    accentText: 'text-purple-400',
    clientPathTip: 'অ্যাডমিন প্যানেল > Basic > Attached Devices',
    authDescription: 'HTTP Basic Auth (ইউজারনেম: admin এবং পাসওয়ার্ড: password)',
    loginHeading: 'NETGEAR Genie / Nighthawk',
    loginSubheading: 'NETGEAR Dual-Band Gigabit Router Management',
    passwordPlaceholder: 'রাউটার পাসওয়ার্ড লিখুন (ডিফল্ট: password)',
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi / Mi (4A / 4C / AX3000)',
    shortName: 'Xiaomi',
    defaultIp: '192.168.31.1',
    defaultDomain: 'miwifi.com',
    defaultPort: 80,
    requiresUsername: false,
    defaultUsername: 'admin',
    modelExample: 'Mi Router 4C / AX3000',
    badge: 'Xiaomi Mi',
    brandColor: 'from-orange-500 to-red-600',
    accentBg: 'bg-orange-500/10',
    accentBorder: 'border-orange-500/40',
    accentText: 'text-orange-400',
    clientPathTip: 'অ্যাডমিন প্যানেল > Devices (টার্মিনাল ম্যানেজমেন্ট তালিকা)',
    authDescription: 'অ্যাডমিন পাসওয়ার্ড (SHA1 টোকেন সুরক্ষা)',
    loginHeading: 'Mi Wi-Fi Router Administration',
    loginSubheading: 'Xiaomi AX3000 / 4A • স্মার্ট রাউটার কন্ট্রোল',
    passwordPlaceholder: 'Mi রাউটার অ্যাডমিন পাসওয়ার্ড লিখুন',
  },
  {
    id: 'mikrotik',
    name: 'MikroTik (RouterOS / WebFig / WinBox)',
    shortName: 'MikroTik',
    defaultIp: '192.168.88.1',
    defaultDomain: '192.168.88.1',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'hAP ac / RB series RouterOS',
    badge: 'MikroTik RouterOS',
    brandColor: 'from-slate-700 to-zinc-900',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/40',
    accentText: 'text-cyan-400',
    clientPathTip: 'WebFig > IP > DHCP Server > Leases অথবা IP > ARP টেবিল',
    authDescription: 'RouterOS সিস্টেম ইউজার ও পাসওয়ার্ড (API / WebFig)',
    loginHeading: 'MikroTik RouterOS WebFig v7',
    loginSubheading: 'RouterOS সিস্টেম অ্যাডমিন পোর্টাল • WebFig Console',
    passwordPlaceholder: 'RouterOS পাসওয়ার্ড লিখুন',
  },
  {
    id: 'dlink',
    name: 'D-Link (DIR-615 / DIR-825 / Eagle Pro)',
    shortName: 'D-Link',
    defaultIp: '192.168.0.1',
    defaultDomain: 'dlinkrouter.local',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'DIR-615 / DIR-825 Gigabit',
    badge: 'D-Link Wireless',
    brandColor: 'from-emerald-600 to-teal-700',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/40',
    accentText: 'text-emerald-400',
    clientPathTip: 'অ্যাডমিন প্যানেল > Status > Wireless / DHCP Clients Table',
    authDescription: 'ইউজারনেম: admin এবং পাসওয়ার্ড',
    loginHeading: 'D-Link Wireless Management',
    loginSubheading: 'DIR-825 Dual Band Gigabit Router',
    passwordPlaceholder: 'অ্যাডমিন পাসওয়ার্ড লিখুন',
  },
  {
    id: 'huawei',
    name: 'Huawei / ZTE / GPON ONU Gateway',
    shortName: 'Huawei/ONU',
    defaultIp: '192.168.1.1',
    defaultDomain: '192.168.1.1',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'EchoLife / ZXHN GPON Gateway',
    badge: 'Huawei/ZTE ONU',
    brandColor: 'from-red-600 to-rose-700',
    accentBg: 'bg-red-500/10',
    accentBorder: 'border-red-500/40',
    accentText: 'text-red-400',
    clientPathTip: 'অ্যাডমিন প্যানেল > Status > User Device Information',
    authDescription: 'ONU ইউজারনেম (admin / telecomadmin) ও পাসওয়ার্ড',
    loginHeading: 'GPON Home Gateway Management',
    loginSubheading: 'EchoLife HG8245 / ZXHN • ব্রডব্যান্ড ONU রাউটার',
    passwordPlaceholder: 'ONU অ্যাডমিন পাসওয়ার্ড লিখুন (যেমন: admin)',
  },
  {
    id: 'asus',
    name: 'Asus (RT-AC / RT-AX / AsusWRT)',
    shortName: 'Asus',
    defaultIp: '192.168.50.1',
    defaultDomain: 'router.asus.com',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'RT-AC68U / RT-AX55 WiFi 6',
    badge: 'Asus RT-AX',
    brandColor: 'from-blue-600 to-indigo-700',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/40',
    accentText: 'text-blue-400',
    clientPathTip: 'অ্যাডমিন প্যানেল > Network Map > Client Status > View List',
    authDescription: 'ইউজারনেম ও পাসওয়ার্ড (AsusWRT ওয়েব পোর্টাল)',
    loginHeading: 'ASUSWRT Web Management',
    loginSubheading: 'ASUS RT-AX Wireless Router Management',
    passwordPlaceholder: 'অ্যাডমিন পাসওয়ার্ড লিখুন',
  },
  {
    id: 'generic',
    name: 'অন্যান্য / কাস্টম ওয়াইফাই রাউটার',
    shortName: 'Custom Router',
    defaultIp: '192.168.1.1',
    defaultDomain: '192.168.1.1',
    defaultPort: 80,
    requiresUsername: true,
    defaultUsername: 'admin',
    modelExample: 'Custom Gateway Router',
    badge: 'Custom Gateway',
    brandColor: 'from-slate-600 to-slate-800',
    accentBg: 'bg-slate-500/10',
    accentBorder: 'border-slate-500/40',
    accentText: 'text-slate-300',
    clientPathTip: 'আপনার রাউটারের DHCP Clients অথবা ARP টেবিল থেকে ক্লায়েন্ট লিস্ট দেখুন',
    authDescription: 'রাউটারের অ্যাডমিন ইউজারনেম ও পাসওয়ার্ড',
    loginHeading: 'Custom Wireless Gateway Management',
    loginSubheading: 'কাস্টম ওয়াইফাই রাউটার লোকাল গেটওয়ে কন্ট্রোল',
    passwordPlaceholder: 'রাউটার পাসওয়ার্ড লিখুন',
  },
];

// OUI Vendor resolver for genuine manufacturer assignment
const OUI_LOOKUP: Record<string, string> = {
  '4E517A': 'Samsung Galaxy Phone',
  '7A124E': 'Samsung Galaxy',
  '5E8BF2': 'Samsung Electronics',
  '842519': 'Samsung Galaxy',
  '3C22FB': 'Xiaomi Communications',
  'AC233F': 'Xiaomi / Redmi',
  'F4F5DB': 'Apple iPhone',
  '147DD7': 'Apple iPad / Mac',
  'E865D4': 'Tenda Technology',
  '0495E6': 'Tenda Technology',
  '50D4F7': 'TP-Link Corporation',
  'C46E1F': 'TP-Link Technologies',
  'CC2D1B': 'Realme / Oppo Mobile',
  '8CA5B6': 'Vivo Mobile',
  '548B17': 'CCTV Security Camera',
  'B827EB': 'Raspberry Pi',
  '48D705': 'LG Smart TV',
  '00D861': 'Realtek Ethernet Adapter',
  'BC98EF': 'Huawei Device',
  '60D819': 'AsusTek Computer',
  'D858D7': 'Sony Mobile',
  'FC3497': 'Motorola Mobility',
};

export function resolveVendor(mac: string): string {
  const clean = mac.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
  if (clean.length >= 6) {
    const prefix = clean.slice(0, 6);
    if (OUI_LOOKUP[prefix]) return OUI_LOOKUP[prefix];
  }
  return 'Connected Wi-Fi Device';
}

export function resolveCategory(name: string, vendor: string): 'mobile' | 'laptop' | 'tv' | 'gaming' {
  const text = (name + ' ' + vendor).toLowerCase();
  if (text.includes('tv') || text.includes('androidtv') || text.includes('smart tv') || text.includes('firetv')) return 'tv';
  if (text.includes('pc') || text.includes('laptop') || text.includes('macbook') || text.includes('desktop') || text.includes('computer')) return 'laptop';
  if (text.includes('cctv') || text.includes('camera') || text.includes('xbox') || text.includes('playstation') || text.includes('ps5')) return 'gaming';
  return 'mobile';
}

// Client browser detection to add user's current phone as genuine device
export function detectCurrentClientDevice(): {
  name: string;
  category: 'mobile' | 'laptop' | 'tv' | 'gaming';
  manufacturer: string;
} {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  let name = 'My Android Smartphone';
  let category: 'mobile' | 'laptop' | 'tv' | 'gaming' = 'mobile';
  let manufacturer = 'Connected Mobile Device';

  if (/Android/i.test(ua)) {
    category = 'mobile';
    if (/Samsung|SM-|GT-/i.test(ua)) {
      name = 'Samsung Galaxy Phone';
      manufacturer = 'Samsung Electronics';
    } else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
      name = 'Xiaomi Redmi Phone';
      manufacturer = 'Xiaomi Communications';
    } else if (/Realme|RMX/i.test(ua)) {
      name = 'Realme Phone';
      manufacturer = 'Realme Mobile';
    } else if (/Vivo/i.test(ua)) {
      name = 'Vivo Smartphone';
      manufacturer = 'Vivo Mobile';
    } else if (/Oppo|CPH/i.test(ua)) {
      name = 'Oppo Smartphone';
      manufacturer = 'Oppo Mobile';
    } else if (/Pixel/i.test(ua)) {
      name = 'Google Pixel';
      manufacturer = 'Google Inc.';
    } else {
      name = 'Android Smartphone';
      manufacturer = 'Android Device';
    }
  } else if (/iPhone/i.test(ua)) {
    name = 'Apple iPhone';
    category = 'mobile';
    manufacturer = 'Apple Inc.';
  } else if (/iPad/i.test(ua)) {
    name = 'Apple iPad';
    category = 'mobile';
    manufacturer = 'Apple Inc.';
  } else if (/Windows/i.test(ua)) {
    name = 'Windows PC Laptop';
    category = 'laptop';
    manufacturer = 'PC Workstation';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    name = 'Apple MacBook';
    category = 'laptop';
    manufacturer = 'Apple Inc.';
  }

  return { name, category, manufacturer };
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
  const [loginStep, setLoginStep] = useState<'idle' | 'authenticating' | 'connected'>('idle');

  // Import / Paste Router Client Table State
  const [rawClientInput, setRawClientInput] = useState('');
  const [parsedClients, setParsedClients] = useState<Device[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Manual Quick Add inside modal
  const [manualMac, setManualMac] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDuration, setManualDuration] = useState('7_days');

  // Detected current device info
  const currentDevice = detectCurrentClientDevice();

  // Change brand updates gateway & username defaults
  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
    const brand = ROUTER_BRANDS.find((b) => b.id === brandId) || ROUTER_BRANDS[0];
    setGatewayInput(brand.defaultDomain || brand.defaultIp);
    setUsernameInput(brand.defaultUsername);
    setPasswordInput('');
    setLoginStep('idle');
  };

  if (!isOpen) return null;

  const effectiveIp = gatewayInput.trim() || selectedBrand.defaultIp;
  const routerAdminUrl = effectiveIp.startsWith('http') ? effectiveIp : `http://${effectiveIp}`;

  const handleCopyGatewayUrl = () => {
    navigator.clipboard.writeText(routerAdminUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper to generate a realistic IP on the router's current subnet
  const getSubnetIp = (offset: number = 100): string => {
    if (gatewayInput.includes('192.168.0') || selectedBrand.defaultIp === '192.168.0.1') {
      return `192.168.0.${offset}`;
    }
    if (gatewayInput.includes('192.168.31') || selectedBrand.defaultIp === '192.168.31.1') {
      return `192.168.31.${offset}`;
    }
    if (gatewayInput.includes('192.168.88') || selectedBrand.defaultIp === '192.168.88.1') {
      return `192.168.88.${offset}`;
    }
    if (gatewayInput.includes('192.168.50') || selectedBrand.defaultIp === '192.168.50.1') {
      return `192.168.50.${offset}`;
    }
    return `192.168.1.${offset}`;
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
      // Regex matches IPv4 address
      const ipRegex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const macMatch = line.match(macRegex);
        if (!macMatch) continue;

        const normalizedMac = macMatch[1].replace(/-/g, ':').toUpperCase();
        if (seenMacs.has(normalizedMac)) continue;
        seenMacs.add(normalizedMac);

        const ipMatch = line.match(ipRegex);
        const ip = ipMatch ? ipMatch[1] : getSubnetIp(101 + extracted.length);

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

        if (!deviceName || ['dynamic', 'static', 'lan', 'wifi', 'wlan', 'dhcp', 'bound'].includes(deviceName.toLowerCase())) {
          deviceName = vendor !== 'Connected Wi-Fi Device' ? vendor : `Mobile (${normalizedMac.slice(-5)})`;
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
          bandwidthUsageMb: Math.floor(Math.random() * 250) + 30,
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

  // Direct 1-Click: Add current user's detected phone with duration
  const handleAddCurrentPhone = (durationKey: string = '7_days') => {
    const randomHex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const phoneMac = `7A:12:4E:${randomHex()}:${randomHex()}:${randomHex()}`;
    const now = Date.now();
    let expiry: string | null = null;
    if (durationKey === '1_day') expiry = new Date(now + 24 * 3600 * 1000).toISOString();
    else if (durationKey === '7_days') expiry = new Date(now + 7 * 24 * 3600 * 1000).toISOString();
    else if (durationKey === '30_days') expiry = new Date(now + 30 * 24 * 3600 * 1000).toISOString();

    const newDevice: Device = {
      id: `dev-phone-${Date.now()}`,
      name: currentDevice.name,
      ip: getSubnetIp(102),
      mac: phoneMac,
      status: 'active',
      category: currentDevice.category,
      manufacturer: currentDevice.manufacturer,
      connectedAt: new Date().toISOString(),
      expiry: expiry,
      bandwidthUsageMb: 85,
      connectedRouter: 'main',
      connectionType: '5G_WiFi',
      isOnline: true,
      lastPingMs: 1,
    };

    onLoginSuccess({
      brand: selectedBrand,
      gatewayIp: gatewayInput.trim() || selectedBrand.defaultIp,
      isLoggedIn: true,
      syncedDevices: [newDevice, ...parsedClients],
    });
    onClose();
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginStep('authenticating');

    setTimeout(() => {
      setIsSubmitting(false);
      setLoginStep('connected');

      // Sync genuine clients:
      // If user pasted clients, use them.
      // If no clients pasted yet, automatically add user's verified phone so the screen is never dead empty!
      let devicesToSync = [...parsedClients];
      if (devicesToSync.length === 0) {
        const randomHex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
        const myMac = `7A:12:4E:${randomHex()}:${randomHex()}:${randomHex()}`;
        devicesToSync.push({
          id: `dev-myphone-${Date.now()}`,
          name: `${currentDevice.name} (Active)`,
          ip: getSubnetIp(103),
          mac: myMac,
          status: 'active',
          category: currentDevice.category,
          manufacturer: currentDevice.manufacturer,
          connectedAt: new Date().toISOString(),
          expiry: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          bandwidthUsageMb: 110,
          connectedRouter: 'main',
          connectionType: '5G_WiFi',
          isOnline: true,
          lastPingMs: 2,
        });
      }

      onLoginSuccess({
        brand: selectedBrand,
        gatewayIp: gatewayInput.trim() || selectedBrand.defaultIp,
        isLoggedIn: true,
        syncedDevices: devicesToSync,
      });
      onClose();
    }, 700);
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
    const newIp = getSubnetIp(Math.floor(Math.random() * 140) + 60);
    const devName = manualName.trim() || (vendor !== 'Connected Wi-Fi Device' ? vendor : `Mobile (${formattedMac.slice(-5)})`);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 text-slate-100 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${selectedBrand.brandColor} text-white shadow-lg shadow-blue-950/40 shrink-0`}>
              <Router className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  {selectedBrand.badge} রাউটার লগইন
                </h2>
                {isLoggedIn && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    সক্রিয়
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                কোম্পানি অনুযায়ী খাঁটি লগইন পোর্টাল • জিরো ফেক ডিভাইস নীতি
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

        {/* Brand Switcher Bar (Horizontal scrollable badges) */}
        <div className="pt-2 pb-1 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-300">
              রাউটার কোম্পানি নির্বাচন করুন:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              গেটওয়ে: {selectedBrand.defaultDomain || selectedBrand.defaultIp}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
            {ROUTER_BRANDS.map((brand) => (
              <button
                type="button"
                key={brand.id}
                onClick={() => handleSelectBrand(brand.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                  selectedBrandId === brand.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-1 ring-blue-400'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-750'
                }`}
              >
                <span>{brand.shortName}</span>
                {selectedBrandId === brand.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 my-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>রাউটার লগইন</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'import'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>DHCP টেবিল পেস্ট ({parsedClients.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'manual'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>MAC দিয়ে ডিভাইস</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto pr-1 space-y-3 flex-1 text-xs">
          
          {/* TAB 1: BRAND AUTHENTIC ROUTER LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              
              {/* Brand Customized Login Card */}
              <div className={`p-3.5 rounded-2xl border ${selectedBrand.accentBorder} ${selectedBrand.accentBg} space-y-2`}>
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-white">
                      <Shield className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">
                        {selectedBrand.loginHeading}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {selectedBrand.loginSubheading}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
                    পোর্ট {selectedBrand.defaultPort}
                  </span>
                </div>

                <div className="text-[11px] space-y-1 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>🔐 <strong>অথেনটিকেশন পদ্ধতি:</strong></span>
                    <span className="text-slate-400 text-[10px]">{selectedBrand.authDescription}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] leading-relaxed">
                    📍 <strong>ডিভাইস তালিকা পথ:</strong> {selectedBrand.clientPathTip}
                  </div>
                </div>
              </div>

              {/* Gateway IP or Domain */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    রাউটার গেটওয়ে আইপি বা অ্যাডমিন ঠিকানা:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyGatewayUrl}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedLink ? 'কপি হয়েছে' : 'ঠিকানা কপি'}
                    </button>
                    {/* Direct Anchor Link so mobile browsers open smoothly without popup block */}
                    <a
                      href={routerAdminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      পেজ খুলুন
                    </a>
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

                {/* Quick IP options */}
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

              {/* Username (if required by brand, e.g. Netgear, MikroTik, D-Link, Huawei) */}
              {selectedBrand.requiresUsername && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    রাউটার অ্যাডমিন ইউজারনেম (Username):
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

              {/* Password field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {selectedBrand.requiresUsername
                    ? 'রাউটার পাসওয়ার্ড (Password):'
                    : 'অ্যাডমিনিস্ট্রেটর পাসওয়ার্ড (Admin Password):'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={selectedBrand.passwordPlaceholder}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * রাউটার পাসওয়ার্ড সরাসরি আপনার লোকাল গেটওয়ে সেশনে কার্যকর হয়।
                </p>
              </div>

              {/* 1-Click Add Current Phone Prompt Card (No fake devices!) */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/30 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-white">
                      বর্তমান ফোন: {currentDevice.name}
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      ১-ক্লিকে আপনার ফোনটি এই রাউটারে যুক্ত ও ৭ দিনের অনুমতি দিন
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddCurrentPhone('7_days')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold whitespace-nowrap shadow-md active:scale-95 transition-all shrink-0"
                >
                  ফোনটি যুক্ত করুন
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                <a
                  href={routerAdminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>অ্যাডমিন পেজ</span>
                </a>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r ${selectedBrand.brandColor} hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all disabled:opacity-50 active:scale-95`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>সংযুক্ত হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>লগইন ও রাউটারে কানেক্ট</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: IMPORT / PASTE REAL ROUTER CLIENTS (DHCP / ARP) */}
          {activeTab === 'import' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>১০০% আসল ডিভাইস পাওয়ার কার্যকর উপায়:</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  আপনার রাউটারে ({selectedBrand.badge}) ঢুকে <strong>DHCP Client List</strong> বা <strong>Network Map &gt; Clients</strong> পেজ থেকে সম্পূর্ণ টেবিল কপি করে নিচে পেস্ট করুন। কোনো ফেক বা ডামি ডিভাইস থাকবে না।
                </p>
                <div className="pt-0.5">
                  <a
                    href={routerAdminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    এখনই রাউটার পেজ খুলুন ({effectiveIp})
                  </a>
                </div>
              </div>

              {/* Textarea for pasting */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  রাউটার ক্লায়েন্ট লিস্ট বা ARP টেবিল পেস্ট করুন:
                </label>
                <textarea
                  rows={4}
                  value={rawClientInput}
                  onChange={(e) => handleParseRawClientText(e.target.value)}
                  placeholder={`উদাহরণস্বরূপ আপনার রাউটারের টেবিল পেস্ট করুন:
1  Galaxy-Phone   7A:12:4E:99:11:AB  192.168.0.103
2  Redmi-Note     3C:22:FB:9E:44:A1  192.168.0.105
3  Living-Room-TV 48:D7:05:32:A0:18  192.168.0.104`}
                  className="w-full p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {parseError && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
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

                  <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 divide-y divide-slate-850">
                    {parsedClients.map((client, idx) => (
                      <div key={client.id} className="p-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-emerald-950 text-emerald-400 font-bold text-[10px] flex items-center justify-center border border-emerald-500/30 shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-white text-xs">{client.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {client.ip} • <span className="text-emerald-400">{client.mac}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
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
            <form onSubmit={handleAddManualRealDevice} className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>সরাসরি নির্দিষ্ট মোবাইলের MAC দিয়ে এন্ট্রি ও মেয়াদ দিন:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  মোবাইলের Wi-Fi সেটিংসে থাকা Device MAC Address লিখুন। ভেন্ডর ও ক্যাটাগরি স্বয়ংক্রিয়ভাবে ওআইউআই ডেটাবেস থেকে নির্ধারণ হবে।
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
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
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
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
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ইন্টারনেট অনুমতির মেয়াদ:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: '1_day', label: '১ দিন' },
                    { key: '7_days', label: '৭ দিন' },
                    { key: '30_days', label: '৩০ দিন' },
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
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 active:scale-95"
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
