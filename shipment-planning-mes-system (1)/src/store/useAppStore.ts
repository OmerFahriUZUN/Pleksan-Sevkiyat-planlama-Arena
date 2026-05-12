import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Shipment,
  ShipmentLine,
  Product,
  Personnel,
  Task,
  Package,
  Vehicle,
  VehicleAssignment,
  LoadingPlan,
  ScanLog,
  AuthUser,
  Notification,
  SyncStatus,
  ShipmentStatus,
  TaskStatus,
} from '../types';
import { generateMockData } from '../utils/mockData';
import { runPackagingAlgorithm } from '../utils/packagingAlgorithm';
import { assignTasksToPersonnel } from '../utils/taskAssignment';
import { planVehicleLoading } from '../utils/vehiclePlanning';
import { tasksAPI } from '../services/tasksAPI';

// ─── FSM ──────────────────────────────────────────────────────────────────────
const STATUS_ORDER: ShipmentStatus[] = [
  'PLANNED',
  'PICKING',
  'PACKING',
  'LOADING',
  'SHIPPED',
];

function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  const fromIdx = STATUS_ORDER.indexOf(from);
  const toIdx = STATUS_ORDER.indexOf(to);
  return toIdx === fromIdx + 1;
}

// ─── STORE INTERFACE ──────────────────────────────────────────────────────────
interface AppState {
  currentUser: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;

  syncStatus: SyncStatus;
  triggerSync: () => void;

  shipments: Shipment[];
  shipmentLines: ShipmentLine[];
  products: Product[];
  personnel: Personnel[];
  tasks: Task[];
  packages: Package[];
  vehicles: Vehicle[];
  vehicleAssignments: VehicleAssignment[];
  loadingPlans: LoadingPlan[];
  scanLogs: ScanLog[];

  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  transitionShipmentStatus: (shipment_id: string, to: ShipmentStatus) => boolean;
  updateShipmentDeliverySequence: (shipment_id: string, seq: number) => void;

  autoAssignTasks: (shipment_id: string) => void;
  loadTasksForShipment: (shipment_id: string) => Promise<void>;
  manualAssignTask: (task_id: string, person_ids: string[]) => Promise<void>;
  updateTaskDuration: (task_id: string, duration_minutes: number) => Promise<void>;
  startTask: (task_id: string) => void;
  completeTask: (task_id: string) => void;
  rescheduleTask: (task_id: string, new_start: string, new_end: string) => boolean;

  generatePackages: (shipment_id: string) => void;

  assignVehicle: (shipment_id: string, vehicle_id: string) => void;
  generateLoadingPlan: (vehicle_id: string) => void;

  recordScan: (shipment_id: string, product_code: string, quantity: number) => 'OK' | 'WRONG_PRODUCT' | 'EXCESS' | 'COMPLETE';

  getDashboardStats: () => {
    total: number;
    delayed: number;
    on_time: number;
    in_progress: number;
    shipped: number;
    vehicle_utilization: number;
    avg_loading_time: number;
    personnel_efficiency: number;
  };

  initializeData: () => void;
}

