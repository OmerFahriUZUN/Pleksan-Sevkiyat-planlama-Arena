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
} from '../types';
import { addMinutes, addHours, subHours } from 'date-fns';

const now = new Date();

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export const mockProducts: Product[] = [
  {
    product_code: 'PRD-001',
    volume_dm3: 2.5,
    weight_kg: 1.2,
    fragile: false,
    stackable: true,
    default_package_type: 'BOX',
  },
  {
    product_code: 'PRD-002',
    volume_dm3: 8.0,
    weight_kg: 4.5,
    fragile: true,
    stackable: false,
    default_package_type: 'BOX',
  },
  {
    product_code: 'PRD-003',
    volume_dm3: 15.0,
    weight_kg: 12.0,
    fragile: false,
    stackable: true,
    default_package_type: 'PALLET',
  },
  {
    product_code: 'PRD-004',
    volume_dm3: 1.0,
    weight_kg: 0.5,
    fragile: true,
    stackable: false,
    default_package_type: 'PACKAGE',
  },
  {
    product_code: 'PRD-005',
    volume_dm3: 5.0,
    weight_kg: 3.2,
    fragile: false,
    stackable: true,
    default_package_type: 'BOX',
  },
  {
    product_code: 'PRD-006',
    volume_dm3: 20.0,
    weight_kg: 18.0,
    fragile: false,
    stackable: false,
    default_package_type: 'PALLET',
  },
  {
    product_code: 'PRD-007',
    volume_dm3: 3.5,
    weight_kg: 2.0,
    fragile: true,
    stackable: false,
    default_package_type: 'BOX',
  },
  {
    product_code: 'PRD-008',
    volume_dm3: 0.8,
    weight_kg: 0.3,
    fragile: false,
    stackable: true,
    default_package_type: 'PACKAGE',
  },
];

const productNames: Record<string, string> = {
  'PRD-001': 'Elektronik Kart A',
  'PRD-002': 'Cam Panel',
  'PRD-003': 'Metal Çerçeve',
  'PRD-004': 'Optik Lens',
  'PRD-005': 'Plastik Kasa',
  'PRD-006': 'Ağır Makine Parçası',
  'PRD-007': 'Seramik İzolasyon',
  'PRD-008': 'Vida Seti',
};

// ─── PERSONNEL ───────────────────────────────────────────────────────────────
export const mockPersonnel: Personnel[] = [
  { id: 'PRS-001', name: 'Ahmet Yılmaz', role: 'PICKER', shift_start: '08:00', shift_end: '17:00' },
  { id: 'PRS-002', name: 'Fatma Kaya', role: 'PICKER', shift_start: '08:00', shift_end: '17:00' },
  { id: 'PRS-003', name: 'Mehmet Demir', role: 'PACKER', shift_start: '08:00', shift_end: '17:00' },
  { id: 'PRS-004', name: 'Ayşe Çelik', role: 'PACKER', shift_start: '09:00', shift_end: '18:00' },
  { id: 'PRS-005', name: 'Mustafa Şahin', role: 'LOADER', shift_start: '08:00', shift_end: '17:00' },
  { id: 'PRS-006', name: 'Zeynep Arslan', role: 'LOADER', shift_start: '10:00', shift_end: '19:00' },
  { id: 'PRS-007', name: 'Hasan Öztürk', role: 'PICKER', shift_start: '14:00', shift_end: '23:00' },
  { id: 'PRS-008', name: 'Elif Koç', role: 'PACKER', shift_start: '14:00', shift_end: '23:00' },
];

// ─── VEHICLES ────────────────────────────────────────────────────────────────
export const mockVehicles: Vehicle[] = [
  { id: 'VHC-001', plate: '34 ABC 001', length_mm: 6000, width_mm: 2400, height_mm: 2500, max_weight: 3500, driver_name: 'Kadir Avcı' },
  { id: 'VHC-002', plate: '06 DEF 002', length_mm: 8000, width_mm: 2400, height_mm: 2700, max_weight: 5000, driver_name: 'Süleyman Baş' },
  { id: 'VHC-003', plate: '35 GHI 003', length_mm: 4000, width_mm: 2000, height_mm: 2200, max_weight: 2000, driver_name: 'Serkan Yıldız' },
  { id: 'VHC-004', plate: '16 JKL 004', length_mm: 10000, width_mm: 2500, height_mm: 2800, max_weight: 8000, driver_name: 'Osman Polat' },
];

