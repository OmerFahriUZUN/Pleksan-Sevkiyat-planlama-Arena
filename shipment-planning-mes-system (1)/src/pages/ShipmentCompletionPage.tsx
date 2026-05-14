import { useState, useEffect, useMemo } from 'react';
import { Search, Truck, Package, CheckCircle2, XCircle, RefreshCw, Barcode, MapPin, Weight, AlertTriangle } from 'lucide-react';
import { shipmentPlansAPI, handleApiError, vehiclesAPI } from '../services';
import { statusLabel, statusColor, statusDotColor, formatWeight, formatVolume } from '../utils/helpers';
import type { ShipmentPlan, Vehicle } from '../types';

export function ShipmentCompletionPage() {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [scannerCode, setScannerCode] = useState('');
  const [scannerShipmentId, setScannerShipmentId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ type: 'OK' | 'WRONG_PRODUCT' | 'EXCESS' | 'COMPLETE'; msg: string } | null>(null);
  const [assignModal, setAssignModal] = useState<{ shipmentId: string } | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, vData] = await Promise.all([
        shipmentPlansAPI.getAll(),
        vehiclesAPI.getAll()
      ]);
      setShipments(sData.filter((s) => ['loading', 'partial_shipment', 'shipped'].includes(s.status)));
      setVehicles(vData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return shipments.filter((s) =>
      !search || s.sevkiyat_no.toLowerCase().includes(search.toLowerCase()) ||
      s.cari_ad.toLowerCase().includes(search.toLowerCase())
    );
  }, [shipments, search]);

  const handleScan = async () => {
    if (!scannerShipmentId || !scannerCode.trim()) return;
    try {
      const result = await shipmentPlansAPI.scanProduct(scannerShipmentId, scannerCode.trim(), 1);
      const msgs: Record<string, string> = {
        OK: 'Ürün başarıyla tarandı.',
        WRONG_PRODUCT: 'Hatalı ürün! Bu sevkiyata ait değil.',
        EXCESS: 'Fazla tarama! Miktar aşıldı.',
        COMPLETE: 'Tüm ürünler tarandı! Sevkiyat tamamlanmaya hazır.',
      };
      setScanResult({ type: result.result, msg: msgs[result.result] || '' });
      setScannerCode('');
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const completeShipment = async (id: string) => {
    try {
      await shipmentPlansAPI.transitionStatus(id, 'shipped');
      // Auto generate irsaliye
      try {
        await shipmentPlansAPI.generateIrsaliye(id);
      } catch (e) {}
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const assignVehicleToShipment = async (shipmentId: string, vehicleId: string) => {
    try {
      const v = vehicles.find((v) => v.id === vehicleId);
      if (!v) return;
      await shipmentPlansAPI.assignVehicle(shipmentId, vehicleId, v.plaka || v.plaka, v.sofor_adi, 100);
      setAssignModal(null);
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const generateLoadingSeq = async (id: string) => {
    try {
      await shipmentPlansAPI.generateLoadingSequence(id);
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sevk Tamamlama</h1>
          <p className="text-slate-500 text-sm">{filtered.length} sevkiyat işlem bekliyor</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Yenile
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>}

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Sevkiyat no, müşteri ara…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 text-slate-700 placeholder-slate-400" />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Yükleniyor...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((shipment) => {
            const totalItems = shipment.urun_listesi?.length || 0;
            const scannedItems = shipment.urun_listesi?.filter((u) => u.scanned_quantity > 0).length || 0;
            const allScanned = shipment.urun_listesi?.every((u) => u.scanned_quantity >= u.miktar) || false;
            const totalWeight = shipment.urun_listesi?.reduce((s, u) => s + u.agirlik, 0) || 0;
            const totalVolume = shipment.urun_listesi?.reduce((s, u) => s + u.hacim_m3, 0) || 0;
            const hasVehicle = (shipment.vehicle_assignments?.length || 0) > 0;
            const hasLoadingSeq = (shipment.loading_sequences?.length || 0) > 0;

            return (
              <div key={shipment.id} className={`bg-white rounded-2xl border shadow-sm ${allScanned ? 'border-emerald-200' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className={`w-2 h-8 rounded-full flex-shrink-0 ${statusDotColor(shipment.status)}`} />
                  <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 text-sm">{shipment.sevkiyat_no}</span>
                        {allScanned && <CheckCircle2 size={14} className="text-emerald-500" />}
                        {shipment.is_partial_shipment && <span className="text-xs text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded-full">%{shipment.partial_shipment_percentage}</span>}
                      </div>
                      <p className="text-slate-500 text-xs">{shipment.cari_ad}</p>
                    </div>
                    <div className="hidden sm:block text-xs text-slate-500 space-y-0.5">
                      <p><Weight size={10} className="inline" /> {formatWeight(totalWeight)} · {formatVolume(totalVolume)}</p>
                      <p><MapPin size={10} className="inline" /> {shipment.cari_sehir || '—'}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-slate-500">Tarama: {scannedItems}/{totalItems}</p>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${totalItems > 0 ? (scannedItems / totalItems) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border font-medium ${statusColor(shipment.status)}`}>{statusLabel(shipment.status)}</span>
                </div>

                {/* Quick Actions */}
                <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                  {/* Barcode Scanner */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Barcode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Barkod okut (stok kodu)" value={scannerShipmentId === shipment.id ? scannerCode : ''}
                        onFocus={() => setScannerShipmentId(shipment.id)}
                        onChange={(e) => { setScannerShipmentId(shipment.id); setScannerCode(e.target.value); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 text-slate-700" />
                    </div>
                    <button onClick={handleScan} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl">Tara</button>
                    {scannerShipmentId === shipment.id && scanResult && (
                      <span className={`text-xs font-medium ${scanResult.type === 'OK' ? 'text-emerald-600' : scanResult.type === 'COMPLETE' ? 'text-emerald-600' : scanResult.type === 'WRONG_PRODUCT' ? 'text-red-600' : 'text-amber-600'}`}>
                        {scanResult.msg}
                      </span>
                    )}
                  </div>

                  {/* Scanned Products Summary */}
                  {shipment.urun_listesi && shipment.urun_listesi.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-2 py-1.5 font-semibold text-slate-500">Ürün</th>
                            <th className="text-right px-2 py-1.5 font-semibold text-slate-500">Miktar</th>
                            <th className="text-right px-2 py-1.5 font-semibold text-slate-500">Taranan</th>
                            <th className="text-right px-2 py-1.5 font-semibold text-slate-500">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {shipment.urun_listesi.map((u, idx) => {
                            const done = u.scanned_quantity >= u.miktar;
                            return (
                              <tr key={idx} className={done ? 'bg-emerald-50/50' : ''}>
                                <td className="px-2 py-1.5"><span className="font-mono text-slate-600">{u.stok_kodu}</span></td>
                                <td className="px-2 py-1.5 text-right text-slate-700">{u.miktar}</td>
                                <td className={`px-2 py-1.5 text-right font-medium ${done ? 'text-emerald-600' : 'text-blue-600'}`}>{u.scanned_quantity}</td>
                                <td className="px-2 py-1.5 text-right">{done ? <CheckCircle2 size={12} className="inline text-emerald-500" /> : <AlertTriangle size={12} className="inline text-amber-500" />}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Vehicle Assignment & Loading */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-50">
                    {!hasVehicle && (
                      <button onClick={() => setAssignModal({ shipmentId: shipment.id })} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-xl border border-indigo-200">
                        <Truck size={11} />Araç Ata
                      </button>
                    )}
                    {hasVehicle && !hasLoadingSeq && (
                      <button onClick={() => generateLoadingSeq(shipment.id)} className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-xl border border-amber-200">
                        <Package size={11} />Yükleme Sırası Oluştur
                      </button>
                    )}
                    {allScanned && hasVehicle && (
                      <button onClick={() => completeShipment(shipment.id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-xl border border-emerald-200 ml-auto">
                        <CheckCircle2 size={11} />Sevkiyatı Tamamla
                      </button>
                    )}
                    {!allScanned && shipment.status === 'loading' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-400 text-xs rounded-xl border border-slate-200 ml-auto">
                        <XCircle size={11} />Eksik ürünler var
                      </span>
                    )}
                  </div>

                  {/* Loading Sequence */}
                  {shipment.loading_sequences && shipment.loading_sequences.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">📋 Yükleme Sırası</p>
                      <div className="space-y-1">
                        {shipment.loading_sequences.sort((a, b) => a.sequence_order - b.sequence_order).map((ls) => (
                          <div key={ls.id} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">{ls.sequence_order}</span>
                            <span className="font-mono">{ls.product_code}</span>
                            <span className="text-slate-400">{ls.box_count} koli / {ls.pallet_count} palet</span>
                            {ls.is_first_delivery && <span className="text-xs text-orange-600 bg-orange-50 px-1.5 rounded-full">İlk Teslim</span>}
                            {ls.is_last_delivery && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 rounded-full">Son Teslim</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vehicle Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAssignModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="font-bold text-slate-800 mb-1">Araç Ata</h3>
            <p className="text-slate-500 text-sm mb-4">Sevkiyat için araç seçin</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {vehicles.filter((v) => v.status === 'available' || v.status === 'in_operation').map((v) => (
                <button key={v.id} onClick={() => assignVehicleToShipment(assignModal.shipmentId, v.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-800 text-sm">{v.plaka}</span>
                    <span className="text-xs text-slate-500">({v.sofor_adi})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{v.arac_tipi} · {v.max_agirlik_kg} kg max</p>
                </button>
              ))}
            </div>
            <button onClick={() => setAssignModal(null)} className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}