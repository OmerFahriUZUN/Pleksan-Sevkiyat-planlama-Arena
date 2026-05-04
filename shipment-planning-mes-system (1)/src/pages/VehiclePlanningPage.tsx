import React, { useState, useMemo } from 'react';
import {
  Truck, Package, MapPin, Weight, ArrowUpDown, ChevronDown,
  ChevronRight, Plus, Zap, AlertTriangle, CheckCircle2,
  List, MoveVertical, RefreshCw, BarChart3
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  packageTypeLabel, packageTypeIcon, countryTypeLabel, formatDate
} from '../utils/helpers';
import { calculateVehicleUtilization } from '../utils/vehiclePlanning';

export function VehiclePlanningPage() {
  const {
    vehicles, vehicleAssignments, shipments, packages,
    loadingPlans, assignVehicle, generateLoadingPlan, addNotification
  } = useAppStore();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null); // shipment_id

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const vehicleData = useMemo(() => {
    return vehicles.map((v) => {
      const assignments = vehicleAssignments
        .filter((va) => va.vehicle_id === v.id)
        .sort((a, b) => a.delivery_sequence - b.delivery_sequence);

      const assignedShipments = assignments.map((va) => {
        const shipment = shipments.find((s) => s.id === va.shipment_id);
        const pkgs = packages.filter((p) => p.shipment_id === va.shipment_id);
        return { ...va, shipment, pkgs };
      });

      const allPkgs = packages.filter((p) =>
        assignments.some((va) => va.shipment_id === p.shipment_id)
      );

      const totalWeight = allPkgs.reduce((s, p) => s + p.total_weight, 0);
      const totalVolume = allPkgs.reduce((s, p) => s + p.total_volume, 0);
      const capacity = (v.length_mm * v.width_mm * v.height_mm) / 1_000_000;

      const util = calculateVehicleUtilization(allPkgs, v);
      const loadingPlanItems = loadingPlans.filter((lp) => lp.vehicle_id === v.id);

      return {
        vehicle: v,
        assignments: assignedShipments,
        totalWeight,
        totalVolume,
        capacity,
        utilWeight: util.weight_percent,
        utilVolume: util.volume_percent,
        loadingPlanItems,
      };
    });
  }, [vehicles, vehicleAssignments, shipments, packages, loadingPlans]);

  // Unassigned shipments (packaged, not yet assigned)
  const unassignedShipments = useMemo(() => {
    const assignedIds = new Set(vehicleAssignments.map((va) => va.shipment_id));
    return shipments.filter(
      (s) =>
        !assignedIds.has(s.id) &&
        (s.status === 'PACKING' || s.status === 'LOADING') &&
        packages.some((p) => p.shipment_id === s.id)
    );
  }, [shipments, vehicleAssignments, packages]);

  const selectedData = vehicleData.find((vd) => vd.vehicle.id === selectedVehicleId);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Araç Planlama</h1>
          <p className="text-slate-500 text-sm">Sevkiyat-araç eşleştirme ve yükleme sıralaması</p>
        </div>
      </div>

      {/* Unassigned alert */}
      {unassignedShipments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <span className="font-semibold text-amber-800 text-sm">{unassignedShipments.length} sevkiyat araç ataması bekliyor</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassignedShipments.map((s) => (
              <div key={s.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-1.5">
                <span className="font-mono text-xs font-bold text-slate-800">{s.shipment_no}</span>
                <button
                  onClick={() => setAssignModal(s.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Araç Ata
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle list */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Araçlar ({vehicles.length})</p>
          {vehicleData.map((vd) => {
            const selected = selectedVehicleId === vd.vehicle.id;
            const overweight = vd.totalWeight > vd.vehicle.max_weight;
            return (
              <button
                key={vd.vehicle.id}
                onClick={() => setSelectedVehicleId(selected ? null : vd.vehicle.id)}
                className={`w-full text-left bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                  selected ? 'border-blue-400 shadow-blue-100' : overweight ? 'border-red-200' : 'border-slate-200'
                } hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${selected ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      <Truck size={16} className={selected ? 'text-blue-600' : 'text-slate-500'} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{vd.vehicle.plate}</p>
                      <p className="text-slate-500 text-xs">{vd.vehicle.driver_name}</p>
                    </div>
                  </div>
                  {overweight && <AlertTriangle size={14} className="text-red-500" />}
                </div>

                {/* Capacity bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">Ağırlık</span>
                      <span className={`font-medium ${overweight ? 'text-red-600' : 'text-slate-700'}`}>
                        {vd.totalWeight.toFixed(1)} / {vd.vehicle.max_weight} kg
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(vd.utilWeight, 100)}%`,
                          background: overweight ? '#ef4444' : vd.utilWeight > 80 ? '#f59e0b' : '#3b82f6',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">Hacim</span>
                      <span className="text-slate-700 font-medium">{vd.utilVolume.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(vd.utilVolume, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{vd.assignments.length} sevkiyat</span>
                  <span className="text-xs text-slate-400">
                    {Math.round(vd.vehicle.length_mm / 1000)}m × {Math.round(vd.vehicle.width_mm / 1000)}m × {Math.round(vd.vehicle.height_mm / 1000)}m
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Vehicle detail */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedData ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 text-center">
              <Truck size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Araç seçin</p>
              <p className="text-slate-400 text-sm">Sol listeden bir araç seçerek detayları görüntüleyin</p>
            </div>
          ) : (
            <>
              {/* Vehicle info */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{selectedData.vehicle.plate}</h3>
                    <p className="text-slate-500 text-sm">Sürücü: {selectedData.vehicle.driver_name}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-500">Kapasite</p>
                    <p className="font-bold text-slate-800">{selectedData.vehicle.max_weight.toLocaleString()} kg</p>
                    <p className="text-slate-400 text-xs">
                      {Math.round(selectedData.vehicle.length_mm / 1000)}m × {Math.round(selectedData.vehicle.width_mm / 1000)}m × {Math.round(selectedData.vehicle.height_mm / 1000)}m
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Toplam Ağırlık', value: `${selectedData.totalWeight.toFixed(1)} kg`, pct: selectedData.utilWeight, color: '#3b82f6' },
                    { label: 'Hacim Kullanımı', value: `${selectedData.utilVolume.toFixed(0)}%`, pct: selectedData.utilVolume, color: '#10b981' },
                    { label: 'Sevkiyat Sayısı', value: String(selectedData.assignments.length), pct: null, color: '#f59e0b' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 text-xs mb-1">{stat.label}</p>
                      <p className="font-bold text-slate-800">{stat.value}</p>
                      {stat.pct !== null && (
                        <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(stat.pct, 100)}%`, background: stat.color }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery sequence */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MoveVertical size={16} className="text-slate-400" />
                    <h3 className="font-semibold text-slate-800">Teslimat Sırası & Yükleme Planı</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAssignModal('__select__')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-xl border border-blue-200 transition-colors"
                    >
                      <Plus size={12} />
                      Sevkiyat Ekle
                    </button>
                    <button
                      onClick={() => generateLoadingPlan(selectedVehicleId!)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-xl border border-emerald-200 transition-colors"
                    >
                      <Zap size={12} />
                      Plan Oluştur
                    </button>
                  </div>
                </div>

                {selectedData.assignments.length === 0 ? (
                  <div className="py-10 text-center bg-slate-50 rounded-xl">
                    <Package size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 text-sm">Henüz sevkiyat atanmamış</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Legend */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 px-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-2 rounded bg-slate-200" />
                        <span>← Araç Önü (Son Teslim)</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span>(İlk Teslim) Araç Arkası →</span>
                        <div className="w-4 h-2 rounded bg-blue-300" />
                      </div>
                    </div>

                    {/* Delivery sequence visualization */}
                    <div className="relative">
                      {/* Truck outline */}
                      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-3 overflow-x-auto">
                        <div className="flex items-center gap-2 min-w-max">
                          <div className="flex-shrink-0 text-center">
                            <div className="text-2xl">🚛</div>
                            <p className="text-xs text-slate-400 mt-1">Önü</p>
                          </div>
                          {selectedData.assignments.map((va, idx) => {
                            const pkgsCount = va.pkgs.length;
                            const totalW = va.pkgs.reduce((s, p) => s + p.total_weight, 0);
                            return (
                              <React.Fragment key={va.id}>
                                <div className="text-slate-300 text-xs">▶</div>
                                <div
                                  className="flex-shrink-0 bg-white border-2 border-slate-300 rounded-xl p-3 text-center hover:border-blue-400 transition-colors"
                                  style={{ minWidth: '120px' }}
                                >
                                  <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block">
                                    #{va.delivery_sequence}
                                  </div>
                                  <p className="font-mono font-bold text-slate-800 text-xs">{va.shipment?.shipment_no}</p>
                                  <p className="text-slate-500 text-xs truncate mt-0.5" style={{ maxWidth: '100px' }}>{va.shipment?.destination_name}</p>
                                  <p className="text-slate-400 text-xs mt-1">{pkgsCount} paket · {totalW.toFixed(0)} kg</p>
                                </div>
                              </React.Fragment>
                            );
                          })}
                          <div className="text-slate-300 text-xs">▶</div>
                          <div className="flex-shrink-0 text-center">
                            <div className="text-xl">🏭</div>
                            <p className="text-xs text-slate-400 mt-1">Depolar</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Loading plan table */}
                    {selectedData.loadingPlanItems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">Yükleme Sırası</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 rounded-l-lg">#</th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Paket ID</th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Tip</th>
                                <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 rounded-r-lg">Ağırlık</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {selectedData.loadingPlanItems
                                .sort((a, b) => a.load_sequence - b.load_sequence)
                                .map((lp) => {
                                  const pkg = packages.find((p) => p.id === lp.package_id);
                                  if (!pkg) return null;
                                  return (
                                    <tr key={lp.id} className="hover:bg-slate-50">
                                      <td className="px-3 py-2">
                                        <span className="w-6 h-6 bg-blue-100 text-blue-800 text-xs font-bold rounded-full flex items-center justify-center">
                                          {lp.load_sequence}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 font-mono text-xs text-slate-600">{pkg.id.slice(-8)}</td>
                                      <td className="px-3 py-2">
                                        <span className="flex items-center gap-1.5 text-xs text-slate-700">
                                          <span>{packageTypeIcon(pkg.package_type)}</span>
                                          {packageTypeLabel(pkg.package_type)}
                                          {pkg.stretch_wrap && <span className="text-blue-500 text-xs">(Streç)</span>}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-right text-slate-700 text-xs font-medium">{pkg.total_weight.toFixed(1)} kg</td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assign modal */}
      {assignModal && (
        <VehicleAssignModal
          vehicleId={selectedVehicleId!}
          unassignedShipments={assignModal === '__select__' ? unassignedShipments : unassignedShipments}
          shipmentId={assignModal !== '__select__' ? assignModal : undefined}
          onAssign={(shipmentId) => {
            assignVehicle(shipmentId, selectedVehicleId!);
            setAssignModal(null);
          }}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  );
}

function VehicleAssignModal({
  vehicleId, unassignedShipments, shipmentId, onAssign, onClose
}: {
  vehicleId: string;
  unassignedShipments: any[];
  shipmentId?: string;
  onAssign: (shipmentId: string) => void;
  onClose: () => void;
}) {
  const { shipments, packages } = useAppStore();
  const allShipments = shipments.filter(
    (s) => s.status !== 'SHIPPED' && s.status !== 'PLANNED'
  );
  const displayList = shipmentId ? allShipments.filter((s) => s.id === shipmentId) : unassignedShipments;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 z-10 max-h-[80vh] flex flex-col">
        <h3 className="font-bold text-slate-800 mb-1">Sevkiyat Ata</h3>
        <p className="text-slate-500 text-sm mb-4">Araca eklenecek sevkiyatı seçin</p>

        <div className="overflow-y-auto flex-1 space-y-2">
          {displayList.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Atanabilecek sevkiyat yok</p>
          ) : (
            displayList.map((s: any) => {
              const pkgs = packages.filter((p) => p.shipment_id === s.id);
              const totalW = pkgs.reduce((sum: number, p: any) => sum + p.total_weight, 0);
              return (
                <button
                  key={s.id}
                  onClick={() => onAssign(s.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-800 text-sm">{s.shipment_no}</span>
                    <span className="text-xs text-slate-500">{pkgs.length} paket</span>
                  </div>
                  <p className="text-slate-600 text-xs truncate">{s.destination_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={10} className="text-slate-400" />
                    <span className="text-slate-400 text-xs">{s.city}</span>
                    <Weight size={10} className="text-slate-400 ml-1" />
                    <span className="text-slate-400 text-xs">{totalW.toFixed(1)} kg</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
          İptal
        </button>
      </div>
    </div>
  );
}
