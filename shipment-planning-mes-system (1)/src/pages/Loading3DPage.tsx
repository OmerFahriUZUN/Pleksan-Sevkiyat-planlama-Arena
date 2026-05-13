import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, RefreshCw, Package, Truck, Layers, Zap, Clock, AlertTriangle } from 'lucide-react';
import { shipmentPlansAPI, handleApiError } from '../services';
import type { ShipmentPlan, VehiclePlacementResult, VehiclePlacementAssignment, VehiclePlacementBlock } from '../types';

const VEHICLE_SCALE = 0.08;
const VEHICLE_LENGTH_PX = 6000 * VEHICLE_SCALE;
const VEHICLE_WIDTH_PX = 2400 * VEHICLE_SCALE;
const VEHICLE_HEIGHT_MM = 2500;

const sampleColors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

function formatVolume(value: number) {
  return `${value.toFixed(2)} m³`;
}

function formatWeight(value: number) {
  return `${value.toFixed(1)} kg`;
}

export function Loading3DPage() {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([]);
  const [placement, setPlacement] = useState<VehiclePlacementResult | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadShipmentPool();
  }, []);

  useEffect(() => {
    if (selectedShipmentId) {
      loadPlacement(selectedShipmentId);
    }
  }, [selectedShipmentId]);

  const loadShipmentPool = async () => {
    try {
      setLoading(true);
      const data = await shipmentPlansAPI.getAll({ status: 'erp_imported' });
      setShipments(data);
      if (!selectedShipmentId && data.length > 0) {
        setSelectedShipmentId(data[0].id);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadPlacement = async (id: string) => {
    try {
      setLoading(true);
      const result = await shipmentPlansAPI.getVehiclePlacement(id);
      setPlacement(result);
    } catch (err) {
      setError(handleApiError(err));
      setPlacement(null);
    } finally {
      setLoading(false);
    }
  };

  const selectedShipment = shipments.find((shipment) => shipment.id === selectedShipmentId) || shipments[0] || null;
  const assignment = placement?.assignments?.[0] || null;

  const hasPlacement = Boolean(assignment && assignment.blocks.length > 0);

  const sortedAssignments = useMemo(() => {
    return placement?.assignments || [];
  }, [placement]);

  const renderBlock = (block: VehiclePlacementBlock, index: number) => {
    return (
      <div
        key={block.id}
        className="absolute rounded-xl border border-white/20 text-[10px] text-white font-semibold flex items-center justify-center opacity-90"
        style={{
          left: `${block.x_mm * VEHICLE_SCALE}px`,
          top: `${block.y_mm * VEHICLE_SCALE}px`,
          width: `${block.width_mm * VEHICLE_SCALE}px`,
          height: `${block.depth_mm * VEHICLE_SCALE}px`,
          background: block.color,
        }}
        title={`${block.product_code} · ${block.product_name} · Z:${block.z_mm}mm`}
      >
        {index + 1}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">3D Yükleme</p>
          <h1 className="text-3xl font-bold text-slate-900">Araç Yerleşim Görselleştirmesi</h1>
          <p className="max-w-2xl text-slate-600 mt-2">
            ERP havuzundan seçilen sevkiyat için araç içi paket yerleşimini hesaplayarak yerleşim bloklarını oluşturuyoruz.
          </p>
        </div>
        <button onClick={loadShipmentPool} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yenile
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} />
            <div>{error}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">ERP Havuzundan Sevkiyatlar</h2>
            {loading ? (
              <div className="py-8 text-center text-slate-500">Yükleniyor...</div>
            ) : shipments.length === 0 ? (
              <div className="py-8 text-center text-slate-500">ERP havuzunda sevkiyat bulunmuyor.</div>
            ) : (
              <div className="space-y-2">
                {shipments.map((shipment) => (
                  <button
                    key={shipment.id}
                    onClick={() => setSelectedShipmentId(shipment.id)}
                    className={`w-full text-left rounded-2xl border px-4 py-3 transition ${shipment.id === selectedShipmentId ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 truncate">{shipment.sevkiyat_no}</p>
                        <p className="text-xs text-slate-500 truncate">{shipment.cari_ad}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {shipment.siparis_no} · {shipment.cari_sehir || '—'} · {shipment.kart_bilgisi}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Yerleşim Özeti</h2>
            {selectedShipment ? (
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <span>Sevkiyat No</span>
                  <strong className="text-slate-900">{selectedShipment.sevkiyat_no}</strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Müşteri</span>
                  <strong className="text-slate-900">{selectedShipment.cari_ad}</strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Durum</span>
                  <strong className="text-slate-900">{selectedShipment.status}</strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span> Ürün sayısı </span>
                  <strong className="text-slate-900">{selectedShipment.urun_listesi?.length || 0}</strong>
                </div>
              </div>
            ) : (
              <div className="py-4 text-sm text-slate-500">Sevkiyat seçin.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Araç İç Yerleşimi</h2>
            {loading ? (
              <div className="py-12 text-center text-slate-500">Hesaplanıyor...</div>
            ) : !selectedShipment ? (
              <div className="py-12 text-center text-slate-500">ERP havuzundan bir sevkiyat seçin.</div>
            ) : !hasPlacement ? (
              <div className="py-12 text-center text-slate-500">Seçili sevkiyat için araç yerleşimi verisi yok.</div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-4">
                  <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950" style={{ width: VEHICLE_LENGTH_PX + 64, minHeight: VEHICLE_WIDTH_PX + 64 }}>
                    <div className="absolute left-6 top-6 h-full w-full rounded-3xl bg-slate-900/80 border border-slate-800" />
                    <div className="absolute left-6 top-6" style={{ width: VEHICLE_LENGTH_PX, height: VEHICLE_WIDTH_PX }}>
                      {assignment?.blocks.map((block, index) => renderBlock(block, index))}
                      <div className="absolute left-0 top-0 right-0 bottom-0 border border-dashed border-slate-500 rounded-2xl" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-slate-700 text-sm">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Araç boyutları</p>
                      <p className="mt-2 font-semibold text-slate-900">6000 x 2400 x 2500 mm</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kullanım</p>
                      <p className="mt-2 font-semibold text-slate-900">{assignment?.utilization ?? 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Araç Detayı</p>
                      <p className="text-xs text-slate-500">Plaka ve şoför bilgileri</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">{assignment?.load_percentage}% doluluk</div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3">
                      <span>Plaka</span>
                      <strong className="text-slate-900">{assignment?.plate}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3">
                      <span>Şoför</span>
                      <strong className="text-slate-900">{assignment?.driver_name}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3">
                      <span>Toplam hacim</span>
                      <strong className="text-slate-900">{formatVolume(assignment?.total_volume_m3 ?? 0)}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3">
                      <span>Kullanılan hacim</span>
                      <strong className="text-slate-900">{formatVolume(assignment?.used_volume_m3 ?? 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
