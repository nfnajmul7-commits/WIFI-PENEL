import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/device.dart';

class ApiService {
  // Configurable base URL:
  // For Android Emulator: 'http://10.0.2.2:8000'
  // For iOS Simulator: 'http://127.0.0.1:8000'
  // For Real Android Device: your computer's local Wi-Fi IP, e.g. 'http://192.168.1.100:8000'
  static String baseUrl = 'http://192.168.1.1:8000';

  /// Update backend base URL dynamically (e.g. from settings screen)
  static void setBaseUrl(String newUrl) {
    baseUrl = newUrl;
  }

  /// Fetch all connected devices
  static Future<List<Device>> getDevices({String? statusFilter}) async {
    try {
      final url = Uri.parse(
        statusFilter != null 
          ? '$baseUrl/api/devices?status_filter=$statusFilter'
          : '$baseUrl/api/devices'
      );

      final response = await http.get(
        url,
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((item) => Device.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load devices: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error connecting to NetGuard backend: $e');
    }
  }

  /// Schedule device expiry (custom datetime or preset duration up to 1 month)
  static Future<Device> setSchedule({
    required int deviceId,
    String? customDateTime,
    String? presetDuration, // '1_hour', '24_hours', '7_days', '30_days'
    double? durationHours,
  }) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/schedule');
    
    final payload = <String, dynamic>{};
    if (customDateTime != null) payload['custom_datetime'] = customDateTime;
    if (presetDuration != null) payload['preset_duration'] = presetDuration;
    if (durationHours != null) payload['duration_hours'] = durationHours;

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      final err = jsonDecode(response.body);
      throw Exception(err['detail'] ?? 'Failed to set schedule');
    }
  }

  /// Manually block a device immediately
  static Future<Device> blockDevice(int deviceId) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/block');
    final response = await http.post(url);

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to block device: ${response.statusCode}');
    }
  }

  /// Manually unblock a device immediately
  static Future<Device> unblockDevice(int deviceId) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/unblock');
    final response = await http.post(url);

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to unblock device: ${response.statusCode}');
    }
  }

  /// Remove time schedule
  static Future<Device> clearSchedule(int deviceId) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/schedule');
    final response = await http.delete(url);

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to clear schedule');
    }
  }

  /// Get router system status
  static Future<Map<String, dynamic>> getRouterStatus() async {
    final url = Uri.parse('$baseUrl/api/router/status');
    final response = await http.get(url);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load router status');
  }

  static Future<Device> quickAddByMac({
    required String mac,
    String? name,
    String? ip,
    String duration = '7_days',
    String? customExpiry,
  }) async {
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
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      final err = jsonDecode(response.body);
      throw Exception(err['detail'] ?? 'Failed to add device by MAC');
    }
  }

  static Future<List<ConnectionHistoryItem>> getConnectionHistory() async {
    final url = Uri.parse('$baseUrl/api/history');
    final response = await http.get(url);
    if (response.statusCode == 200) {
      final List<dynamic> body = jsonDecode(response.body);
      return body.map((item) => ConnectionHistoryItem.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load connection history');
    }
  }

  static Future<Device> setupTimeForHistoryDevice(
    int historyId, {
    String? presetDuration,
    String? customDateTime,
  }) async {
    final url = Uri.parse('$baseUrl/api/history/$historyId/setup-time');
    final payload = <String, dynamic>{};
    if (presetDuration != null) payload['preset_duration'] = presetDuration;
    if (customDateTime != null) payload['custom_datetime'] = customDateTime;

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      final err = jsonDecode(response.body);
      throw Exception(err['detail'] ?? 'Failed to set time for history device');
    }
  }
}

