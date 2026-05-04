import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { ShipmentStatus, TaskType, TaskStatus, PackageType } from '../types';

export function formatDate(dateStr: string | null | undefined, fmt = 'dd.MM.yyyy HH:mm'): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return '—';
    return format(d, fmt, { locale: tr });
  } catch {
    return '—';
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  return formatDate(dateStr, 'dd.MM.yyyy');
}

export function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: tr });
  } catch {
    return '—';
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} dk`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}s ${m}dk` : `${h}s`;
}

export function statusLabel(status: ShipmentStatus): string {
  const map: Record<ShipmentStatus, string> = {
    PLANNED: 'Planlandı',
    PICKING: 'Toplama',
    PACKING: 'Paketleme',
    LOADING: 'Yükleme',
    SHIPPED: 'Sevk Edildi',
  };
  return map[status] ?? status;
}

export function statusColor(status: ShipmentStatus): string {
  const map: Record<ShipmentStatus, string> = {
    PLANNED: 'bg-slate-100 text-slate-700 border-slate-200',
    PICKING: 'bg-blue-100 text-blue-700 border-blue-200',
    PACKING: 'bg-amber-100 text-amber-700 border-amber-200',
    LOADING: 'bg-orange-100 text-orange-700 border-orange-200',
    SHIPPED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

export function statusDotColor(status: ShipmentStatus): string {
  const map: Record<ShipmentStatus, string> = {
    PLANNED: 'bg-slate-400',
    PICKING: 'bg-blue-500',
    PACKING: 'bg-amber-500',
    LOADING: 'bg-orange-500',
    SHIPPED: 'bg-emerald-500',
  };
  return map[status] ?? 'bg-gray-400';
}

export function taskTypeLabel(type: TaskType): string {
  const map: Record<TaskType, string> = {
    PICKING: 'Toplama',
    PACKING: 'Paketleme',
    LOADING: 'Yükleme',
  };
  return map[type] ?? type;
}

export function taskTypeColor(type: TaskType): string {
  const map: Record<TaskType, string> = {
    PICKING: '#3b82f6',
    PACKING: '#f59e0b',
    LOADING: '#f97316',
  };
  return map[type] ?? '#6b7280';
}

export function taskStatusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    PENDING: 'Bekliyor',
    IN_PROGRESS: 'Devam Ediyor',
    COMPLETED: 'Tamamlandı',
    BLOCKED: 'Engellendi',
  };
  return map[status] ?? status;
}

export function taskStatusColor(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    PENDING: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    BLOCKED: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

export function packageTypeLabel(type: PackageType): string {
  const map: Record<PackageType, string> = {
    BOX: 'Koli',
    PALLET: 'Palet',
    PACKAGE: 'Paket',
  };
  return map[type] ?? type;
}

export function packageTypeIcon(type: PackageType): string {
  const map: Record<PackageType, string> = {
    BOX: '📦',
    PALLET: '🪵',
    PACKAGE: '🎁',
  };
  return map[type] ?? '📦';
}

export function countryTypeLabel(type: string): string {
  return type === 'DOMESTIC' ? 'Yurt İçi' : 'İhracat';
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    PICKER: 'Toplayıcı',
    PACKER: 'Paketleyici',
    LOADER: 'Yükleyici',
    ADMIN: 'Yönetici',
    PLANNER: 'Planlayıcı',
    OPERATOR: 'Operatör',
  };
  return map[role] ?? role;
}

export function truncate(str: string, len = 30): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
