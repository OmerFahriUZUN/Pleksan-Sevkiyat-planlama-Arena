import type { VehicleAssignment, Package, Shipment, LoadingPlan } from '../types';

// ─── VEHICLE LOADING PLAN ─────────────────────────────────────────────────────
// Rule: Multi-drop → Last delivery loaded first (front of truck), 
//                    First delivery loaded last (rear) for easy unloading
// ─────────────────────────────────────────────────────────────────────────────

export function planVehicleLoading(
  vehicle_id: string,
  assignments: VehicleAssignment[], // sorted by delivery_sequence ASC
  allPackages: Package[],
  allShipments: Shipment[]
): LoadingPlan[] {
  const plans: LoadingPlan[] = [];
  let loadSequence = 1;

  // Reverse: last delivery sequence first (front of vehicle)
  const reversed = [...assignments].sort(
    (a, b) => b.delivery_sequence - a.delivery_sequence
  );

  for (const assignment of reversed) {
    const shipmentPackages = allPackages.filter(
      (p) => p.shipment_id === assignment.shipment_id
    );

    // Sort packages: heavier first, then by volume
    const sortedPackages = [...shipmentPackages].sort((a, b) => {
      // Pallets first (heaviest, go to bottom)
      if (a.package_type === 'PALLET' && b.package_type !== 'PALLET') return -1;
      if (b.package_type === 'PALLET' && a.package_type !== 'PALLET') return 1;
      return b.total_weight - a.total_weight;
    });

    for (const pkg of sortedPackages) {
      plans.push({
        id: `LP-${vehicle_id}-${pkg.id}-${loadSequence}`,
        package_id: pkg.id,
        vehicle_id,
        load_sequence: loadSequence++,
      });
    }
  }

  return plans;
}

// ─── VEHICLE CAPACITY CALCULATOR ─────────────────────────────────────────────
export function calculateVehicleCapacity(vehicle: {
  length_mm: number;
  width_mm: number;
  height_mm: number;
  max_weight: number;
}): { volume_dm3: number; max_weight: number } {
  const volume_dm3 =
    (vehicle.length_mm * vehicle.width_mm * vehicle.height_mm) / 1_000_000;
  return { volume_dm3, max_weight: vehicle.max_weight };
}

export function calculateVehicleUtilization(
  packages: Package[],
  vehicle: { length_mm: number; width_mm: number; height_mm: number; max_weight: number }
): { weight_percent: number; volume_percent: number } {
  const cap = calculateVehicleCapacity(vehicle);
  const totalWeight = packages.reduce((s, p) => s + p.total_weight, 0);
  const totalVolume = packages.reduce((s, p) => s + p.total_volume, 0);

  return {
    weight_percent: Math.min((totalWeight / cap.max_weight) * 100, 100),
    volume_percent: Math.min((totalVolume / cap.volume_dm3) * 100, 100),
  };
}
