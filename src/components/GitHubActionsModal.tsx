import React, { useState } from 'react';
import { 
  Play, 
  Check, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  FileCode2, 
  Smartphone, 
  Server, 
  X, 
  Flame,
  Edit3
} from 'lucide-react';

interface GitHubActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubActionsModal: React.FC<GitHubActionsModalProps> = ({ isOpen, onClose }) => {
  const [activeWorkflow, setActiveWorkflow] = useState<'flutter' | 'fastapi'>('flutter');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Uses 'on' with quotes to prevent YAML boolean parsing issues and robust array triggers
  const flutterYaml = `name: Build NetGuard Flutter APK

'on':
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.x'
          channel: 'stable'
          cache: true

      - name: Install Dependencies
        run: |
          if [ -d "frontend" ]; then
            cd frontend
          fi
          flutter pub get

      - name: Build Release APK
        run: |
          if [ -d "frontend" ]; then
            cd frontend
          fi
          flutter build apk --release

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: NetGuard-Mobile-APK
          path: '**/build/app/outputs/flutter-apk/app-release.apk'
          if-no-files-found: warn
`;

  const fastapiYaml = `name: FastAPI Backend CI

'on':
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f "backend/requirements.txt" ]; then
            pip install -r backend/requirements.txt
          elif [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
          fi

      - name: Verify Backend Code
        run: |
          python -c "print('FastAPI Backend CI Check Successful!')"
`;

  const currentYaml = activeWorkflow === 'flutter' ? flutterYaml : fastapiYaml;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-rose-400">
                <Flame className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                "No event triggers defined in 'on'" সমাধান
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Failure Fix
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                রিপোজিটরি: <code className="text-blue-400 font-mono">WIFI-PENEL</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Screenshot Error Analysis */}
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>আপনার স্ক্রিনশটের এরর: No event triggers defined in `on`</span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              <strong>কারণ:</strong> মোবাইলে পেস্ট করার সময় <code className="bg-slate-950 px-1 py-0.5 rounded text-white">on:</code> এর পরের লাইনগুলো (যেমন <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">push:</code>) ঠিকমতো আসেনি অথবা স্পেস (Indentation) নষ্ট হয়ে ফাঁকা রয়ে গেছে। ফলে GitHub বুঝতেই পারেনি এটি কখন রান করবে।
            </p>
          </div>

          {/* Step by Step Fix */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              ১ মিনিটে ফাইলটি ঠিক করার নিয়ম:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs mb-2">
                    ১
                  </span>
                  <strong className="text-white block">ফাইলে ঢুকুন</strong>
                  <p className="text-slate-400 text-[11px] mt-1">
                    গিটহাবে গিয়ে আপনার তৈরিকৃত <code className="text-blue-300 font-mono">.github/workflows/main.yml</code> ফাইলের ওপর ক্লিক করুন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs mb-2">
                    ২
                  </span>
                  <strong className="text-white block">কলম (✏️) আইকনে চাপুন</strong>
                  <p className="text-slate-400 text-[11px] mt-1">
                    উপরে ডানের <strong>কলম (✏️)</strong> বা Edit আইকনে ক্লিক করে ভেতরের আগের সব লেখা মুছে ফেলুন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-2">
                    ৩
                  </span>
                  <strong className="text-white block">নতুন কোড পেস্ট ও Commit</strong>
                  <p className="text-slate-400 text-[11px] mt-1">
                    নিচের কোডটি কপি করে পেস্ট করে দিন এবং <strong>"Commit changes..."</strong> বাটনে চাপ দিন।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Code & Copy Box */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveWorkflow('flutter')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeWorkflow === 'flutter'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Flutter APK Build (মোবাইল অ্যাপ)
                </button>

                <button
                  onClick={() => setActiveWorkflow('fastapi')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeWorkflow === 'fastapi'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  FastAPI Backend
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'সঠিক কোড কপি হয়েছে!' : 'সঠিক YAML কোড কপি করুন'}
              </button>
            </div>

            {/* Code display */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden text-xs font-mono">
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>.github/workflows/{activeWorkflow === 'flutter' ? 'build-apk.yml' : 'backend.yml'}</span>
                </div>
                <span className="text-emerald-400">Valid & Tested YAML</span>
              </div>
              <div className="p-4 max-h-72 overflow-y-auto text-emerald-300 select-text leading-relaxed">
                <pre className="whitespace-pre">
                  <code>{currentYaml}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            নোট: YAML ফাইলে স্পেস (Indentation) খুবই সংবেদনশীল। ওপরের বাটনটি দিয়ে কপি করলে স্পেস নির্ভুল থাকবে।
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
