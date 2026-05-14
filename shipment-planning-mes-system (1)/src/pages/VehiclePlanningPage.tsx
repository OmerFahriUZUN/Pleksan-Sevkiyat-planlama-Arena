import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Weight, RefreshCw, Box, ChevronRight, Package, GripVertical } from 'lucide-react';
import { shipmentPlansAPI, vehiclesAPI, handleApiError } from '../services';
import { formatWeight, formatVolume } from '../utils/helpers';
import { Vehicle3DView } from '../components/Vehicle3DView';
import type { ShipmentPlan, Vehicle } from '../types';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#14B8A6',
];

interface AssignedShipment {
  shipmentId: string;
  sevkiyat_no: string;
  cari_ad: string;
  toplam_koli: number;
  toplam_agirlik_kg: number;
  toplam_hacim_m3: number;
  weightPercentage: number;
  volumePercentage: number;
}

interface VehicleCard {
  vehicle: Vehicle;
  shipments: AssignedShipment[];
  totalWeightPercent: number;
  totalVolumePercent: number;
}

export function VehiclePlanningPage() {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [placementData, setPlacementData] = useState<any>(null);
  const [placementLoading, setPlacementLoading] = useState(false);
  const [vehicleCards, setVehicleCards] = useState<VehicleCard[]>([]);
  const [draggedShipmentId, setDraggedShipmentId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => { loadData(); }, []);

  const calculateVehicleCapacity = (vehicle: Vehicle) => {
    const totalVolume = (Number(vehicle.ic_uzunluk_mm) * Number(vehicle.ic_genislik_mm) * Number(vehicle.ic_yukseklik_mm)) / 1000000000;
    return {
      maxWeight: Number(vehicle.max_agirlik_kg) || 20000,
      maxVolume: totalVolume,
    };
  };

  const buildAssignmentMap = (shipmentsList: ShipmentPlan[], vehiclesList: Vehicle[]) => {
    const assigned: Record<string, AssignedShipment[]> = {};

    shipmentsList.forEach((shipment) => {
      (shipment.vehicle_assignments || []).forEach((assignment) => {
        const vehicle = vehiclesList.find((v) => v.id === assignment.vehicle_id);
        if (!vehicle) return;

        const cap = calculateVehicleCapacity(vehicle);
        const assignedWeight = Number(shipment.toplam_agirlik_kg) * (assignment.load_percentage / 100 || 1);
        const assignedVolume = Number(shipment.toplam_hacim_m3) * (assignment.load_percentage / 100 || 1);
        const weightPercentage = cap.maxWeight > 0 ? (assignedWeight / cap.maxWeight) * 100 : 0;
        const volumePercentage = cap.maxVolume > 0 ? (assignedVolume / cap.maxVolume) * 100 : 0;

        assigned[assignment.vehicle_id] = assigned[assignment.vehicle_id] || [];
        assigned[assignment.vehicle_id].push({
          shipmentId: shipment.id,
          sevkiyat_no: shipment.sevkiyat_no,
          cari_ad: shipment.cari_ad,
          toplam_koli: shipment.toplam_koli,
          toplam_agirlik_kg: shipment.toplam_agirlik_kg,
          toplam_hacim_m3: shipment.toplam_hacim_m3,
          weightPercentage,
          volumePercentage,
        });
      });
    });

    return assigned;
  };

  const buildVehicleCards = useCallback((vehiclesList: Vehicle[], assigned: Record<string, AssignedShipment[]>) => {
    return vehiclesList
      .filter((v) => v.isActive)
      .map((vehicle) => {
        const vAssignments = assigned[vehicle.id] || [];
        const totalWeightPct = vAssignments.reduce((s, a) => s + a.weightPercentage, 0);
        const totalVolumePct = vAssignments.reduce((s, a) => s + a.volumePercentage, 0);
        return {
          vehicle,
          shipments: vAssignments,
          totalWeightPercent: Math.min(100, totalWeightPct),
          totalVolumePercent: Math.min(100, totalVolumePct),
        };
      });
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    setSaveMsg('');
    try {
      const [sData, vData] = await Promise.all([
        shipmentPlansAPI.getAll(),
        vehiclesAPI.getAll()
      ]);
      const filtered = sData.filter((s) => s.status !== 'cancelled' && s.status !== 'shipped');
      setShipments(filtered);
      setVehicles(vData);

      const assignmentMap = buildAssignmentMap(filtered, vData);
      setVehicleCards(buildVehicleCards(vData, assignmentMap));

      if (!selectedShipmentId && filtered.length > 0) {
        setSelectedShipmentId(filtered[0].id);
      }
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

  // Drag & Drop handlers
  const handleDragStart = (shipmentId: string) => {
    setDraggedShipmentId(shipmentId);
  };

  const handleDropOnVehicle = async (vehicleId: string) => {
    if (!draggedShipmentId) return;

    const shipment = shipments.find((s) => s.id === draggedShipmentId);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!shipment || !vehicle) {
      setDraggedShipmentId(null);
      return;
    }

    const cap = calculateVehicleCapacity(vehicle);
    const weightPct = (Number(shipment.toplam_agirlik_kg) / cap.maxWeight) * 100;
    const volPct = (Number(shipment.toplam_hacim_m3) / cap.maxVolume) * 100;

    const alreadyAssignedToTarget = (shipment.vehicle_assignments || []).some((assignment) => assignment.vehicle_id === vehicleId);
    const alreadyAssignedAnywhere = (shipment.vehicle_assignments || []).some((assignment) => assignment.vehicle_id && assignment.vehicle_id !== vehicleId);
    if (alreadyAssignedToTarget) {
      setError('Bu sevkiyat zaten bu araca atanmış.');
      setDraggedShipmentId(null);
      return;
    }
    if (alreadyAssignedAnywhere) {
      setError('Bu sevkiyat zaten başka bir araca atanmış.');
      setDraggedShipmentId(null);
      return;
    }

    const existingAssignments = vehicleCards.find((vc) => vc.vehicle.id === vehicleId)?.shipments || [];
    const currentTotalWeight = existingAssignments.reduce((s, a) => s + a.weightPercentage, 0);
    const currentTotalVol = existingAssignments.reduce((s, a) => s + a.volumePercentage, 0);

    if (currentTotalWeight + weightPct > 100) {
      setError(`Araç max ağırlık kapasitesi aşılıyor! Mevcut: %${currentTotalWeight.toFixed(1)} + Eklenecek: %${weightPct.toFixed(1)}`);
      setDraggedShipmentId(null);
      return;
    }

    if (currentTotalVol + volPct > 100) {
      setError(`Araç max hacim kapasitesi aşılıyor! Mevcut: %${currentTotalVol.toFixed(1)} + Eklenecek: %${volPct.toFixed(1)}`);
      setDraggedShipmentId(null);
      return;
    }

    // Save assignment to backend
    try {
      setSaveMsg(`${shipment.sevkiyat_no} → ${vehicle.plaka} atanıyor...`);
      await shipmentPlansAPI.assignShipmentToVehicle(
        draggedShipmentId,
        vehicleId,
        vehicle.plaka,
        vehicle.sofor_adi,
        100,
      );
      await shipmentPlansAPI.generateLoadingSequence(draggedShipmentId);
      await loadData();
      if (selectedShipmentId) {
        loadPlacement(selectedShipmentId);
      }
      setSaveMsg(`${shipment.sevkiyat_no} başarıyla ${vehicle.plaka}'a atandı!`);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setError(handleApiError(err));
    }

    setDraggedShipmentId(null);
  };

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId);

  const build3DBlocks = (assignment: any) => {
    if (!assignment?.blocks) return [];
    return assignment.blocks.map((b: any, idx: number) => ({
      id: b.id || `block-${idx}`,
      product_code: b.product_code || '',
      product_name: b.product_name || '',
      x: b.x_mm ?? 0,
      y: b.y_mm ?? 0,
      z: b.z_mm ?? 0,
      width: b.width_mm ?? 1000,
      depth: b.depth_mm ?? 1000,
      height: b.height_mm ?? 1000,
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Araç Planlama</h1>
          <p className="text-slate-500 text-sm">Sevkiyatları araç kartlarına sürükleyip bırakarak planlayın</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Yenile
          </button>
          <Link to="/vehicle-list" className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors">
            <Truck size={15} /> Araç Listesi
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {saveMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{saveMsg}</div>
      )}

      {/* Vehicle Cards - Drop Targets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vehicleCards.map((card) => {
          const isOver = draggedShipmentId !== null;
          return (
            <div
              key={card.vehicle.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOnVehicle(card.vehicle.id)}
              className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${
                isOver ? 'border-blue-400 bg-blue-50/50 shadow-lg scale-[1.02]' : 'border-slate-200'
              } ${card.totalWeightPercent >= 100 ? 'opacity-80' : ''}`}
            >
              {/* Vehicle Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck size={18} className={card.vehicle.status === 'available' ? 'text-green-500' : 'text-orange-400'} />
                    <div>
                      <span className="font-bold text-slate-800">{card.vehicle.plaka}</span>
                      <span className="text-xs text-slate-400 ml-2">{card.vehicle.sofor_adi}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    card.totalWeightPercent >= 100 ? 'bg-red-100 text-red-700' :
                    card.totalWeightPercent >= 80 ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    %{card.totalWeightPercent.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Capacity Bars */}
              <div className="px-4 py-2 space-y-1.5">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                    <span>Ağırlık Kapasitesi</span>
                    <span>{card.totalWeightPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        card.totalWeightPercent >= 100 ? 'bg-red-500' :
                        card.totalWeightPercent >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, card.totalWeightPercent)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                    <span>Hacim Kapasitesi</span>
                    <span>{card.totalVolumePercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        card.totalVolumePercent >= 100 ? 'bg-red-500' :
                        card.totalVolumePercent >= 80 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, card.totalVolumePercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Assigned Shipments */}
              <div className="px-4 pb-3 space-y-1.5 max-h-40 overflow-y-auto">
                {card.shipments.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-2 border border-dashed border-slate-200 rounded-lg">
                    Sevkiyat sürükleyin
                  </div>
                ) : (
                  card.shipments.map((as) => (
                    <div key={as.shipmentId} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <div className="min-w-0">
                        <span className="font-medium text-slate-700">{as.sevkiyat_no}</span>
                        <span className="text-slate-400 ml-1">({as.cari_ad})</span>
                      </div>
                      <span className="text-slate-500">{as.toplam_koli} koli</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Shipments + 3D View */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sol: Sevkiyat Listesi (Drag kaynağı) */}
        <div className="xl:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Sevkiyatlar ({shipments.length})</h2>

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
                <div
                  key={s.id}
                  draggable
                  onDragStart={() => handleDragStart(s.id)}
                  className={`cursor-grab active:cursor-grabbing w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedShipmentId === s.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                  } ${draggedShipmentId === s.id ? 'opacity-50 border-dashed' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1" onClick={() => handleSelectShipment(s.id)}>
                      <div className="flex items-center gap-2 mb-1">
                        <GripVertical size={14} className="text-slate-300 flex-shrink-0 cursor-grab" />
                        <span className="font-semibold text-slate-800 text-sm truncate">{s.sevkiyat_no}</span>
                        {getStatusBadge(s.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="truncate">{s.cari_ad}</span>
                        {(s.vehicle_assignments?.length || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Araç Atandı</span>
                        )}
                      </div>
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: 3D Görünüm */}
        <div className="xl:col-span-2 space-y-4">
          {!selectedShipmentId ? (
            <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Truck size={48} className="text-slate-300 mb-3" />
              <p className="text-slate-400 font-medium">Sevkiyat seçin veya sürükleyin</p>
              <p className="text-slate-300 text-sm mt-1">3D araç yerleşim görünümü için sol listeden bir sevkiyat seçin</p>
            </div>
          ) : placementLoading ? (
            <div className="flex flex-col items-center justify-center h-96 bg-slate-900 rounded-2xl">
              <RefreshCw size={32} className="text-blue-400 animate-spin mb-3" />
              <p className="text-slate-400 text-sm">3D yerleşim hesaplanıyor...</p>
            </div>
          ) : placementData?.assignments?.length > 0 ? (
            <div className="space-y-4">
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

              {placementData.assignments.map((assignment: any) => {
                const blocks = build3DBlocks(assignment);
                const vehicleDims = {
                  length: assignment.vehicle_length_mm || assignment.dimensions?.length_mm || 4200,
                  width: assignment.vehicle_width_mm || assignment.dimensions?.width_mm || 2100,
                  height: assignment.vehicle_height_mm || assignment.dimensions?.height_mm || 2200,
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
