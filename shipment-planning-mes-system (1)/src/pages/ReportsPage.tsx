import { useState, useEffect } from 'react';
import { shipmentPlansAPI, handleApiError } from '../services';
import { formatWeight, formatVolume } from '../utils/helpers';
import { BarChart3, Download, RefreshCw } from 'lucide-react';

export function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('this-month');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dashboardData = await shipmentPlansAPI.getDashboard();
      setData(dashboardData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Raporlar</h1>
          <p className="text-slate-500 text-sm">Operasyonel istatistikler ve analiz</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-blue-400">
            <option value="this-month">Bu Ay</option>
            <option value="last-month">Geçen Ay</option>
            <option value="this-quarter">Bu Çeyrek</option>
            <option value="this-year">Bu Yıl</option>
          </select>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Yenile
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            <Download size={15} />Dışa Aktar
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="py-20 text-center text-slate-500">Yükleniyor...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Toplam Sevkiyat', value: data?.total || 0, color: 'bg-blue-50 text-blue-600 border-blue-100', icon: '📦' },
              { label: 'Geciken', value: data?.delayed || 0, color: 'bg-red-50 text-red-600 border-red-100', icon: '⚠️' },
              { label: 'Planlanan', value: data?.planned || 0, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: '📋' },
              { label: 'Sevk Edilen', value: data?.shipped || 0, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: '✅' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className={`inline-flex p-2.5 rounded-xl border mb-3 ${kpi.color}`}>
                  <span className="text-lg">{kpi.icon}</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">{kpi.value}</p>
                <p className="text-slate-500 text-sm mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Sevkiyat Durum Özeti</h3>
              <div className="space-y-3">
                {[
                  { label: 'Bekleyen', value: data?.waiting_preparation || 0, color: 'bg-amber-500' },
                  { label: 'Devam Eden', value: data?.in_progress || 0, color: 'bg-blue-500' },
                  { label: 'Planlanan', value: data?.planned || 0, color: 'bg-indigo-500' },
                  { label: 'Kısmi Sevkiyat', value: data?.partial_shipments || 0, color: 'bg-cyan-500' },
                  { label: 'Revizyon Gerekli', value: data?.revision_required || 0, color: 'bg-red-500' },
                  { label: 'Sevk Edilen', value: data?.shipped || 0, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <div className="flex-1 flex justify-between">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Operasyonel Veriler</h3>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Operasyon Verimliliği</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-slate-800">{data?.operation_efficiency || 0}%</p>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(data?.operation_efficiency || 0, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Toplam Hacim</p>
                    <p className="text-lg font-bold text-slate-800">{formatVolume(data?.total_hacim_m3 || 0)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Toplam Ağırlık</p>
                    <p className="text-lg font-bold text-slate-800">{formatWeight(data?.total_agirlik_kg || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder for future detailed reports */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Detaylı Raporlar</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Bu bölüm ileride operasyon süreleri, personel performansı, araç doluluk oranları 
              ve trend analizleri gibi detaylı raporlar için kullanılacaktır.
            </p>
          </div>
        </>
      )}
    </div>
  );
}