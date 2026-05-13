import { useState, useEffect } from 'react';
import { Truck, MapPin, Weight, RefreshCw, Box, ChevronRight, Package, User } from 'lucide-react';
import { shipmentPlansAPI, vehiclesAPI, handleApiError } from '../services';
import { formatWeight, formatVolume } from '../utils/helpers';
import { Vehicle3DView } from '../components/Vehicle3DView';
import type { ShipmentPlan, Vehicle } from '../types';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#14B8A6',
];

export function VehiclePlanningPage() {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [placementData, setPlacementData] = useState<any>(null);
  const [placementLoading, setPlacementLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sData, vData] = await Promise.all([
        shipmentPlansAPI.getAll(),
        vehiclesAPI.getAll()
      ]);
      setShipments(sData.filter((s) => s.status !== 'cancelled'));
      setVehicles(vData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadPlacement = async (shipmentId: string) => {
    setPlacementLoading(true);
    setPlacementData(null);
    try {
      const data = await shipmentPlansAPI.getVehiclePlacement(shipmentId);
      setPlacementData(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setPlacementLoading(false);
    }
  };

  const handleSelectShipment = (id: string) => {
    setSelectedShipmentId(id);
    loadPlacement(id);
  };

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId);

  // Placement verisinden 3D blokları oluştur
  const build3DBlocks = (assignment: any) => {
    if (!assignment?.blocks) return [];
    return assignment.blocks.map((b: any, idx: number) => ({
      id: b.id || `block-${idx}`,
      product_code: b.product_code || '',
      product_name: b.product_name || '',
      x: b.x ?? 0,
      y: b.y ?? 0,
      z: b.z ?? 0,
      width: b.width ?? 1000,
      depth: b.depth ?? 1000,
      height: b.height ?? 1000,
      color: COLORS[idx % COLORS.length],
      sequence_order: b.sequence_order ?? idx + 1,
      box_count: b.box_count ?? 0,
      weight_kg: b.weight_kg ?? 0,
    }));
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      erp_imported: { label: 'ERP İthal', cls: 'bg-slate-100 text-slate-600' },
      ready_for_planning: { label: 'Planlamaya Hazır', cls: 'bg-blue-100 text-blue-700' },
      planned: { label: 'Planlandı', cls: 'bg-indigo-100 text-indigo-700' },
      picking: { label: 'Toplama', cls: 'bg-yellow-100 text-yellow-700' },
      packing: { label: 'Paketleme', cls: 'bg-orange-100 text-orange-700' },
      loading: { label: 'Yükleme', cls: 'bg-purple-100 text-purple-700' },
      shipped: { label: 'Sevk Edildi', cls: 'bg-green-100 text-green-700' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Araç Planlama</h1>
          <p className="text-slate-500 text-sm">Sevkiyat-araç eşleştirme ve 3D yükleme görünümü</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Yenile
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sol: Sevkiyat Listesi */}
        <div className="xl:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Sevkiyatlar</h2>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sevkiyat bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {shipments.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectShipment(s.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedShipmentId === s.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800 text-sm truncate">{s.sevkiyat_no}</span>
                        {getStatusBadge(s.status)}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{s.cari_ad}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />{s.cari_sehir || s.nakliye_yeri}
                        </span>
                        <span className="flex items-center gap-1">
                          <Box size={10} />{s.toplam_koli} koli
                        </span>
                        <span className="flex items-center gap-1">
                          <Weight size={10} />{formatWeight(s.toplam_agirlik_kg)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`flex-shrink-0 mt-1 transition-colors ${selectedShipmentId === s.id ? 'text-blue-500' : 'text-slate-300'}`} />
                  </div>

                  {/* Araç atama durumu */}
                  {s.vehicle_assignments && s.vehicle_assignments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                      <Truck size={11} className="text-green-500" />
                      <span className="text-green-600 font-medium">{s.vehicle_assignments[0].plate}</span>
                      <span>·</span>
                      <User size={11} />
                      <span>{s.vehicle_assignments[0].driver_name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Araç Özeti */}
          {vehicles.length > 0 && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Araçlar ({vehicles.length})</h2>
              <div className="space-y-1.5">
                {vehicles.map(v => (
                  <div key={v.id} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <Truck size={13} className={v.status === 'available' ? 'text-green-500' : 'text-orange-400'} />
                      <span className="font-medium text-slate-700">{v.plaka}</span>
                      <span className="text-slate-400">{v.sofor_adi}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      v.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {v.status === 'available' ? 'Müsait' : 'Meşgul'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ: 3D Görünüm */}
        <div className="xl:col-span-2 space-y-4">
          {!selectedShipmentId ? (
            <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Truck size={48} className="text-slate-300 mb-3" />
              <p className="text-slate-400 font-medium">Sevkiyat seçin</p>
              <p className="text-slate-300 text-sm mt-1">3D araç yerleşim görünümü için sol listeden bir sevkiyat seçin</p>
            </div>
          ) : placementLoading ? (
            <div className="flex flex-col items-center justify-center h-96 bg-slate-900 rounded-2xl">
              <RefreshCw size={32} className="text-blue-400 animate-spin mb-3" />
              <p className="text-slate-400 text-sm">3D yerleşim hesaplanıyor...</p>
            </div>
          ) : placementData?.assignments?.length > 0 ? (
            <div className="space-y-4">
              {/* Sevkiyat Özeti */}
              {selectedShipment && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800">{selectedShipment.sevkiyat_no}</h3>
                      <p className="text-sm text-slate-500">{selectedShipment.cari_ad} · {selectedShipment.nakliye_yeri}</p>
                    </div>
                    {getStatusBadge(selectedShipment.status)}
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {[
                      { label: 'Koli', value: selectedShipment.toplam_koli },
                      { label: 'Palet', value: selectedShipment.toplam_palet },
                      { label: 'Ağırlık', value: formatWeight(selectedShipment.toplam_agirlik_kg) },
                      { label: 'Hacim', value: formatVolume(selectedShipment.toplam_hacim_m3) },
                    ].map(item => (
                      <div key={item.label} className="text-center bg-slate-50 rounded-lg py-2">
                        <p className="text-xs text-slate-400">{item.label}</p>
                        <p className="font-semibold text-slate-700 text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3D Görünüm - Her araç için */}
              {placementData.assignments.map((assignment: any) => {
                const blocks = build3DBlocks(assignment);
                const vehicleDims = {
                  length: assignment.vehicle_length_mm || 4200,
                  width: assignment.vehicle_width_mm || 2100,
                  height: assignment.vehicle_height_mm || 2200,
                };
                return (
                  <div key={assignment.vehicle_assignment_id}>
                    <Vehicle3DView
                      blocks={blocks}
                      vehicle={vehicleDims}
                      utilization={assignment.utilization || 0}
                      plate={assignment.plate || ''}
                      driverName={assignment.driver_name || ''}
                    />

                    {/* Araç detay istatistikleri */}
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-400 mb-1">Hacim Kullanımı</p>
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, assignment.utilization || 0)}%`,
                              background: (assignment.utilization || 0) > 90 ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                        <p className="font-bold text-slate-700">%{(assignment.utilization || 0).toFixed(1)}</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-400 mb-1">Toplam Ağırlık</p>
                        <p className="font-bold text-slate-700">{formatWeight(assignment.total_weight_kg || 0)}</p>
                        <p className="text-xs text-slate-400">/ {formatWeight(assignment.max_weight_kg || 3500)}</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-400 mb-1">Blok Sayısı</p>
                        <p className="font-bold text-slate-700">{blocks.length}</p>
                        <p className="text-xs text-slate-400">yerleşim bloğu</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-2xl border border-slate-200">
              <Box size={40} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">3D yerleşim verisi yok</p>
              <p className="text-slate-400 text-sm mt-1">Bu sevkiyata araç atanmamış veya yükleme sırası oluşturulmamış</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
