import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, Plus, ChevronDown, ChevronRight,
  CalendarDays, Users, Package, MapPin, Clock,
  Play, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle,
  SortAsc, Eye, Settings2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  statusLabel, statusColor, statusDotColor, formatDate,
  taskTypeLabel, taskStatusLabel, taskStatusColor,
  taskTypeColor, roleLabel, countryTypeLabel
} from '../utils/helpers';
import type { Shipment, ShipmentStatus } from '../types';

const STATUS_FILTERS: (ShipmentStatus | 'ALL')[] = ['ALL', 'PLANNED', 'PICKING', 'PACKING', 'LOADING', 'SHIPPED'];
const NEXT_STATUS: Record<ShipmentStatus, ShipmentStatus | null> = {
  PLANNED: 'PICKING',
  PICKING: 'PACKING',
  PACKING: 'LOADING',
  LOADING: 'SHIPPED',
  SHIPPED: null,
};

export function PlanningPage() {
  const {
    shipments, shipmentLines, tasks, personnel, packages,
    transitionShipmentStatus, autoAssignTasks, generatePackages,
    loadTasksForShipment, manualAssignTask, updateTaskDuration,
    startTask, completeTask, rescheduleTask
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<{ taskId: string; type: string } | null>(null);
  const [sortBy, setSortBy] = useState<'due_date' | 'status' | 'shipment_no'>('due_date');

  useEffect(() => {
    if (expandedId) {
      loadTasksForShipment(expandedId);
    }
  }, [expandedId, loadTasksForShipment]);

  const filtered = useMemo(() => {
    return shipments
      .filter((s) => {
        const matchSearch =
          s.shipment_no.toLowerCase().includes(search.toLowerCase()) ||
          s.destination_name.toLowerCase().includes(search.toLowerCase()) ||
          s.order_no.toLowerCase().includes(search.toLowerCase()) ||
          s.city.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'due_date') return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (sortBy === 'status') return STATUS_FILTERS.indexOf(a.status) - STATUS_FILTERS.indexOf(b.status);
        return a.shipment_no.localeCompare(b.shipment_no);
      });
  }, [shipments, search, statusFilter, sortBy]);

  const isDelayed = (s: Shipment) => s.status !== 'SHIPPED' && new Date(s.due_date) < new Date();

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sevkiyat Planlaması</h1>
          <p className="text-slate-500 text-sm">{filtered.length} sevkiyat listeleniyor</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-blue-400"
          >
            <option value="due_date">Termin Tarihi</option>
            <option value="status">Durum</option>
            <option value="shipment_no">Sevk No</option>
          </select>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Sevkiyat no, müşteri, şehir ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 text-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf}
              onClick={() => setStatusFilter(sf)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                statusFilter === sf
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {sf === 'ALL' ? 'Tümü' : statusLabel(sf)}
              {sf !== 'ALL' && (
                <span className="ml-1 opacity-70">
                  ({shipments.filter((s) => s.status === sf).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt-style header */}
      <GanttHeader />

      {/* Shipment List */}
      <div className="space-y-3">
        {filtered.map((shipment) => {
          const lines = shipmentLines.filter((l) => l.shipment_id === shipment.id);
          const shipmentTasks = tasks.filter((t) => t.shipment_id === shipment.id);
          const pkgs = packages.filter((p) => p.shipment_id === shipment.id);
          const expanded = expandedId === shipment.id;
          const delayed = isDelayed(shipment);
          const nextStatus = NEXT_STATUS[shipment.status];
          const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
          const scannedItems = lines.reduce((s, l) => s + l.scanned_quantity, 0);
          const scanProgress = totalItems > 0 ? (scannedItems / totalItems) * 100 : 0;

          return (
            <div
              key={shipment.id}
              className={`bg-white rounded-2xl border shadow-sm transition-all ${
                delayed ? 'border-red-200 shadow-red-100' : 'border-slate-200'
              }`}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-4 py-4 cursor-pointer select-none"
                onClick={() => setExpandedId(expanded ? null : shipment.id)}
              >
                <div className={`w-2 h-8 rounded-full flex-shrink-0 ${statusDotColor(shipment.status)}`} />

                {/* Shipment info */}
                <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-sm">{shipment.shipment_no}</span>
                      {delayed && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                    </div>
                    <p className="text-slate-500 text-xs">{shipment.order_no}</p>
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className="flex items-center gap-1 text-slate-700 text-sm font-medium truncate">
                      <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{shipment.destination_name}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{shipment.city} · {countryTypeLabel(shipment.country_type)}</p>
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <p className="text-slate-700 text-sm font-medium flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      {formatDate(shipment.due_date)}
                    </p>
                    <p className="text-slate-400 text-xs">{totalItems} ürün · {pkgs.length} paket</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="hidden md:flex items-center gap-3 w-36 flex-shrink-0">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Tarama</span>
                      <span className="text-slate-700 font-medium">{scannedItems}/{totalItems}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${scanProgress}%`,
                          background: scanProgress === 100 ? '#10b981' : '#3b82f6',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border font-medium ${statusColor(shipment.status)}`}>
                  {statusLabel(shipment.status)}
                </span>

                {/* Expand icon */}
                <ChevronRight
                  size={16}
                  className={`text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
                />
              </div>

              {/* Expanded details */}
              {expanded && (
                <div className="border-t border-slate-100 px-4 pb-5 pt-4 space-y-4">
                  {/* Task progress */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Görev Akışı</p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {['PICKING', 'PACKING', 'LOADING'].map((type, idx) => {
                        const task = shipmentTasks.find((t) => t.type === type);
                        const assignedPersonIds = task?.assigned_person_ids?.length
                          ? task.assigned_person_ids
                          : task?.assigned_person_id
                          ? [task.assigned_person_id]
                          : [];
                        const assignedPeople = personnel.filter((p) => assignedPersonIds.includes(p.id));
                        return (
                          <React.Fragment key={type}>
                            <div className="flex-shrink-0 w-44 bg-slate-50 rounded-xl border border-slate-200 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ background: taskTypeColor(type as any) }} />
                                  <span className="text-xs font-semibold text-slate-700">{taskTypeLabel(type as any)}</span>
                                </div>
                                {task && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${taskStatusColor(task.status)}`}>
                                    {taskStatusLabel(task.status)}
                                  </span>
                                )}
                              </div>
                              {task ? (
                                <>
                                  <div className="mb-2 flex flex-wrap gap-1">
                                    {assignedPeople.length > 0 ? (
                                      assignedPeople.map((person) => (
                                        <span key={person.id} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                                          {person.name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-400">—</span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400">
                                    <label className="block mb-1">Süre (dk)</label>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => updateTaskDuration(task.id, Math.max(1, task.duration_minutes - 1))}
                                        className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min={1}
                                        value={task.duration_minutes}
                                        onChange={(e) => updateTaskDuration(task.id, Math.max(1, Number(e.target.value) || 1))}
                                        className="w-16 text-center rounded-lg border border-slate-200 bg-white text-slate-800 text-xs py-1"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateTaskDuration(task.id, task.duration_minutes + 1)}
                                        className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 mt-2">
                                    {task.status === 'PENDING' && (
                                      <button
                                        onClick={() => startTask(task.id)}
                                        className="flex-1 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-lg transition-colors font-medium"
                                      >
                                        Başlat
                                      </button>
                                    )}
                                    {task.status === 'IN_PROGRESS' && (
                                      <button
                                        onClick={() => completeTask(task.id)}
                                        className="flex-1 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs rounded-lg transition-colors font-medium"
                                      >
                                        Tamamla
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setAssignModal({ taskId: task.id, type })}
                                      className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors"
                                      title="Yeniden ata"
                                    >
                                      <Settings2 size={11} />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-slate-400">Görev atanmadı</p>
                              )}
                            </div>
                            {idx < 2 && <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Products */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ürünler</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 rounded-lg">
                            <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 rounded-l-lg">Ürün Kodu</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Ürün Adı</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Miktar</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 rounded-r-lg">Tarama</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {lines.map((line) => {
                            const progress = (line.scanned_quantity / line.quantity) * 100;
                            return (
                              <tr key={line.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-mono text-xs text-slate-600">{line.product_code}</td>
                                <td className="px-3 py-2 text-slate-700">{line.product_name}</td>
                                <td className="px-3 py-2 text-right text-slate-700 font-medium">{line.quantity}</td>
                                <td className="px-3 py-2 text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className={`text-xs font-medium ${line.scanned_quantity >= line.quantity ? 'text-emerald-600' : 'text-blue-600'}`}>
                                      {line.scanned_quantity}/{line.quantity}
                                    </span>
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : '#3b82f6' }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => autoAssignTasks(shipment.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-xl transition-colors border border-blue-200"
                    >
                      <RefreshCw size={12} />
                      Görev Ata
                    </button>
                    <button
                      onClick={() => generatePackages(shipment.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-xl transition-colors border border-amber-200"
                    >
                      <Package size={12} />
                      Paket Oluştur ({pkgs.length})
                    </button>
                    {nextStatus && (
                      <button
                        onClick={() => transitionShipmentStatus(shipment.id, nextStatus)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-xl transition-colors border border-emerald-200 ml-auto"
                      >
                        <Play size={12} />
                        {statusLabel(nextStatus)} Geçir
                      </button>
                    )}
                    {shipment.status === 'SHIPPED' && (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl border border-emerald-200 ml-auto">
                        <CheckCircle2 size={12} />
                        Sevk Tamamlandı
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
            <Package size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Sevkiyat bulunamadı</p>
            <p className="text-slate-400 text-sm">Arama kriterlerini değiştirin</p>
          </div>
        )}
      </div>

      {/* Manual assign modal */}
      {assignModal && (
        <AssignModal
          taskId={assignModal.taskId}
          taskType={assignModal.type}
          personnel={personnel}
          currentAssignments={
            (() => {
              const task = tasks.find((t) => t.id === assignModal.taskId);
              return task?.assigned_person_ids?.length
                ? task.assigned_person_ids
                : task?.assigned_person_id
                ? [task.assigned_person_id]
                : [];
            })()
          }
          onSave={(personIds) => {
            manualAssignTask(assignModal.taskId, personIds);
            setAssignModal(null);
          }}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  );
}

// ─── GANTT HEADER ─────────────────────────────────────────────────────────────
function GanttHeader() {
  const { tasks, personnel, shipments } = useAppStore();
  const today = new Date();

  // Show today's gantt view
  const todayTasks = tasks.filter((t) => {
    const start = new Date(t.planned_start);
    return start.toDateString() === today.toDateString() || true; // show all for demo
  }).slice(0, 18);

  if (todayTasks.length === 0) return null;

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am to 7pm
  const dayStart = new Date(today);
  dayStart.setHours(7, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(19, 0, 0, 0);
  const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;

  const getBarStyle = (task: typeof tasks[0]) => {
    const start = new Date(task.planned_start);
    const end = new Date(task.planned_end);
    const left = Math.max(0, (start.getTime() - dayStart.getTime()) / 60000 / totalMinutes * 100);
    const width = Math.min(100 - left, (end.getTime() - start.getTime()) / 60000 / totalMinutes * 100);
    return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
  };

  const personGroups = personnel.map((p) => ({
    person: p,
    tasks: todayTasks.filter((t) => t.assigned_person_id === p.id),
  })).filter((g) => g.tasks.length > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-800">Gantt Planı</h3>
          <p className="text-slate-500 text-xs">Personel bazlı görev dağılımı</p>
        </div>
        <CalendarDays size={16} className="text-slate-400" />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour markers */}
          <div className="flex border-b border-slate-100 px-4 py-2">
            <div className="w-36 flex-shrink-0" />
            <div className="flex-1 relative">
              <div className="flex justify-between">
                {hours.map((h) => (
                  <span key={h} className="text-slate-400 text-xs">{h}:00</span>
                ))}
              </div>
            </div>
          </div>

          {/* Person rows */}
          <div className="divide-y divide-slate-50 px-4 py-2">
            {personGroups.slice(0, 6).map(({ person, tasks: personTasks }) => (
              <div key={person.id} className="flex items-center gap-3 py-2">
                <div className="w-36 flex-shrink-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{person.name.split(' ')[0]}</p>
                  <p className="text-xs text-slate-400">{roleLabel(person.role)}</p>
                </div>
                <div className="flex-1 h-8 relative bg-slate-50 rounded-lg overflow-hidden">
                  {/* Grid lines */}
                  {hours.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-slate-200"
                      style={{ left: `${(i / (hours.length - 1)) * 100}%` }}
                    />
                  ))}
                  {/* Task bars */}
                  {personTasks.map((task) => {
                    const style = getBarStyle(task);
                    const colors: Record<string, string> = {
                      PICKING: '#3b82f6',
                      PACKING: '#f59e0b',
                      LOADING: '#f97316',
                    };
                    const bg = colors[task.type] ?? '#6b7280';
                    return (
                      <div
                        key={task.id}
                        className="absolute top-1 bottom-1 rounded flex items-center px-1.5 text-white text-xs font-medium overflow-hidden"
                        style={{ ...style, background: bg, opacity: task.status === 'COMPLETED' ? 0.5 : 1 }}
                        title={`${task.shipment_no} · ${taskTypeLabel(task.type)}`}
                      >
                        <span className="truncate">{task.shipment_no}</span>
                      </div>
                    );
                  })}
                  {/* Current time marker */}
                  {(() => {
                    const now = new Date();
                    const pct = Math.max(0, Math.min(100, (now.getTime() - dayStart.getTime()) / 60000 / totalMinutes * 100));
                    return (
                      <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/70 z-10" style={{ left: `${pct}%` }} />
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ASSIGN MODAL ─────────────────────────────────────────────────────────────
function AssignModal({
  taskId,
  taskType,
  personnel,
  currentAssignments,
  onSave,
  onClose,
}: {
  taskId: string;
  taskType: string;
  personnel: any[];
  currentAssignments: string[];
  onSave: (personIds: string[]) => void;
  onClose: () => void;
}) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(currentAssignments);
  const roleMap: Record<string, string> = { PICKING: 'PICKER', PACKING: 'PACKER', LOADING: 'LOADER' };
  const eligible = personnel.filter((p) => p.role === roleMap[taskType]);
  const others = personnel.filter((p) => p.role !== roleMap[taskType]);

  const togglePerson = (personId: string) => {
    setSelectedIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 z-10">
        <h3 className="font-bold text-slate-800 mb-1">Personel Ata</h3>
        <p className="text-slate-500 text-sm mb-4">{taskTypeLabel(taskType as any)} görevi için</p>

        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Seçili Personel</p>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 ? (
              selectedIds.map((id) => {
                const person = personnel.find((p) => p.id === id);
                return person ? (
                  <span key={id} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                    {person.name}
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-xs text-slate-400">Hiç personel seçilmedi</span>
            )}
          </div>
        </div>

        {eligible.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Uygun Personel</p>
            <div className="space-y-1.5 mb-3">
              {eligible.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePerson(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left border ${
                    selectedIds.includes(p.id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                    {p.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">{roleLabel(p.role)} · {p.shift_start}–{p.shift_end}</p>
                  </div>
                  {selectedIds.includes(p.id) && (
                    <span className="text-xs text-blue-600 font-semibold">Seçili</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {others.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Diğer (Rol Uyuşmuyor)</p>
            <div className="space-y-1 mb-4">
              {others.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePerson(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left border ${
                    selectedIds.includes(p.id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50 opacity-80'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0">
                    {p.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{roleLabel(p.role)}</p>
                  </div>
                  {selectedIds.includes(p.id) && (
                    <span className="text-xs text-blue-600 font-semibold">Seçili</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSave(selectedIds)}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
