import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Play, Truck, Boxes,
  Bell, RefreshCw, LogOut, Menu, X, ChevronRight,
  User, Shield, Zap, Package, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatTimeAgo } from '../utils/helpers';

const navItems = [
  { path: '/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
  { path: '/planning', label: 'Planlama', icon: CalendarDays },
  { path: '/execution', label: 'Depo Yürütme', icon: Play },
  { path: '/vehicle-planning', label: 'Araç Planı', icon: Truck },
  { path: '/loading-3d', label: '3D Yükleme', icon: Boxes },
];

const adminNavItems = [
  { path: '/admin', label: 'Yönetici Paneli', icon: Shield },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [syncCountdown, setSyncCountdown] = useState(60);

  const { currentUser, logout, syncStatus, triggerSync, notifications, markNotificationRead, clearNotifications } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncCountdown((prev) => {
        if (prev <= 1) {
          triggerSync();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [triggerSync]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-500" />;
      case 'error': return <X size={14} className="text-red-500" />;
      default: return <Bell size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">MES Sevkiyat</p>
            <p className="text-slate-400 text-xs">Planlama Sistemi</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* ERP Sync Status */}
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="bg-slate-800 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs font-medium">ERP Bağlantısı</span>
              <button
                onClick={triggerSync}
                disabled={syncStatus.syncing}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <RefreshCw size={12} className={syncStatus.syncing ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus.syncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 text-xs">
                {syncStatus.syncing ? 'Senkronize ediliyor…' : `Son: ${formatTimeAgo(syncStatus.last_sync)}`}
              </span>
            </div>
            {!syncStatus.syncing && (
              <div className="mt-1.5">
                <div className="flex justify-between text-slate-500 text-xs mb-0.5">
                  <span>Sonraki sync</span>
                  <span>{syncCountdown}s</span>
                </div>
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(syncCountdown / 60) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={17} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} className="opacity-60" />}
              </Link>
            );
          })}

          {/* Admin Navigation */}
          {currentUser?.role === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Yönetim
                </div>
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                      active
                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={17} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight size={14} className="opacity-60" />}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser?.name ?? 'Kullanıcı'}</p>
              <div className="flex items-center gap-1">
                <Shield size={10} className="text-slate-500" />
                <span className="text-slate-500 text-xs">{currentUser?.role ?? '—'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 text-sm transition-colors"
          >
            <LogOut size={14} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700">
            <Menu size={22} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-slate-500 min-w-0">
            <Zap size={14} className="text-blue-500 flex-shrink-0" />
            <span className="text-slate-400">MES</span>
            <ChevronRight size={12} className="flex-shrink-0" />
            <span className="text-slate-700 font-medium truncate">
              {navItems.find((n) => location.pathname.startsWith(n.path))?.label ?? 'Sayfa'}
            </span>
          </div>

          <div className="flex-1" />

          {/* Notification button */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-800 text-sm">Bildirimler</span>
                  <button onClick={clearNotifications} className="text-slate-400 hover:text-slate-600 text-xs">
                    Temizle
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">Bildirim yok</div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</div>
                        <div className="min-w-0">
                          <p className={`text-sm leading-snug ${!n.read ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatTimeAgo(n.timestamp)}</p>
                        </div>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Notification backdrop */}
      {notifOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
      )}
    </div>
  );
}
