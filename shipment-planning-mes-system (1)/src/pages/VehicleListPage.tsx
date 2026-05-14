import { useState, useEffect } from 'react';
import { Truck, Plus, Edit3, Trash2, RefreshCw, Save, X, Search } from 'lucide-react';
import { vehiclesAPI, handleApiError } from '../services';
import type { Vehicle } from '../types';

const emptyVehicle = {
  arac_tipi: '',
  plaka: '',
  sofor_adi: '',
  sofor_telefon: '',
  ic_uzunluk_mm: 6000,
  ic_genislik_mm: 2400,
  ic_yukseklik_mm: 2500,
  max_agirlik_kg: 20000,
  palet_kapasitesi: 33,
  status: 'available' as Vehicle['status'],
};

interface VehicleFormData {
  arac_tipi: string;
  plaka: string;
  sofor_adi: string;
  sofor_telefon: string;
  ic_uzunluk_mm: number;
  ic_genislik_mm: number;
  ic_yukseklik_mm: number;
  max_agirlik_kg: number;
  palet_kapasitesi: number;
  status: Vehicle['status'];
}

export function VehicleListPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({ ...emptyVehicle });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehiclesAPI.getAll();
      setVehicles(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...emptyVehicle });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (v: Vehicle) => {
    setFormData({
      arac_tipi: v.arac_tipi,
      plaka: v.plaka,
      sofor_adi: v.sofor_adi,
      sofor_telefon: v.sofor_telefon || '',
      ic_uzunluk_mm: v.ic_uzunluk_mm || 6000,
      ic_genislik_mm: v.ic_genislik_mm || 2400,
      ic_yukseklik_mm: v.ic_yukseklik_mm || 2500,
      max_agirlik_kg: v.max_agirlik_kg,
      palet_kapasitesi: v.palet_kapasitesi || 33,
      status: v.status,
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.plaka.trim() || !formData.sofor_adi.trim()) {
      setError('Plaka ve şoför adı zorunludur.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await vehiclesAPI.update(editingId, formData);
      } else {
        await vehiclesAPI.create(formData);
      }
      resetForm();
      await loadVehicles();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, plaka: string) => {
    if (!window.confirm(`${plaka} plakalı aracı pasife almak istediğinize emin misiniz?`)) return;
    try {
      await vehiclesAPI.delete(id);
      await loadVehicles();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: Vehicle['status']) => {
    const newStatus = currentStatus === 'available' ? 'maintenance' : 'available';
    try {
      await vehiclesAPI.updateStatus(id, newStatus);
      await loadVehicles();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const filtered = vehicles.filter((v) =>
    !searchTerm ||
    v.plaka.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.sofor_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.arac_tipi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Araç Listesi</h1>
          <p className="text-slate-500 text-sm">{vehicles.length} araç kayıtlı</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadVehicles} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Yenile
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            <Plus size={15} />Yeni Araç
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Plaka, şoför veya araç tipi ara..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 text-slate-700 placeholder-slate-400" />
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Plaka *</label>
                <input type="text" value={formData.plaka} onChange={(e) => setFormData(p => ({ ...p, plaka: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" placeholder="34 ABC 123" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Şoför Adı *</label>
                <input type="text" value={formData.sofor_adi} onChange={(e) => setFormData(p => ({ ...p, sofor_adi: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" placeholder="Ahmet Yılmaz" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Araç Tipi</label>
                <input type="text" value={formData.arac_tipi} onChange={(e) => setFormData(p => ({ ...p, arac_tipi: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" placeholder="Kamyon" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Şoför Telefon</label>
                <input type="text" value={formData.sofor_telefon} onChange={(e) => setFormData(p => ({ ...p, sofor_telefon: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" placeholder="+90 555 123 4567" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">İç Uzunluk (mm)</label>
                <input type="number" value={formData.ic_uzunluk_mm} onChange={(e) => setFormData(p => ({ ...p, ic_uzunluk_mm: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">İç Genişlik (mm)</label>
                <input type="number" value={formData.ic_genislik_mm} onChange={(e) => setFormData(p => ({ ...p, ic_genislik_mm: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">İç Yükseklik (mm)</label>
                <input type="number" value={formData.ic_yukseklik_mm} onChange={(e) => setFormData(p => ({ ...p, ic_yukseklik_mm: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Maks. Ağırlık (kg)</label>
                <input type="number" value={formData.max_agirlik_kg} onChange={(e) => setFormData(p => ({ ...p, max_agirlik_kg: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Palet Kapasitesi</label>
                <input type="number" value={formData.palet_kapasitesi} onChange={(e) => setFormData(p => ({ ...p, palet_kapasitesi: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Durum</label>
                <select value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as Vehicle['status'] }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="available">Müsait</option>
                  <option value="in_operation">Operasyonda</option>
                  <option value="maintenance">Bakımda</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">İptal</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl disabled:opacity-50">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {editingId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <Truck size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Araç bulunamadı</p>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="mt-3 text-blue-600 hover:underline text-sm">Yeni araç ekle</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Plaka</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Şoför</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Araç Tipi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Boyutlar (mm)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Max Ağırlık</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Durum</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-slate-400" />
                      <span className="font-semibold text-slate-800 text-sm">{v.plaka}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{v.sofor_adi}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{v.arac_tipi}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                    {v.ic_uzunluk_mm}x{v.ic_genislik_mm}x{v.ic_yukseklik_mm}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 text-right">{v.max_agirlik_kg} kg</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleStatusToggle(v.id, v.status)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${
                        v.status === 'available' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                        v.status === 'in_operation' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={v.status === 'available' ? 'Bakıma al' : 'Müsait yap'}
                    >
                      {v.status === 'available' ? 'Müsait' : v.status === 'in_operation' ? 'Operasyonda' : 'Bakımda'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(v)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Düzenle">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(v.id, v.plaka)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Pasife Al">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
