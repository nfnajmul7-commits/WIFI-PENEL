import 'package:intl/intl.dart';

class Device {
  final int id;
  final String name;
  final String ip;
  final String mac;
  final String status; // 'active' | 'blocked'
  final String category;
  final String manufacturer;
  final DateTime? expiry;
  final DateTime connectedAt;
  final DateTime? lastBlockedAt;
  final int? remainingSeconds;

  Device({
    required this.id,
    required this.name,
    required this.ip,
    required this.mac,
    required this.status,
    required this.category,
    required this.manufacturer,
    this.expiry,
    required this.connectedAt,
    this.lastBlockedAt,
    this.remainingSeconds,
  });

  bool get isBlocked => status.toLowerCase() == 'blocked';
  bool get isActive => status.toLowerCase() == 'active';
  bool get hasExpiry => expiry != null;

  bool get isExpired {
    if (expiry == null) return false;
    return DateTime.now().toUtc().isAfter(expiry!);
  }

  String get formattedExpiry {
    if (expiry == null) return 'No Time Limit';
    final local = expiry!.toLocal();
    return DateFormat('MMM dd, yyyy - hh:mm a').format(local);
  }

  String get remainingTimeFormatted {
    if (expiry == null) return 'Unlimited';
    final diff = expiry!.difference(DateTime.now());
    if (diff.isNegative) return 'Expired';
    
    final days = diff.inDays;
    final hours = diff.inHours % 24;
    final minutes = diff.inMinutes % 60;
    final seconds = diff.inSeconds % 60;

    if (days > 0) {
      return '${days}d ${hours}h ${minutes}m';
    } else if (hours > 0) {
      return '${hours}h ${minutes}m ${seconds}s';
    } else {
      return '${minutes}m ${seconds}s';
    }
  }

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'],
      name: json['name'] ?? 'Unknown Device',
      ip: json['ip'] ?? '0.0.0.0',
      mac: json['mac'] ?? '',
      status: json['status'] ?? 'active',
      category: json['category'] ?? 'mobile',
      manufacturer: json['manufacturer'] ?? 'Unknown',
      expiry: json['expiry'] != null ? DateTime.parse(json['expiry']) : null,
      connectedAt: DateTime.parse(json['connected_at']),
      lastBlockedAt: json['last_blocked_at'] != null 
          ? DateTime.parse(json['last_blocked_at']) 
          : null,
      remainingSeconds: json['remaining_seconds'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'ip': ip,
      'mac': mac,
      'status': status,
      'category': category,
      'manufacturer': manufacturer,
      'expiry': expiry?.toIso8601String(),
    };
  }
}

class ConnectionHistoryItem {
  final int id;
  final String mac;
  final String ip;
  final String name;
  final String category;
  final String manufacturer;
  final DateTime firstSeen;
  final DateTime lastSeen;
  final int connectionCount;
  final String currentStatus;
  final bool isCurrentlyManaged;
  final DateTime? expiry;

  ConnectionHistoryItem({
    required this.id,
    required this.mac,
    required this.ip,
    required this.name,
    required this.category,
    required this.manufacturer,
    required this.firstSeen,
    required this.lastSeen,
    required this.connectionCount,
    required this.currentStatus,
    required this.isCurrentlyManaged,
    this.expiry,
  });

  factory ConnectionHistoryItem.fromJson(Map<String, dynamic> json) {
    return ConnectionHistoryItem(
      id: json['id'],
      mac: json['mac'] ?? '',
      ip: json['ip'] ?? '',
      name: json['name'] ?? 'Unknown',
      category: json['category'] ?? 'mobile',
      manufacturer: json['manufacturer'] ?? 'Connected Device',
      firstSeen: DateTime.parse(json['first_seen']),
      lastSeen: DateTime.parse(json['last_seen']),
      connectionCount: json['connection_count'] ?? 1,
      currentStatus: json['current_status'] ?? 'disconnected',
      isCurrentlyManaged: json['is_currently_managed'] ?? false,
      expiry: json['expiry'] != null ? DateTime.parse(json['expiry']) : null,
    );
  }
}

