import React from 'react';
import { 
  Network, 
  Terminal, 
  ShieldCheck, 
  Radio, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Server, 
  ArrowRight,
  Database,
  Share2,
  Wifi,
  SearchCheck,
  Check
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
          <Network className="w-4 h-4" />
          মাল্টি-রাউটার কন্ট্রোল ও ভেরিফিকেশন গাইড
        </div>
        <h2 className="text-xl font-bold text-white">
          সেকেন্ড রাউটার থেকে মেইন রাউটার কন্ট্রোল এবং মোট সংযুক্ত ডিভাইসের সঠিক সংখ্যা নির্ধারণ
        </h2>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          আপনার প্রশ্ন দুটির বিস্তারিত কারিগরি সমাধান: (১) সেকেন্ড রাউটার থেকে কীভাবে মেইন রাউটার নিয়ন্ত্রণ করবেন এবং (২) উভয় রাউটার মিলিয়ে মোট কতটি ডিভাইস সক্রিয় রয়েছে তা কীভাবে নিশ্চিত করবেন।
        </p>
      </div>

      {/* Question 1 Answer Card: সেকেন্ড রাউটার থেকে মেইন রাউটার কন্ট্রোল */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-blue-500/30 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-blue-400">
          <Share2 className="w-5 h-5 text-blue-400" />
          <span>১. সেকেন্ড রাউটার থেকেও কি মেইন রাউটার কন্ট্রোল করা যাবে?</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>হ্যাঁ, শতভাগ সম্ভব!</strong> আপনার মোবাইল বা কম্পিউটার যদি সেকেন্ড রাউটারের Wi-Fi বা ক্যাবলে সংযুক্ত থাকে, তবুও আপনি অনায়াসে মেইন রাউটার নিয়ন্ত্রণ করতে পারবেন এবং যেকোনো ডিভাইসের ইন্টারনেট ব্লক বা শিডিউল করতে পারবেন। এর জন্য দুটি সহজ নেটওয়ার্ক কনফিগারেশন রয়েছে:
        </p>

        {/* Two Configuration Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Method A: AP / Bridge Mode (সবচেয়ে সহজ ও সেরা উপায়) */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-400">পদ্ধতি ১: Access Point (AP) / Bridge মোড (প্রস্তাবিত)</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">সেরা পদ্ধতি</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              সেকেন্ড রাউটারটিকে <strong>Access Point (AP)</strong> বা <strong>Bridge Mode</strong>-এ রাখা হয় এবং এর DHCP বন্ধ রাখা হয়।
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>মেইন রাউটার IP: <code className="text-blue-300 font-mono">192.168.1.1</code> (Gateway & FastAPI Server)</li>
              <li>সেকেন্ড রাউটার IP: <code className="text-purple-300 font-mono">192.168.1.2</code> (LAN-to-LAN সংযুক্ত)</li>
              <li>উভয় রাউটার একই সাবনেটে থাকে (<code className="text-amber-300 font-mono">192.168.1.0/24</code>)</li>
            </ul>
            <div className="p-2 bg-slate-950 rounded-lg text-[10px] font-mono text-emerald-300 border border-slate-800">
              ফলাফল: মোবাইল সেকেন্ড রাউটারে থাকলেও সরাসরি http://192.168.1.1:8000 এ কল চলে যায়।
            </div>
          </div>

          {/* Method B: Cascaded / Router-Behind-Router Mode */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-purple-400">পদ্ধতি ২: ক্যাসকেড / ডাবল সাবনেট মোড (Router Mode)</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">Subnet Mode</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              সেকেন্ড রাউটার তার নিজস্ব সাবনেট চালায় (যেমন: <code className="text-purple-300 font-mono">192.168.2.1</code>)।
            </p>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>সেকেন্ড রাউটারের WAN পোর্ট মেইন রাউটারের LAN পোর্টের সাথে যুক্ত।</li>
              <li>সেকেন্ড রাউটারের ক্লায়েন্টদের ডিফল্ট গেটওয়ে রুট হিসেবে মেইন রাউটার (<code className="text-blue-300 font-mono">192.168.1.1</code>) সবসময় দৃশ্যমান থাকে।</li>
              <li>মোবাইল অ্যাপ অনায়াসে আপস্ট্রিম গেটওয়ের API কল করতে পারে।</li>
            </ul>
            <div className="p-2 bg-slate-950 rounded-lg text-[10px] font-mono text-purple-300 border border-slate-800">
              ফায়ারওয়াল ড্রপ: মূল ইন্টারনেট মেইন রাউটার দিয়ে যায়, তাই সেকেন্ড রাউটারের ডিভাইসও শতভাগ ব্লক হয়।
            </div>
          </div>
        </div>
      </div>

      {/* Question 2 Answer Card: সব মিলিয়ে মোট কতজন কানেক্ট রয়েছে সেটি নিশ্চিত করা */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-emerald-400">
          <SearchCheck className="w-5 h-5 text-emerald-400" />
          <span>২. সব মিলিয়ে মোট কতজন কানেক্ট রয়েছে সেটি কীভাবে শতভাগ নিশ্চিত (Verified) করবেন?</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          সাধারণ রাউটার অ্যাপে শুধু DHCP লিজ তালিকা দেখালে অনেক সময় অফলাইন বা পুরোনো ডিভাইসও দেখা যায় ("Ghost Devices")। আমাদের ব্যাকএন্ড সিস্টেমটি <strong>৪ স্তরের অ্যাগ্রিগেশন ও লাইভ ভেরিফিকেশন ইঞ্জিন</strong> ব্যবহার করে মোট ডিভাইস সংখ্যা শতভাগ নিশ্চিত করে:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-blue-400 uppercase">ধাপ ১: DHCP লিজ সংগ্রহ</span>
            <h5 className="text-xs font-bold text-white mt-1">dnsmasq.leases</h5>
            <p className="text-[11px] text-slate-400 mt-1">
              মেইন রাউটার থেকে ডাইনামিক আইপি এবং ম্যাক অ্যাড্রেসের প্রাথমিক তালিকা সংগ্রহ করা হয়।
            </p>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-purple-400 uppercase">ধাপ ২: সেকেন্ড রাউটার স্ক্যান</span>
            <h5 className="text-xs font-bold text-white mt-1">AP Client Sync</h5>
            <p className="text-[11px] text-slate-400 mt-1">
              সেকেন্ড রাউটারের ওয়্যারলেস অ্যাসোসিয়েশন তালিকা (<code className="text-purple-300">wlan assoclist</code>) থেকে সংযুক্ত ক্লায়েন্ট যুক্ত করা হয়।
            </p>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-amber-400 uppercase">ধাপ ৩: ARP নেইবারশিপ</span>
            <h5 className="text-xs font-bold text-white mt-1">ip neigh / proc arp</h5>
            <p className="text-[11px] text-slate-400 mt-1">
              কার্নেল লেভেলে কোন কোন ম্যাক অ্যাড্রেস বর্তমানে প্যাকেট আদান-প্রদান করছে তা যাচাই করা হয়।
            </p>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">ধাপ ৪: লাইভ পিং সুইপ</span>
            <h5 className="text-xs font-bold text-white mt-1">Active Ping Sweep</h5>
            <p className="text-[11px] text-slate-400 mt-1">
              সন্দেহজনক বা নিষ্ক্রিয় ডিভাইসগুলোতে লাইভ ICMP পিং পাঠিয়ে নিশ্চিত করা হয় তারা অনলাইনে আছে কিনা।
            </p>
          </div>
        </div>

        {/* Verification Formula Display */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
          <div className="text-slate-300">
            <span className="text-emerald-400 font-bold">Verified Grand Total</span> = [মেইন রাউটারের লাইভ ক্লায়েন্ট] + [সেকেন্ড রাউটারের লাইভ ক্লায়েন্ট] - [ডুপ্লিকেট ম্যাক ফিল্টার]
          </div>
          <div className="text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            অফলাইন বা ড্রপ হওয়া ডিভাইস স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়
          </div>
        </div>
      </div>

      {/* Network Topology Visual Diagram */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          নেটওয়ার্ক টপোলজি ডায়াগ্রাম (Network Topology)
        </h3>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed">
{`                        [ ISP / Internet Optical Fiber ]
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       মেইন রাউটার (Main Gateway)                 │
             │       IP: 192.168.1.1 (FastAPI Backend :8000)     │
             │       • ফায়ারওয়াল রুলস (iptables FORWARD DROP) │
             │       • সেন্ট্রাল DHCP ও ডাটাবেস                 │
             └───────────────┬─────────────────────────┬────────┘
                             │                         │
                             │ (LAN Cable)             │ (Wi-Fi 5G)
                             ▼                         ▼
         ┌───────────────────────────────┐     [ টিভি ও গেমিং কনসোল ]
         │ সেকেন্ড রাউটার (2nd Router/AP) │       (192.168.1.118)
         │ IP: 192.168.1.2 (Bridge Mode) │
         └───────────────┬───────────────┘
                         │
                         │ (Wi-Fi / LAN)
                         ▼
        ┌──────────────────────────────────┐
        │  আপনার মোবাইল (Flutter App)      │  <--- সেকেন্ড রাউটার থেকে মেইন রাউটার
        │  IP: 192.168.1.109               │       কন্ট্রোল করছে (http://192.168.1.1:8000)
        └──────────────────────────────────┘`}
        </div>
      </div>

      {/* FastAPI Code Snippet for Multi-Router Verification */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          ব্যাকএন্ডে কীভাবে মোট ডিভাইস নিশ্চিত করা হয় (Python কোড নমুনা)
        </h3>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
{`# backend/main.py
@app.get("/api/network/verified-clients")
async def get_verified_network_clients():
    """
    মেইন রাউটার ও সেকেন্ড রাউটারের সব ক্লায়েন্ট স্ক্যান করে
    এবং লাইভ পিং চেক করে মোট সক্রিয় ক্লায়েন্টের সঠিক সংখ্যা নিশ্চিত করে।
    """
    # ১. মেইন রাউটারের ARP টেবিল ও DHCP লিজ
    main_clients = scan_local_arp_table(interface="br-lan")
    
    # ২. সেকেন্ড রাউটার (Bridge / AP) থেকে ক্লায়েন্ট লিস্ট
    secondary_clients = scan_secondary_ap_clients(ap_ip="192.168.1.2")
    
    # ৩. ম্যাক অ্যাড্রেস মার্জ ও ডুপ্লিকেট রিমুভ
    all_clients = {**main_clients, **secondary_clients}
    
    verified_online = []
    for mac, info in all_clients.items():
        # লাইভ দ্রুত পিং চেক (১০০ মিলিসেকেন্ড টাইমআউট)
        is_alive = await async_fast_ping(info["ip"])
        if is_alive:
            verified_online.append({
                "ip": info["ip"],
                "mac": mac,
                "connected_router": info.get("router", "main"), # 'main' or 'secondary'
                "status": "online"
            })
            
    return {
        "verified_grand_total": len(verified_online),
        "main_router_count": len([d for d in verified_online if d["connected_router"] == "main"]),
        "secondary_router_count": len([d for d in verified_online if d["connected_router"] == "secondary"]),
        "clients": verified_online
    }`}
        </pre>
      </div>
    </div>
  );
};

function Layers(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
    </svg>
  );
}
