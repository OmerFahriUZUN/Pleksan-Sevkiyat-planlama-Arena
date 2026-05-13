import type { ShipmentStatus, OperationType, OperationStatus, PersonnelRole, ShipmentPriority } from '../types';

export const statusLabel = (status: ShipmentStatus | string): string => {
  const labels: Record<string, string> = {
    'erp_imported': 'ERP\'den Geldi',
    'waiting_stock': 'Stok Bekliyor',
    'waiting_quality': 'Kalite Onayı',
    'blocked': 'Engelli',
    'ready_for_planning': 'Planlamaya Hazır',
    'planned': 'Planlandı',
    'picking': 'Picking',
    'packing': 'Packing',
    'loading': 'Yükleme',
    'partial_shipment': 'Kısmi Sevkiyat',
    'shipped': 'Sevk Edildi',
    'cancelled': 'İptal',
    'revision_required': 'Revizyon Gerekli',
  };
  return labels[status] || status;
};

export const statusColor = (status: ShipmentStatus | string): string => {
  const colors: Record<string, string> = {
    'erp_imported': 'bg-slate-100 text-slate-700 border-slate-300',
    'waiting_stock': 'bg-amber-50 text-amber-700 border-amber-300',
    'waiting_quality': 'bg-orange-50 text-orange-700 border-orange-300',
    'blocked': 'bg-red-50 text-red-700 border-red-300',
    'ready_for_planning': 'bg-emerald-50 text-emerald-700 border-emerald-300',
    'planned': 'bg-blue-50 text-blue-700 border-blue-300',
    'picking': 'bg-indigo-50 text-indigo-700 border-indigo-300',
    'packing': 'bg-purple-50 text-purple-700 border-purple-300',
    'loading': 'bg-amber-50 text-amber-700 border-amber-300',
    'partial_shipment': 'bg-cyan-50 text-cyan-700 border-cyan-300',
    'shipped': 'bg-emerald-50 text-emerald-700 border-emerald-300',
    'cancelled': 'bg-slate-100 text-slate-500 border-slate-300',
    'revision_required': 'bg-red-50 text-red-700 border-red-300',
  };
  return colors[status] || 'bg-slate-100 text-slate-600 border-slate-300';
};

export const statusDotColor = (status: ShipmentStatus | string): string => {
  const colors: Record<string, string> = {
    'erp_imported': 'bg-slate-400',
    'waiting_stock': 'bg-amber-400',
    'waiting_quality': 'bg-orange-400',
    'blocked': 'bg-red-500',
    'ready_for_planning': 'bg-emerald-500',
    'planned': 'bg-blue-500',
    'picking': 'bg-indigo-500',
    'packing': 'bg-purple-500',
    'loading': 'bg-amber-500',
    'partial_shipment': 'bg-cyan-500',
    'shipped': 'bg-emerald-500',
    'cancelled': 'bg-slate-400',
    'revision_required': 'bg-red-500',
  };
  return colors[status] || 'bg-slate-400';
};

export const priorityLabel = (p: ShipmentPriority | string): string => {
  const labels: Record<string, string> = { low: 'Düşük', normal: 'Normal', high: 'Yüksek', critical: 'Kritik' };
  return labels[p] || p;
};

export const priorityColor = (p: ShipmentPriority | string): string => {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    normal: 'bg-blue-50 text-blue-700',
    high: 'bg-amber-50 text-amber-700',
    critical: 'bg-red-50 text-red-700',
  };
  return colors[p] || 'bg-slate-100 text-slate-600';
};

export const operationTypeLabel = (type: OperationType | string): string => {
  const labels: Record<string, string> = { PICKING: 'Picking', PACKING: 'Packing', LOADING: 'Yükleme' };
  return labels[type] || type;
};

export const operationStatusLabel = (status: OperationStatus | string): string => {
  const labels: Record<string, string> = { PENDING: 'Bekliyor', IN_PROGRESS: 'Devam Ediyor', COMPLETED: 'Tamamlandı' };
  return labels[status] || status;
};

export const operationTypeColor = (type: OperationType | string): string => {
  const colors: Record<string, string> = { PICKING: '#3b82f6', PACKING: '#f59e0b', LOADING: '#f97316' };
  return colors[type] || '#6b7280';
};

export const operationStatusColor = (status: OperationStatus | string): string => {
  const colors: Record<string, string> = {
    PENDING: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
};

export const personnelRoleLabel = (role: PersonnelRole | string): string => {
  const labels: Record<string, string> = { PICKER: 'Toplayıcı', PACKER: 'Paketçi', LOADER: 'Yükleyici', MULTI: 'Çok Yönlü' };
  return labels[role] || role;
};

export const packageTypeLabel = (type: string): string => {
  const labels: Record<string, string> = { BOX: 'Koli', PALLET: 'Palet', PACKAGE: 'Paket' };
  return labels[type] || type;
};

export const packageTypeIcon = (type: string): string => {
  const icons: Record<string, string> = { BOX: '📦', PALLET: '📏', PACKAGE: '📎' };
  return icons[type] || '📦';
};

export const formatDate = (date: string | Date | null, format: 'short' | 'long' | 'time' | 'datetime' = 'short'): string => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  switch (format) {
    case 'short': return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    case 'long': return d.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
    case 'time': return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    case 'datetime': return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    default: return d.toLocaleDateString('tr-TR');
  }
};

export const formatDateTime = (date: string | Date | null): string => {
  return formatDate(date, 'datetime');
};

export const formatTimeAgo = (dateStr: string | null): string => {
  if (!dateStr) return 'Hiç';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
};

export const countryTypeLabel = (type: string): string => {
  return type === 'YURTDISI' || type === 'EXPORT' ? 'İhracat' : 'Yurtiçi';
};

export const formatWeight = (kg: number): string => {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} ton`;
  return `${kg.toFixed(1)} kg`;
};

export const formatVolume = (m3: number): string => {
  return `${m3.toFixed(2)} m³`;
};