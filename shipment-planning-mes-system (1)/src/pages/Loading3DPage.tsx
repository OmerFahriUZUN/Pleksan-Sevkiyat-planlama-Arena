import React from 'react';
import {
  Boxes, Cpu, BarChart3, Layers, Zap, Clock,
  ChevronRight, ArrowRight, Code2, Globe, Shield
} from 'lucide-react';

const roadmapItems = [
  {
    phase: 'Faz 1',
    title: '3D Görselleştirme',
    desc: 'WebGL/Three.js tabanlı gerçek zamanlı 3 boyutlu araç görselleştirme. Paket boyutları ve konumlarının interaktif gösterimi.',
    icon: <Boxes size={20} />,
    color: 'blue',
    status: 'Planlandı',
    eta: 'Q1 2025',
    features: ['Three.js / WebGL entegrasyonu', 'Gerçek boyutlu paket modelleri', 'Sürükle-bırak konumlandırma', 'Kamera kontrolleri (döndür, yakınlaştır)'],
  },
  {
    phase: 'Faz 2',
    title: 'Bin Packing Optimizasyonu',
    desc: 'Deterministik 3D bin packing algoritması ile maksimum araç kapasitesi kullanımı. Kısıt tabanlı yerleştirme (kırılganlık, istiflenebilirlik).',
    icon: <Cpu size={20} />,
    color: 'violet',
    status: 'Araştırma',
    eta: 'Q2 2025',
    features: ['3D First-Fit-Decreasing algoritması', 'Kırılgan ürün kısıtları', 'Ağırlık dağılımı optimizasyonu', 'Çoklu araç senaryoları'],
  },
  {
    phase: 'Faz 3',
    title: 'Yükleme Simülasyonu',
    desc: 'Adım adım yükleme simülasyonu ve animasyon. Operatör rehberliği için adım adım görsel talimatlar.',
    icon: <BarChart3 size={20} />,
    color: 'emerald',
    status: 'Tasarım',
    eta: 'Q3 2025',
    features: ['Adım adım animasyon', 'Operatör tablet görünümü', 'AR desteği (planlama aşaması)', 'PDF rapor çıktısı'],
  },
  {
    phase: 'Faz 4',
    title: 'Gerçek Zamanlı Entegrasyon',
    desc: 'Barkod tarama ile gerçek zamanlı senkronizasyon. Yükleme anında 3D sahne güncelleme.',
    icon: <Zap size={20} />,
    color: 'amber',
    status: 'Yol Haritası',
    eta: 'Q4 2025',
    features: ['WebSocket senkronizasyonu', 'Barkod → 3D konum güncelleme', 'Sapma algılama & uyarı', 'Tamamlanma doğrulama'],
  },
];

const techStack = [
  { name: 'Three.js', desc: '3D sahne & render', icon: '🎮', category: 'Frontend' },
  { name: 'React Three Fiber', desc: 'React entegrasyonu', icon: '⚛️', category: 'Frontend' },
  { name: 'WebGL 2.0', desc: 'GPU hızlandırmalı render', icon: '🖥️', category: 'Grafik' },
  { name: 'Socket.IO', desc: 'Gerçek zamanlı güncelleme', icon: '⚡', category: 'Backend' },
  { name: 'Node.js Worker', desc: 'Bin packing hesaplama', icon: '🔧', category: 'Backend' },
  { name: 'WASM (Rust)', desc: 'Yüksek perf. algoritma', icon: '🦀', category: 'Optimizasyon' },
];

const statusColors: Record<string, string> = {
  'Planlandı': 'bg-blue-100 text-blue-700',
  'Araştırma': 'bg-violet-100 text-violet-700',
  'Tasarım': 'bg-emerald-100 text-emerald-700',
  'Yol Haritası': 'bg-amber-100 text-amber-700',
};

const phaseColors: Record<string, { bg: string; border: string; icon: string; ring: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', ring: 'ring-blue-200' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-600', ring: 'ring-violet-200' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-200' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600', ring: 'ring-amber-200' },
};

