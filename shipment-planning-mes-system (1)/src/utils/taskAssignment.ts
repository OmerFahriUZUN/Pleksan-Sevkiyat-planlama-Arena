import type {
  Shipment,
  ShipmentLine,
  Package,
  Personnel,
  Task,
  TaskType,
} from '../types';
import { addMinutes } from 'date-fns';

type PersonnelRole = 'PICKER' | 'PACKER' | 'LOADER';

// ─── LEAST WORKLOAD ASSIGNMENT ────────────────────────────────────────────────
function getPersonWorkloadMinutes(
  person_id: string,
  allTasks: Task[]
): number {
  return allTasks
    .filter(
      (t) =>
        t.assigned_person_id === person_id &&
        t.status !== 'COMPLETED'
    )
    .reduce((sum, t) => {
      const dur =
        (new Date(t.planned_end).getTime() -
          new Date(t.planned_start).getTime()) /
        60000;
      return sum + dur;
    }, 0);
}

function isPersonAvailableForShift(
  person: Personnel,
  start: Date,
  end: Date
): boolean {
  // Parse shift times as today's date boundaries
  const shiftStart = new Date(start);
  const [sh, sm] = person.shift_start.split(':').map(Number);
  shiftStart.setHours(sh, sm, 0, 0);

  const shiftEnd = new Date(start);
  const [eh, em] = person.shift_end.split(':').map(Number);
  shiftEnd.setHours(eh, em, 0, 0);

  // Night shift: if shift_end < shift_start, add 1 day
  if (shiftEnd < shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  return start >= shiftStart && end <= shiftEnd;
}

function hasConflict(
  person_id: string,
  start: Date,
  end: Date,
  allTasks: Task[],
  excludeTaskId?: string
): boolean {
  return allTasks.some(
    (t) =>
      t.id !== excludeTaskId &&
      t.assigned_person_id === person_id &&
      t.status !== 'COMPLETED' &&
      new Date(t.planned_start) < end &&
      new Date(t.planned_end) > start
  );
}

function selectBestPerson(
  role: PersonnelRole,
  personnel: Personnel[],
  start: Date,
  end: Date,
  allTasks: Task[]
): string | null {
  const eligible = personnel.filter(
    (p) =>
      p.role === role && isPersonAvailableForShift(p, start, end)
  );

  if (eligible.length === 0) return null;

  // Find person with least workload and no conflict
  const candidates = eligible
    .filter((p) => !hasConflict(p.id, start, end, allTasks))
    .sort(
      (a, b) =>
        getPersonWorkloadMinutes(a.id, allTasks) -
        getPersonWorkloadMinutes(b.id, allTasks)
    );

  return candidates.length > 0 ? candidates[0].id : eligible[0].id;
}

// ─── MAIN ASSIGNMENT FUNCTION ─────────────────────────────────────────────────
export function assignTasksToPersonnel(
  shipment: Shipment,
  lines: ShipmentLine[],
  packages: Package[],
  personnel: Personnel[],
  existingTasks: Task[],
  allTasks: Task[]
): Task[] {
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
  const totalPackages = packages.length > 0 ? packages.length : 1;

  // Durations per spec:
  // Picking: 1 min/item
  // Packing: 0.5 min/item
  // Loading: 2 min/package
  const pickDur = Math.max(totalItems * 1, 5);
  const packDur = Math.max(Math.ceil(totalItems * 0.5), 3);
  const loadDur = Math.max(totalPackages * 2, 4);

  // Start from now or due_date - (pickDur + packDur + loadDur)
  const dueDate = new Date(shipment.due_date);
  const totalDur = pickDur + packDur + loadDur;
  const baseStart = new Date(Math.max(
    Date.now(),
    dueDate.getTime() - totalDur * 60000
  ));

  const pickStart = baseStart;
  const pickEnd = addMinutes(pickStart, pickDur);
  const packStart = pickEnd;
  const packEnd = addMinutes(packStart, packDur);
  const loadStart = packEnd;
  const loadEnd = addMinutes(loadStart, loadDur);

  // Merge existing + new tasks for conflict checking
  const mergedTasks = [...allTasks.filter((t) => t.shipment_id !== shipment.id)];

  const pickPersonId = selectBestPerson('PICKER', personnel, pickStart, pickEnd, mergedTasks);
  const packPersonId = selectBestPerson('PACKER', personnel, packStart, packEnd, mergedTasks);
  const loadPersonId = selectBestPerson('LOADER', personnel, loadStart, loadEnd, mergedTasks);

  const newTasks: Task[] = [
    {
      id: existingTasks.find((t) => t.type === 'PICKING')?.id ?? `TSK-${shipment.id}-PICK-${Date.now()}`,
      shipment_id: shipment.id,
      shipment_no: shipment.shipment_no,
      type: 'PICKING',
      assigned_person_id: pickPersonId,
      planned_start: pickStart.toISOString(),
      planned_end: pickEnd.toISOString(),
      actual_start: null,
      actual_end: null,
      status: 'PENDING',
      duration_minutes: pickDur,
    },
    {
      id: existingTasks.find((t) => t.type === 'PACKING')?.id ?? `TSK-${shipment.id}-PACK-${Date.now()}`,
      shipment_id: shipment.id,
      shipment_no: shipment.shipment_no,
      type: 'PACKING',
      assigned_person_id: packPersonId,
      planned_start: packStart.toISOString(),
      planned_end: packEnd.toISOString(),
      actual_start: null,
      actual_end: null,
      status: 'PENDING',
      duration_minutes: packDur,
    },
    {
      id: existingTasks.find((t) => t.type === 'LOADING')?.id ?? `TSK-${shipment.id}-LOAD-${Date.now()}`,
      shipment_id: shipment.id,
      shipment_no: shipment.shipment_no,
      type: 'LOADING',
      assigned_person_id: loadPersonId,
      planned_start: loadStart.toISOString(),
      planned_end: loadEnd.toISOString(),
      actual_start: null,
      actual_end: null,
      status: 'PENDING',
      duration_minutes: loadDur,
    },
  ];

  return newTasks;
}
