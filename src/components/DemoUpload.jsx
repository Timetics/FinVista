import { supabase } from '../lib/supabaseClient';
import { useState, useRef, useEffect } from 'react';
import {
  Upload, Image as ImageIcon, Sparkles,
  Scan, Eye, ArrowRight, RefreshCw, FileText, Zap,
  AlertCircle, ShieldCheck, Check, Trash2, Camera,
  CornerDownRight, Play, Edit3, Layers, Wand2, FileSpreadsheet, X
} from 'lucide-react';
import { formatCurrency, formatDate, parseCSV } from '../utils/helpers';

// Sample statement photos for instant demo testing
const samplePhotos = [
  {
    id: 'commerce-bank-statement',
    name: 'Commerce Bank Statement Template.png',
    bank: 'Commerce Bank',
    date: 'June 5, 2003',
    previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    transactions: [
      { id: 401, date: '2003-05-15', description: 'Deposit (Ref Nbr: 130012345)', category: 'Income', amount: 3615.08, type: 'credit', confidence: 99.9, flags: [] },
      { id: 402, date: '2003-05-12', description: 'Check #1001 (Ref: 00012576589)', category: 'Checks & Transfers', amount: -75.00, type: 'debit', confidence: 99.5, flags: [] },
      { id: 403, date: '2003-05-18', description: 'Check #1002 (Ref: 00036547854)', category: 'Checks & Transfers', amount: -30.00, type: 'debit', confidence: 99.3, flags: [] },
      { id: 404, date: '2003-05-18', description: 'ATM Withdrawal - 1000 Walnut St Kansas City MO', category: 'ATM & Cash', amount: -20.00, type: 'debit', confidence: 98.9, flags: [] },
      { id: 405, date: '2003-05-24', description: 'Check #1003 (Ref: 00094613547)', category: 'Checks & Transfers', amount: -200.00, type: 'debit', confidence: 99.4, flags: [] },
    ]
  },
  {
    id: 'chase-statement',
    name: 'Chase Checking Statement Photo.jpg',
    bank: 'Chase Bank',
    date: 'Sept 2026',
    previewUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
    transactions: [
      { id: 101, date: '2026-09-28', description: 'TechCorp Salary Direct Deposit', category: 'Income', amount: 7500.00, type: 'credit', confidence: 99.8, flags: [] },
      { id: 102, date: '2026-09-27', description: 'Whole Foods Market #1042 San Francisco', category: 'Groceries', amount: -134.52, type: 'debit', confidence: 98.4, flags: [] },
      { id: 103, date: '2026-09-27', description: 'Netflix.com Auto-Debit', category: 'Subscriptions', amount: -15.99, type: 'debit', confidence: 99.1, flags: ['Recurring'] },
      { id: 104, date: '2026-09-26', description: 'Chevron Station 0482', category: 'Transportation', amount: -58.40, type: 'debit', confidence: 97.9, flags: [] },
      { id: 105, date: '2026-09-25', description: 'Amazon.com Online Purchase', category: 'Shopping', amount: -89.99, type: 'debit', confidence: 98.8, flags: [] },
      { id: 106, date: '2026-09-25', description: 'Equinox Fitness Club', category: 'Subscriptions', amount: -210.00, type: 'debit', confidence: 96.5, flags: ['Recurring'] },
      { id: 107, date: '2026-09-24', description: 'Starbucks Store #9914', category: 'Dining', amount: -6.75, type: 'debit', confidence: 99.5, flags: [] },
    ]
  },
  {
    id: 'bofa-statement',
    name: 'Bank of America Statement Scan.png',
    bank: 'Bank of America',
    date: 'Sept 2026',
    previewUrl: 'https://images.unsplash.com/photo-1556742049-0a67daf4005a?auto=format&fit=crop&w=800&q=80',
    transactions: [
      { id: 201, date: '2026-09-28', description: 'Freelance Consulting Payment', category: 'Income', amount: 2400.00, type: 'credit', confidence: 99.2, flags: [] },
      { id: 202, date: '2026-09-27', description: 'Trader Joes Groceries', category: 'Groceries', amount: -94.20, type: 'debit', confidence: 98.1, flags: [] },
      { id: 203, date: '2026-09-26', description: 'Spotify USA Monthly', category: 'Subscriptions', amount: -10.99, type: 'debit', confidence: 99.6, flags: ['Recurring'] },
      { id: 204, date: '2026-09-25', description: 'Uber Trip San Jose', category: 'Transportation', amount: -32.50, type: 'debit', confidence: 97.4, flags: [] },
      { id: 205, date: '2026-09-24', description: 'Best Buy Electronics #412', category: 'Shopping', amount: -429.99, type: 'debit', confidence: 98.9, flags: ['Unusual'] },
    ]
  }
];

