import React, { useState } from 'react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Folder, 
  FolderOpen, 
  FileText, 
  Layers, 
  Sparkles,
  Search
} from 'lucide-react';
import { codeFiles, CodeFile } from '../codeFiles';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(codeFiles[0]);
  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'backend' | 'frontend' | 'docs'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredFiles = codeFiles.filter((file) => {
    if (filterCategory !== 'all' && file.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        file.name.toLowerCase().includes(q) ||
        file.path.toLowerCase().includes(q) ||
        file.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[780px] shadow-xl">
      {/* Left Sidebar: File Tree Navigation */}
      <div className="w-full md:w-80 bg-slate-950/70 border-r border-slate-800 flex flex-col">
        {/* Header & Filter */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Source Code Explorer
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
              {filteredFiles.length} files
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1">
            {(['all', 'backend', 'frontend', 'docs'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'backend' ? 'Python' : cat === 'frontend' ? 'Flutter' : 'Docs'}
              </button>
            ))}
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredFiles.map((file) => {
            const isSelected = selectedFile.path === file.path;
            const badgeColor =
              file.category === 'backend'
                ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                : file.category === 'frontend'
                ? 'text-sky-400 bg-sky-400/10 border-sky-400/20'
                : 'text-purple-400 bg-purple-400/10 border-purple-400/20';

            return (
              <button
                key={file.path}
                onClick={() => {
                  setSelectedFile(file);
                  setCopied(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-blue-600/15 border border-blue-500/50 text-white'
                    : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-mono font-semibold truncate">{file.name}</span>
                  </div>
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${badgeColor}`}>
                    {file.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate pl-5">
                  {file.path}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Code Viewer */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* File Header Bar */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400 font-bold">
                {selectedFile.path}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {selectedFile.language.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {selectedFile.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-slate-200 select-text">
          <pre className="whitespace-pre">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
