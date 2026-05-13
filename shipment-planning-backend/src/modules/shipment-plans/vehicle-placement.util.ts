import { ShipmentPlan, LoadingSequence, VehicleAssignment } from './shipment-plan.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

export interface VehiclePlacementBlock {
  id: string;
  product_code: string;
  product_name: string;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  x_mm: number;
  y_mm: number;
  z_mm: number;
  vehicle_assignment_id: string;
  sequence_order: number;
  weight_kg: number;
  volume_m3: number;
  color: string;
}

export interface VehiclePlacementAssignment {
  vehicle_assignment_id: string;
  plate: string;
  driver_name: string;
  load_percentage: number;
  dimensions: {
    length_mm: number;
    width_mm: number;
    height_mm: number;
    volume_m3: number;
  };
  total_volume_m3: number;
  used_volume_m3: number;
  utilization: number;
  blocks: VehiclePlacementBlock[];
}

export interface VehiclePlacementResult {
  shipment_id: string;
  assignments: VehiclePlacementAssignment[];
}

const VEHICLE_DIMENSIONS = {
  length_mm: 6000,
  width_mm: 2400,
  height_mm: 2500,
};

const BOX_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9', '#a855f7'];

function createBlock(
  seq: LoadingSequence,
  index: number,
  x_mm: number,
  y_mm: number,
  z_mm: number,
  width_mm: number,
  depth_mm: number,
  height_mm: number,
  color: string,
): VehiclePlacementBlock {
  return {
    id: `VP-${seq.vehicle_assignment_id}-${seq.product_code}-${index}`,
    product_code: seq.product_code,
    product_name: seq.product_name,
    width_mm,
    depth_mm,
    height_mm,
    x_mm,
    y_mm,
    z_mm,
    vehicle_assignment_id: seq.vehicle_assignment_id,
    sequence_order: seq.sequence_order,
    weight_kg: seq.weight_kg,
    volume_m3: seq.volume_m3,
    color,
  };
}

export function calculateVehiclePlacement(plan: ShipmentPlan, vehicles: Record<string, Vehicle> = {}): VehiclePlacementResult {
  const assignments: VehiclePlacementAssignment[] = [];
  if (!plan.vehicle_assignments || !plan.loading_sequences) {
    return { shipment_id: plan.id, assignments };
  }

  const grouped = plan.loading_sequences.reduce<Record<string, LoadingSequence[]>>((acc, seq) => {
    acc[seq.vehicle_assignment_id] = acc[seq.vehicle_assignment_id] || [];
    acc[seq.vehicle_assignment_id].push(seq);
    return acc;
  }, {});

  for (const assignment of plan.vehicle_assignments) {
    const sequences = (grouped[assignment.id] || []).sort((a, b) => a.sequence_order - b.sequence_order);
    let x_mm = 0;
    let y_mm = 0;
    let z_mm = 0;
    let rowMaxDepth = 0;
    let layerMaxHeight = 0;
    const blocks: VehiclePlacementBlock[] = [];

    const vehicle = vehicles[assignment.vehicle_id];
    const dims = vehicle && vehicle.ic_uzunluk_mm && vehicle.ic_genislik_mm && vehicle.ic_yukseklik_mm
      ? {
        length_mm: Number(vehicle.ic_uzunluk_mm),
        width_mm: Number(vehicle.ic_genislik_mm),
        height_mm: Number(vehicle.ic_yukseklik_mm),
      }
      : VEHICLE_DIMENSIONS;

    const vehicleVolume = (dims.length_mm / 1000) * (dims.width_mm / 1000) * (dims.height_mm / 1000);
    let usedVolume = 0;

    sequences.forEach((seq, seqIndex) => {
      const width_mm = seq.width_mm || (seq.pallet_count > 0 ? 1200 : 800);
      const depth_mm = seq.depth_mm || (seq.pallet_count > 0 ? 1000 : 600);
      const height_mm = seq.height_mm || (seq.pallet_count > 0 ? 1500 : 500);
      const count = Math.max(1, seq.box_count || seq.pallet_count || 1);

      for (let i = 0; i < count; i += 1) {
        if (x_mm + width_mm > dims.length_mm) {
          x_mm = 0;
          y_mm += rowMaxDepth || depth_mm;
          rowMaxDepth = 0;
        }

        if (y_mm + depth_mm > dims.width_mm) {
          y_mm = 0;
          z_mm += layerMaxHeight || height_mm;
          layerMaxHeight = 0;
        }

        if (z_mm + height_mm > dims.height_mm) {
          z_mm = 0;
          y_mm = 0;
          x_mm = 0;
        }

        blocks.push(createBlock(seq, i, x_mm, y_mm, z_mm, width_mm, depth_mm, height_mm, BOX_COLORS[seqIndex % BOX_COLORS.length]));
        usedVolume += (width_mm / 1000) * (depth_mm / 1000) * (height_mm / 1000);

        x_mm += width_mm;
        rowMaxDepth = Math.max(rowMaxDepth, depth_mm);
        layerMaxHeight = Math.max(layerMaxHeight, height_mm);
      }
    });

    assignments.push({
      vehicle_assignment_id: assignment.id,
      plate: assignment.plate,
      driver_name: assignment.driver_name,
      load_percentage: assignment.load_percentage,
      dimensions: {
        ...dims,
        volume_m3: vehicleVolume,
      },
      total_volume_m3: vehicleVolume,
      used_volume_m3: Number(usedVolume.toFixed(2)),
      utilization: Number(((usedVolume / vehicleVolume) * 100).toFixed(1)),
      blocks,
    });
  }

  return { shipment_id: plan.id, assignments };
}