// Sample CSV content so users can paste/generate test data.
const SAMPLE_CSV = `Date,Description,Amount,Category
2026-09-28,Salary Deposit - TechCorp Inc,7500.00,Income
2026-09-27,Whole Foods Market #1042,-134.52,Groceries
2026-09-27,Netflix Monthly Subscription,-15.99,Subscriptions
2026-09-26,Shell Gas Station,-58.40,Transportation
2026-09-26,Spotify Premium,-10.99,Subscriptions
2026-09-25,Amazon.com Purchase,-89.99,Shopping
2026-09-25,Rent Payment - Apt 4B,-2100.00,Housing
2026-09-24,Starbucks Coffee,-6.75,Dining`;

export default function DemoUpload({ onLaunchDashboard }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [extractedData, setExtractedData] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [scannedDone, setScannedDone] = useState(false);
  const [mode, setMode] = useState('scan'); // 'scan' | 'csv'
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [csvError, setCsvError] = useState('');
  const fileInputRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => () => clearInterval(scanIntervalRef.current), []);

  const startScanningProcess = (photoObj, customImageSrc = null) => {
    clearInterval(scanIntervalRef.current);
    setIsScanning(true);
    setScannedDone(false);
    setScanProgress(0);
    setExtractedData([]);

    const targetTx = customImageSrc
      ? [
        { id: Date.now() + 1, date: '2026-09-29', description: 'Extracted Merchant - Target Superstore', category: 'Groceries', amount: -112.50, type: 'debit', confidence: 98.7, flags: [] },
        { id: Date.now() + 2, date: '2026-09-28', description: 'Extracted Direct Deposit - Salary', category: 'Income', amount: 4800.00, type: 'credit', confidence: 99.5, flags: [] },
        { id: Date.now() + 3, date: '2026-09-27', description: 'Extracted Recurring - Netflix Monthly', category: 'Subscriptions', amount: -15.99, type: 'debit', confidence: 99.1, flags: ['Recurring'] },
        { id: Date.now() + 4, date: '2026-09-26', description: 'Extracted Uber Ride - City Transit', category: 'Transportation', amount: -28.40, type: 'debit', confidence: 96.8, flags: [] },
      ]
      : photoObj.transactions;

    const steps = [
      { progress: 20, text: 'Preprocessing image lighting & contrast...' },
      { progress: 45, text: 'Detecting tabular bounding boxes with AI Vision...' },
      { progress: 70, text: 'OCR text recognition & confidence scoring...' },
      { progress: 90, text: 'Classifying categories & flagging anomalies...' },
      { progress: 100, text: 'Scan Complete! 98.9% OCR accuracy.' }
    ];

    let stepIdx = 0;
    scanIntervalRef.current = setInterval(() => {
      if (stepIdx < steps.length) {
        setScanProgress(steps[stepIdx].progress);
        setScanStepText(steps[stepIdx].text);
        stepIdx++;
      } else {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
        setIsScanning(false);
        setScannedDone(true);
        setExtractedData(targetTx);
      }
    }, 600);
  };

  const handleSelectPreset = (preset) => {
    setSelectedPhoto(preset);
    setUploadedImage(null);
    startScanningProcess(preset);
  };

  const handleRemoveImage = () => {
    clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = null;
    setSelectedPhoto(null);
    setUploadedImage(null);
    setIsScanning(false);
    setScanProgress(0);
    setScanStepText('');
    setScannedDone(false);
    setExtractedData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Plugged-in Edge Function invocation (parse-statement) for uploads.
  const handleFileUpload = async (fileOrEvent) => {
    // Support both being called with a File directly and with an input event.
    const file = fileOrEvent?.target?.files?.[0] ?? fileOrEvent;
    if (!file) return;

    try {
      // 1. Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please sign in first to parse and save bank statements!");
        return;
      }

      // 2. Prepare the file payload
      const formData = new FormData();
      formData.append('file', file);

      // 3. Call the Edge Function via Supabase SDK
      const { data, error } = await supabase.functions.invoke('parse-statement', {
        body: formData,
      });

      if (error) throw error;

      alert(`Success! Saved ${data.count} transactions to your account.`);

      // Optional: Call a prop function to refresh transactions in parent component/dashboard
      // if (onUploadSuccess) onUploadSuccess(data.transactions);

    } catch (err) {
      console.error('Upload error:', err.message);
      alert(`Upload failed: ${err.message}`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleParseCSV = () => {
    const parsed = parseCSV(csvText);
    if (parsed.length === 0) {
      setCsvError('No transactions could be parsed. Check the CSV header row (Date, Description, Amount, Category).');
      setExtractedData([]);
      setScannedDone(false);
    } else {
      setCsvError('');
      setExtractedData(parsed);
      setScannedDone(true);
      setIsScanning(false);
    }
  };

  const handleResetCSV = () => {
    setCsvText(SAMPLE_CSV);
    setCsvError('');
    setExtractedData([]);
    setScannedDone(false);
  };

  const activeImageSrc = uploadedImage ? uploadedImage.src : selectedPhoto?.previewUrl;
  const activeTitle = uploadedImage ? uploadedImage.name : selectedPhoto?.name;

  return (
    <div className="pt-24 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-up">

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
          <Scan className="w-4 h-4" />
          <span>AI Vision OCR Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Demo Upload: <span className="gradient-text">Statement Photo Scanner</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Upload a photo or snapshot of your paper bank statement or receipt. Our AI Vision engine reads, detects, and maps transactions directly into structured digital data.
        </p>
      </div>

      {/* Preset Photo Selectors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            Try Preset Statement Photo Samples
          </span>
          <span className="text-xs text-slate-500">Click any photo to trigger live scan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {samplePhotos.map((preset) => {
            const isSelected = !uploadedImage && selectedPhoto?.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`glass-card p-4 cursor-pointer transition-all duration-300 flex items-center gap-4 group ${isSelected
                  ? '!border-cyan-500/50 bg-slate-800/80 shadow-lg shadow-cyan-500/10'
                  : 'hover:bg-slate-800/40'
                  }`}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-700">
                  <img src={preset.previewUrl} alt={preset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-cyan-300 font-bold" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate mb-1">{preset.bank}</h4>
                  <p className="text-[11px] text-slate-400 truncate mb-1">{preset.name}</p>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 font-mono">
                    {preset.transactions.length} items parsed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode Selector: Real CSV vs Mock Scan */}
      <div className="glass-card p-4 border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
              mode === 'scan'
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
            onClick={() => setMode('scan')}
          >
            <Wand2 className="w-4 h-4" />
            Mock Scan (AI Vision)
          </div>
          <div
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
              mode === 'csv'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
            onClick={() => setMode('csv')}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Real CSV Parsing
          </div>
        </div>
      </div>

      {/* Main Upload Dropzone & Live Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Image Dropzone & Visual Scanner (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                Upload Statement Photo
              </h3>
              {uploadedImage && (
                <button
                  onClick={handleRemoveImage}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Custom Image
                </button>
              )}
            </div>

            {/* Dropzone Container */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${dragActive
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-slate-800 hover:border-cyan-500/40 bg-slate-950/60'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-xs font-semibold text-white mb-1">
                Click to browse or drop your statement photo here
              </p>
              <p className="text-[11px] text-slate-500">
                Supports PNG, JPG, WEBP, and CSV • Max 10MB
              </p>
            </div>

            {/* Photo Preview & Scanning Laser Canvas */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[340px] flex items-center justify-center group">
              {activeImageSrc ? (
                <img
                  src={activeImageSrc}
                  alt={activeTitle}
                  className="w-full max-h-[420px] object-cover opacity-90 transition-opacity"
                />
              ) : (
                <p className="px-6 text-center text-sm text-slate-500">
                  Choose a sample statement or upload a photo to begin.
                </p>
              )}

              {/* Bounding box simulation overlays */}
              {activeImageSrc && (
                <div className="absolute inset-0 pointer-events-none p-6">
                  <div className="absolute top-12 left-10 w-48 h-8 border-2 border-cyan-400/80 bg-cyan-400/10 rounded flex items-center px-2">
                    <span className="text-[9px] font-mono text-cyan-300 font-bold">DATE & MERCHANT DETECTED</span>
                  </div>
                  <div className="absolute top-28 left-10 w-64 h-8 border-2 border-emerald-400/80 bg-emerald-400/10 rounded flex items-center px-2">
                    <span className="text-[9px] font-mono text-emerald-300 font-bold">AMOUNT: +$7,500.00 (CREDIT)</span>
                  </div>
                  <div className="absolute bottom-16 right-10 w-56 h-8 border-2 border-amber-400/80 bg-amber-400/10 rounded flex items-center px-2">
                    <span className="text-[9px] font-mono text-amber-300 font-bold">CATEGORY: SUBSCRIPTIONS</span>
                  </div>
                </div>
              )}

              {/* Animated Laser Scanning Beam */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse"
                    style={{
                      position: 'absolute',
                      top: `${scanProgress}%`,
                      transition: 'top 0.5s ease-out'
                    }}
                  />
                  <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay" />
                </div>
              )}

              {/* Status Badge Over Image */}
              {activeTitle && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="font-mono text-slate-300 text-[11px] truncate max-w-[200px]">{activeTitle}</span>
                </div>
              )}
            </div>

            {/* Scan Progress Bar */}
            {isScanning && (
              <div className="space-y-2 p-4 bg-slate-900/90 rounded-xl border border-cyan-500/30 animate-pulse">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 animate-spin" />
                    {scanStepText}
                  </span>
                  <span className="text-white font-bold">{scanProgress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Parsed Results Table & Dashboard Action (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-emerald-400" />
                  Extracted Data Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  {scannedDone ? `Data mapped ${extractedData.length} entries` : 'Select or upload a statement to begin'}
                </p>
              </div>
              {scannedDone && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                  {extractedData.length} rows
                </span>
              )}
            </div>

            {/* Scanned/Csv Entries List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {extractedData.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  {isScanning ? scanStepText : 'No statement analysis yet.'}
                </p>
              ) : extractedData.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-white">{item.description}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{formatDate(item.date)}</span>
                    </div>
                    <span className={`text-xs font-mono font-bold whitespace-nowrap ${item.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                      {item.type === 'credit' ? '+' : ''}{formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-medium">
                      {item.category || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-2 text-slate-400 font-mono">
                      <span>Source: {item.source || 'csv'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mode-specific actions */}
            {mode === 'csv' ? (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real CSV Parsing (client-side)</span>
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    setCsvError('');
                  }}
                  placeholder="Paste CSV here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-y"
                  rows={6}
                />
                {csvError && <p className="text-xs text-rose-400">{csvError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleParseCSV}
                    className="btn-primary !py-2.5 !px-4 flex items-center gap-2 text-xs"
                    disabled={extractedData.length > 0}
                  >
                    <span>Parse CSV</span>
                    <Scan className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleResetCSV}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
                <p className="text-[10px] text-slate-600">
                  Tip: paste or upload a CSV with a header row. Columns: Date, Description, Amount, Category.
                </p>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mock Scan (AI Vision) — simulated output</span>
                </div>
                <button
                  onClick={() => onLaunchDashboard(extractedData)}
                  disabled={!scannedDone || isScanning}
                  className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-indigo-500/25 group"
                >
                  <Sparkles className="w-4.5 h-4.5 text-white group-hover:rotate-12 transition-transform" />
                  <span>Analyze in FinVista AI Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