// ─── SHIPMENTS ────────────────────────────────────────────────────────────────
function makeShipment(
  shipment_no: string,
  order_no: string,
  destination_name: string,
  delivery_address: string,
  country_type: 'DOMESTIC' | 'EXPORT',
  city: string,
  status: Shipment['status'],
  dueOffset: number // hours from now
): Shipment {
  return {
    id: `SHP-${shipment_no}`,
    shipment_no,
    order_no,
    due_date: addHours(now, dueOffset).toISOString(),
    shipment_date: subHours(now, 2).toISOString(),
    destination_name,
    delivery_address,
    country_type,
    city,
    status,
    delivery_sequence: undefined,
  };
}

const rawShipments = [
  makeShipment('SV-2024-001', 'SP-8801', 'Arçelik A.Ş.', 'Sütlüce Mah. İmrahor Cad. No:1', 'DOMESTIC', 'İstanbul', 'LOADING', 2),
  makeShipment('SV-2024-002', 'SP-8802', 'Bosch Türkiye', 'Kartal Plaza, Kat 10', 'DOMESTIC', 'İstanbul', 'PACKING', 5),
  makeShipment('SV-2024-003', 'SP-8803', 'Ford Otosan', 'Gölcük Fabrikası', 'DOMESTIC', 'Kocaeli', 'PICKING', 8),
  makeShipment('SV-2024-004', 'SP-8804', 'Siemens AG', 'Werner-von-Siemens-Str. 1', 'EXPORT', 'Berlin', 'PLANNED', 24),
  makeShipment('SV-2024-005', 'SP-8805', 'Vestel Elektronik', 'Manisa OSB No:45', 'DOMESTIC', 'Manisa', 'PLANNED', 12),
  makeShipment('SV-2024-006', 'SP-8806', 'BSH Grubu', 'Çerkezköy Fabrika', 'DOMESTIC', 'Tekirdağ', 'SHIPPED', -24),
  makeShipment('SV-2024-007', 'SP-8807', 'Mercedes-Benz', 'Stuttgart Headquarters', 'EXPORT', 'Stuttgart', 'PLANNED', 48),
  makeShipment('SV-2024-008', 'SP-8808', 'Tofaş', 'Bursa Fabrikası', 'DOMESTIC', 'Bursa', 'PICKING', 6),
  makeShipment('SV-2024-009', 'SP-8809', 'Samsung Türkiye', 'Levent 4, İstanbul', 'DOMESTIC', 'İstanbul', 'PLANNED', -2), // delayed
  makeShipment('SV-2024-010', 'SP-8810', 'LG Electronics', 'Seúl, Güney Kore', 'EXPORT', 'Seúl', 'PACKING', 36),
  makeShipment('SV-2024-011', 'SP-8811', 'Renault', 'Bursa Oyak Fabrikası', 'DOMESTIC', 'Bursa', 'PLANNED', 10),
  makeShipment('SV-2024-012', 'SP-8812', 'Philips', 'Amsterdam HQ', 'EXPORT', 'Amsterdam', 'PLANNED', -5), // delayed
];

// ─── SHIPMENT LINES ───────────────────────────────────────────────────────────
function makeLines(shipment: Shipment, lineData: Array<[string, number]>): ShipmentLine[] {
  return lineData.map(([product_code, quantity]) => ({
    id: `SL-${shipment.id}-${product_code}`,
    shipment_id: shipment.id,
    product_code,
    product_name: productNames[product_code] ?? product_code,
    quantity,
    unit: 'ADET',
    scanned_quantity:
      shipment.status === 'SHIPPED'
        ? quantity
        : shipment.status === 'LOADING' || shipment.status === 'PACKING'
        ? Math.floor(quantity * 0.8)
        : shipment.status === 'PICKING'
        ? Math.floor(quantity * 0.3)
        : 0,
  }));
}

