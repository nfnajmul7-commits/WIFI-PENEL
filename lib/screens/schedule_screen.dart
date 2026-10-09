import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/device.dart';
import '../services/api_service.dart';

class ScheduleScreen extends StatefulWidget {
  final Device device;

  const ScheduleScreen({super.key, required this.device});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  String? _selectedPreset = '24_hours';
  DateTime? _customDateTime;
  bool _isCustomMode = false;
  bool _isSubmitting = false;

  final List<Map<String, dynamic>> _presets = [
    {'key': '1_hour', 'label': '১ ঘণ্টা (1 Hour)', 'desc': 'পরীক্ষা বা হোমওয়ার্কের সময়সীমা'},
    {'key': '24_hours', 'label': '২৪ ঘণ্টা (1 Day)', 'desc': '১ দিনের দৈনিক ইন্টারনেট পাস'},
    {'key': '7_days', 'label': '৭ দিন (1 Week)', 'desc': '১ সপ্তাহের অনুমোদিত মেয়াদ'},
    {'key': '15_days', 'label': '১৫ দিন (Half Month)', 'desc': 'অর্ধ মাসিক ইন্টারনেট মেয়াদ'},
    {'key': '30_days', 'label': '৩০ দিন (1 Month)', 'desc': '১ মাসের বিলিং চক্র / মাসিক লিমিট'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.device.expiry != null) {
      _customDateTime = widget.device.expiry!.toLocal();
      _isCustomMode = true;
      _selectedPreset = null;
    }
  }

  Future<void> _pickCustomDateTime() async {
    final now = DateTime.now();
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: _customDateTime ?? now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 60)), // Up to 2 months
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF3B82F6),
              surface: Color(0xFF1E293B),
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedDate == null) return;

    if (!mounted) return;
    final pickedTime = await showTimePicker(
      context: context,
      initialTime: _customDateTime != null 
          ? TimeOfDay.fromDateTime(_customDateTime!) 
          : const TimeOfDay(hour: 23, minute: 59),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF3B82F6),
              surface: Color(0xFF1E293B),
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedTime == null) return;

    setState(() {
      _customDateTime = DateTime(
        pickedDate.year,
        pickedDate.month,
        pickedDate.day,
        pickedTime.hour,
        pickedTime.minute,
      );
      _isCustomMode = true;
      _selectedPreset = null;
    });
  }

  Future<void> _submitSchedule() async {
    setState(() => _isSubmitting = true);

    try {
      if (_isCustomMode && _customDateTime != null) {
        final formattedUtc = DateFormat('yyyy-MM-dd HH:mm:ss').format(_customDateTime!.toUtc());
        await ApiService.setSchedule(
          deviceId: widget.device.id,
          customDateTime: formattedUtc,
        );
      } else if (_selectedPreset != null) {
        await ApiService.setSchedule(
          deviceId: widget.device.id,
          presetDuration: _selectedPreset,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('অনুমতির মেয়াদ সক্রিয় হয়েছে! মেয়াদান্তে মোবাইলটি অটো-ব্লক হবে।'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _clearSchedule() async {
    setState(() => _isSubmitting = true);
    try {
      await ApiService.clearSchedule(widget.device.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('মেয়াদের সীমা তুলে দেওয়া হয়েছে (সীমাহীন অনুমতি)।')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('মোবাইল ব্যবহারের মেয়াদ নির্ধারণ'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Device Summary Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.phone_android, color: Color(0xFF3B82F6), size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.device.name,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'IP: ${widget.device.ip}  •  MAC: ${widget.device.mac}',
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Text(
              'কত সময়ের জন্য অনুমতি দিতে চান?',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'নির্ধারিত মেয়াদ শেষ হওয়ামাত্রই রাউটার এর MAC অ্যাড্রেস ফায়ারওয়ালে স্বয়ংক্রিয়ভাবে ব্লক (Auto-Block) করে দেবে।',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),

            // Presets List
            ..._presets.map((preset) {
              final isSelected = !_isCustomMode && _selectedPreset == preset['key'];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10.0),
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _isCustomMode = false;
                      _selectedPreset = preset['key'];
                      _customDateTime = null;
                    });
                  },
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? const Color(0xFF3B82F6).withOpacity(0.12)
                          : const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFF334155),
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
                          color: isSelected ? const Color(0xFF3B82F6) : Colors.grey,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                preset['label'],
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? Colors.white : const Color(0xFFE2E8F0),
                                ),
                              ),
                              Text(
                                preset['desc'],
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),

            const SizedBox(height: 10),
            // Custom Date and Time Picker Card
            InkWell(
              onTap: _pickCustomDateTime,
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _isCustomMode 
                      ? const Color(0xFF8B5CF6).withOpacity(0.12)
                      : const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: _isCustomMode ? const Color(0xFF8B5CF6) : const Color(0xFF334155),
                    width: _isCustomMode ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isCustomMode ? Icons.check_circle : Icons.edit_calendar,
                      color: _isCustomMode ? const Color(0xFF8B5CF6) : Colors.grey,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ক্যালেন্ডার থেকে নির্দিষ্ট শেষ তারিখ ও সময়',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            _customDateTime != null
                                ? 'শেষ তারিখ: ${DateFormat('dd MMM yyyy, hh:mm a').format(_customDateTime!)}'
                                : 'ক্যালেন্ডার থেকে নির্দিষ্ট দিন ও সময় বেছে নিন',
                            style: TextStyle(
                              fontSize: 12,
                              color: _customDateTime != null ? const Color(0xFFA78BFA) : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: Colors.grey),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitSchedule,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: _isSubmitting 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.timer),
                label: Text(
                  _isSubmitting ? 'সংরক্ষণ করা হচ্ছে...' : 'অনুমতি কার্যকর করুন (Activate Limit)',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),

            if (widget.device.expiry != null) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: _isSubmitting ? null : _clearSchedule,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    side: const BorderSide(color: Color(0xFFEF4444)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.delete_outline),
                  label: const Text('মেয়াদ বাতিল করুন (সীমাহীন অনুমতি রাখুন)'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
