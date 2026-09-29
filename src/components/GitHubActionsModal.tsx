import React, { useState } from 'react';
import { 
  Play, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  FileCode2, 
  Smartphone, 
  Server, 
  X, 
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface GitHubActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubActionsModal: React.FC<GitHubActionsModalProps> = ({ isOpen, onClose }) => {
  const [activeWorkflow, setActiveWorkflow] = useState<'flutter' | 'fastapi'>('flutter');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const flutterYaml = `name: Build NetGuard Flutter APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch: # Allows manual trigger from Actions tab

jobs:
  build-apk:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Java JDK
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

      - name: Verify Flutter Installation
        run: flutter doctor -v

      - name: Install Dependencies
        run: |
          cd frontend || cd .
          flutter pub get

      - name: Build Release APK
        run: |
          cd frontend || cd .
          flutter build apk --release

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: NetGuard-Release-APK
          path: build/app/outputs/flutter-apk/app-release.apk
`;

  const fastapiYaml = `name: FastAPI Backend CI & Test

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  test-and-lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install Dependencies
        run: |
          cd backend || cd .
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      - name: Test FastAPI Syntax & Import
        run: |
          cd backend || cd .
          python -c "import main; print('FastAPI loaded successfully!')"
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-purple-400">
                <Play className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                GitHub Actions একটিভেশন সমাধান
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Step-by-Step
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                আপনার রিপোজিটরি: <code className="text-blue-400 font-mono">WIFI-PENEL</code>
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
          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <strong className="text-white block mb-1">স্ক্রিনশটে Actions কেন এক্টিভ হচ্ছে না?</strong>
              আপনার রিপোজিটরির <strong>Actions</strong> ট্যাবে <span className="text-amber-300 font-mono">"Get started with GitHub Actions"</span> দেখাচ্ছে কারণ রিপোজিটরির ভেতর এখনো কোনো <code className="text-white bg-slate-900 px-1.5 py-0.5 rounded">.github/workflows/*.yml</code> ফাইল তৈরি করা হয়নি। একটি ওয়ার্কফ্লো ফাইল সেভ করলেই Actions স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে যাবে!
            </div>
          </div>

          {/* 4 Easy Steps */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              যেভাবে ১ মিনিটে একটিভ করবেন (৪টি সহজ ধাপ):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ১
                </span>
                <div>
                  <strong className="text-white block">লিংকে ক্লিক করুন</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    আপনার স্ক্রিনে নীল রঙের <strong className="text-blue-400">"Set up a workflow yourself →"</strong> বাটনে ক্লিক করুন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ২
                </span>
                <div>
                  <strong className="text-white block">ফাইলের নাম দিন</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    উপরে বক্সটিতে নাম দিন: <code className="text-emerald-400 font-mono">.github/workflows/main.yml</code>
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ৩
                </span>
                <div>
                  <strong className="text-white block">কোড পেস্ট করুন</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    নিচে দেওয়া প্রস্তুতকৃত YAML কোডটি কপি করে এডিটরে পেস্ট করুন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ৪
                </span>
                <div>
                  <strong className="text-white block">Commit Changes চাপুন</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    উপরে ডানে থাকা সবুজ <strong className="text-emerald-400">"Commit changes..."</strong> বাটনে চাপ দিন। ব্যস! Actions চালু হয়ে যাবে।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Selector & Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
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
                  Flutter APK Build Workflow (মোবাইল অ্যাপ)
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
                  FastAPI Backend Workflow
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'কপি হয়েছে!' : 'Copy YAML Code'}
              </button>
            </div>

            {/* YAML Preview Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden text-xs font-mono">
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>.github/workflows/{activeWorkflow === 'flutter' ? 'flutter-apk.yml' : 'fastapi.yml'}</span>
                </div>
                <span>YAML Workflow</span>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto text-emerald-300 select-text">
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
            GitHub Actions ফাইল যুক্ত করার সাথে সাথে সবুজ টিক চিহ্ন আসবে এবং অটো বিল্ড শুরু হবে।
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
          >
            বুঝেছি, বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
