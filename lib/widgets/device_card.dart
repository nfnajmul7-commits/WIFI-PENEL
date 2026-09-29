import 'package:flutter/material.dart';
import '../models/device.dart';

class DeviceCard extends StatelessWidget {
  final Device device;
  final VoidCallback onToggleBlock;
  final VoidCallback onOpenSchedule;

  const DeviceCard({
    super.key,
    required this.device,
    required this.onToggleBlock,
    required this.onOpenSchedule,
  });

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'mobile': return Icons.phone_android;
      case 'laptop': return Icons.laptop_mac;
      case 'tablet': return Icons.tablet_mac;
      case 'tv': return Icons.tv;
      case 'gaming': return Icons.sports_esports;
      default: return Icons.devices;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isBlocked = device.isBlocked;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isBlocked ? const Color(0xFFEF4444).withOpacity(0.5) : const Color(0xFF334155),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isBlocked
                        ? const Color(0xFFEF4444).withOpacity(0.15)
                        : const Color(0xFF3B82F6).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getCategoryIcon(device.category),
                    color: isBlocked ? const Color(0xFFEF4444) : const Color(0xFF3B82F6),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Text(
                              device.name,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isBlocked 
                                  ? const Color(0xFFEF4444).withOpacity(0.2)
                                  : const Color(0xFF10B981).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isBlocked ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: isBlocked ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  isBlocked ? 'ব্লকড' : 'অনুমতি সক্রিয়',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isBlocked ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'IP: ${device.ip}',
                        style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                      ),
                      Text(
                        'MAC: ${device.mac}  (${device.manufacturer})',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            if (device.hasExpiry) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.hourglass_top, size: 16, color: Color(0xFFF59E0B)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'শেষ তারিখ: ${device.formattedExpiry}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFFE2E8F0)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      device.remainingTimeFormatted,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 14),
            const Divider(color: Color(0xFF334155), height: 1),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onOpenSchedule,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF38BDF8),
                      side: const BorderSide(color: Color(0xFF0284C7)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    icon: const Icon(Icons.calendar_month, size: 16),
                    label: Text(
                      device.hasExpiry ? 'মেয়াদ পরিবর্তন' : 'অনুমতি দিন',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onToggleBlock,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isBlocked ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    icon: Icon(isBlocked ? Icons.lock_open : Icons.block, size: 16),
                    label: Text(
                      isBlocked ? 'আনব্লক' : 'এখনই ব্লক',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
