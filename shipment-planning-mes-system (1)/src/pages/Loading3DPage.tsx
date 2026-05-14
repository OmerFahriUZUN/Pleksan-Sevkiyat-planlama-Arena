import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, RefreshCw, AlertTriangle, Barcode, CheckCircle2 } from 'lucide-react';
import { shipmentPlansAPI, handleApiError } from '../services';
import type { ShipmentPlan, VehiclePlacementResult, VehiclePlacementBlock } from '../types';

const VEHICLE_SCALE = 0.08;
const VEHICLE_LENGTH_PX = 6000 * VEHICLE_SCALE;
const VEHICLE_WIDTH_PX = 2400 * VEHICLE_SCALE;

export function Loading3DPage() {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([]);
  const [placement, setPlacement] = useState<VehiclePlacementResult | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [scanMsg, setScanMsg] = useState('');
  const [scanMsgType, setScanMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [highlightedBlock, setHighlightedBlock] = useState<VehiclePlacementBlock | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [confirmedItems, setConfirmedItems] = useState<any[]>([]);
  const [saveMsg, setSaveMsg] = useState('');

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
      const data = await shipmentPlansAPI.getPlannedShipments();
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
      setHighlightedBlock(null);
      setConfirmedIds(new Set());
      setConfirmedItems([]);
      setScanMsg('');
      const result = await shipmentPlansAPI.getVehiclePlacement(id);
      setPlacement(result);
      
      // Load existing confirmed items
      try {
        const plan = await shipmentPlansAPI.getById(id);
        if (plan.loading_confirmed_items) {
          setConfirmedItems(plan.loading_confirmed_items);
          setConfirmedIds(new Set(plan.loading_confirmed_items.map((ci: any) => ci.block_id)));
        }
      } catch (e) {}
    } catch (err) {
      setError(handleApiError(err));
      setPlacement(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!selectedShipmentId || !scanCode.trim()) return;
    
    setSaveMsg('');
    setScanMsg('');
    setHighlightedBlock(null);

    const code = scanCode.trim().toUpperCase();

    // Find the block with matching product_code
    const allBlocks = placement?.assignments?.flatMap((a) => a.blocks) || [];
    const matchingBlock = allBlocks.find((b: VehiclePlacementBlock) => b.product_code.toUpperCase() === code || b.id.toUpperCase() === code);


    if (!matchingBlock) {
      setScanMsgType('error');
      setScanMsg('Bu barkod/ürün kodu 3D yerleşim planında bulunamadı!');
      setScanCode('');
      return;
    }

    // Check if already confirmed
    if (confirmedIds.has(matchingBlock.id)) {
      setScanMsgType('info');
      setScanMsg(`${matchingBlock.product_code} - ${matchingBlock.product_name} zaten yüklendi!`);
      setHighlightedBlock(matchingBlock);
      setScanCode('');
      return;
    }

    // Highlight the block where this should be placed
    setHighlightedBlock(matchingBlock);
    setScanMsgType('success');
    setScanMsg(`✅ ${matchingBlock.product_name} (${matchingBlock.product_code}) → ${matchingBlock.sequence_order}. sırada, pozisyon: X:${matchingBlock.x_mm}mm Y:${matchingBlock.y_mm}mm Z:${matchingBlock.z_mm}mm`);
    
    setScanCode('');
  };

  const handleConfirmLoading = async () => {
    if (!highlightedBlock || !selectedShipmentId) return;

    try {
      setSaveMsg(`${highlightedBlock.product_name} yükleniyor...`);
      
      // Start 3D loading if not started
      try {
        await shipmentPlansAPI.start3DLoading(selectedShipmentId);
      } catch (e) {}

      // Confirm the loading item
      await shipmentPlansAPI.confirm3DLoadingItem(
        selectedShipmentId,
        highlightedBlock.product_code,
        highlightedBlock.id,
        'operator'
      );

      // Update local state
      const newConfirmed = [...confirmedItems, {
        id: `LC-${Date.now()}`,
        product_code: highlightedBlock.product_code,
        block_id: highlightedBlock.id,
        confirmed_at: new Date().toISOString(),
        confirmed_by: 'operator',
      }];
      setConfirmedItems(newConfirmed);
      setConfirmedIds(new Set([...confirmedIds, highlightedBlock.id]));
      
      setSaveMsg(`${highlightedBlock.product_name} başarıyla yüklendi!`);
      setHighlightedBlock(null);
      setScanMsgType('info');
      setScanMsg('Bir sonraki ürünün barkodunu okutun.');

      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleCompleteLoading = async () => {
    if (!selectedShipmentId) return;
    try {
      await shipmentPlansAPI.complete3DLoading(selectedShipmentId);
      setSaveMsg('3D yükleme tamamlandı! Sevkiyat PARTIAL_SHIPMENT durumuna geçti.');
      setTimeout(() => setSaveMsg(''), 5000);
      loadPlacement(selectedShipmentId);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const selectedShipment = shipments.find((shipment) => shipment.id === selectedShipmentId) || shipments[0] || null;

  const sortedAssignments = useMemo(() => {
    return placement?.assignments || [];
  }, [placement]);

  const totalBlocks = placement?.assignments?.reduce((s, a) => s + a.blocks.length, 0) || 0;
  const totalConfirmed = confirmedIds.size;
  const lastUnconfirmedBlock = placement?.assignments?.flatMap(a => a.blocks).find(b => !confirmedIds.has(b.id));

  const renderBlock = (block: VehiclePlacementBlock) => {
    const isConfirmed = confirmedIds.has(block.id);
    const isHighlighted = highlightedBlock?.id === block.id;
    
    return (
      <div
        key={block.id}
        className={`absolute rounded-xl border text-[10px] text-white font-semibold flex items-center justify-center transition-all ${
          isHighlighted ? 'ring-4 ring-yellow-400 z-10 scale-110' : 
          isConfirmed ? 'opacity-60' : 'opacity-90'
        } ${isConfirmed ? 'border-green-400' : 'border-white/20'}`}
        style={{
          left: `${block.x_mm * VEHICLE_SCALE}px`,
          top: `${block.y_mm * VEHICLE_SCALE}px`,
          width: `${block.width_mm * VEHICLE_SCALE}px`,
          height: `${block.depth_mm * VEHICLE_SCALE}px`,
          background: isConfirmed ? '#10b981' : block.color,
        }}
        title={`${block.product_code} · ${block.product_name} · Sıra:${block.sequence_order}`}
      >
        {isConfirmed ? '✓' : block.sequence_order}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">3D Yükleme</p>
          <h1 className="text-3xl font-bold text-slate-900">Barkodlu Yükleme Yönlendirme</h1>
          <p className="max-w-2xl text-slate-600 mt-2">
            Barkod okutun, sistem ürünün araca nereye yerleştirileceğini göstersin. Yükledikten sonra onaylayın.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadShipmentPool} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yenile
          </button>
          {totalConfirmed > 0 && totalBlocks > 0 && totalConfirmed >= totalBlocks && (
            <button onClick={handleCompleteLoading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition">
              <CheckCircle2 size={16} /> Yüklemeyi Tamamla
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} />
            <div>{error}</div>
          </div>
        </div>
      )}

      {saveMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 text-sm">
          {saveMsg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Yükleme Yapılacak Sevkiyatlar</h2>
            {loading ? (
              <div className="py-8 text-center text-slate-500">Yükleniyor...</div>
            ) : shipments.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Yükleme bekleyen sevkiyat bulunmuyor.</div>
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
                      {shipment.siparis_no} · {shipment.cari_sehir || '—'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Yükleme İlerleme</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>İlerleme</span>
                  <span>{totalConfirmed}/{totalBlocks} blok</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" 
                    style={{ width: `${totalBlocks > 0 ? (totalConfirmed / totalBlocks) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Barcode Scanner */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Barcode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Barkod okut (ürün kodu)" value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 text-slate-700" />
                </div>
                <button onClick={handleScan} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl">Tara</button>
              </div>

              {scanMsg && (
                <div className={`text-xs p-2 rounded-xl ${
                  scanMsgType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  scanMsgType === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {scanMsg}
                </div>
              )}

              {highlightedBlock && (
                <button onClick={handleConfirmLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors">
                  Yükledim ✅
                </button>
              )}
            </div>
          </div>

          {selectedShipment && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Sevkiyat Detayı</h2>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Sevkiyat No</span><strong className="text-slate-900">{selectedShipment.sevkiyat_no}</strong></div>
                <div className="flex justify-between"><span>Müşteri</span><strong className="text-slate-900">{selectedShipment.cari_ad}</strong></div>
                <div className="flex justify-between"><span>Durum</span><strong className="text-slate-900">{selectedShipment.status}</strong></div>
                <div className="flex justify-between"><span>Toplam Blok</span><strong className="text-slate-900">{totalBlocks}</strong></div>
                <div className="flex justify-between"><span>Yüklenen</span><strong className="text-slate-900">{totalConfirmed}</strong></div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              3D Araç İçi Yerleşim
              {lastUnconfirmedBlock && <span className="text-amber-600 ml-2">→ Sıradaki: ${lastUnconfirmedBlock.sequence_order}. ${lastUnconfirmedBlock.product_name}</span>}
            </h2>
            {loading ? (
              <div className="py-12 text-center text-slate-500">Hesaplanıyor...</div>
            ) : !selectedShipment ? (
              <div className="py-12 text-center text-slate-500">Bir sevkiyat seçin.</div>
            ) : !placement?.assignments?.length ? (
              <div className="py-12 text-center text-slate-500">Seçili sevkiyat için araç yerleşimi verisi yok.</div>
            ) : (
              <div className="space-y-4">
                {sortedAssignments.map((assignment) => (
                  <div key={assignment.vehicle_assignment_id} className="bg-white rounded-3xl border border-slate-200 p-4">
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950" style={{ width: VEHICLE_LENGTH_PX + 64, minHeight: VEHICLE_WIDTH_PX + 64 }}>
                      <div className="absolute left-6 top-6" style={{ width: VEHICLE_LENGTH_PX, height: VEHICLE_WIDTH_PX }}>
                        {assignment.blocks.map((block) => renderBlock(block))}
                        <div className="absolute left-0 top-0 right-0 bottom-0 border border-dashed border-slate-500 rounded-2xl" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-slate-700 text-sm">
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Araç</p>
                        <p className="mt-2 font-semibold text-slate-900">{assignment.plate} · {assignment.driver_name}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kullanım</p>
                        <p className="mt-2 font-semibold text-slate-900">{assignment.utilization.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
