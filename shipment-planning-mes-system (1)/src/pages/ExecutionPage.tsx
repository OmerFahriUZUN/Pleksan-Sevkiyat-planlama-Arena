import React, { useState, useRef, useEffect } from 'react';
import {
  Barcode, Search, CheckCircle2, AlertTriangle, XCircle,
  Package, RefreshCw, Wifi, WifiOff, ChevronRight, ArrowLeft,
  ScanLine, ShieldAlert, Layers, Clock, User
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { statusLabel, statusColor, formatDate, packageTypeLabel, packageTypeIcon } from '../utils/helpers';
import type { ShipmentStatus } from '../types';

type ScanResult = 'OK' | 'WRONG_PRODUCT' | 'EXCESS' | 'COMPLETE' | null;

export function ExecutionPage() {
  const {
    shipments, shipmentLines, packages, scanLogs,
    recordScan, currentUser, transitionShipmentStatus
  } = useAppStore();

  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult>(null);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeShipments = shipments.filter(
    (s) => s.status === 'PICKING' || s.status === 'PACKING' || s.status === 'LOADING'
  );

  const filteredActive = activeShipments.filter((s) =>
    s.shipment_no.toLowerCase().includes(search.toLowerCase()) ||
    s.destination_name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = shipments.find((s) => s.id === selectedShipmentId);
  const selectedLines = selectedShipmentId
    ? shipmentLines.filter((l) => l.shipment_id === selectedShipmentId)
    : [];
  const selectedPkgs = selectedShipmentId
    ? packages.filter((p) => p.shipment_id === selectedShipmentId)
    : [];
  const selectedScanLogs = selectedShipmentId
    ? scanLogs.filter((l) => l.shipment_id === selectedShipmentId).slice().reverse().slice(0, 10)
    : [];

  const totalItems = selectedLines.reduce((s, l) => s + l.quantity, 0);
  const scannedItems = selectedLines.reduce((s, l) => s + l.scanned_quantity, 0);
  const scanProgress = totalItems > 0 ? (scannedItems / totalItems) * 100 : 0;

  // Focus barcode input when shipment selected
  useEffect(() => {
    if (selectedShipmentId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedShipmentId]);

  // Clear scan result after 3 seconds
  useEffect(() => {
    if (lastScanResult) {
      const t = setTimeout(() => setLastScanResult(null), 3000);
      return () => clearTimeout(t);
    }
  }, [lastScanResult]);

  // Monitor online status
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !selectedShipmentId) return;

    const code = barcodeInput.trim().toUpperCase();
    setLastScannedCode(code);
    const result = recordScan(selectedShipmentId, code, 1);
    setLastScanResult(result);
    setBarcodeInput('');
    inputRef.current?.focus();
  };

  const scanResultConfig = {
    OK: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: <CheckCircle2 size={20} className="text-emerald-500" />,
      title: 'Tarama Başarılı',
      sub: `${lastScannedCode} kabul edildi`,
      text: 'text-emerald-700',
    },
    WRONG_PRODUCT: {
      bg: 'bg-red-50 border-red-300',
      icon: <XCircle size={20} className="text-red-500" />,
      title: 'Hatalı Ürün!',
      sub: `${lastScannedCode} bu sevkiyata ait değil`,
      text: 'text-red-700',
    },
    EXCESS: {
      bg: 'bg-amber-50 border-amber-300',
      icon: <AlertTriangle size={20} className="text-amber-500" />,
      title: 'Fazla Tarama!',
      sub: `${lastScannedCode} limiti aşıyor`,
      text: 'text-amber-700',
    },
    COMPLETE: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <CheckCircle2 size={20} className="text-blue-500" />,
      title: 'Tüm Ürünler Tarandı!',
      sub: 'Sevkiyat tamamlanabilir',
      text: 'text-blue-700',
    },
  };

  if (!selectedShipmentId) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Depo Yürütme</h1>
            <p className="text-slate-500 text-sm">Barkod Tarama & Doğrulama</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Sevkiyat no veya müşteri ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 text-slate-700"
          />
        </div>

        {/* Active shipments */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Aktif Sevkiyatlar ({filteredActive.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActive.map((s) => {
              const lines = shipmentLines.filter((l) => l.shipment_id === s.id);
              const total = lines.reduce((sum, l) => sum + l.quantity, 0);
              const scanned = lines.reduce((sum, l) => sum + l.scanned_quantity, 0);
              const progress = total > 0 ? (scanned / total) * 100 : 0;

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedShipmentId(s.id)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-slate-800 text-sm">{s.shipment_no}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{s.destination_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-xl border font-medium ${statusColor(s.status)}`}>
                      {statusLabel(s.status)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Tarama İlerlemesi</span>
                      <span className="font-semibold text-slate-700">{scanned}/{total}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : '#3b82f6' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">{formatDate(s.due_date, 'dd.MM HH:mm')} termin</span>
                    <div className="flex items-center gap-1 text-blue-600 text-xs font-medium group-hover:gap-2 transition-all">
                      Tara <ChevronRight size={12} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {filteredActive.length === 0 && (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
            <ScanLine size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Aktif sevkiyat yok</p>
            <p className="text-slate-400 text-sm">Toplama/Paketleme/Yükleme aşamasındaki sevkiyatlar burada görünür</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Back */}
      <button
        onClick={() => { setSelectedShipmentId(null); setLastScanResult(null); }}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Sevkiyat Seçimine Dön
      </button>

      {/* Shipment header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-800 font-mono">{selected?.shipment_no}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-xl border font-medium ${statusColor(selected?.status ?? 'PLANNED')}`}>
                {statusLabel(selected?.status ?? 'PLANNED')}
              </span>
            </div>
            <p className="text-slate-600">{selected?.destination_name}</p>
            <p className="text-slate-400 text-sm">{selected?.delivery_address}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs">Termin</p>
            <p className="text-slate-800 font-semibold">{formatDate(selected?.due_date)}</p>
            <p className="text-slate-400 text-xs">{selected?.city} · {selected?.country_type === 'DOMESTIC' ? 'Yurt İçi' : 'İhracat'}</p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 font-medium">Toplam Tarama</span>
            <span className="font-bold text-slate-800">{scannedItems} / {totalItems} ürün</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${scanProgress}%`,
                background: scanProgress === 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #3b82f6, #6366f1)',
              }}
            />
          </div>
          {scanProgress === 100 && (
            <div className="flex items-center gap-2 mt-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 size={15} />
              Tüm ürünler başarıyla tarandı!
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Barcode scanner */}
        <div className="lg:col-span-1 space-y-4">
          {/* Scan feedback */}
          {lastScanResult && scanResultConfig[lastScanResult] && (
            <div className={`rounded-2xl border p-4 ${scanResultConfig[lastScanResult].bg}`}>
              <div className="flex items-center gap-2 mb-1">
                {scanResultConfig[lastScanResult].icon}
                <span className={`font-bold text-sm ${scanResultConfig[lastScanResult].text}`}>
                  {scanResultConfig[lastScanResult].title}
                </span>
              </div>
              <p className={`text-xs ${scanResultConfig[lastScanResult].text} opacity-80`}>
                {scanResultConfig[lastScanResult].sub}
              </p>
            </div>
          )}

          {/* Barcode input */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Barcode size={18} className="text-blue-500" />
              <h3 className="font-semibold text-slate-800">Barkod Tarama</h3>
            </div>

            <form onSubmit={handleBarcodeScan}>
              <div className="relative mb-3">
                <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Barkod tarayın veya girin…"
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm font-mono focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={!barcodeInput.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Taramayı Onayla (Enter)
              </button>
            </form>

            {/* Quick test buttons */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">Hızlı Test:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedLines.slice(0, 4).map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { setBarcodeInput(l.product_code); setTimeout(() => inputRef.current?.form?.requestSubmit(), 50); }}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs rounded-lg border border-slate-200 transition-colors font-mono"
                  >
                    {l.product_code}
                  </button>
                ))}
                <button
                  onClick={() => setBarcodeInput('YANLIS-KOD')}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg border border-red-200 transition-colors"
                >
                  Hatalı
                </button>
              </div>
            </div>
          </div>

          {/* Offline status */}
          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <WifiOff size={14} className="text-amber-600" />
                <span className="text-amber-700 text-xs font-medium">Çevrimdışı Mod</span>
              </div>
              <p className="text-amber-600 text-xs mt-1">Taramalar yerel olarak saklanıyor, bağlantı gelince senkronize edilecek.</p>
            </div>
          )}

          {/* Packages info */}
          {selectedPkgs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package size={15} className="text-amber-500" />
                <h4 className="font-semibold text-slate-800 text-sm">Paketler ({selectedPkgs.length})</h4>
              </div>
              <div className="space-y-2">
                {selectedPkgs.map((pkg) => (
                  <div key={pkg.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <span className="text-lg">{packageTypeIcon(pkg.package_type)}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700">{packageTypeLabel(pkg.package_type)}</p>
                      <p className="text-xs text-slate-500">{pkg.total_weight.toFixed(1)} kg · {pkg.total_volume.toFixed(1)} dm³</p>
                    </div>
                    {pkg.stretch_wrap && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Streç</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product lines */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-slate-400" />
                <h3 className="font-semibold text-slate-800">Ürün Listesi</h3>
              </div>
              <span className="text-xs text-slate-400">{selectedLines.length} kalem</span>
            </div>
            <div className="divide-y divide-slate-50">
              {selectedLines.map((line) => {
                const progress = line.quantity > 0 ? (line.scanned_quantity / line.quantity) * 100 : 0;
                const done = line.scanned_quantity >= line.quantity;
                const over = line.scanned_quantity > line.quantity;
                return (
                  <div key={line.id} className={`px-5 py-3.5 ${done ? 'bg-emerald-50/50' : over ? 'bg-amber-50/50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-100' : over ? 'bg-amber-100' : 'bg-slate-100'}`}>
                        {done ? (
                          <CheckCircle2 size={14} className="text-emerald-600" />
                        ) : over ? (
                          <AlertTriangle size={14} className="text-amber-600" />
                        ) : (
                          <Package size={14} className="text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500">{line.product_code}</span>
                          <span className="text-sm font-medium text-slate-800 truncate">{line.product_name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%`, background: done ? '#10b981' : over ? '#f59e0b' : '#3b82f6' }}
                            />
                          </div>
                          <span className={`text-xs font-bold flex-shrink-0 ${done ? 'text-emerald-600' : over ? 'text-amber-600' : 'text-slate-600'}`}>
                            {line.scanned_quantity} / {line.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scan log */}
          {selectedScanLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                <Clock size={15} className="text-slate-400" />
                <h3 className="font-semibold text-slate-800">Son Taramalar</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {selectedScanLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-2.5">
                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                    <span className="font-mono text-xs text-slate-600">{log.product_code}</span>
                    <span className="text-slate-500 text-xs truncate">{log.product_name}</span>
                    <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-800">x{log.quantity}</span>
                      <span className="text-xs text-slate-400">{formatDate(log.timestamp, 'HH:mm:ss')}</span>
                      {!log.synced && <WifiOff size={10} className="text-amber-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FSM transition */}
          {scanProgress === 100 && selected && selected.status !== 'SHIPPED' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <ShieldAlert size={20} className="text-emerald-600" />
                <div>
                  <p className="font-bold text-emerald-800">Aşama Tamamlandı!</p>
                  <p className="text-emerald-600 text-sm">Tüm ürünler tarandı. Sonraki aşamaya geçebilirsiniz.</p>
                </div>
              </div>
              {(() => {
                const nextMap: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
                  PICKING: 'PACKING',
                  PACKING: 'LOADING',
                  LOADING: 'SHIPPED',
                };
                const next = nextMap[selected.status];
                if (!next) return null;
                return (
                  <button
                    onClick={() => transitionShipmentStatus(selected.id, next)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
                  >
                    {statusLabel(next)} Aşamasına Geç
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
