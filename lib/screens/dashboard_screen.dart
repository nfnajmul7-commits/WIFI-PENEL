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

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Device> _devices = [];
  List<ConnectionHistoryItem> _historyItems = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _filter = 'all'; // 'all' | 'active' | 'blocked'
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });

    _fetchDevices();
    _fetchHistory();
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        _fetchDevices(silent: true);
        if (_tabController.index == 1) _fetchHistory(silent: true);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
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

  Future<void> _fetchHistory({bool silent = false}) async {
    try {
      final items = await ApiService.getConnectionHistory();
      if (mounted) {
        setState(() {
          _historyItems = items;
        });
      }
    } catch (e) {
      // ignore silent history fetch errors
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
      _fetchHistory(silent: true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('ত্রুটি: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showQuickAddMacDialog() {
    final macController = TextEditingController();
    String selectedDuration = '7_days';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.flash_on, color: Color(0xFFF59E0B), size: 22),
              SizedBox(width: 8),
              Text(
                'শুধুমাত্র MAC দিয়ে যুক্ত করুন',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'কোনো নাম বা আইপি দিতে হবে না। শুধুমাত্র ম্যাক অ্যাড্রেস লিখলেই ডিভাইস যুক্ত হবে ও টাইম সক্রিয় হবে।',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: macController,
                autofocus: true,
                style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  labelText: 'ম্যাক অ্যাড্রেস (MAC Address)',
                  hintText: '3C:22:FB:9E:44:A1',
                  hintStyle: const TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.router, color: Color(0xFF3B82F6), size: 20),
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'ব্যবহারের মেয়াদের অনুমতি:',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  _buildDurationChoice('১ দিন', '1_day', selectedDuration, (val) => setDialogState(() => selectedDuration = val)),
                  _buildDurationChoice('৭ দিন', '7_days', selectedDuration, (val) => setDialogState(() => selectedDuration = val)),
                  _buildDurationChoice('১৫ দিন', '15_days', selectedDuration, (val) => setDialogState(() => selectedDuration = val)),
                  _buildDurationChoice('৩০ দিন', '30_days', selectedDuration, (val) => setDialogState(() => selectedDuration = val)),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('বাতিল', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () async {
                final rawMac = macController.text.trim();
                if (rawMac.isEmpty) return;
                Navigator.pop(ctx);
                try {
                  await ApiService.quickAddByMac(mac: rawMac, duration: selectedDuration);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('MAC ($rawMac) সফলভাবে যুক্ত ও টাইম সক্রিয় হয়েছে!'),
                        backgroundColor: const Color(0xFF10B981),
                      ),
                    );
                  }
                  _fetchDevices();
                  _fetchHistory();
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('ত্রুটি: $e'), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              child: const Text('যুক্ত করুন', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDurationChoice(String label, String value, String current, Function(String) onSelect) {
    final isSelected = current == value;
    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : Colors.grey)),
      selected: isSelected,
      selectedColor: const Color(0xFF3B82F6),
      backgroundColor: const Color(0xFF1E293B),
      onSelected: (_) => onSelect(value),
    );
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
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF3B82F6),
          labelColor: Colors.white,
          unselectedLabelColor: Colors.grey,
          tabs: [
            Tab(
              icon: const Icon(Icons.phone_android, size: 18),
              text: 'পরিচালিত ডিভাইস (${_devices.length})',
            ),
            Tab(
              icon: const Icon(Icons.history, size: 18),
              text: 'কানেক্টেড হিস্ট্রি (${_historyItems.length})',
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _fetchDevices();
              _fetchHistory();
            },
            tooltip: 'রিফ্রেশ',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showQuickAddMacDialog,
        backgroundColor: const Color(0xFF3B82F6),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('MAC দিয়ে যুক্ত করুন', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Current Managed Devices
          RefreshIndicator(
            onRefresh: () async {
              await _fetchDevices();
              await _fetchHistory();
            },
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
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.shield, size: 48, color: Color(0xFF3B82F6)),
                          SizedBox(height: 12),
                          Text(
                            'কোনো ডেমো ডিভাইস নেই',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          SizedBox(height: 6),
                          Text(
                            'নিচের "+ MAC দিয়ে যুক্ত করুন" চেপে শুধুমাত্র ম্যাক দিয়ে ডিভাইস যুক্ত করুন।',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
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
                const SliverToBoxAdapter(child: SizedBox(height: 80)),
              ],
            ),
          ),

          // Tab 2: Connection History (Previously Connected Devices)
          RefreshIndicator(
            onRefresh: () async {
              await _fetchHistory();
              await _fetchDevices();
            },
            child: _historyItems.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.history, size: 48, color: Colors.grey),
                        SizedBox(height: 12),
                        Text(
                          'পূর্বে কানেক্ট হওয়া কোনো হিস্ট্রি পাওয়া যায়নি',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        SizedBox(height: 6),
                        Text('রাউটারে ডিভাইস কানেক্ট হলে বা স্ক্যান করলে হিস্ট্রি জমা হবে।', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _historyItems.length,
                    itemBuilder: (context, index) {
                      final item = _historyItems[index];
                      final isManaged = _devices.any((d) => d.mac.toUpperCase() == item.mac.toUpperCase());
                      final liveDevice = isManaged ? _devices.firstWhere((d) => d.mac.toUpperCase() == item.mac.toUpperCase()) : null;

                      return Card(
                        color: const Color(0xFF1E293B),
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF8B5CF6).withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.phone_android, color: Color(0xFFA78BFA), size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.name,
                                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                                        ),
                                        Text(
                                          'IP: ${item.ip}',
                                          style: const TextStyle(fontSize: 12, color: Colors.grey, fontFamily: 'monospace'),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isManaged ? const Color(0xFF10B981).withOpacity(0.2) : Colors.grey.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      isManaged ? 'পরিচালিত' : 'পূর্বে কানেক্টেড',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: isManaged ? const Color(0xFF10B981) : Colors.grey,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0F172A),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  'MAC: ${item.mac}',
                                  style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Color(0xFF38BDF8), fontSize: 13),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'মোট সংযোগ: ${item.connectionCount} বার',
                                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                                  ),
                                  Text(
                                    item.manufacturer,
                                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF8B5CF6),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                  ),
                                  icon: const Icon(Icons.timer, color: Colors.white, size: 18),
                                  label: const Text(
                                    '⏱️ টাইম সেট করুন (Setup Time)',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                  onPressed: () async {
                                    // Either open schedule screen directly or quick add
                                    if (liveDevice != null) {
                                      final updated = await Navigator.push<bool>(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => ScheduleScreen(device: liveDevice),
                                        ),
                                      );
                                      if (updated == true) {
                                        _fetchDevices();
                                        _fetchHistory();
                                      }
                                    } else {
                                      // Promote and schedule
                                      try {
                                        final newDev = await ApiService.quickAddByMac(mac: item.mac, duration: '7_days');
                                        if (mounted) {
                                          final updated = await Navigator.push<bool>(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => ScheduleScreen(device: newDev),
                                            ),
                                          );
                                          _fetchDevices();
                                          _fetchHistory();
                                        }
                                      } catch (e) {
                                        if (mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(content: Text('ত্রুটি: $e'), backgroundColor: Colors.red),
                                          );
                                        }
                                      }
                                    }
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiCard(String label, int value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(16),
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