const rawLines: ShipmentLine[] = [
  ...makeLines(rawShipments[0], [['PRD-001', 10], ['PRD-003', 2]]),
  ...makeLines(rawShipments[1], [['PRD-002', 5], ['PRD-005', 8]]),
  ...makeLines(rawShipments[2], [['PRD-004', 20], ['PRD-007', 3]]),
  ...makeLines(rawShipments[3], [['PRD-006', 1], ['PRD-001', 15]]),
  ...makeLines(rawShipments[4], [['PRD-008', 50], ['PRD-005', 10]]),
  ...makeLines(rawShipments[5], [['PRD-001', 8], ['PRD-003', 3]]),
  ...makeLines(rawShipments[6], [['PRD-006', 2], ['PRD-002', 4]]),
  ...makeLines(rawShipments[7], [['PRD-005', 12], ['PRD-008', 30]]),
  ...makeLines(rawShipments[8], [['PRD-003', 5], ['PRD-004', 10]]),
  ...makeLines(rawShipments[9], [['PRD-007', 6], ['PRD-001', 20]]),
  ...makeLines(rawShipments[10], [['PRD-002', 3], ['PRD-005', 7]]),
  ...makeLines(rawShipments[11], [['PRD-006', 1], ['PRD-008', 100]]),
];

