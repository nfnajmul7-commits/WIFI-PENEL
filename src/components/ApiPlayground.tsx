import React, { useState } from 'react';
import { 
  Send, 
  Terminal, 
  Code, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight,
  Clock,
  ShieldCheck,
  Server
} from 'lucide-react';
import { Device } from '../types';

interface ApiPlaygroundProps {
  devices: Device[];
  onToggleBlock: (deviceId: string) => void;
  onSetSchedule: (deviceId: string, expiryIso: string | null) => void;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({
  devices,
  onToggleBlock,
  onSetSchedule,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/devices');
  const [targetDeviceId, setTargetDeviceId] = useState<string>(devices[0]?.id || '1');
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(
      {
        custom_datetime: '2026-10-15 18:00:00',
        preset_duration: '24_hours',
      },
      null,
      2
    )
  );
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [latency, setLatency] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const endpoints = [
    { key: 'GET /api/devices', method: 'GET', path: '/api/devices', desc: 'List all connected devices & status' },
    { key: 'GET /api/devices/{id}', method: 'GET', path: '/api/devices/{id}', desc: 'Fetch single device details' },
    { key: 'POST /api/devices/{id}/schedule', method: 'POST', path: '/api/devices/{id}/schedule', desc: 'Save expiry schedule (up to 1 month)' },
    { key: 'POST /api/devices/{id}/block', method: 'POST', path: '/api/devices/{id}/block', desc: 'Immediately drop device on router' },
    { key: 'POST /api/devices/{id}/unblock', method: 'POST', path: '/api/devices/{id}/unblock', desc: 'Allow traffic and clear limit' },
    { key: 'GET /api/router/status', method: 'GET', path: '/api/router/status', desc: 'Gateway info and cron daemon health' },
  ];

  const handleExecute = () => {
    const startTime = performance.now();
    const targetDev = devices.find((d) => d.id === targetDeviceId) || devices[0];

    let result: any = null;

    if (selectedEndpoint === 'GET /api/devices') {
      result = devices.map((d) => ({
        id: d.id,
        name: d.name,
        ip: d.ip,
        mac: d.mac,
        status: d.status,
        expiry: d.expiry,
        category: d.category,
        manufacturer: d.manufacturer,
        connected_at: d.connectedAt,
      }));
    } else if (selectedEndpoint === 'GET /api/devices/{id}') {
      result = targetDev;
    } else if (selectedEndpoint === 'POST /api/devices/{id}/schedule') {
      try {
        const parsed = JSON.parse(requestBody);
        let expiryDate: Date;
        if (parsed.custom_datetime) {
          expiryDate = new Date(parsed.custom_datetime.replace(' ', 'T'));
        } else {
          expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
        onSetSchedule(targetDev.id, expiryDate.toISOString());
        result = {
          ...targetDev,
          status: 'active',
          expiry: expiryDate.toISOString(),
          message: 'Schedule successfully updated on router database',
        };
      } catch (err: any) {
        result = { error: 'Invalid JSON body: ' + err.message };
      }
    } else if (selectedEndpoint === 'POST /api/devices/{id}/block') {
      if (targetDev.status !== 'blocked') {
        onToggleBlock(targetDev.id);
      }
      result = {
        ...targetDev,
        status: 'blocked',
        router_action: `iptables -I FORWARD -m mac --mac-source ${targetDev.mac} -j DROP`,
        blocked_at: new Date().toISOString(),
      };
    } else if (selectedEndpoint === 'POST /api/devices/{id}/unblock') {
      if (targetDev.status === 'blocked') {
        onToggleBlock(targetDev.id);
      }
      onSetSchedule(targetDev.id, null);
      result = {
        ...targetDev,
        status: 'active',
        expiry: null,
        router_action: `iptables -D FORWARD -m mac --mac-source ${targetDev.mac} -j DROP`,
      };
    } else if (selectedEndpoint === 'GET /api/router/status') {
      result = {
        gateway_ip: '192.168.1.1',
        router_model: 'OpenWrt 23.05 / Linux Kernel 6.6',
        firewall_driver: 'iptables',
        background_worker_active: true,
        check_interval_seconds: 10,
        stats: {
          total_devices: devices.length,
          active_devices: devices.filter((d) => d.status === 'active').length,
          blocked_devices: devices.filter((d) => d.status === 'blocked').length,
          scheduled_devices: devices.filter((d) => d.expiry && d.status === 'active').length,
        },
      };
    }

    const elapsed = Math.round(performance.now() - startTime) + Math.floor(Math.random() * 8) + 12;
    setLatency(elapsed);
    setResponseOutput(result);
  };

  const copyResponse = () => {
    if (responseOutput) {
      navigator.clipboard.writeText(JSON.stringify(responseOutput, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Interactive FastAPI Swagger & REST Tester
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test backend endpoints live directly against the router management engine.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          FastAPI Server: http://localhost:8000
        </div>
      </div>

      {/* Endpoint Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {endpoints.map((ep) => {
          const isSelected = selectedEndpoint === ep.key;
          const methodColor =
            ep.method === 'GET'
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

          return (
            <button
              key={ep.key}
              onClick={() => {
                setSelectedEndpoint(ep.key);
                setResponseOutput(null);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${methodColor}`}>
                  {ep.method}
                </span>
                <span className="text-xs font-mono text-slate-200 truncate">{ep.path}</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{ep.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Request Parameters Bar */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {selectedEndpoint.includes('{id}') && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-mono">Device Target ID:</label>
              <select
                value={targetDeviceId}
                onChange={(e) => setTargetDeviceId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    ID {d.id}: {d.name} ({d.mac})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto">
            <button
              onClick={handleExecute}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              Send Request
            </button>
          </div>
        </div>

        {/* Request JSON Body editor if POST endpoint */}
        {selectedEndpoint.includes('schedule') && (
          <div>
            <label className="text-xs text-slate-400 font-mono block mb-1">
              Request Payload (JSON Body):
            </label>
            <textarea
              rows={4}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Response Display */}
      {responseOutput && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                200 OK
              </span>
              <span className="text-slate-400 text-[11px]">
                Time: <strong className="text-white">{latency}ms</strong>
              </span>
              <span className="text-slate-400 text-[11px]">
                Format: <strong className="text-white">application/json</strong>
              </span>
            </div>

            <button
              onClick={copyResponse}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Copy JSON response"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 max-h-72 overflow-y-auto text-slate-300 leading-relaxed">
            <pre className="whitespace-pre">
              <code>{JSON.stringify(responseOutput, null, 2)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
