import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { authAPI, handleApiError } from '../services';
import type { AuthUser } from '../types';

const DEMO_USERS: (AuthUser & { password: string })[] = [
  { id: 'u1', username: 'admin', fullName: 'Admin Kullanıcı', role: 'admin', email: 'admin@pleksan.com', password: 'Admin123!' },
  { id: 'u2', username: 'planner01', fullName: 'Ahmet Planlayıcı', role: 'planner', email: 'planner01@pleksan.com', password: 'Planner123!' },
  { id: 'u3', username: 'warehouse01', fullName: 'Depo Operatörü', role: 'warehouse', email: 'warehouse01@pleksan.com', password: 'Warehouse123!' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, initializeData } = useAppStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ username, password });
      login(response.user);
      initializeData();
      // Admin kullanıcıları admin paneline yönlendir
      if (response.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl mb-4">
              <Package size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">MES Sevkiyat Sistemi</h1>
            <p className="text-slate-400 text-sm mt-1">Üretim Yürütme Sistemi</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullaniciadi"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Şifre</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-lg shadow-blue-900/50 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-slate-500 text-xs text-center mb-3">Demo Hesaplar</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setUsername(u.username); setPassword(u.password); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-colors"
                >
                  <ShieldCheck size={14} className="mx-auto mb-1 text-blue-400" />
                  <p className="text-white text-xs font-medium">{u.role}</p>
                  <p className="text-slate-500 text-xs truncate">{u.password}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-slate-400">
            Hesabınız yok mu?{' '}
            <Link
              to="/register"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Kayıt olun
            </Link>
          </p>
        </div>

        {/* Version */}
        <p className="text-center text-slate-600 text-xs mt-4">MES v2.0 · PostgreSQL + MSSQL ERP Entegrasyonu</p>
      </div>
    </div>
  );
}