// ─── PACKAGES ────────────────────────────────────────────────────────────────
function makePackages(shipments: Shipment[]): Package[] {
  const pkgs: Package[] = [];

  shipments.forEach((sh) => {
    if (sh.status === 'SHIPPED' || sh.status === 'LOADING' || sh.status === 'PACKING') {
      const pkg: Package = {
        id: `PKG-${sh.id}-1`,
        shipment_id: sh.id,
        package_type: 'BOX',
        total_weight: 12.5,
        total_volume: 18.0,
        stretch_wrap: false,
        items: [
          {
            id: `PKI-${sh.id}-1`,
            package_id: `PKG-${sh.id}-1`,
            product_code: 'PRD-001',
            product_name: 'Elektronik Kart A',
            quantity: 5,
            weight_kg: 1.2,
            volume_dm3: 2.5,
            fragile: false,
          },
        ],
      };
      pkgs.push(pkg);

      if (sh.status === 'SHIPPED') {
        const pallet: Package = {
          id: `PKG-${sh.id}-2`,
          shipment_id: sh.id,
          package_type: 'PALLET',
          total_weight: 24.0,
          total_volume: 45.0,
          stretch_wrap: true,
          items: [],
        };
        pkgs.push(pallet);
      }
    }
  });

  return pkgs;
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
function makeTasks(shipments: Shipment[], lines: ShipmentLine[]): Task[] {
  const tasks: Task[] = [];

  shipments.forEach((sh, idx) => {
    const totalItems = lines
      .filter((l) => l.shipment_id === sh.id)
      .reduce((s, l) => s + l.quantity, 0);

    const pickDur = totalItems * 1;
    const packDur = Math.ceil(totalItems * 0.5);
    const loadDur = 2 * 2; // 2 packages default

    const baseTime = new Date(sh.due_date);
    baseTime.setHours(8, 0, 0, 0);

    const offset = idx * 30;

    const pickStart = addMinutes(baseTime, offset);
    const pickEnd = addMinutes(pickStart, pickDur);
    const packStart = pickEnd;
    const packEnd = addMinutes(packStart, packDur);
    const loadStart = packEnd;
    const loadEnd = addMinutes(loadStart, loadDur);

    const pickers = mockPersonnel.filter((p) => p.role === 'PICKER');
    const packers = mockPersonnel.filter((p) => p.role === 'PACKER');
    const loaders = mockPersonnel.filter((p) => p.role === 'LOADER');

    const pickPerson = pickers[idx % pickers.length];
    const packPerson = packers[idx % packers.length];
    const loadPerson = loaders[idx % loaders.length];

    const pickStatus: Task['status'] =
      sh.status === 'PLANNED'
        ? 'PENDING'
        : sh.status === 'PICKING'
        ? 'IN_PROGRESS'
        : 'COMPLETED';

    const packStatus: Task['status'] =
      sh.status === 'PLANNED' || sh.status === 'PICKING'
        ? 'PENDING'
        : sh.status === 'PACKING'
        ? 'IN_PROGRESS'
        : 'COMPLETED';

    const loadStatus: Task['status'] =
      sh.status === 'LOADING'
        ? 'IN_PROGRESS'
        : sh.status === 'SHIPPED'
        ? 'COMPLETED'
        : 'PENDING';

    tasks.push({
      id: `TSK-${sh.id}-PICK`,
      shipment_id: sh.id,
      shipment_no: sh.shipment_no,
      type: 'PICKING',
      assigned_person_id: pickPerson.id,
      planned_start: pickStart.toISOString(),
      planned_end: pickEnd.toISOString(),
      actual_start: pickStatus !== 'PENDING' ? pickStart.toISOString() : null,
      actual_end: pickStatus === 'COMPLETED' ? pickEnd.toISOString() : null,
      status: pickStatus,
      duration_minutes: pickDur,
    });

    tasks.push({
      id: `TSK-${sh.id}-PACK`,
      shipment_id: sh.id,
      shipment_no: sh.shipment_no,
      type: 'PACKING',
      assigned_person_id: packPerson.id,
      planned_start: packStart.toISOString(),
      planned_end: packEnd.toISOString(),
      actual_start: packStatus !== 'PENDING' ? packStart.toISOString() : null,
      actual_end: packStatus === 'COMPLETED' ? packEnd.toISOString() : null,
      status: packStatus,
      duration_minutes: packDur,
    });

    tasks.push({
      id: `TSK-${sh.id}-LOAD`,
      shipment_id: sh.id,
      shipment_no: sh.shipment_no,
      type: 'LOADING',
      assigned_person_id: loadPerson.id,
      planned_start: loadStart.toISOString(),
      planned_end: loadEnd.toISOString(),
      actual_start: loadStatus !== 'PENDING' ? loadStart.toISOString() : null,
      actual_end: loadStatus === 'COMPLETED' ? loadEnd.toISOString() : null,
      status: loadStatus,
      duration_minutes: loadDur,
    });
  });

  return tasks;
}

// ─── VEHICLE ASSIGNMENTS ──────────────────────────────────────────────────────
const rawVehicleAssignments: VehicleAssignment[] = [
  { id: 'VA-001', shipment_id: 'SHP-SV-2024-001', vehicle_id: 'VHC-001', delivery_sequence: 1 },
  { id: 'VA-002', shipment_id: 'SHP-SV-2024-006', vehicle_id: 'VHC-001', delivery_sequence: 2 },
  { id: 'VA-003', shipment_id: 'SHP-SV-2024-002', vehicle_id: 'VHC-002', delivery_sequence: 1 },
  { id: 'VA-004', shipment_id: 'SHP-SV-2024-003', vehicle_id: 'VHC-003', delivery_sequence: 1 },
];

// ─── LOADING PLANS ────────────────────────────────────────────────────────────
const rawLoadingPlans: LoadingPlan[] = [
  { id: 'LP-001', package_id: 'PKG-SHP-SV-2024-006-2', vehicle_id: 'VHC-001', load_sequence: 1 },
  { id: 'LP-002', package_id: 'PKG-SHP-SV-2024-006-1', vehicle_id: 'VHC-001', load_sequence: 2 },
  { id: 'LP-003', package_id: 'PKG-SHP-SV-2024-001-1', vehicle_id: 'VHC-001', load_sequence: 3 },
];

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export function generateMockData() {
  const packages = makePackages(rawShipments);
  const tasks = makeTasks(rawShipments, rawLines);

  return {
    shipments: rawShipments,
    shipmentLines: rawLines,
    products: mockProducts,
    personnel: mockPersonnel,
    tasks,
    packages,
    vehicles: mockVehicles,
    vehicleAssignments: rawVehicleAssignments,
    loadingPlans: rawLoadingPlans,
  };
}
