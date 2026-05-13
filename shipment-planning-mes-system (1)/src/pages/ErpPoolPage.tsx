import { useState, useEffect, useMemo } from 'react';
import { Search, Database, ChevronRight, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import { shipmentPlansAPI, handleApiError } from '../services';
import { statusLabel, statusColor, statusDotColor, formatDate, countryTypeLabel } from '../utils/helpers';
import type { ShipmentPlan } from '../types';

export function ErpPoolPage() {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await shipmentPlansAPI.getErpPool();
      setShipments(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return shipments.filter((s) =>
      !search || s.sevkiyat_no.toLowerCase().includes(search.toLowerCase()) ||
      s.cari_ad.toLowerCase().includes(search.toLowerCase()) ||
      s.siparis_no.toLowerCase().includes(search.toLowerCase())
    );
  }, [shipments, search]);

  const importToSystem = async (id: string) => {
    try {
      await shipmentPlansAPI.transitionStatus(id, 'ready_for_planning');
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ERP Sevkiyat Havuzu</h1>
          <p className="text-slate-500 text-sm">{filtered.length} sevkiyat ERP'den alındı, işlem bekliyor</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>
      )}

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Sevkiyat no, müşteri, sipariş no ara…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 text-slate-700 placeholder-slate-400" />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <Database size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">ERP Havuzu Boş</p>
          <p className="text-slate-400 text-sm">ERP'den yeni sevkiyat emri gelmedi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((shipment) => {
            const expanded = expandedId === shipment.id;
            const totalItems = shipment.urun_listesi?.length || 0;
            return (
              <div key={shipment.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm transition-all">
                <div className="flex items-center gap-3 px-4 py-4 cursor-pointer select-none" onClick={() => setExpandedId(expanded ? null : shipment.id)}>
                  <div className={`w-2 h-8 rounded-full flex-shrink-0 ${statusDotColor(shipment.status)}`} />
                  <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 text-sm">{shipment.sevkiyat_no}</span>
                      </div>
                      <p className="text-slate-500 text-xs">{shipment.siparis_no}</p>
                    </div>
                    <div className="min-w-0 hidden sm:block">
                      <p className="text-slate-700 text-sm font-medium truncate">{shipment.cari_ad}</p>
                      <p className="text-slate-400 text-xs">{shipment.cari_sehir} · {countryTypeLabel(shipment.kart_bilgisi)}</p>
                    </div>
                    <div className="min-w-0 hidden sm:block">
                      <p className="text-slate-700 text-sm font-medium flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        {formatDate(shipment.termin_tarihi)}
                      </p>
                      <p className="text-slate-400 text-xs">{totalItems} ürün</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border font-medium ${statusColor(shipment.status)}`}>
                    {statusLabel(shipment.status)}
                  </span>
                  <ChevronRight size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 px-4 pb-5 pt-4 space-y-4">
                    {/* Shipment Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <InfoBox label="Müşteri" value={shipment.cari_ad} />
                      <InfoBox label="Termin Tarihi" value={formatDate(shipment.termin_tarihi)} />
                      <InfoBox label="Ülke/Şehir" value={`${shipment.cari_ulke || '—'} / ${shipment.cari_sehir || '—'}`} />
                      <InfoBox label="Teslimat Adresi" value={shipment.teslimat_adresi || '—'} />
                    </div>

                    {/* Products */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ürün Listesi</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 rounded-lg">
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Stok Kodu</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Stok Adı</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Miktar</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Kalan</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Depo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {shipment.urun_listesi?.map((u, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-mono text-xs text-slate-600">{u.stok_kodu}</td>
                                <td className="px-3 py-2 text-slate-700">{u.stok_adi}</td>
                                <td className="px-3 py-2 text-right text-slate-700 font-medium">{u.miktar}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{u.kalan_miktar}</td>
                                <td className="px-3 py-2 text-right text-slate-500">{u.depo_kodu}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button onClick={() => importToSystem(shipment.id)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-xl border border-emerald-200 transition-colors">
                        <CheckCircle2 size={12} />
                        Planlamaya Hazırla
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className="text-slate-800 text-sm font-medium">{value}</p>
    </div>
  );
}