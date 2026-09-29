import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/device.dart';

class ApiService {
  static String baseUrl = 'http://192.168.1.1:8000';

  static void setBaseUrl(String newUrl) {
    baseUrl = newUrl;
  }

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

  static Future<Device> setSchedule({
    required int deviceId,
    String? customDateTime,
    String? presetDuration,
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

  static Future<Device> blockDevice(int deviceId) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/block');
    final response = await http.post(url);

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to block device: ${response.statusCode}');
    }
  }

  static Future<Device> unblockDevice(int deviceId) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/unblock');
    final response = await http.post(url);

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to unblock device: ${response.statusCode}');
    }
  }

  static Future<Device> clearSchedule(int deviceId) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/schedule');
    final response = await http.delete(url);

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to clear schedule');
    }
  }

  static Future<Map<String, dynamic>> getRouterStatus() async {
    final url = Uri.parse('$baseUrl/api/router/status');
    final response = await http.get(url);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load router status');
  }
}
