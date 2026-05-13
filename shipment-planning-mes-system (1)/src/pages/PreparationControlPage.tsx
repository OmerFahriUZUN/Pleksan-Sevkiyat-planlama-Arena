import { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle2, XCircle, RefreshCw, ClipboardCheck } from 'lucide-react';
import { shipmentPlansAPI, handleApiError } from '../services';
import { statusLabel, statusColor, statusDotColor, formatDate } from '../utils/helpers';
import type { ShipmentPlan, PreparationCheck } from '../types';

export function PreparationControlPage() {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localChecks, setLocalChecks] = useState<Record<string, PreparationCheck[]>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await shipmentPlansAPI.getAll();
      const pending = data.filter((s) =>
        ['erp_imported', 'waiting_stock', 'waiting_quality', 'blocked'].includes(s.status)
      );
      setShipments(pending);
      const checks: Record<string, PreparationCheck[]> = {};
      pending.forEach((s) => {
        if (s.preparation_checks?.length) checks[s.id] = [...s.preparation_checks];
      });
      setLocalChecks(checks);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (shipmentId: string, productIdx: number, field: keyof PreparationCheck) => {
    setLocalChecks((prev) => {
      const newChecks = { ...prev };
      const checks = [...(newChecks[shipmentId] || [])];
      if (checks[productIdx]) {
        checks[productIdx] = { ...checks[productIdx], [field]: !checks[productIdx][field] };
      }
      newChecks[shipmentId] = checks;
      return newChecks;
    });
  };

  const setNotes = (shipmentId: string, productIdx: number, notes: string) => {
    setLocalChecks((prev) => {
      const newChecks = { ...prev };
      const checks = [...(newChecks[shipmentId] || [])];
      if (checks[productIdx]) {
        checks[productIdx] = { ...checks[productIdx], notes };
      }
      newChecks[shipmentId] = checks;
      return newChecks;
    });
  };

  const saveChecks = async (shipmentId: string) => {
    setSaving(shipmentId);
    try {
      const checks = localChecks[shipmentId];
      if (!checks) return;
      await shipmentPlansAPI.updatePreparationCheck(shipmentId, checks);
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(null);
    }
  };

  const allChecksPassed = (shipmentId: string): boolean => {
    const checks = localChecks[shipmentId];
    if (!checks || checks.length === 0) return false;
    return checks.every((c) => c.is_stock_sufficient && c.is_product_ready && c.is_quality_approved && c.is_warehouse_suitable);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hazırlık Kontrolü</h1>
          <p className="text-slate-500 text-sm">{shipments.length} sevkiyat hazırlık bekliyor</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Yenile
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="py-20 text-center text-slate-500">Yükleniyor...</div>
      ) : shipments.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <ClipboardCheck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Tüm sevkiyatlar kontrol edildi</p>
          <p className="text-slate-400 text-sm">Hazırlık bekleyen sevkiyat yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment) => {
            const expanded = expandedId === shipment.id;
            const checks = localChecks[shipment.id] || shipment.preparation_checks || [];
            const passed = allChecksPassed(shipment.id);

            return (
              <div key={shipment.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${passed ? 'border-emerald-200' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 px-4 py-4 cursor-pointer select-none" onClick={() => setExpandedId(expanded ? null : shipment.id)}>
                  <div className={`w-2 h-8 rounded-full flex-shrink-0 ${statusDotColor(shipment.status)}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-sm">{shipment.sevkiyat_no}</span>
                      {passed && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </div>
                    <p className="text-slate-500 text-xs">{shipment.cari_ad}</p>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border font-medium ${statusColor(shipment.status)}`}>{statusLabel(shipment.status)}</span>
                  <ChevronRight size={16} className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 px-4 pb-5 pt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Info label="Müşteri" value={shipment.cari_ad} />
                      <Info label="Termin" value={formatDate(shipment.termin_tarihi)} />
                      <Info label="Ülke/Şehir" value={`${shipment.cari_ulke || '—'}/${shipment.cari_sehir || '—'}`} />
                      <Info label="Toplam Ürün" value={`${shipment.urun_listesi?.length || 0} kalem`} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ürün Bazlı Hazırlık Kontrolleri</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Ürün</th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500">Stok Yeterli</th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500">Ürün Hazır</th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500">Kalite Onayı</th>
                              <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500">Depo Uygun</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Not</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {checks.map((check, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2">
                                  <p className="font-mono text-xs text-slate-600">{check.stok_kodu}</p>
                                  <p className="text-xs text-slate-500">{check.stok_adi}</p>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <CheckButton checked={check.is_stock_sufficient} onClick={() => toggleCheck(shipment.id, idx, 'is_stock_sufficient')} />
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <CheckButton checked={check.is_product_ready} onClick={() => toggleCheck(shipment.id, idx, 'is_product_ready')} />
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <CheckButton checked={check.is_quality_approved} onClick={() => toggleCheck(shipment.id, idx, 'is_quality_approved')} />
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <CheckButton checked={check.is_warehouse_suitable} onClick={() => toggleCheck(shipment.id, idx, 'is_warehouse_suitable')} />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="text" value={check.notes} onChange={(e) => setNotes(shipment.id, idx, e.target.value)}
                                    className="w-24 text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-blue-400" placeholder="Not..." />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button onClick={() => saveChecks(shipment.id)} disabled={saving === shipment.id}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl border transition-colors ${
                          passed ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                        {saving === shipment.id ? 'Kaydediliyor...' : passed ? <><CheckCircle2 size={12} /> Planlamaya Hazır</> : <><ClipboardCheck size={12} /> Kontrolleri Kaydet</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckButton({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${
      checked ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
    }`}>
      {checked ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className="text-slate-800 text-sm font-medium">{value}</p>
    </div>
  );
}