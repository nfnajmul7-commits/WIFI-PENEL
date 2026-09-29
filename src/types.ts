export type DeviceStatus = 'active' | 'blocked';
export type ConnectedRouterNode = 'main' | 'secondary';

export interface ConnectedDeviceHistoryItem {
  id: string;
  mac: string;
  ip: string;
  name: string;
  category: 'mobile' | 'laptop' | 'tv' | 'gaming' | 'iot' | 'tablet';
  manufacturer: string;
  firstSeen: string;
  lastSeen: string;
  connectionCount: number;
  lastRouter: ConnectedRouterNode;
  isOnlineNow: boolean;
  currentStatus: DeviceStatus | 'disconnected';
  expiry?: string | null;
}

export interface Device {
  id: string;
  name: string;
  ip: string;
  mac: string;
  status: DeviceStatus;
  expiry: string | null; // ISO string or "YYYY-MM-DD HH:mm:ss"
  category: 'mobile' | 'laptop' | 'tv' | 'gaming' | 'iot' | 'tablet';
  manufacturer: string;
  connectedAt: string;
  bandwidthUsageMb: number;
  // Multi-router tracking:
  connectedRouter: ConnectedRouterNode; // 'main' (192.168.1.1) or 'secondary' (192.168.1.2 / 192.168.2.1)
  connectionType: '5G_WiFi' | '2.4G_WiFi' | 'LAN_Ethernet';
  isOnline: boolean; // Verified via ARP/Ping
  lastPingMs: number;
}

export interface RouterLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'action' | 'error';
  command: string;
  output: string;
  deviceId?: string;
  mac?: string;
  routerNode?: ConnectedRouterNode | 'both';
}

export interface RouterNodeInfo {
  id: string;
  name: string;
  role: 'primary_gateway' | 'secondary_ap';
  ip: string;
  mac: string;
  mode: 'gateway' | 'access_point' | 'repeater' | 'cascade_router';
  connectedClients: number;
  status: 'online' | 'degraded' | 'offline';
}

export interface RouterStats {
  verifiedTotalConnected: number; // Accurately verified online clients
  mainRouterConnected: number;
  secondaryRouterConnected: number;
  activeCount: number;
  blockedCount: number;
  scheduledCount: number;
  routerUptime: string;
  gatewayIp: string;
  secondaryIp: string;
  routerModel: string;
}
