import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/device.dart';
import 'router_service.dart';
import 'network_scanner_service.dart';

enum ConnectionMode {
  standaloneRouter, // Direct Router & Local Wi-Fi Scanner (স্বয়ংক্রিয়)
  backendServer,    // NetGuard Backend Server (FastAPI Daemon on port 8000)
}

class ApiService {
  // Configurable base URL for when a custom backend server is used
  static String baseUrl = 'http://192.168.1.1:8000';
  static ConnectionMode activeMode = ConnectionMode.standaloneRouter;

  static void setBaseUrl(String newUrl) {
    baseUrl = newUrl;
  }

  static void setConnectionMode(ConnectionMode mode) {
    activeMode = mode;
  }

  /// Fetch all connected devices (seamlessly falls back to local scanner if no server)
  static Future<List<Device>> getDevices({String? statusFilter}) async {
    if (activeMode == ConnectionMode.standaloneRouter) {
      return await NetworkScannerService.getDevices(statusFilter: statusFilter);
    }

    try {
      final url = Uri.parse(
        statusFilter != null 
          ? '$baseUrl/api/devices?status_filter=$statusFilter'
          : '$baseUrl/api/devices'
      );

      final response = await http.get(
        url,
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((item) => Device.fromJson(item)).toList();
      } else {
        throw Exception('Server returned ${response.statusCode}');
      }
    } catch (_) {
      // Graceful fallback to Direct Router Mode so app never crashes
      activeMode = ConnectionMode.standaloneRouter;
      return await NetworkScannerService.getDevices(statusFilter: statusFilter);
    }
  }

  /// Schedule device expiry
  static Future<Device> setSchedule({
    required int deviceId,
    String? customDateTime,
    String? presetDuration,
    double? durationHours,
  }) async {
    if (activeMode == ConnectionMode.standaloneRouter) {
      return await NetworkScannerService.setSchedule(
        deviceId: deviceId,
        customDateTime: customDateTime,
        presetDuration: presetDuration,
        durationHours: durationHours,
      );
    }

    try {
      final url = Uri.parse('$baseUrl/api/devices/$deviceId/schedule');
      final payload = <String, dynamic>{};
      if (customDateTime != null) payload['custom_datetime'] = customDateTime;
      if (presetDuration != null) payload['preset_duration'] = presetDuration;
      if (durationHours != null) payload['duration_hours'] = durationHours;

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        return Device.fromJson(jsonDecode(response.body));
      } else {
        final err = jsonDecode(response.body);
        throw Exception(err['detail'] ?? 'Failed to set schedule');
      }
    } catch (_) {
      return await NetworkScannerService.setSchedule(
        deviceId: deviceId,
        customDateTime: customDateTime,
        presetDuration: presetDuration,
        durationHours: durationHours,
      );
    }
  }

  /// Manually block a device
  static Future<Device> blockDevice(int deviceId) async {
    if (activeMode == ConnectionMode.standaloneRouter) {
      return await NetworkScannerService.toggleBlock(deviceId);
    }

    try {
      final url = Uri.parse('$baseUrl/api/devices/$deviceId/block');
      final response = await http.post(url).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        return Device.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to block: ${response.statusCode}');
      }
    } catch (_) {
      return await NetworkScannerService.toggleBlock(deviceId);
    }
  }

  /// Manually unblock a device
  static Future<Device> unblockDevice(int deviceId) async {
    if (activeMode == ConnectionMode.standaloneRouter) {
      return await NetworkScannerService.toggleBlock(deviceId);
    }

    try {
      final url = Uri.parse('$baseUrl/api/devices/$deviceId/unblock');
      final response = await http.post(url).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        return Device.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to unblock: ${response.statusCode}');
      }
    } catch (_) {
      return await NetworkScannerService.toggleBlock(deviceId);
    }
  }

  /// Remove time schedule
  static Future<Device> clearSchedule(int deviceId) async {
    if (activeMode == ConnectionMode.standaloneRouter) {
      return await NetworkScannerService.clearSchedule(deviceId);
    }

    try {
      final url = Uri.parse('$baseUrl/api/devices/$deviceId/schedule');
      final response = await http.delete(url).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        return Device.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to clear schedule');
      }
    } catch (_) {
      return await NetworkScannerService.clearSchedule(deviceId);
    }
  }

  /// Quick add device by MAC
  static Future<Device> quickAddByMac({
    required String mac,
    String? name,
    String? ip,
    String duration = '7_days',
    String? customExpiry,
  }) async {
    if (activeMode == ConnectionMode.standaloneRouter) {
      return await NetworkScannerService.quickAddByMac(
        mac: mac,
        name: name,
        ip: ip,
        duration: duration,
        customExpiry: customExpiry,
      );
    }

    try {
      final url = Uri.parse('$baseUrl/api/devices/quick-add');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'mac': mac,
          'name': name,
          'ip': ip,
          'duration': duration,
          'custom_expiry': customExpiry,
        }),
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 201 || response.statusCode == 200) {
        return Device.fromJson(jsonDecode(response.body));
      } else {
        final err = jsonDecode(response.body);
        throw Exception(err['detail'] ?? 'Failed to add MAC');
      }
    } catch (_) {
      return await NetworkScannerService.quickAddByMac(
        mac: mac,
        name: name,
        ip: ip,
        duration: duration,
        customExpiry: customExpiry,
      );
    }
  }

  /// Get router system status
  static Future<Map<String, dynamic>> getRouterStatus() async {
    if (activeMode == ConnectionMode.standaloneRouter) {
      return RouterService.getStatusSummary();
    }

    try {
      final url = Uri.parse('$baseUrl/api/router/status');
      final response = await http.get(url).timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (_) {
      // Fallback
    }
    return RouterService.getStatusSummary();
  }

  /// Connection history
  static Future<List<ConnectionHistoryItem>> getConnectionHistory() async {
    if (activeMode == ConnectionMode.standaloneRouter) {
      return await NetworkScannerService.getConnectionHistory();
    }

    try {
      final url = Uri.parse('$baseUrl/api/history');
      final response = await http.get(url).timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((item) => ConnectionHistoryItem.fromJson(item)).toList();
      }
    } catch (_) {
      // Fallback
    }
    return await NetworkScannerService.getConnectionHistory();
  }
}