// ─── STORE ────────────────────────────────────────────────────────────────────
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),

      syncStatus: { last_sync: null, syncing: false, error: null, next_sync_in: 60 },

      triggerSync: () => {
        set((s) => ({ syncStatus: { ...s.syncStatus, syncing: true, error: null } }));
        setTimeout(() => {
          set((s) => ({
            syncStatus: {
              ...s.syncStatus,
              syncing: false,
              last_sync: new Date().toISOString(),
              next_sync_in: 60,
            },
          }));
          get().addNotification({ type: 'success', message: 'ERP verisi başarıyla senkronize edildi.' });
        }, 2000);
      },

      shipments: [],
      shipmentLines: [],
      products: [],
      personnel: [],
      tasks: [],
      packages: [],
      vehicles: [],
      vehicleAssignments: [],
      loadingPlans: [],
      scanLogs: [],

      notifications: [],

      addNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: `notif-${Date.now()}-${Math.random()}`, timestamp: new Date().toISOString(), read: false },
            ...s.notifications,
          ].slice(0, 50),
        })),

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      clearNotifications: () => set({ notifications: [] }),

      transitionShipmentStatus: (shipment_id, to) => {
        const { shipments, tasks, shipmentLines, addNotification } = get();
        const shipment = shipments.find((s) => s.id === shipment_id);
        if (!shipment) return false;

        if (!canTransition(shipment.status, to)) {
          addNotification({ type: 'error', message: `Geçiş izin verilmiyor: ${shipment.status} → ${to}` });
          return false;
        }

        if (to === 'SHIPPED') {
          const lines = shipmentLines.filter((l) => l.shipment_id === shipment_id);
          const allScanned = lines.every((l) => l.scanned_quantity >= l.quantity);
          const relatedTasks = tasks.filter((t) => t.shipment_id === shipment_id);
          const allTasksDone = relatedTasks.every((t) => t.status === 'COMPLETED');
          if (!allScanned || !allTasksDone) {
            addNotification({ type: 'error', message: 'Tüm taramalar ve görevler tamamlanmadan sevkiyat kapatılamaz.' });
            return false;
          }
        }

        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.id === shipment_id ? { ...sh, status: to } : sh
          ),
        }));

        addNotification({ type: 'success', message: `Sevkiyat #${shipment.shipment_no} → ${to} durumuna geçirildi.` });
        return true;
      },

      updateShipmentDeliverySequence: (shipment_id, seq) =>
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.id === shipment_id ? { ...sh, delivery_sequence: seq } : sh
          ),
        })),

      autoAssignTasks: (shipment_id) => {
        const { shipments, shipmentLines, personnel, tasks, packages, addNotification } = get();
        const shipment = shipments.find((s) => s.id === shipment_id);
        if (!shipment) return;
        const lines = shipmentLines.filter((l) => l.shipment_id === shipment_id);
        const pkgs = packages.filter((p) => p.shipment_id === shipment_id);
        const existingTasks = tasks.filter((t) => t.shipment_id === shipment_id);
        const newTasks = assignTasksToPersonnel(shipment, lines, pkgs, personnel, existingTasks, tasks);
        set((s) => ({
          tasks: [...s.tasks.filter((t) => t.shipment_id !== shipment_id), ...newTasks],
        }));
        addNotification({ type: 'success', message: `Sevkiyat #${shipment.shipment_no} için görevler otomatik atandı.` });
      },

      manualAssignTask: async (task_id, person_ids) => {
        const { tasks, personnel, addNotification } = get();
        const task = tasks.find((t) => t.id === task_id);
        if (!task) return;
        const roleMap: Record<string, string> = { PICKING: 'PICKER', PACKING: 'PACKER', LOADING: 'LOADER' };
        const invalid = person_ids.some((person_id) => {
          const person = personnel.find((p) => p.id === person_id);
          return person ? person.role !== roleMap[task.type] : true;
        });
        if (invalid) {
          addNotification({ type: 'warning', message: 'Seçilen personellerden bazıları bu görev tipi için uygun değil.' });
        }

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === task_id
              ? {
                  ...t,
                  assigned_person_ids: person_ids,
                  assigned_person_id: person_ids.length > 0 ? person_ids[0] : null,
                }
              : t,
          ),
        }));

        try {
          await tasksAPI.updateTask(task.shipment_id, task_id, { assigned_person_ids: person_ids });
          addNotification({ type: 'success', message: `${task.shipment_no} görevi için operatörler kaydedildi.` });
        } catch (error) {
          addNotification({ type: 'warning', message: 'Operatör ataması backend ile senkronize edilemedi. Yerelde kaydedildi.' });
        }
      },

      updateTaskDuration: async (task_id, duration_minutes) => {
        const { tasks, addNotification } = get();
        const task = tasks.find((t) => t.id === task_id);
        if (!task) return;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === task_id ? { ...t, duration_minutes } : t
          ),
        }));

        try {
          await tasksAPI.updateTask(task.shipment_id, task_id, { duration_minutes });
          addNotification({ type: 'success', message: `${task.shipment_no} görevi için süre güncellendi.` });
        } catch (error) {
          addNotification({ type: 'warning', message: 'Süre backend ile kaydedilemedi. Yerelde güncellendi.' });
        }
      },

      loadTasksForShipment: async (shipment_id) => {
        const { tasks, addNotification } = get();
        try {
          const serverTasks = await tasksAPI.getByShipment(shipment_id);
          set((s) => ({
            tasks: [
              ...s.tasks.filter((t) => t.shipment_id !== shipment_id),
              ...serverTasks,
            ],
          }));
          addNotification({ type: 'success', message: 'Sevkiyat görevleri backend ile senkronize edildi.' });
        } catch (error) {
          addNotification({ type: 'warning', message: 'Sevkiyat görevleri backend yüklenemedi. Yerelde devam ediliyor.' });
        }
      },

      startTask: (task_id) => {
        const now = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === task_id ? { ...t, status: 'IN_PROGRESS' as TaskStatus, actual_start: now } : t
          ),
        }));
      },

      completeTask: (task_id) => {
        const now = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === task_id ? { ...t, status: 'COMPLETED' as TaskStatus, actual_end: now } : t
          ),
        }));
      },

      rescheduleTask: (task_id, new_start, new_end) => {
        const { tasks, addNotification } = get();
        const task = tasks.find((t) => t.id === task_id);
        const taskPersonIds = task?.assigned_person_ids?.length
          ? task.assigned_person_ids
          : task?.assigned_person_id
          ? [task.assigned_person_id]
          : [];
        if (!task || taskPersonIds.length === 0) return false;

        const conflict = tasks.find((t) => {
          const assigneeIds = t.assigned_person_ids?.length
            ? t.assigned_person_ids
            : t.assigned_person_id
            ? [t.assigned_person_id]
            : [];
          return (
            t.id !== task_id &&
            assigneeIds.some((id) => taskPersonIds.includes(id)) &&
            t.status !== 'COMPLETED' &&
            new Date(t.planned_start) < new Date(new_end) &&
            new Date(t.planned_end) > new Date(new_start)
          );
        });

        if (conflict) {
          addNotification({ type: 'error', message: `Çakışma tespit edildi: Görev #${conflict.id} ile örtüşüyor.` });
          return false;
        }

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === task_id ? { ...t, planned_start: new_start, planned_end: new_end } : t
          ),
        }));
        return true;
      },

      generatePackages: (shipment_id) => {
        const { shipmentLines, products, addNotification } = get();
        const lines = shipmentLines.filter((l) => l.shipment_id === shipment_id);
        const pkgs = runPackagingAlgorithm(shipment_id, lines, products);
        set((s) => ({
          packages: [...s.packages.filter((p) => p.shipment_id !== shipment_id), ...pkgs],
        }));
        addNotification({ type: 'success', message: `${pkgs.length} paket oluşturuldu.` });
      },

      assignVehicle: (shipment_id, vehicle_id) => {
        const { vehicleAssignments, vehicles, packages, addNotification } = get();
        const vehicle = vehicles.find((v) => v.id === vehicle_id);
        if (!vehicle) return;
        const pkgs = packages.filter((p) => p.shipment_id === shipment_id);
        const totalWeight = pkgs.reduce((s, p) => s + p.total_weight, 0);
        if (totalWeight > vehicle.max_weight) {
          addNotification({ type: 'error', message: `Toplam ağırlık (${totalWeight.toFixed(1)} kg) araç kapasitesini (${vehicle.max_weight} kg) aşıyor.` });
          return;
        }
        const existingSeq = vehicleAssignments.filter((va) => va.vehicle_id === vehicle_id).map((va) => va.delivery_sequence);
        const maxSeq = existingSeq.length > 0 ? Math.max(...existingSeq) : 0;
        const newAssignment: VehicleAssignment = {
          id: `va-${Date.now()}`,
          shipment_id,
          vehicle_id,
          delivery_sequence: maxSeq + 1,
        };
        set((s) => ({
          vehicleAssignments: [...s.vehicleAssignments.filter((va) => va.shipment_id !== shipment_id), newAssignment],
        }));
        addNotification({ type: 'success', message: `Araç atandı: ${vehicle.plate}` });
      },

      generateLoadingPlan: (vehicle_id) => {
        const { vehicleAssignments, packages, shipments, addNotification } = get();
        const assignments = vehicleAssignments
          .filter((va) => va.vehicle_id === vehicle_id)
          .sort((a, b) => a.delivery_sequence - b.delivery_sequence);
        const plans = planVehicleLoading(vehicle_id, assignments, packages, shipments);
        set((s) => ({
          loadingPlans: [...s.loadingPlans.filter((lp) => lp.vehicle_id !== vehicle_id), ...plans],
        }));
        addNotification({ type: 'success', message: `Yükleme planı oluşturuldu: ${plans.length} paket.` });
      },

      recordScan: (shipment_id, product_code, quantity) => {
        const { shipmentLines, currentUser, addNotification } = get();
        const line = shipmentLines.find(
          (l) => l.shipment_id === shipment_id && l.product_code === product_code
        );

        if (!line) {
          addNotification({ type: 'error', message: `Hatalı ürün kodu: ${product_code}. Bu sevkiyata ait değil.` });
          return 'WRONG_PRODUCT';
        }

        const newScanned = line.scanned_quantity + quantity;
        if (newScanned > line.quantity) {
          addNotification({ type: 'warning', message: `Fazla tarama: ${product_code}. Limit: ${line.quantity}` });
          return 'EXCESS';
        }

        const log: ScanLog = {
          id: `scan-${Date.now()}-${Math.random()}`,
          shipment_id,
          product_code,
          product_name: line.product_name,
          quantity,
          operator_id: currentUser?.id ?? 'unknown',
          timestamp: new Date().toISOString(),
          synced: true,
        };

        set((s) => ({
          shipmentLines: s.shipmentLines.map((l) =>
            l.id === line.id ? { ...l, scanned_quantity: l.scanned_quantity + quantity } : l
          ),
          scanLogs: [...s.scanLogs, log],
        }));

        const updatedLines = get().shipmentLines.filter((l) => l.shipment_id === shipment_id);
        const allDone = updatedLines.every((l) => l.scanned_quantity >= l.quantity);

        if (allDone) {
          addNotification({ type: 'success', message: `Sevkiyat için tüm ürünler tarandı!` });
          return 'COMPLETE';
        }
        return 'OK';
      },

      getDashboardStats: () => {
        const { shipments, tasks, vehicleAssignments, vehicles } = get();
        const now = new Date();
        const delayed = shipments.filter((s) => s.status !== 'SHIPPED' && new Date(s.due_date) < now).length;
        const in_progress = shipments.filter((s) => s.status !== 'PLANNED' && s.status !== 'SHIPPED').length;
        const shipped = shipments.filter((s) => s.status === 'SHIPPED').length;
        const on_time = shipments.filter((s) => s.status === 'SHIPPED' || new Date(s.due_date) >= now).length;

        const completedLoadingTasks = tasks.filter(
          (t) => t.type === 'LOADING' && t.status === 'COMPLETED' && t.actual_start && t.actual_end
        );
        const avg_loading_time =
          completedLoadingTasks.length > 0
            ? completedLoadingTasks.reduce((sum, t) => {
                return sum + (new Date(t.actual_end!).getTime() - new Date(t.actual_start!).getTime()) / 60000;
              }, 0) / completedLoadingTasks.length
            : 0;

        const doneTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
        const activeTasks = tasks.filter((t) => t.status !== 'PENDING').length;
        const personnel_efficiency = activeTasks > 0 ? (doneTasks / activeTasks) * 100 : 0;
        const vehicle_utilization = vehicles.length > 0 ? Math.min((vehicleAssignments.length / vehicles.length) * 100, 100) : 0;

        return { total: shipments.length, delayed, on_time, in_progress, shipped, vehicle_utilization, avg_loading_time, personnel_efficiency };
      },

      initializeData: () => {
        const data = generateMockData();
        set({
          shipments: data.shipments,
          shipmentLines: data.shipmentLines,
          products: data.products,
          personnel: data.personnel,
          tasks: data.tasks,
          packages: data.packages,
          vehicles: data.vehicles,
          vehicleAssignments: data.vehicleAssignments,
          loadingPlans: data.loadingPlans,
          scanLogs: [],
        });
      },
    }),
    {
      name: 'mes-shipment-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        shipments: state.shipments,
        shipmentLines: state.shipmentLines,
        products: state.products,
        personnel: state.personnel,
        tasks: state.tasks,
        packages: state.packages,
        vehicles: state.vehicles,
        vehicleAssignments: state.vehicleAssignments,
        loadingPlans: state.loadingPlans,
        scanLogs: state.scanLogs,
      }),
    }
  )
);
