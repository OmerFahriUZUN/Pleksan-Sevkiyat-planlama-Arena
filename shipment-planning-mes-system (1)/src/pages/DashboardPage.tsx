import { useState, useEffect } from 'react';
import {
  Package, Truck, AlertTriangle,
  Activity, Calendar, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { shipmentPlansAPI, handleApiError } from '../services';
import { formatWeight, formatVolume } from '../utils/helpers';

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await shipmentPlansAPI.getDashboard();
      setStats(data);
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
          <h1 className="text-2xl font-bold text-slate-800">Kontrol Paneli</h1>
          <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Yenile
          </button>
          <Link to="/planning" className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            <Calendar size={15} />
            Planlamaya Git
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="py-20 text-center text-slate-500">Yükleniyor...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Toplam Sevkiyat" value={stats?.total || 0} sub="Bu dönem" icon={<Package size={20} />} color="blue" />
            <KpiCard label="Geciken" value={stats?.delayed || 0} sub="Müdahale gerekli" icon={<AlertTriangle size={20} />} color="red" />
            <KpiCard label="Operasyon Verimliliği" value={`${stats?.operation_efficiency || 0}%`} sub="Tamamlanan operasyonlar" icon={<Activity size={20} />} color="emerald" />
            <KpiCard label="Toplam Ağırlık" value={formatWeight(stats?.total_agirlik_kg || 0)} sub={formatVolume(stats?.total_hacim_m3 || 0)} icon={<Truck size={20} />} color="amber" />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Bekleyen', value: stats?.waiting_preparation || 0, color: 'bg-amber-500', icon: '⏳' },
              { label: 'Devam Eden', value: stats?.in_progress || 0, color: 'bg-blue-500', icon: '🔄' },
              { label: 'Planlanan', value: stats?.planned || 0, color: 'bg-indigo-500', icon: '📋' },
              { label: 'Sevk Edildi', value: stats?.shipped || 0, color: 'bg-emerald-500', icon: '✅' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-slate-500 text-xs font-medium">{item.label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Sevkiyat Durum Özeti</h3>
            <div className="space-y-3">
              {[
                { label: 'Hazırlık Bekleyen', value: stats?.waiting_preparation || 0, color: 'bg-amber-400' },
                { label: 'Revizyon Gerekli', value: stats?.revision_required || 0, color: 'bg-red-500' },
                { label: 'Devam Eden', value: stats?.in_progress || 0, color: 'bg-blue-500' },
                { label: 'Planlanan', value: stats?.planned || 0, color: 'bg-indigo-500' },
                { label: 'Kısmi Sevkiyat', value: stats?.partial_shipments || 0, color: 'bg-cyan-500' },
                { label: 'Sevk Edilen', value: stats?.shipped || 0, color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <div className="flex-1 flex justify-between">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Efficiency */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Operasyonel Veriler</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Operasyon Verimliliği</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.operation_efficiency || 0}%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Toplam Hacim</p>
                <p className="text-2xl font-bold text-slate-800">{formatVolume(stats?.total_hacim_m3 || 0)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Kısmi Sevkiyat</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.partial_shipments || 0}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub: string; icon: React.ReactNode; color: 'blue' | 'red' | 'amber' | 'emerald';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      <p className="text-slate-500 text-sm mt-1 font-medium">{label}</p>
      <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
    </div>
  );
}