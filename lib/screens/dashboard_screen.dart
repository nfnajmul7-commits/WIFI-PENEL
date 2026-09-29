import 'dart:async';
import 'package:flutter/material.dart';
import '../models/device.dart';
import '../services/api_service.dart';
import '../widgets/device_card.dart';
import 'schedule_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Device> _devices = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _filter = 'all'; // 'all' | 'active' | 'blocked'
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _fetchDevices();
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) _fetchDevices(silent: true);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchDevices({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);
    try {
      final list = await ApiService.getDevices();
      if (mounted) {
        setState(() {
          _devices = list;
          _isLoading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          if (!silent) _errorMessage = e.toString();
        });
      }
    }
  }

  Future<void> _handleToggleBlock(Device device) async {
    try {
      if (device.isBlocked) {
        await ApiService.unblockDevice(device.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${device.name} আনব্লক করা হয়েছে'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        }
      } else {
        await ApiService.blockDevice(device.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${device.name} রাউটারে ব্লক করা হয়েছে'),
              backgroundColor: const Color(0xFFEF4444),
            ),
          );
        }
      }
      _fetchDevices(silent: true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _devices.where((d) => d.isActive).length;
    final blockedCount = _devices.where((d) => d.isBlocked).length;
    final scheduledCount = _devices.where((d) => d.hasExpiry && d.isActive).length;

    final filteredDevices = _devices.where((d) {
      if (_filter == 'active') return d.isActive;
      if (_filter == 'blocked') return d.isBlocked;
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.router, color: Color(0xFF3B82F6), size: 22),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NetGuard Router',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Gateway: 192.168.1.1 • Online',
                  style: TextStyle(fontSize: 12, color: Color(0xFF10B981)),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchDevices(),
            tooltip: 'Refresh Devices',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetchDevices(),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    _buildKpiCard('সক্রিয়', activeCount, const Color(0xFF10B981), Icons.wifi),
                    const SizedBox(width: 12),
                    _buildKpiCard('ব্লকড', blockedCount, const Color(0xFFEF4444), Icons.block),
                    const SizedBox(width: 12),
                    _buildKpiCard('মেয়াদযুক্ত', scheduledCount, const Color(0xFFF59E0B), Icons.timer),
                  ],
                ),
              ),
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    _buildFilterChip('সব (${_devices.length})', 'all'),
                    const SizedBox(width: 8),
                    _buildFilterChip('অনুমোদিত ($activeCount)', 'active'),
                    const SizedBox(width: 8),
                    _buildFilterChip('ব্লকড ($blockedCount)', 'blocked'),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            if (_isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_errorMessage != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.wifi_off, size: 48, color: Colors.red),
                        const SizedBox(height: 12),
                        Text('ব্যাকএন্ড সার্ভারে সংযোগ পাওয়া যায়নি', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => _fetchDevices(),
                          icon: const Icon(Icons.refresh),
                          label: const Text('পুনরায় চেষ্টা করুন'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (filteredDevices.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Text('কোনো ডিভাইস পাওয়া যায়নি', style: TextStyle(color: Colors.grey)),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final device = filteredDevices[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
                      child: DeviceCard(
                        device: device,
                        onToggleBlock: () => _handleToggleBlock(device),
                        onOpenSchedule: () async {
                          final updated = await Navigator.push<bool>(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ScheduleScreen(device: device),
                            ),
                          );
                          if (updated == true) _fetchDevices(silent: true);
                        },
                      ),
                    );
                  },
                  childCount: filteredDevices.length,
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard(String label, int value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Icon(icon, size: 16, color: color),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '$value',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF3B82F6) : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.white : Colors.grey,
          ),
        ),
      ),
    );
  }
}
