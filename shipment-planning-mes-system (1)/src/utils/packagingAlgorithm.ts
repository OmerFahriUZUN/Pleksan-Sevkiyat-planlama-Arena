import type { ShipmentLine, Product, Package, PackageItem } from '../types';

const MAX_BOX_WEIGHT_KG = 25;
const MAX_BOX_VOLUME_DM3 = 60;
const PALLET_THRESHOLD_VOLUME_DM3 = 50;

// ─── DETERMINISTIC PACKAGING ALGORITHM ───────────────────────────────────────
// Rules:
//   1. Sort items: fragile first (must be isolated), then by volume DESC
//   2. Fill boxes up to weight/volume limit
//   3. If item volume > PALLET_THRESHOLD → pallet
//   4. Fragile items cannot mix with non-fragile in same box
//   5. Apply stretch wrap if: pallet used OR mixed content
// ─────────────────────────────────────────────────────────────────────────────

interface ItemUnit {
  product_code: string;
  product_name: string;
  quantity: number;
  weight_kg: number;
  volume_dm3: number;
  fragile: boolean;
  stackable: boolean;
}

export function runPackagingAlgorithm(
  shipment_id: string,
  lines: ShipmentLine[],
  products: Product[]
): Package[] {
  const productMap = new Map(products.map((p) => [p.product_code, p]));

  // Expand each line into individual item units grouped by 1
  const items: ItemUnit[] = [];

  for (const line of lines) {
    const product = productMap.get(line.product_code);
    if (!product) {
      // Default values if product not in catalog
      for (let i = 0; i < line.quantity; i++) {
        items.push({
          product_code: line.product_code,
          product_name: line.product_name,
          quantity: 1,
          weight_kg: 1.0,
          volume_dm3: 2.0,
          fragile: false,
          stackable: true,
        });
      }
      continue;
    }

    // If single item volume > pallet threshold, treat each as pallet item
    for (let i = 0; i < line.quantity; i++) {
      items.push({
        product_code: line.product_code,
        product_name: line.product_name,
        quantity: 1,
        weight_kg: product.weight_kg,
        volume_dm3: product.volume_dm3,
        fragile: product.fragile,
        stackable: product.stackable,
      });
    }
  }

  // Sort: fragile first (isolation), then by volume DESC
  items.sort((a, b) => {
    if (a.fragile !== b.fragile) return a.fragile ? -1 : 1;
    return b.volume_dm3 - a.volume_dm3;
  });

  // Separate fragile and non-fragile items
  const fragileItems = items.filter((i) => i.fragile);
  const normalItems = items.filter((i) => !i.fragile);

  const packages: Package[] = [];
  let pkgCounter = 1;

  function createPackage(type: 'BOX' | 'PALLET' | 'PACKAGE'): Package {
    return {
      id: `PKG-${shipment_id}-${pkgCounter++}`,
      shipment_id,
      package_type: type,
      total_weight: 0,
      total_volume: 0,
      stretch_wrap: false,
      items: [],
    };
  }

  function addItem(pkg: Package, item: ItemUnit): void {
    const existing = pkg.items.find((i) => i.product_code === item.product_code);
    if (existing) {
      existing.quantity += 1;
      existing.weight_kg += item.weight_kg;
      existing.volume_dm3 += item.volume_dm3;
    } else {
      const pkgItem: PackageItem = {
        id: `PKI-${pkg.id}-${item.product_code}-${Date.now()}-${Math.random()}`,
        package_id: pkg.id,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: 1,
        weight_kg: item.weight_kg,
        volume_dm3: item.volume_dm3,
        fragile: item.fragile,
      };
      pkg.items.push(pkgItem);
    }
    pkg.total_weight += item.weight_kg;
    pkg.total_volume += item.volume_dm3;
  }

  function packItems(itemList: ItemUnit[], isFragile: boolean): void {
    let currentPkg: Package | null = null;

    for (const item of itemList) {
      // Large volume → pallet
      if (item.volume_dm3 > PALLET_THRESHOLD_VOLUME_DM3) {
        const pallet = createPackage('PALLET');
        addItem(pallet, item);
        pallet.stretch_wrap = true;
        packages.push(pallet);
        continue;
      }

      // Heavy single item → new box
      if (item.weight_kg > MAX_BOX_WEIGHT_KG) {
        const pallet = createPackage('PALLET');
        addItem(pallet, item);
        pallet.stretch_wrap = true;
        packages.push(pallet);
        continue;
      }

      // Try to fit into current box
      if (currentPkg) {
        const newWeight = currentPkg.total_weight + item.weight_kg;
        const newVolume = currentPkg.total_volume + item.volume_dm3;

        // Check fragility isolation: fragile items must not stack over others
        const hasNonFragile = currentPkg.items.some((i) => !i.fragile);
        const hasFragile = currentPkg.items.some((i) => i.fragile);

        const fragileConflict =
          (isFragile && hasNonFragile) || (!isFragile && hasFragile);

        if (
          newWeight <= MAX_BOX_WEIGHT_KG &&
          newVolume <= MAX_BOX_VOLUME_DM3 &&
          !fragileConflict
        ) {
          addItem(currentPkg, item);
        } else {
          // Finalize current, start new
          packages.push(currentPkg);
          currentPkg = createPackage('BOX');
          addItem(currentPkg, item);
        }
      } else {
        currentPkg = createPackage('BOX');
        addItem(currentPkg, item);
      }
    }

    if (currentPkg) {
      packages.push(currentPkg);
    }
  }

  // Pack fragile items first (isolated)
  packItems(fragileItems, true);
  // Then normal items
  packItems(normalItems, false);

  // Post-processing: apply stretch wrap rules
  packages.forEach((pkg) => {
    if (pkg.package_type === 'PALLET') {
      pkg.stretch_wrap = true;
    }
    // Mixed content check
    const hasFragile = pkg.items.some((i) => i.fragile);
    const hasNonFragile = pkg.items.some((i) => !i.fragile);
    if (hasFragile && hasNonFragile) {
      pkg.stretch_wrap = true;
    }
  });

  return packages;
}
