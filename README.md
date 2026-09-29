# 🛡️ NetGuard - Router Management & Device Time-Blocking System

একটি সম্পূর্ণ প্রোডাকশন-রেডি মোবাইল অ্যাপ্লিকেশন ও রাউটার ব্যাকএন্ড সিস্টেম, যার মাধ্যমে আপনি আপনার রাউটারের সাথে সংযুক্ত যেকোনো মোবাইল ডিভাইসকে নির্দিষ্ট তারিখ বা সময় পর্যন্ত ইন্টারনেট ব্যবহারের অনুমতি দিতে পারবেন এবং মেয়াদ শেষ হওয়ামাত্র রাউটার স্বয়ংক্রিয়ভাবে তার ইন্টারনেট অ্যাক্সেস ব্লক (Auto-Block) করে দেবে।

---

## 📱 গিটহাব (GitHub) থেকে APK ডাউনলোড ও মোবাইলে ইন্সটলের নিয়ম

আপনি সরাসরি গিটহাব থেকে রেডিমেড **Android APK** ডাউনলোড করে আপনার ফোনে ইনস্টল করতে পারেন:

1. **গিটহাব রিপোজিটরির "Actions" ট্যাবে যান:**
   - আপনার রিপোজিটরির ওপরের মেনু থেকে **`Actions`** ট্যাবে ক্লিক করুন।
2. **সর্বশেষ বিল্ড (Build Workflow) রান সিলেক্ট করুন:**
   - তালিকায় থাকা **`NetGuard Build & CI`** রানের ওপর ক্লিক করুন।
3. **Artifacts থেকে APK ডাউনলোড করুন:**
   - পেজের নিচে **`Artifacts`** সেকশনে **`NetGuard-Release-APK`** নামের ফাইল পাবেন।
   - সেখানে ক্লিক করলেই **`app-release.apk`** ডাউনলোড হয়ে যাবে।
4. **ফোনে ইন্সটল করুন:**
   - ডাউনলোড করা `.apk` ফাইলটিতে ট্যাপ করে আপনার অ্যান্ড্রয়েড ফোনে ইন্সটল করে নিন।

---

## 🚀 সম্পূর্ণ প্রোজেক্ট স্ট্রাকচার (Repository Tree)

```text
├── backend/                     # Python FastAPI Backend Server
│   ├── main.py                  # ব্যাকগ্রাউন্ড ক্রন ও রেস্ট এপিআই
│   ├── models.py                # SQLite ডেটাবেজ মডেল
│   ├── schemas.py               # Pydantic ভ্যালিডেশন স্কিমা
│   ├── database.py              # ডেটাবেজ ইঞ্জিন ও সেশন
│   ├── router_driver.py         # iptables ও OpenWrt ফায়ারওয়াল ড্রাইভার
│   ├── requirements.txt         # পাইথন ডিপেনডেন্সি
│   └── Dockerfile               # ডকার কনটেইনার ফাইল
│
├── lib/ & frontend/lib/         # Flutter Mobile Application Source Code
│   ├── main.dart                # অ্যাপ এন্ট্রি পয়েন্ট ও ডার্ক থিম
│   ├── models/device.dart       # ডিভাইস ও রিমেইনিং টাইম মডেল
│   ├── screens/
│   │   ├── dashboard_screen.dart # কানেক্টেড মোবাইল লিস্ট ও লাইভ স্ট্যাটাস
│   │   └── schedule_screen.dart  # ক্যালেন্ডার ও সময় নির্বাচন (অনুমতি নির্ধারণ)
│   ├── services/api_service.dart # ব্যাকএন্ডের সাথে HTTP API যোগাযোগ
│   └── widgets/device_card.dart  # কাউন্টডাউন ব্যাজ ও কুইক টগল বাটন
│
├── android/                     # Android Native Build & Manifest
├── pubspec.yaml                 # Flutter ডিপেনডেন্সি কনফিগ
└── .github/workflows/main.yml   # অটোমেটিক APK বিল্ড পাইপলাইন
```

---

## 💻 নিজের কম্পিউটারে চালানোর নিয়ম (Local Run Guide)

### ১. ব্যাকএন্ড সার্ভার চালু করুন (FastAPI)
```bash
cd backend
python -m venv venv

# উইন্ডোজে:
venv\Scripts\activate
# ম্যাক বা লিনাক্সে:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- সোয়াগার ডকুমেন্টেশন: `http://localhost:8000/docs`

### ২. মোবাইল অ্যাপ চালু করুন (Flutter)
```bash
# ডিপেনডেন্সি নামিয়ে অ্যাপ রান করুন:
flutter pub get
flutter run
```
- ফিজিক্যাল অ্যান্ড্রয়েড ফোনে টেস্ট করতে `lib/services/api_service.dart` ফাইলে আপনার কম্পিউটারের লোকাল আইপি (যেমন `http://192.168.1.xxx:8000`) দিয়ে দিন।

---

## ⚙️ রাউটারে ফায়ারওয়াল অটো-ব্লক কমান্ড

রাউটারে নির্দিষ্ট ডিভাইসের মেয়াদ শেষ হলে ব্যাকএন্ড স্বয়ংক্রিয়ভাবে নিচের কমান্ড দিয়ে ড্রপ করে:
```bash
# লিনাক্স গেটওয়ে বা রাউটারে ড্রপ:
iptables -I FORWARD -m mac --mac-source <MAC_ADDRESS> -j DROP

# ওপেন-ডব্লিউআরটি (OpenWrt) রাউটারে:
uci add firewall rule
uci set firewall.@rule[-1].src_mac='<MAC_ADDRESS>'
uci set firewall.@rule[-1].target='REJECT'
uci commit firewall
/etc/init.d/firewall reload
```
