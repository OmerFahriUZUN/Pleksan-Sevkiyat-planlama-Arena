import React, { useState, useEffect } from 'react';
import { ChevronRight, CalendarDays, Users, Play, CheckCircle2, Settings2, ArrowRight, RefreshCw } from 'lucide-react';
import { shipmentPlansAPI, personnelAPI, handleApiError } from '../services';
import { statusLabel, statusColor, formatDate, formatDateTime, operationTypeLabel, operationTypeColor, operationStatusLabel, operationStatusColor, personnelRoleLabel } from '../utils/helpers';
import type { ShipmentPlan, Personnel } from '../types';

export function OperationPlanningPage() {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ganttView, setGanttView] = useState<'shipment' | 'personnel'>('shipment');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, pData] = await Promise.all([
        shipmentPlansAPI.getAll(),
        personnelAPI.getAll()
      ]);
      setShipments(sData.filter((s) => ['ready_for_planning', 'planned', 'picking', 'packing', 'loading'].includes(s.status)));
      setPersonnel(pData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const createOps = async (id: string, picking: number, packing: number, loading: number) => {
    try {
      await shipmentPlansAPI.createOperations(id, picking, packing, loading);
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const assignPerson = async (shipmentId: string, opId: string, personelIds: string[], personelNames: string[]) => {
    try {
      await shipmentPlansAPI.assignPersonnel(shipmentId, opId, personelIds, personelNames);
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const startOp = async (shipmentId: string, opId: string) => {
    try {
      await shipmentPlansAPI.startOperation(shipmentId, opId);
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const completeOp = async (shipmentId: string, opId: string) => {
    try {
      await shipmentPlansAPI.completeOperation(shipmentId, opId);
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const transitionStatus = async (id: string, status: string) => {
    try {
      await shipmentPlansAPI.transitionStatus(id, status);
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  // Available personnel by role
  const pickers = personnel.filter((p) => p.role === 'PICKER' || p.role === 'MULTI');
  const packers = personnel.filter((p) => p.role === 'PACKER' || p.role === 'MULTI');
  const loaders = personnel.filter((p) => p.role === 'LOADER' || p.role === 'MULTI');

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operasyon Planlama</h1>
          <p className="text-slate-500 text-sm">{shipments.length} aktif sevkiyat</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Yenile
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>}

      {/* Gantt View Selector */}
      <div className="flex gap-2">
        <button onClick={() => setGanttView('shipment')} className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all ${ganttView === 'shipment' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
          <CalendarDays size={14} className="inline mr-1" />Sevkiyat Gantt
        </button>
        <button onClick={() => setGanttView('personnel')} className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all ${ganttView === 'personnel' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
          <Users size={14} className="inline mr-1" />Personel Gantt
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Yükleniyor...</div>
      ) : shipments.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <CalendarDays size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Aktif sevkiyat yok</p>
          <p className="text-slate-400 text-sm">Önce ERP Havuzu'ndan sevkiyatları planlamaya hazırlayın</p>
        </div>
      ) : (
        <>
          {/* Gantt View */}
          {ganttView === 'shipment' ? (
            <ShipmentGantt shipments={shipments} />
          ) : (
            <PersonnelGantt shipments={shipments} personnel={personnel} />
          )}

          {/* Shipment List with Operations */}
          <div className="space-y-3">
            {shipments.map((shipment) => {
              const expanded = expandedId === shipment.id;
              const ops = shipment.operations || [];
              const hasOps = ops.length > 0;
              const allDone = ops.every((o) => o.status === 'COMPLETED');

              return (
                <div key={shipment.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 px-4 py-4 cursor-pointer select-none" onClick={() => setExpandedId(expanded ? null : shipment.id)}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 text-sm">{shipment.sevkiyat_no}</span>
                        {allDone && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </div>
                      <p className="text-slate-500 text-xs">{shipment.cari_ad} · {formatDate(shipment.termin_tarihi)}</p>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border font-medium ${statusColor(shipment.status)}`}>{statusLabel(shipment.status)}</span>
                    <ChevronRight size={16} className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </div>

                  {expanded && (
                    <div className="border-t border-slate-100 px-4 pb-5 pt-4 space-y-4">
                      {!hasOps ? (
                        <CreateOperationsForm shipmentId={shipment.id} onCreate={createOps} />
                      ) : (
                        <div className="space-y-4">
                          {/* Operation Blocks */}
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {ops.map((op, idx) => {
                              const roleMap: Record<string, Personnel[]> = {
                                PICKING: pickers, PACKING: packers, LOADING: loaders,
                              };
                              const eligible = roleMap[op.type] || [];
                              return (
                                <React.Fragment key={op.id}>
                                  <div className="flex-shrink-0 w-48 bg-slate-50 rounded-xl border border-slate-200 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ background: operationTypeColor(op.type) }} />
                                        <span className="text-xs font-semibold text-slate-700">{operationTypeLabel(op.type)}</span>
                                      </div>
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${operationStatusColor(op.status)}`}>{operationStatusLabel(op.status)}</span>
                                    </div>
                                    <div className="space-y-1 text-xs text-slate-500">
                                      <p>⏱ {op.planned_duration_minutes} dk</p>
                                      <p>🕐 {op.planned_start ? formatDateTime(op.planned_start) : '—'}</p>
                                      <p>👤 {op.personel_names?.join(', ') || 'Atanmadı'}</p>
                                    </div>
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                      <PersonnelAssignDropdown
                                        personnel={eligible}
                                        selectedIds={op.personel_ids || []}
                                        onAssign={(ids, names) => assignPerson(shipment.id, op.id, ids, names)}
                                      />
                                      {op.status === 'PENDING' && (
                                        <button onClick={() => startOp(shipment.id, op.id)} className="py-1 px-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-lg">Başlat</button>
                                      )}
                                      {op.status === 'IN_PROGRESS' && (
                                        <button onClick={() => completeOp(shipment.id, op.id)} className="py-1 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs rounded-lg">Bitir</button>
                                      )}
                                    </div>
                                  </div>
                                  {idx < ops.length - 1 && <ArrowRight size={14} className="text-slate-300 flex-shrink-0 mt-8" />}
                                </React.Fragment>
                              );
                            })}
                          </div>

                          {/* Status Transition */}
                          <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <NextStatusButton shipment={shipment} onTransition={transitionStatus} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CreateOperationsForm({ shipmentId, onCreate }: { shipmentId: string; onCreate: (id: string, p: number, pk: number, l: number) => void }) {
  const [picking, setPicking] = useState(30);
  const [packing, setPacking] = useState(30);
  const [loading, setLoading] = useState(20);
  return (
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
      <p className="text-sm font-semibold text-blue-800 mb-3">Operasyon Sürelerini Belirleyin</p>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { label: 'Picking (dk)', value: picking, set: setPicking, color: 'border-blue-300' },
          { label: 'Packing (dk)', value: packing, set: setPacking, color: 'border-amber-300' },
          { label: 'Yükleme (dk)', value: loading, set: setLoading, color: 'border-orange-300' },
        ].map(({ label, value, set, color }) => (
          <div key={label}>
            <p className="text-xs text-slate-600 mb-1">{label}</p>
            <input type="number" min={1} value={value} onChange={(e) => set(Number(e.target.value) || 1)}
              className={`w-full px-3 py-2 border ${color} rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:border-blue-400`} />
          </div>
        ))}
      </div>
      <button onClick={() => onCreate(shipmentId, picking, packing, loading)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors">
        Operasyonları Oluştur
      </button>
    </div>
  );
}

function PersonnelAssignDropdown({ personnel, selectedIds, onAssign }: { personnel: Personnel[]; selectedIds: string[]; onAssign: (ids: string[], names: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedIds);
  
  const togglePerson = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="relative">
      <button onClick={() => { setSelected([...selectedIds]); setOpen(!open); }} className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg flex items-center gap-1">
        <Settings2 size={11} />Ata
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-slate-200 shadow-xl p-3 w-56">
            <p className="text-xs font-semibold text-slate-500 mb-2">Personel Seç</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {personnel.map((p) => (
                <button key={p.id} onClick={() => togglePerson(p.id)} className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all ${selected.includes(p.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                  {p.ad_soyad} <span className="text-slate-400">({personnelRoleLabel(p.role)})</span>
                </button>
              ))}
            </div>
            <button onClick={() => { onAssign(selected, selected.map((id) => personnel.find((p) => p.id === id)?.ad_soyad || '')); setOpen(false); }}
              className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg">
              Kaydet ({selected.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NextStatusButton({ shipment, onTransition }: { shipment: ShipmentPlan; onTransition: (id: string, status: string) => void }) {
  const nextMap: Record<string, string> = {
    ready_for_planning: 'planned',
    planned: 'picking',
    picking: 'packing',
    packing: 'loading',
    loading: 'shipped',
  };
  const next = nextMap[shipment.status];
  if (!next) return null;
  return (
    <button onClick={() => onTransition(shipment.id, next)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-xl border border-emerald-200 transition-colors">
      <Play size={12} />
      {statusLabel(next)} Geçir
    </button>
  );
}

function ShipmentGantt({ shipments }: { shipments: ShipmentPlan[] }) {
  const activeOps = shipments.flatMap((s) =>
    (s.operations || [])
      .filter((o) => o.planned_start && o.status !== 'COMPLETED')
      .map((o) => ({ ...o, sevkiyat_no: s.sevkiyat_no }))
  );

  const hours = Array.from({ length: 12 }, (_, i) => i + 7);
  const today = new Date();
  const dayStart = new Date(today); dayStart.setHours(7, 0, 0, 0);
  const dayEnd = new Date(today); dayEnd.setHours(19, 0, 0, 0);
  const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;

  const getBarStyle = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const left = Math.max(0, (s.getTime() - dayStart.getTime()) / 60000 / totalMinutes * 100);
    const width = Math.min(100 - left, Math.max(1, (e.getTime() - s.getTime()) / 60000 / totalMinutes * 100));
    return { left: `${left}%`, width: `${width}%` };
  };

  if (activeOps.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">Sevkiyat Bazlı Gantt</h3>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px] px-4 py-2">
          <div className="flex border-b border-slate-100 pb-2">
            <div className="w-32 flex-shrink-0" />
            <div className="flex-1 flex justify-between">
              {hours.map((h) => (<span key={h} className="text-slate-400 text-xs">{h}:00</span>))}
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {shipments.filter((s) => (s.operations || []).some((o) => o.status !== 'COMPLETED')).slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2">
                <div className="w-32 flex-shrink-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{s.sevkiyat_no}</p>
                </div>
                <div className="flex-1 h-8 relative bg-slate-50 rounded-lg overflow-hidden">
                  {(s.operations || []).filter((o) => o.planned_start && o.status !== 'COMPLETED').map((op) => {
                    const style = getBarStyle(op.planned_start, op.planned_end);
                    return (
                      <div key={op.id} className="absolute top-1 bottom-1 rounded flex items-center px-1.5 text-white text-[10px] font-medium overflow-hidden"
                        style={{ ...style, background: operationTypeColor(op.type) }}
                        title={`${operationTypeLabel(op.type)} · ${op.personel_names?.join(',') || ''}`}>
                        <span className="truncate">{operationTypeLabel(op.type)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonnelGantt({ shipments, personnel }: { shipments: ShipmentPlan[]; personnel: Personnel[] }) {
  const allOps = shipments.flatMap((s) =>
    (s.operations || []).filter((o) => o.planned_start && o.status !== 'COMPLETED').map((o) => ({ ...o, sevkiyat_no: s.sevkiyat_no }))
  );

  const hours = Array.from({ length: 12 }, (_, i) => i + 7);
  const today = new Date();
  const dayStart = new Date(today); dayStart.setHours(7, 0, 0, 0);
  const dayEnd = new Date(today); dayEnd.setHours(19, 0, 0, 0);
  const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;

  const getBarStyle = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const left = Math.max(0, (s.getTime() - dayStart.getTime()) / 60000 / totalMinutes * 100);
    const width = Math.min(100 - left, Math.max(1, (e.getTime() - s.getTime()) / 60000 / totalMinutes * 100));
    return { left: `${left}%`, width: `${width}%` };
  };

  const personRows = personnel.filter((p) => allOps.some((o) => (o.personel_ids || []).includes(p.id)));

  if (personRows.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">Personel Bazlı Gantt</h3>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px] px-4 py-2">
          <div className="flex border-b border-slate-100 pb-2">
            <div className="w-36 flex-shrink-0" />
            <div className="flex-1 flex justify-between">
              {hours.map((h) => (<span key={h} className="text-slate-400 text-xs">{h}:00</span>))}
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {personRows.map((person) => {
              const personOps = allOps.filter((o) => (o.personel_ids || []).includes(person.id));
              return (
                <div key={person.id} className="flex items-center gap-3 py-2">
                  <div className="w-36 flex-shrink-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{person.ad_soyad}</p>
                    <p className="text-xs text-slate-400">{personnelRoleLabel(person.role)}</p>
                  </div>
                  <div className="flex-1 h-8 relative bg-slate-50 rounded-lg overflow-hidden">
                    {personOps.map((op) => {
                      const style = getBarStyle(op.planned_start, op.planned_end);
                      return (
                        <div key={op.id} className="absolute top-1 bottom-1 rounded flex items-center px-1.5 text-white text-[10px] font-medium overflow-hidden"
                          style={{ ...style, background: operationTypeColor(op.type) }}
                          title={`${op.sevkiyat_no} · ${operationTypeLabel(op.type)}`}>
                          <span className="truncate">{op.sevkiyat_no}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}