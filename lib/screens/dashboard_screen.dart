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
    try {
      final info = await RouterService.testAndConnectRouter();
      if (mounted) setState(() => _routerInfo = info);
    } catch (_) {
      // Fallback
    }

    // Load devices (NO fake devices seeded)
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

  /// Sync real router clients (e.g. from TP-Link Archer C54 as shown in router admin map)
  Future<void> _syncRouterClients() async {
    setState(() => _isLoading = true);
    try {
      final synced = await ApiService.syncClientsFromRouter();
      if (mounted) {
        setState(() {
          _devices = synced;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Text(
                  '${RouterService.selectedBrandConfig.name} থেকে ${synced.length} টি আসল ক্লায়েন্ট সফলভাবে সিঙ্ক হয়েছে!',
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
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('সিঙ্ক ত্রুটি: $e'), backgroundColor: Colors.red),
        );
      }
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
                  'স্ক্যান সম্পন্ন! ${_devices.length} টি আসল ডিভাইস পাওয়া গেছে।',
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

  /// Show Brand-Specific Router Login & Access dialog
  void _showRouterSettingsDialog() {
    String selectedBrandId = RouterService.selectedBrandConfig.id;
    final ipController = TextEditingController(
      text: RouterService.currentRouterDomain.isNotEmpty && RouterService.currentRouterDomain != '192.168.0.1' && RouterService.currentRouterDomain != '192.168.1.1'
          ? RouterService.currentRouterDomain
          : RouterService.currentRouterIp,
    );
    final userController = TextEditingController(text: RouterService.adminUsername);
    final passController = TextEditingController(text: RouterService.adminPassword);

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          final curBrand = RouterService.supportedBrands.firstWhere(
            (b) => b.id == selectedBrandId,
            orElse: () => RouterService.supportedBrands[0],
          );

          return AlertDialog(
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
                        'রাউটার লগইন ও কানেকশন হাব',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      Text(
                        'কোম্পানি ভিত্তিক রাউটার লগইন সিস্টেম',
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
                  // Router Brand Selector
                  const Text(
                    'রাউটার কোম্পানি / ব্র্যান্ড নির্বাচন করুন:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.4)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedBrandId,
                        dropdownColor: const Color(0xFF1E293B),
                        isExpanded: true,
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                        icon: const Icon(Icons.keyboard_arrow_down, color: Color(0xFF38BDF8)),
                        items: RouterService.supportedBrands.map((b) {
                          return DropdownMenuItem(
                            value: b.id,
                            child: Row(
                              children: [
                                Icon(
                                  b.id == 'tplink'
                                      ? Icons.wifi
                                      : b.id == 'tenda'
                                          ? Icons.settings_input_antenna
                                          : Icons.router,
                                  size: 16,
                                  color: b.id == 'tplink' ? const Color(0xFF38BDF8) : Colors.orangeAccent,
                                ),
                                const SizedBox(width: 8),
                                Expanded(child: Text(b.name, overflow: TextOverflow.ellipsis)),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (newBrandId) {
                          if (newBrandId != null) {
                            setDialogState(() {
                              selectedBrandId = newBrandId;
                              final cfg = RouterService.supportedBrands.firstWhere((b) => b.id == newBrandId);
                              ipController.text = cfg.defaultDomain.isNotEmpty ? cfg.defaultDomain : cfg.defaultIp;
                              userController.text = cfg.defaultUsername;
                            });
                          }
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),
                  // Brand Tip
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, size: 14, color: Color(0xFF38BDF8)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            curBrand.tip,
                            style: const TextStyle(fontSize: 10, color: Color(0xFF93C5FD)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),
                  const Text(
                    'রাউটার অ্যাড্রেস / গেটওয়ে আইপি:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: ipController,
                    style: const TextStyle(color: Colors.white, fontFamily: 'monospace'),
                    decoration: InputDecoration(
                      hintText: curBrand.defaultDomain,
                      filled: true,
                      fillColor: const Color(0xFF1E293B),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      prefixIcon: const Icon(Icons.link, color: Color(0xFF3B82F6), size: 20),
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Quick IP chips
                  Wrap(
                    spacing: 6,
                    children: [
                      curBrand.defaultDomain,
                      curBrand.defaultIp,
                      '192.168.0.1',
                      '192.168.1.1'
                    ].toSet().map((val) {
                      final isSel = ipController.text == val;
                      return ActionChip(
                        label: Text(val, style: TextStyle(fontSize: 10, color: isSel ? Colors.white : Colors.grey)),
                        backgroundColor: isSel ? const Color(0xFF3B82F6) : const Color(0xFF1E293B),
                        onPressed: () {
                          setDialogState(() => ipController.text = val);
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 14),
                  if (curBrand.requiresUsername) ...[
                    const Text(
                      'রাউটার অ্যাডমিন ইউজারনেম:',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: userController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: curBrand.defaultUsername,
                        filled: true,
                        fillColor: const Color(0xFF1E293B),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        prefixIcon: const Icon(Icons.person, color: Colors.grey, size: 20),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  Text(
                    curBrand.requiresUsername ? 'রাউটার পাসওয়ার্ড:' : 'রাউটার অ্যাডমিন পাসওয়ার্ড (Administrator Password):',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: passController,
                    obscureText: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: curBrand.id == 'tplink' ? 'আপনার TP-Link অ্যাডমিন পাসওয়ার্ড' : 'রাউটার পাসওয়ার্ড',
                      filled: true,
                      fillColor: const Color(0xFF1E293B),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      prefixIcon: const Icon(Icons.lock, color: Color(0xFFF59E0B), size: 20),
                    ),
                  ),

                  const SizedBox(height: 14),
                  // Direct Router Admin Button
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF38BDF8),
                      side: const BorderSide(color: Color(0xFF38BDF8)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      minimumSize: const Size(double.infinity, 38),
                    ),
                    onPressed: () {
                      final url = 'http://${ipController.text.trim()}';
                      Clipboard.setData(ClipboardData(text: url));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('রাউটার অ্যাডমিন লিংক কপি করা হয়েছে: $url'),
                          backgroundColor: const Color(0xFF10B981),
                        ),
                      );
                    },
                    icon: const Icon(Icons.copy, size: 14),
                    label: Text('রাউটার অ্যাডমিন URL কপি করুন (http://${ipController.text})', style: const TextStyle(fontSize: 11)),
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
                  backgroundColor: const Color(0xFF10B981),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () async {
                  final target = ipController.text.trim();
                  final pass = passController.text.trim();
                  Navigator.pop(ctx);
                  setState(() => _isLoading = true);

                  try {
                    final info = await RouterService.loginToRouter(
                      brandId: selectedBrandId,
                      targetIpOrDomain: target.isNotEmpty ? target : curBrand.defaultIp,
                      username: userController.text.trim(),
                      password: pass,
                    );

                    if (mounted) {
                      setState(() {
                        _routerInfo = info;
                        _isLoading = false;
                      });
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${info.brand} এ সফলভাবে লগইন হয়েছে! এখন রাউটার থেকে ক্লায়েন্ট সিঙ্ক হচ্ছে...'),
                          backgroundColor: const Color(0xFF10B981),
                        ),
                      );
                      // Auto-sync clients from the router
                      _syncRouterClients();
                    }
                  } catch (e) {
                    if (mounted) {
                      setState(() => _isLoading = false);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('লগইন ত্রুটি: $e'), backgroundColor: Colors.red),
                      );
                    }
                  }
                },
                icon: const Icon(Icons.login, size: 16, color: Colors.white),
                label: const Text('লগইন ও সিঙ্ক করুন', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showQuickAddMacDialog() {
    final macController = TextEditingController();
    final nameController = TextEditingController();
    String selectedDuration = '7_days';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          title: const Row(
            children: [
              Icon(Icons.add_circle, color: Color(0xFF3B82F6), size: 22),
              SizedBox(width: 8),
              Text('আসল ডিভাইস যোগ করুন', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'রাউটারের ক্লায়েন্ট তালিকা থেকে ম্যাক অ্যাড্রেস লিখুন। কোনো ফেক ডাটা তৈরি হবে না।',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: macController,
                autofocus: true,
                style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  labelText: 'ম্যাক অ্যাড্রেস (MAC Address)',
                  hintText: '4E:51:7A:B3:26:BC',
                  hintStyle: const TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.router, color: Color(0xFF3B82F6), size: 20),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'ডিভাইসের নাম (ঐচ্ছিক)',
                  hintText: 'যেমন: NT, TENDA F6, CCTV',
                  hintStyle: const TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.label, color: Colors.grey, size: 20),
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
                final devName = nameController.text.trim();
                if (rawMac.isEmpty) return;
                Navigator.pop(ctx);
                try {
                  await ApiService.quickAddByMac(
                    mac: rawMac,
                    name: devName.isNotEmpty ? devName : null,
                    duration: selectedDuration,
                  );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('ডিভাইস ($rawMac) সফলভাবে যুক্ত ও টাইম সক্রিয় হয়েছে!'),
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

  void _showPasteClientsDialog() {
    final textController = TextEditingController();
    List<Map<String, String>> parsed = [];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          title: const Row(
            children: [
              Icon(Icons.paste_rounded, color: Color(0xFF10B981), size: 22),
              SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('রাউটার ক্লায়েন্ট টেবিল পেস্ট', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                    Text('সবচেয়ে নির্ভুল ও সঠিক পদ্ধতি (100% Genuine)', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
              ),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
                    ),
                    child: const Text(
                      'আপনার রাউটারের (যেমন TP-Link Archer C54 / Tenda / ইত্যাদি) এডমিন পেজে গিয়ে Network Map > Clients অথবা DHCP Client List সম্পূর্ণ কপি করে নিচে পেস্ট করুন। অ্যাপটি স্বয়ংক্রিয়ভাবে আসল ডিভাইসগুলোর নাম, আইপি ও ম্যাক এক্সট্রাক্ট করবে।',
                      style: TextStyle(fontSize: 11, color: Color(0xFF93C5FD), height: 1.3),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text('দ্রুত পরীক্ষা করতে ডেমো নমুনা নির্বাচন করুন:', style: TextStyle(fontSize: 11, color: Colors.white70, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.wifi, size: 14, color: Color(0xFF38BDF8)),
                        label: const Text('TP-Link Archer C54', style: TextStyle(fontSize: 10, color: Colors.white)),
                        backgroundColor: const Color(0xFF1E293B),
                        onPressed: () {
                          setDialogState(() {
                            textController.text = NetworkScannerService.sampleTpLinkArcher;
                            parsed = NetworkScannerService.parseRawRouterText(textController.text);
                          });
                        },
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.router, size: 14, color: Colors.orangeAccent),
                        label: const Text('Tenda F3/F6', style: TextStyle(fontSize: 10, color: Colors.white)),
                        backgroundColor: const Color(0xFF1E293B),
                        onPressed: () {
                          setDialogState(() {
                            textController.text = NetworkScannerService.sampleTenda;
                            parsed = NetworkScannerService.parseRawRouterText(textController.text);
                          });
                        },
                      ),
                      ActionChip(
                        avatar: const Icon(Icons.smartphone, size: 14, color: Colors.redAccent),
                        label: const Text('Xiaomi Mi', style: TextStyle(fontSize: 10, color: Colors.white)),
                        backgroundColor: const Color(0xFF1E293B),
                        onPressed: () {
                          setDialogState(() {
                            textController.text = NetworkScannerService.sampleXiaomi;
                            parsed = NetworkScannerService.parseRawRouterText(textController.text);
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: textController,
                    maxLines: 5,
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'monospace'),
                    decoration: InputDecoration(
                      hintText: 'এখানে রাউটারের DHCP টেবিল টেক্সট পেস্ট করুন...',
                      hintStyle: const TextStyle(color: Colors.grey, fontSize: 11),
                      filled: true,
                      fillColor: const Color(0xFF1E293B),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (val) {
                      setDialogState(() {
                        parsed = NetworkScannerService.parseRawRouterText(val);
                      });
                    },
                  ),
                  if (parsed.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'সফলভাবে সনাক্ত হয়েছে: ${parsed.length} টি আসল ডিভাইস',
                          style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      constraints: const BoxConstraints(maxHeight: 140),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF334155)),
                      ),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: parsed.length,
                        separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFF1E293B)),
                        itemBuilder: (c, idx) {
                          final item = parsed[idx];
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 10,
                                  backgroundColor: const Color(0xFF10B981).withOpacity(0.2),
                                  child: Text('${idx + 1}', style: const TextStyle(fontSize: 9, color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item['name'] ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white), overflow: TextOverflow.ellipsis),
                                      Text('${item['ip']} • ${item['mac']}', style: const TextStyle(fontSize: 9, color: Colors.grey, fontFamily: 'monospace')),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('বাতিল', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () async {
                final list = NetworkScannerService.parseRawRouterText(textController.text);
                if (list.isEmpty) return;
                Navigator.pop(ctx);
                setState(() => _isLoading = true);
                try {
                  final synced = await NetworkScannerService.syncClientsFromRouter(customClients: list);
                  if (mounted) {
                    setState(() {
                      _devices = synced;
                      _isLoading = false;
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Row(
                          children: [
                            const Icon(Icons.check_circle, color: Colors.white, size: 20),
                            const SizedBox(width: 8),
                            Text('${synced.length} টি আসল ডিভাইস সফলভাবে আমদানি ও ম্যানেজ করা হয়েছে!'),
                          ],
                        ),
                        backgroundColor: const Color(0xFF10B981),
                      ),
                    );
                  }
                  _fetchHistory(silent: true);
                } catch (e) {
                  if (mounted) setState(() => _isLoading = false);
                }
              },
              icon: const Icon(Icons.check, size: 16, color: Colors.white),
              label: Text('এই ${parsed.isNotEmpty ? "${parsed.length}টি " : ""}আমদানি করুন', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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

    final filteredDevices = _devices.where((d) {
      if (_filter == 'active') return d.isActive;
      if (_filter == 'blocked') return d.isBlocked;
      return true;
    }).toList();

    final routerBrand = RouterService.selectedBrandConfig.name.split("(").first.trim();
    final routerIp = RouterService.currentRouterIp;
    final isLoggedIn = RouterService.isLoggedIn;

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
                    color: (isLoggedIn ? const Color(0xFF10B981) : const Color(0xFF3B82F6)).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.router, color: isLoggedIn ? const Color(0xFF10B981) : const Color(0xFF3B82F6), size: 22),
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
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_drop_down, color: Colors.grey, size: 18),
                        ],
                      ),
                      Row(
                        children: [
                          Container(
                            width: 7,
                            height: 7,
                            decoration: BoxDecoration(
                              color: isLoggedIn ? const Color(0xFF10B981) : Colors.orangeAccent,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            isLoggedIn ? 'লগইন সম্পন্ন • গেটওয়ে: $routerIp (${_devices.length} টি আসল)' : 'গেটওয়ে: $routerIp • লগইন করুন',
                            style: TextStyle(fontSize: 10, color: isLoggedIn ? const Color(0xFF10B981) : Colors.orangeAccent),
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
            icon: const Icon(Icons.paste_rounded, color: Color(0xFF10B981)),
            tooltip: 'রাউটার DHCP টেবিল পেস্ট বা ইমপোর্ট (সবচেয়ে সঠিক)',
            onPressed: _showPasteClientsDialog,
          ),
          IconButton(
            icon: const Icon(Icons.sync, color: Color(0xFF38BDF8)),
            tooltip: 'রাউটার থেকে ক্লায়েন্ট সিঙ্ক করুন',
            onPressed: _syncRouterClients,
          ),
          IconButton(
            icon: _isScanningSubnet 
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.radar),
            tooltip: 'রাউটার নেটওয়ার্ক স্ক্যান করুন',
            onPressed: _isScanningSubnet ? null : _runNetworkScan,
          ),
          IconButton(
            icon: const Icon(Icons.login),
            tooltip: 'রাউটার লগইন সিস্টেম',
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
                                'রাউটারের আসল ডিভাইস স্ক্যান হচ্ছে...',
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

                // Router Access Strip & Sync Header
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
                            Icon(isLoggedIn ? Icons.verified_user : Icons.security, color: isLoggedIn ? const Color(0xFF10B981) : Colors.orangeAccent, size: 18),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  RouterService.selectedBrandConfig.name.split("(").first.trim(),
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                                Text(
                                  'IP: $routerIp • ${isLoggedIn ? "লগইন সক্রিয়" : "লগইন প্রয়োজন"}',
                                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Wrap(
                          spacing: 6,
                          children: [
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: _showPasteClientsDialog,
                              icon: const Icon(Icons.paste, size: 12, color: Colors.white),
                              label: const Text('টেবিল পেস্ট', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold)),
                            ),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF3B82F6),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: _syncRouterClients,
                              icon: const Icon(Icons.sync, size: 12, color: Colors.white),
                              label: const Text('সিঙ্ক', style: TextStyle(fontSize: 11, color: Colors.white)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // Filter Buttons
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                    child: Row(
                      children: [
                        _buildFilterChip('সকল আসল (${_devices.length})', 'all'),
                        const SizedBox(width: 8),
                        _buildFilterChip('সক্রিয় ($activeCount)', 'active'),
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
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                              ),
                              child: const Icon(Icons.router, size: 48, color: Color(0xFF10B981)),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'রাউটারের সঠিক ডিভাইস দেখতে নিচের অপশন ব্যবহার করুন',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'আপনার রাউটারের (${RouterService.selectedBrandConfig.name.split("(").first.trim()}) এডমিন পেজ থেকে DHCP টেবিল কপি করে পেস্ট করুন অথবা অটো-সিঙ্ক চাপুন।',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 20),
                            Column(
                              children: [
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF10B981),
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    onPressed: _showPasteClientsDialog,
                                    icon: const Icon(Icons.paste, color: Colors.white, size: 18),
                                    label: const Text('১. রাউটারের DHCP টেবিল পেস্ট করুন (সবচেয়ে সঠিক)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF3B82F6),
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                        ),
                                        onPressed: _syncRouterClients,
                                        icon: const Icon(Icons.sync, color: Colors.white, size: 16),
                                        label: const Text('২. অটো-সিঙ্ক', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: const Color(0xFF38BDF8),
                                          side: const BorderSide(color: Color(0xFF38BDF8)),
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                        ),
                                        onPressed: _runNetworkScan,
                                        icon: const Icon(Icons.radar, size: 16),
                                        label: const Text('৩. ডিপ স্ক্যান', style: TextStyle(fontSize: 12)),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
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

          // Tab 2: Connection History
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
                        Text('রাউটারে আসল ডিভাইস সংযুক্ত হলে হিস্ট্রি জমা হবে।', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _historyItems.length,
                    itemBuilder: (context, index) {
                      final item = _historyItems[index];
                      final isManaged = _devices.any((d) => d.mac.toUpperCase() == item.mac.toUpperCase());

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        color: const Color(0xFF1E293B),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
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
                                        'IP: ${item.ip} • MAC: ${item.mac}',
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
                                  isManaged ? 'সংযুক্ত' : 'ডিসকানেক্টেড',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isManaged ? const Color(0xFF10B981) : Colors.grey,
                                  ),
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

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : Colors.grey)),
      selected: isSelected,
      selectedColor: const Color(0xFF3B82F6),
      backgroundColor: const Color(0xFF1E293B),
      onSelected: (_) => setState(() => _filter = value),
    );
  }
}
