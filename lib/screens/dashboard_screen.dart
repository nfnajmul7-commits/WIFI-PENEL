import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/device.dart';
import '../services/api_service.dart';
import '../services/router_service.dart';
import '../services/network_scanner_service.dart';
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

  // Router Connection & Scanner State
  bool _isConnectingRouter = false;
  bool _isScanningSubnet = false;
  double _scanProgress = 0.0;
  String _scanStatusText = '';
  RouterInfo? _routerInfo;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });

    _initializeRouterAndDevices();

    // Auto refresh every 5 seconds to update timers and detect state
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted && !_isScanningSubnet) {
        _fetchDevices(silent: true);
        if (_tabController.index == 1) _fetchHistory(silent: true);
      }
    });

    // Listen to automatic device expiry notifications
    NetworkScannerService.addExpiryListener(_handleDeviceExpiredNotice);
  }

  void _handleDeviceExpiredNotice(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.timer_off, color: Colors.amber, size: 20),
              const SizedBox(width: 8),
              Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.bold))),
            ],
          ),
          backgroundColor: const Color(0xFFEF4444),
          duration: const Duration(seconds: 4),
        ),
      );
      _fetchDevices(silent: true);
    }
  }

  @override
  void dispose() {
    NetworkScannerService.removeExpiryListener(_handleDeviceExpiredNotice);
    _tabController.dispose();
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _initializeRouterAndDevices() async {
    setState(() => _isLoading = true);
    // 1. Connect and verify router gateway
    try {
      final info = await RouterService.testAndConnectRouter();
      if (mounted) setState(() => _routerInfo = info);
    } catch (_) {
      // Fallback
    }

    // 2. Load devices
    await _fetchDevices();
    await _fetchHistory();
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
    } catch (_) {
      // ignore
    }
  }

  /// Run deep genuine subnet scan for all active devices
  Future<void> _runNetworkScan() async {
    setState(() {
      _isScanningSubnet = true;
      _scanProgress = 0.05;
      _scanStatusText = 'রাউটারের সাথে সংযোগ তৈরি হচ্ছে...';
    });

    try {
      final scanned = await NetworkScannerService.scanSubnetForRealDevices(
        onProgress: (prog, text) {
          if (mounted) {
            setState(() {
              _scanProgress = prog;
              _scanStatusText = text;
            });
          }
        },
      );

      if (mounted) {
        setState(() {
          _devices = scanned;
          _isScanningSubnet = false;
          _errorMessage = null;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Text(
                  'স্ক্যান সম্পন্ন! ${_devices.length} টি জেনুইন ডিভাইস পাওয়া গেছে।',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      }
      _fetchHistory(silent: true);
    } catch (e) {
      if (mounted) {
        setState(() => _isScanningSubnet = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('স্ক্যান ত্রুটি: $e'), backgroundColor: Colors.red),
        );
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
              content: Text('${device.name} রাউটারে ব্লক করা হয়েছে (MAC: ${device.mac})'),
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

  /// Show Router Connection & Gateway Settings dialog
  void _showRouterSettingsDialog() {
    final ipController = TextEditingController(text: RouterService.currentRouterIp);
    final userController = TextEditingController(text: RouterService.adminUsername);
    final passController = TextEditingController(text: RouterService.adminPassword);

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.router, color: Color(0xFF3B82F6), size: 24),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'রাউটার সংযোগ ও এক্সেস',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    Text(
                      'Router Gateway & Admin Access',
                      style: TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Router Status Badge
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: RouterService.isConnected ? const Color(0xFF10B981) : Colors.orange,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        RouterService.isConnected ? Icons.check_circle : Icons.warning_amber,
                        color: RouterService.isConnected ? const Color(0xFF10B981) : Colors.orange,
                        size: 24,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              RouterService.isConnected ? 'রাউটার সক্রিয় ও সংযুক্ত' : 'রাউটার সংযোগ চেক করুন',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                            ),
                            Text(
                              'ব্র্যান্ড: ${RouterService.detectedBrand} • ল্যাটেন্সি: ${RouterService.lastLatencyMs}ms',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                            Text(
                              'গেটওয়ে IP: ${RouterService.currentRouterIp} • আপনার ফোন: ${RouterService.currentLocalIp}',
                              style: const TextStyle(fontSize: 10, color: Color(0xFF38BDF8), fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),
                const Text(
                  'রাউটার গেটওয়ে আইপি (Gateway IP):',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: ipController,
                  style: const TextStyle(color: Colors.white, fontFamily: 'monospace'),
                  decoration: InputDecoration(
                    hintText: '192.168.1.1',
                    filled: true,
                    fillColor: const Color(0xFF1E293B),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.settings_ethernet, color: Color(0xFF3B82F6), size: 20),
                  ),
                ),
                const SizedBox(height: 8),

                // Common Presets
                Wrap(
                  spacing: 6,
                  children: ['192.168.1.1', '192.168.0.1', '192.168.31.1', '10.0.0.1'].map((ip) {
                    final isSel = ipController.text == ip;
                    return ActionChip(
                      label: Text(ip, style: TextStyle(fontSize: 10, color: isSel ? Colors.white : Colors.grey)),
                      backgroundColor: isSel ? const Color(0xFF3B82F6) : const Color(0xFF1E293B),
                      onPressed: () {
                        setDialogState(() => ipController.text = ip);
                      },
                    );
                  }).toList(),
                ),

                const SizedBox(height: 14),
                const Text(
                  'রাউটার অ্যাডমিন লগইন (ঐচ্ছিক):',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: userController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'ইউজারনেম (Username)',
                    hintText: 'admin',
                    filled: true,
                    fillColor: const Color(0xFF1E293B),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.person, color: Colors.grey, size: 20),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: passController,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'পাসওয়ার্ড (Password)',
                    hintText: 'admin বা আপনার পাসওয়ার্ড',
                    filled: true,
                    fillColor: const Color(0xFF1E293B),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.lock, color: Colors.grey, size: 20),
                  ),
                ),

                const SizedBox(height: 16),
                // Admin Console Guide Button
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B).withOpacity(0.6),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.vpn_key, color: Color(0xFFF59E0B), size: 16),
                          SizedBox(width: 6),
                          Text(
                            'রাউটারের সম্পূর্ণ কন্ট্রোল প্যানেল:',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'ব্রাউজারে http://${ipController.text} খুলে DHCP ক্লায়েন্ট তালিকা, ওয়াইফাই পাসওয়ার্ড ও ম্যাক ফিল্টারিং সরাসরি নিয়ন্ত্রণ করা যাবে।',
                        style: const TextStyle(fontSize: 10, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF38BDF8),
                          side: const BorderSide(color: Color(0xFF38BDF8)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: 'http://${ipController.text}'));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('রাউটার গেটওয়ে লিংক কপি করা হয়েছে: http://${ipController.text}'),
                              backgroundColor: const Color(0xFF10B981),
                            ),
                          );
                        },
                        icon: const Icon(Icons.copy, size: 14),
                        label: const Text('গেটওয়ে লিংক কপি করুন', style: TextStyle(fontSize: 11)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('বাতিল', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () async {
                final target = ipController.text.trim();
                Navigator.pop(ctx);
                setState(() => _isLoading = true);
                try {
                  final info = await RouterService.testAndConnectRouter(
                    targetIp: target,
                    username: userController.text.trim(),
                    password: passController.text.trim(),
                  );
                  if (mounted) {
                    setState(() {
                      _routerInfo = info;
                      _isLoading = false;
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('রাউটার ${info.ip} এর সাথে সফলভাবে কানেক্ট হয়েছে (${info.brand})'),
                        backgroundColor: const Color(0xFF10B981),
                      ),
                    );
                    _runNetworkScan();
                  }
                } catch (e) {
                  if (mounted) {
                    setState(() => _isLoading = false);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('সংযোগ ত্রুটি: $e'), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              icon: const Icon(Icons.link, size: 16, color: Colors.white),
              label: const Text('কানেক্ট করুন', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
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

    final routerBrand = _routerInfo?.brand ?? RouterService.detectedBrand;
    final routerIp = _routerInfo?.ip ?? RouterService.currentRouterIp;

    return Scaffold(
      appBar: AppBar(
        title: InkWell(
          onTap: _showRouterSettingsDialog,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 2.0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.router, color: Color(0xFF3B82F6), size: 22),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              'NetGuard • $routerBrand',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_drop_down, color: Colors.grey, size: 18),
                        ],
                      ),
                      Row(
                        children: [
                          Container(
                            width: 7,
                            height: 7,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            'গেটওয়ে: $routerIp • সংযুক্ত (${_devices.length} টি আসল ডিভাইস)',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF10B981)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF3B82F6),
          labelColor: Colors.white,
          unselectedLabelColor: Colors.grey,
          tabs: [
            Tab(
              icon: const Icon(Icons.phone_android, size: 18),
              text: 'সক্রিয় ডিভাইস (${_devices.length})',
            ),
            Tab(
              icon: const Icon(Icons.history, size: 18),
              text: 'হিস্ট্রি (${_historyItems.length})',
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: _isScanningSubnet 
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.radar),
            tooltip: 'রাউটার নেটওয়ার্ক স্ক্যান করুন',
            onPressed: _isScanningSubnet ? null : _runNetworkScan,
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'রাউটার গেটওয়ে সেটিংস',
            onPressed: _showRouterSettingsDialog,
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
          // Tab 1: Current Managed Real Devices
          RefreshIndicator(
            onRefresh: () async {
              await _fetchDevices();
              await _fetchHistory();
            },
            child: CustomScrollView(
              slivers: [
                // Scan in progress banner
                if (_isScanningSubnet)
                  SliverToBoxAdapter(
                    child: Container(
                      margin: const EdgeInsets.all(16),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF3B82F6)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF38BDF8)),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'রাউটারের সাথে সংযুক্ত আসল ডিভাইস স্ক্যান হচ্ছে...',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          LinearProgressIndicator(
                            value: _scanProgress,
                            backgroundColor: const Color(0xFF0F172A),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          const SizedBox(height: 6),
                          Text(_scanStatusText, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                        ],
                      ),
                    ),
                  ),

                // Router Access Quick Strip
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.security, color: Color(0xFF10B981), size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'রাউটার সংযোগ: $routerIp',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ],
                        ),
                        InkWell(
                          onTap: _runNetworkScan,
                          child: const Row(
                            children: [
                              Icon(Icons.refresh, color: Color(0xFF38BDF8), size: 16),
                              SizedBox(width: 4),
                              Text(
                                'নতুন স্ক্যান',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        _buildKpiCard('সক্রিয় ডিভাইস', activeCount, const Color(0xFF10B981), Icons.wifi),
                        const SizedBox(width: 12),
                        _buildKpiCard('ব্লকড ডিভাইস', blockedCount, const Color(0xFFEF4444), Icons.block),
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

                if (_isLoading && _devices.isEmpty)
                  const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (filteredDevices.isEmpty)
                  SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.shield, size: 48, color: Color(0xFF3B82F6)),
                          const SizedBox(height: 12),
                          const Text(
                            'কোনো ডিভাইস পাওয়া যায়নি',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'রাউটারের সকল ডিভাইস খুঁজে পেতে "স্ক্যান করুন" বাটন চাপুন।',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6)),
                            onPressed: _runNetworkScan,
                            icon: const Icon(Icons.radar, color: Colors.white),
                            label: const Text('রাউটার স্ক্যান করুন', style: TextStyle(color: Colors.white)),
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

          // Tab 2: Connection History (Previously & Currently Connected Devices)
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
                      Device? liveDevice;
                      try {
                        liveDevice = _devices.firstWhere((d) => d.mac.toUpperCase() == item.mac.toUpperCase());
                      } catch (_) {
                        liveDevice = null;
                      }

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        color: const Color(0xFF1E293B),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF3B82F6).withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Icon(Icons.devices, color: Color(0xFF3B82F6), size: 20),
                                      ),
                                      const SizedBox(width: 10),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.name,
                                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                                          ),
                                          Text(
                                            item.ip,
                                            style: const TextStyle(color: Colors.grey, fontSize: 11, fontFamily: 'monospace'),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isManaged ? const Color(0xFF10B981).withOpacity(0.2) : Colors.grey.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      isManaged ? 'পরিচালিত (Managed)' : 'অ-পরিচালিত',
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
                                    if (liveDevice != null) {
                                      final updated = await Navigator.push<bool>(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => ScheduleScreen(device: liveDevice!),
                                        ),
                                      );
                                      if (updated == true) {
                                        _fetchDevices();
                                        _fetchHistory();
                                      }
                                    } else {
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
                Expanded(child: Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey), overflow: TextOverflow.ellipsis)),
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