export function Loading3DPage() {
  return (
    <div className="p-4 lg:p-6 space-y-8 max-w-5xl mx-auto">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-8 lg:p-12 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl translate-x-24 -translate-y-24" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-x-16 translate-y-16" />
        </div>

        {/* 3D cube illustration */}
        <div className="absolute right-8 top-8 hidden lg:block opacity-20">
          <div className="relative w-32 h-32">
            {/* Simple CSS 3D box */}
            <div className="absolute inset-0 border-2 border-white rounded-lg transform rotate-12 scale-75" />
            <div className="absolute inset-0 border-2 border-blue-300 rounded-lg transform -rotate-6" />
            <div className="absolute inset-4 border-2 border-indigo-300 rounded-lg" />
          </div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium mb-5 border border-white/20">
            <Clock size={12} className="text-blue-300" />
            <span>Yakında Geliyor</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold mb-3">
            3D Yükleme Modülü
          </h1>
          <p className="text-blue-200 text-lg mb-2 font-medium">
            Coming Soon – 3D Loading Visualization
          </p>
          <p className="text-slate-300 max-w-xl text-sm leading-relaxed">
            Araç içi paket yerleştirmesini üç boyutlu olarak görselleştirin, 
            bin packing algoritmaları ile optimal yükleme planları oluşturun 
            ve gerçek zamanlı tarama entegrasyonu ile yükleme sürecini yönetin.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs border border-white/20">
              <Boxes size={12} className="text-blue-300" />
              <span>3D Görselleştirme</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs border border-white/20">
              <Cpu size={12} className="text-violet-300" />
              <span>Bin Packing AI</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs border border-white/20">
              <Zap size={12} className="text-amber-300" />
              <span>Gerçek Zamanlı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview mockup */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-slate-400 text-xs font-mono">mes-loading-3d.local</span>
        </div>
        <div className="relative h-56 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          {/* Mock 3D visualization */}
          <div className="relative">
            {/* Vehicle outline */}
            <div className="border-2 border-blue-400/50 rounded-xl w-72 h-32 flex items-center justify-center relative overflow-hidden">
              {/* Packages */}
              {[
                { x: 20, y: 20, w: 45, h: 35, color: '#3b82f6', label: 'PKT-1' },
                { x: 75, y: 20, w: 60, h: 35, color: '#f59e0b', label: 'PKT-2' },
                { x: 145, y: 20, w: 40, h: 35, color: '#10b981', label: 'PKT-3' },
                { x: 195, y: 20, w: 50, h: 35, color: '#8b5cf6', label: 'PKT-4' },
                { x: 20, y: 65, w: 80, h: 30, color: '#ef4444', label: 'PALET' },
                { x: 110, y: 65, w: 60, h: 30, color: '#06b6d4', label: 'PKT-5' },
                { x: 180, y: 65, w: 65, h: 30, color: '#f97316', label: 'PKT-6' },
              ].map((box, i) => (
                <div
                  key={i}
                  className="absolute flex items-center justify-center text-white text-xs font-bold rounded opacity-80 border border-white/20"
                  style={{
                    left: box.x,
                    top: box.y,
                    width: box.w,
                    height: box.h,
                    background: box.color,
                    fontSize: '9px',
                  }}
                >
                  {box.label}
                </div>
              ))}

              {/* Labels */}
              <div className="absolute bottom-1 left-2 text-blue-300/60 text-xs">← ÖNDEN</div>
              <div className="absolute bottom-1 right-2 text-blue-300/60 text-xs">ARKADAN →</div>
            </div>

            {/* Dimensions */}
            <div className="absolute -top-5 left-0 right-0 flex justify-between text-slate-400 text-xs">
              <span>←</span>
              <span>6000 mm</span>
              <span>→</span>
            </div>
            <div className="absolute top-0 bottom-0 -left-10 flex items-center">
              <span className="text-slate-400 text-xs transform -rotate-90">2400mm</span>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 bg-blue-600/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
            Önizleme Modu
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-5">Geliştirme Yol Haritası</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmapItems.map((item, idx) => {
            const colors = phaseColors[item.color];
            return (
              <div key={idx} className={`rounded-2xl border p-5 ${colors.bg} ${colors.border}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${colors.icon}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.phase}</p>
                      <h3 className="font-bold text-slate-800">{item.title}</h3>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-400">{item.eta}</span>
                  </div>
                </div>

                <p className="text-slate-600 text-sm mb-3 leading-relaxed">{item.desc}</p>

                <div className="space-y-1">
                  {item.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-xs text-slate-600">
                      <ChevronRight size={11} className="text-slate-400 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech stack */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-5">Planlanan Teknoloji Yığını</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {techStack.map((tech, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{tech.icon}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{tech.name}</p>
                  <p className="text-slate-400 text-xs">{tech.category}</p>
                </div>
              </div>
              <p className="text-slate-600 text-xs">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture note */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Code2 size={18} className="text-blue-400" />
          <h3 className="font-bold">Modüler Mimari Notu</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          3D Yükleme Modülü, mevcut MES sistemine entegre edilmek üzere modüler tasarlanmıştır. 
          Mevcut <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">loading_plan</code> ve{' '}
          <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">packages</code> veritabanı 
          tabloları, 3D koordinat alanları içerecek şekilde genişletilecektir.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'loading_plan', field: '+ position_x, position_y, position_z', icon: <Layers size={14} /> },
            { label: 'packages', field: '+ dim_length, dim_width, dim_height', icon: <Boxes size={14} /> },
            { label: 'vehicle_slots', field: 'Yeni tablo: 3D grid mapping', icon: <Globe size={14} /> },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1 text-blue-400">
                {item.icon}
                <span className="font-mono text-xs font-bold">{item.label}</span>
              </div>
              <p className="text-slate-400 text-xs font-mono">{item.field}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <Shield size={16} className="text-blue-600 flex-shrink-0" />
        <p className="text-blue-700 text-sm">
          Bu modül, sistemin geri kalanı ile tamamen bağımsız çalışacak şekilde tasarlanmıştır. 
          Aktive edilene kadar mevcut iş akışlarını etkilemez.
        </p>
      </div>
    </div>
  );
}
