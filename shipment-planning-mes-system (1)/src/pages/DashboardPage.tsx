import React, { useMemo, useState, useEffect } from 'react';
import {
  Package, Truck, Users, Clock, AlertTriangle, TrendingUp,
  CheckCircle2, ArrowRight, BarChart3, Activity, Calendar, MapPin
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { statusLabel, statusColor, statusDotColor, formatDate, countryTypeLabel } from '../utils/helpers';
import { shipmentPlansAPI, handleApiError } from '../services';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  PLANNED: '#64748b',
  PICKING: '#3b82f6',
  PACKING: '#f59e0b',
  LOADING: '#f97316',
  SHIPPED: '#10b981',
};

export function DashboardPage() {
  const { shipments, tasks, personnel, getDashboardStats } = useAppStore();
  const [dashboardData, setDashboardData] = useState(getDashboardStats());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await shipmentPlansAPI.getDashboard();
        setDashboardData(data);
      } catch (err) {
        setError(handleApiError(err));
        setDashboardData(getDashboardStats());
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const stats = dashboardData;

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    shipments.forEach((s) => {
      counts[s.status] = (counts[s.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: statusLabel(status as any),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? '#6b7280',
    }));
  }, [shipments]);

  const personnelStats = useMemo(() => {
    return personnel.map((p) => {
      const personTasks = tasks.filter((t) => t.assigned_person_id === p.id);
      const completed = personTasks.filter((t) => t.status === 'COMPLETED').length;
      const total = personTasks.length;
      return {
        name: p.name.split(' ')[0],
        fullName: p.name,
        role: p.role,
        completed,
        total,
        efficiency: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [personnel, tasks]);

  const weeklyData = useMemo(() => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    return days.map((day, i) => ({
      day,
      planlanan: Math.floor(Math.random() * 15 + 5),
      teslim: Math.floor(Math.random() * 12 + 3),
      geciken: Math.floor(Math.random() * 3),
    }));
  }, []);

  const recentShipments = useMemo(() =>
    [...shipments]
      .sort((a, b) => new Date(b.shipment_date).getTime() - new Date(a.shipment_date).getTime())
      .slice(0, 6),
    [shipments]
  );

  const delayedShipments = shipments.filter(
    (s) => s.status !== 'SHIPPED' && new Date(s.due_date) < new Date()
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kontrol Paneli</h1>
          <p className="text-slate-500 text-sm mt-0.5">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/planning" className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <Calendar size={15} />
          Planlamaya Git
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Toplam Sevkiyat"
          value={stats.total}
          sub="Bu dönem"
          icon={<Package size={20} />}
          color="blue"
          trend="+12%"
        />
        <KpiCard
          label="Gecikenler"
          value={stats.delayed}
          sub="Müdahale gerekli"
          icon={<AlertTriangle size={20} />}
          color="red"
          trend={stats.delayed > 0 ? `${stats.delayed} kritik` : 'Sorun yok'}
          trendBad={stats.delayed > 0}
        />
        <KpiCard
          label="Araç Doluluk"
          value={`${stats.vehicle_utilization.toFixed(0)}%`}
          sub="Ortalama kapasite"
          icon={<Truck size={20} />}
          color="amber"
          trend="+5%"
        />
        <KpiCard
          label="Personel Verimliliği"
          value={`${stats.personnel_efficiency.toFixed(0)}%`}
          sub="Tamamlanan görevler"
          icon={<Users size={20} />}
          color="emerald"
          trend="Hedef: 90%"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Devam Eden', value: stats.in_progress, color: 'bg-blue-500', icon: '🔄' },
          { label: 'Sevk Edildi', value: stats.shipped, color: 'bg-emerald-500', icon: '✅' },
          { label: 'Zamanında', value: stats.on_time, color: 'bg-indigo-500', icon: '⏱️' },
          { label: 'Ort. Yükleme', value: `${stats.avg_loading_time.toFixed(1)} dk`, color: 'bg-orange-500', icon: '⏰' },
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Haftalık Sevkiyat</h3>
              <p className="text-slate-500 text-xs">Son 7 gün</p>
            </div>
            <BarChart3 size={16} className="text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: 'white', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="planlanan" name="Planlanan" stroke="#3b82f6" strokeWidth={2} fill="url(#colorPlanned)" />
              <Area type="monotone" dataKey="teslim" name="Teslim Edilen" stroke="#10b981" strokeWidth={2} fill="url(#colorDelivered)" />
              <Area type="monotone" dataKey="geciken" name="Geciken" stroke="#ef4444" strokeWidth={2} fill="none" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Durum Dağılımı</h3>
              <p className="text-slate-500 text-xs">Sevkiyat durumları</p>
            </div>
            <Activity size={16} className="text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: 'white', fontSize: '11px' }}
                formatter={(val) => [`${val} adet`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusDistribution.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-600 text-xs">{s.name}</span>
                </div>
                <span className="text-slate-800 text-xs font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personnel Efficiency */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Personel Performansı</h3>
          <Users size={16} className="text-slate-400" />
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={personnelStats} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={55} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: 'white', fontSize: '11px' }}
              formatter={(val) => [`${val}%`, 'Verimlilik']}
            />
            <Bar dataKey="efficiency" radius={[0, 6, 6, 0]} fill="#3b82f6" name="Verimlilik">
              {personnelStats.map((entry, index) => (
                <Cell key={index} fill={entry.efficiency >= 80 ? '#10b981' : entry.efficiency >= 50 ? '#3b82f6' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Delayed shipments alert */}
      {delayedShipments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-semibold text-red-800">Geciken Sevkiyatlar ({delayedShipments.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {delayedShipments.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-red-200 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-semibold text-slate-800">{s.shipment_no}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(s.status)}`}>{statusLabel(s.status)}</span>
                </div>
                <p className="text-slate-600 text-xs truncate">{s.destination_name}</p>
                <p className="text-red-500 text-xs mt-1">⏰ {formatDate(s.due_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent shipments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Son Sevkiyatlar</h3>
          <Link to="/planning" className="text-blue-600 text-xs hover:text-blue-700 flex items-center gap-1">
            Tümünü Gör <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentShipments.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotColor(s.status)}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-slate-800">{s.shipment_no}</span>
                  <span className="text-xs text-slate-500">{s.order_no}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                  <MapPin size={10} />
                  <span className="truncate">{s.destination_name} · {s.city}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400 hidden sm:block">{formatDate(s.due_date, 'dd.MM.yy')}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor(s.status)}`}>
                  {statusLabel(s.status)}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  {countryTypeLabel(s.country_type)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, color, trend, trendBad }: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'amber' | 'emerald';
  trend: string;
  trendBad?: boolean;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  const trendColors = {
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>{icon}</div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${trendBad ? 'text-red-600 bg-red-50' : trendColors[color]}`}>
          {trend}
        </span>
      </div>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      <p className="text-slate-500 text-sm mt-1 font-medium">{label}</p>
      <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
    </div>
  );
}
