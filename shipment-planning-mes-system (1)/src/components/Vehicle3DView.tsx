import { useEffect, useRef, useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Eye } from 'lucide-react';

interface Block3D {
  id: string;
  product_code: string;
  product_name: string;
  x: number; // mm
  y: number; // mm
  z: number; // mm
  width: number;  // mm (X ekseni)
  depth: number;  // mm (Z ekseni)
  height: number; // mm (Y ekseni)
  color: string;
  sequence_order: number;
  box_count: number;
  weight_kg: number;
}

interface VehicleDimensions {
  length: number; // mm
  width: number;  // mm
  height: number; // mm
}

interface Vehicle3DViewProps {
  blocks: Block3D[];
  vehicle: VehicleDimensions;
  utilization: number;
  plate: string;
  driverName: string;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#14B8A6',
];

function getColor(index: number): string {
  return COLORS[index % COLORS.length];
}

export function Vehicle3DView({ blocks, vehicle, utilization, plate, driverName }: Vehicle3DViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotX, setRotX] = useState(25);
  const [rotY, setRotY] = useState(-35);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [hoveredBlock, setHoveredBlock] = useState<Block3D | null>(null);

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // 3D → 2D projeksiyon (izometrik)
  const project = (x: number, y: number, z: number, canvas: HTMLCanvasElement) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const rx = toRad(rotX);
    const ry = toRad(rotY);

    // Y ekseni rotasyonu
    const x1 = x * Math.cos(ry) + z * Math.sin(ry);
    const z1 = -x * Math.sin(ry) + z * Math.cos(ry);

    // X ekseni rotasyonu
    const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
    const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);

    const fov = 800;
    const perspective = fov / (fov + z2);

    return {
      sx: cx + x1 * perspective * scale,
      sy: cy - y2 * perspective * scale,
      depth: z2,
    };
  };

  const drawScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Normalize boyutlar (araç iç hacmi referans)
    const maxDim = Math.max(vehicle.length, vehicle.width, vehicle.height);
    const norm = 200 / maxDim; // 200px referans

    const vL = vehicle.length * norm;
    const vW = vehicle.width * norm;
    const vH = vehicle.height * norm;

    // Merkeze al
    const ox = -vL / 2;
    const oy = -vH / 2;
    const oz = -vW / 2;

    // Araç dış çerçevesi (wireframe)
    const corners = [
      [ox, oy, oz], [ox + vL, oy, oz], [ox + vL, oy + vH, oz], [ox, oy + vH, oz],
      [ox, oy, oz + vW], [ox + vL, oy, oz + vW], [ox + vL, oy + vH, oz + vW], [ox, oy + vH, oz + vW],
    ].map(([x, y, z]) => project(x, y, z, canvas));

    const edges = [
      [0,1],[1,2],[2,3],[3,0], // ön yüz
      [4,5],[5,6],[6,7],[7,4], // arka yüz
      [0,4],[1,5],[2,6],[3,7], // kenarlar
    ];

    ctx.strokeStyle = 'rgba(100,150,255,0.6)';
    ctx.lineWidth = 1.5;
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(corners[a].sx, corners[a].sy);
      ctx.lineTo(corners[b].sx, corners[b].sy);
      ctx.stroke();
    });

    // Zemin ızgarası
    ctx.strokeStyle = 'rgba(100,150,255,0.15)';
    ctx.lineWidth = 0.5;
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const t = i / gridSteps;
      const p1 = project(ox + vL * t, oy, oz, canvas);
      const p2 = project(ox + vL * t, oy, oz + vW, canvas);
      ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
      const p3 = project(ox, oy, oz + vW * t, canvas);
      const p4 = project(ox + vL, oy, oz + vW * t, canvas);
      ctx.beginPath(); ctx.moveTo(p3.sx, p3.sy); ctx.lineTo(p4.sx, p4.sy); ctx.stroke();
    }

    // Blokları derinliğe göre sırala (painter's algorithm)
    const sortedBlocks = [...blocks].sort((a, b) => {
      const pa = project(
        ox + (a.x + a.width / 2) * norm,
        oy + (a.y + a.height / 2) * norm,
        oz + (a.z + a.depth / 2) * norm,
        canvas
      );
      const pb = project(
        ox + (b.x + b.width / 2) * norm,
        oy + (b.y + b.height / 2) * norm,
        oz + (b.z + b.depth / 2) * norm,
        canvas
      );
      return pa.depth - pb.depth;
    });

    // Her bloğu çiz
    sortedBlocks.forEach((block, idx) => {
      const bx = ox + block.x * norm;
      const by = oy + block.y * norm;
      const bz = oz + block.z * norm;
      const bw = block.width * norm;
      const bh = block.height * norm;
      const bd = block.depth * norm;

      const isHovered = hoveredBlock?.id === block.id;
      const color = block.color || getColor(idx);
      const alpha = isHovered ? 0.95 : 0.75;

      // 6 yüz: ön, arka, sol, sağ, üst, alt
      const faces = [
        // Üst yüz
        [[bx, by+bh, bz], [bx+bw, by+bh, bz], [bx+bw, by+bh, bz+bd], [bx, by+bh, bz+bd]],
        // Ön yüz (z küçük)
        [[bx, by, bz], [bx+bw, by, bz], [bx+bw, by+bh, bz], [bx, by+bh, bz]],
        // Sağ yüz
        [[bx+bw, by, bz], [bx+bw, by, bz+bd], [bx+bw, by+bh, bz+bd], [bx+bw, by+bh, bz]],
        // Sol yüz
        [[bx, by, bz], [bx, by, bz+bd], [bx, by+bh, bz+bd], [bx, by+bh, bz]],
        // Arka yüz
        [[bx, by, bz+bd], [bx+bw, by, bz+bd], [bx+bw, by+bh, bz+bd], [bx, by+bh, bz+bd]],
        // Alt yüz
        [[bx, by, bz], [bx+bw, by, bz], [bx+bw, by, bz+bd], [bx, by, bz+bd]],
      ];

      const brightness = [1.0, 0.85, 0.7, 0.6, 0.5, 0.4];

      faces.forEach((face, fi) => {
        const pts = face.map(([x, y, z]) => project(x, y, z, canvas));
        const b2 = brightness[fi];
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const bl = parseInt(color.slice(5, 7), 16);

        ctx.beginPath();
        ctx.moveTo(pts[0].sx, pts[0].sy);
        pts.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy));
        ctx.closePath();

        ctx.fillStyle = `rgba(${Math.round(r*b2)},${Math.round(g*b2)},${Math.round(bl*b2)},${alpha})`;
        ctx.fill();

        ctx.strokeStyle = isHovered ? '#fff' : `rgba(0,0,0,0.3)`;
        ctx.lineWidth = isHovered ? 2 : 0.5;
        ctx.stroke();
      });

      // Sıra numarası etiketi
      const center = project(bx + bw/2, by + bh/2, bz + bd/2, canvas);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${isHovered ? 14 : 11}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(block.sequence_order), center.sx, center.sy);
    });

    // Araç bilgisi
    ctx.fillStyle = 'rgba(15,23,42,0.8)';
    ctx.fillRect(8, 8, 200, 50);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`🚛 ${plate}`, 14, 14);
    ctx.fillText(`👤 ${driverName}`, 14, 30);
    ctx.fillStyle = utilization > 80 ? '#f59e0b' : '#10b981';
    ctx.fillText(`📦 Doluluk: %${utilization.toFixed(1)}`, 14, 46);
  };

  useEffect(() => {
    drawScene();
  }, [blocks, rotX, rotY, scale, hoveredBlock]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setRotY(prev => prev + dx * 0.5);
      setRotX(prev => Math.max(-80, Math.min(80, prev - dy * 0.5)));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  };

  const resetView = () => { setRotX(25); setRotY(-35); setScale(1); };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-blue-400" />
          <span className="text-xs font-medium text-slate-300">3D Araç Yerleşim Görünümü</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => setScale(s => Math.max(0.3, s - 0.2))} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
            <ZoomOut size={14} />
          </button>
          <button onClick={resetView} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={380}
        className="w-full cursor-grab active:cursor-grabbing"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Ürün listesi */}
      {blocks.length > 0 && (
        <div className="px-4 py-3 bg-slate-800 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2 font-medium">Yükleme Sırası</p>
          <div className="flex flex-wrap gap-2">
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs cursor-pointer transition-all"
                style={{
                  background: `${block.color || getColor(idx)}22`,
                  border: `1px solid ${block.color || getColor(idx)}66`,
                  color: block.color || getColor(idx),
                }}
                onMouseEnter={() => setHoveredBlock(block)}
                onMouseLeave={() => setHoveredBlock(null)}
              >
                <span className="font-bold">{block.sequence_order}.</span>
                <span>{block.product_name}</span>
                <span className="opacity-60">({block.box_count} koli)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredBlock && (
        <div className="px-4 py-2 bg-slate-700 border-t border-slate-600 text-xs text-slate-300">
          <span className="font-medium text-white">{hoveredBlock.product_name}</span>
          {' · '}
          {hoveredBlock.box_count} koli · {hoveredBlock.weight_kg} kg ·{' '}
          {hoveredBlock.width}×{hoveredBlock.depth}×{hoveredBlock.height} mm
        </div>
      )}
    </div>
  );
}
