import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  ShipmentPlan,
  ShipmentStatus,
  ShipmentPriority,
  Operation,
  OperationType,
  OperationStatus,
  VehicleAssignment,
  LoadingSequence,
  PreparationCheck,
  OrderProduct,
  ErpShipmentHeader,
  ErpShipmentDetail,
} from './shipment-plan.entity';
import { CreateShipmentPlanDto } from './dto/create-shipment-plan.dto';
import { calculateVehiclePlacement, VehiclePlacementResult } from './vehicle-placement.util';
import { Vehicle } from '../vehicles/vehicle.entity';

@Injectable()
export class ShipmentPlansService {
  private readonly logger = new Logger(ShipmentPlansService.name);

  // FSM: Geçerli durum geçişleri
  private readonly VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
    [ShipmentStatus.ERP_IMPORTED]: [ShipmentStatus.WAITING_STOCK, ShipmentStatus.WAITING_QUALITY, ShipmentStatus.BLOCKED, ShipmentStatus.READY_FOR_PLANNING],
    [ShipmentStatus.WAITING_STOCK]: [ShipmentStatus.READY_FOR_PLANNING, ShipmentStatus.BLOCKED, ShipmentStatus.WAITING_QUALITY],
    [ShipmentStatus.WAITING_QUALITY]: [ShipmentStatus.READY_FOR_PLANNING, ShipmentStatus.BLOCKED],
    [ShipmentStatus.BLOCKED]: [ShipmentStatus.READY_FOR_PLANNING, ShipmentStatus.WAITING_STOCK, ShipmentStatus.WAITING_QUALITY],
    [ShipmentStatus.READY_FOR_PLANNING]: [ShipmentStatus.PLANNED, ShipmentStatus.BLOCKED],
    [ShipmentStatus.PLANNED]: [ShipmentStatus.PICKING, ShipmentStatus.REVISION_REQUIRED],
    [ShipmentStatus.PICKING]: [ShipmentStatus.PACKING, ShipmentStatus.REVISION_REQUIRED],
    [ShipmentStatus.PACKING]: [ShipmentStatus.LOADING, ShipmentStatus.REVISION_REQUIRED],
    [ShipmentStatus.LOADING]: [ShipmentStatus.PARTIAL_SHIPMENT, ShipmentStatus.SHIPPED, ShipmentStatus.REVISION_REQUIRED],
    [ShipmentStatus.PARTIAL_SHIPMENT]: [ShipmentStatus.PLANNED, ShipmentStatus.PICKING, ShipmentStatus.SHIPPED],
    [ShipmentStatus.SHIPPED]: [],
    [ShipmentStatus.CANCELLED]: [],
    [ShipmentStatus.REVISION_REQUIRED]: [ShipmentStatus.PLANNED, ShipmentStatus.READY_FOR_PLANNING],
  };

  constructor(
    @InjectRepository(ShipmentPlan, 'MES_DB')
    private readonly repo: Repository<ShipmentPlan>,
    @InjectRepository(Vehicle, 'MES_DB')
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  // ─── ERP'den Veri Alma ───────────────────────────────────────────────────

  async importFromErp(
    header: ErpShipmentHeader,
    details: ErpShipmentDetail[],
  ): Promise<ShipmentPlan> {
    // Mevcut kaydı kontrol et
    const existing = await this.repo.findOne({
      where: { sevkiyat_no: header.sevkiyat_no },
    });

    const dataHash = this.calculateDataHash(header, details);

    if (existing) {
      // ERP verisi değişmiş mi kontrol et
      if (existing.erp_data_hash && existing.erp_data_hash !== dataHash) {
        // Değişiklik tespit edildi
        if (existing.status !== ShipmentStatus.ERP_IMPORTED &&
            existing.status !== ShipmentStatus.READY_FOR_PLANNING &&
            existing.status !== ShipmentStatus.REVISION_REQUIRED) {
          // Planlama yapıldıktan sonra değişiklik → REVISION_REQUIRED
          existing.status = ShipmentStatus.REVISION_REQUIRED;
          existing.revision_notes = 'ERP verisi değişti. Sevkiyat yeniden planlanmalıdır.';
        }
      }
      // Verileri güncelle
      Object.assign(existing, this.mapErpToEntity(header, details, dataHash));
      return this.repo.save(existing);
    }

    // Yeni kayıt
    const entity = this.repo.create({
      ...this.mapErpToEntity(header, details, dataHash),
      status: ShipmentStatus.ERP_IMPORTED,
      priority: ShipmentPriority.NORMAL,
    });
    return this.repo.save(entity);
  }

  private mapErpToEntity(
    header: ErpShipmentHeader,
    details: ErpShipmentDetail[],
    dataHash: string,
  ): Partial<ShipmentPlan> {
    const urun_listesi: OrderProduct[] = details.map((d, idx) => {
      const hacim = d.hacim_m3 ?? (d.koli_uzunluk_m && d.koli_genislik_m && d.koli_yukseklik_m ? d.koli_uzunluk_m * d.koli_genislik_m * d.koli_yukseklik_m : 0);
      const agirlik = d.agirlik ?? 0;
      return {
        id: `prod-${Date.now()}-${idx}`,
        stok_kodu: d.stok_kodu,
        stok_adi: d.stok_adi,
        miktar: d.sevk_emir_miktari,
        kalan_miktar: d.sevk_emri_kalan,
        koli_sayisi: d.koli_sayisi ?? 1,
        palet_sayisi: d.palet_sayisi ?? 0,
        hacim_m3: hacim,
        agirlik: agirlik,
        depo_kodu: d.depo_kodu,
        scanned_quantity: 0,
        koli_uzunluk_m: d.koli_uzunluk_m,
        koli_genislik_m: d.koli_genislik_m,
        koli_yukseklik_m: d.koli_yukseklik_m,
      };
    });

    const toplam_koli = urun_listesi.reduce((s, p) => s + p.koli_sayisi, 0);
    const toplam_palet = urun_listesi.reduce((s, p) => s + p.palet_sayisi, 0);
    const toplam_agirlik = urun_listesi.reduce((s, p) => s + p.agirlik, 0);
    const toplam_hacim = urun_listesi.reduce((s, p) => s + p.hacim_m3, 0);

    return {
      sevkiyat_no: header.sevkiyat_no,
      siparis_no: header.siparis_no,
      kart_bilgisi: header.kart_bilgisi,
      cari_kod: header.cari_kod,
      cari_ad: header.cari_ad,
      nakliye_yeri: header.nakliye_yeri,
      cari_ulke: header.cari_ulke,
      cari_sehir: header.cari_sehir,
      cari_ilce: header.cari_ilce,
      termin_tarihi: new Date(header.termin_tarihi),
      sevkiyat_tarihi: header.sevkiyat_tarihi ? new Date(header.sevkiyat_tarihi) : null,
      islem_tarihi: header.islem_tarihi ? new Date(header.islem_tarihi) : null,
      teslimat_adresi: `${header.nakliye_yeri || ''}, ${header.cari_ilce || ''}/${header.cari_sehir || ''}`,
      erp_raw_header: header,
      erp_raw_details: details,
      erp_data_hash: dataHash,
      urun_listesi,
      toplam_koli,
      toplam_palet,
      toplam_agirlik_kg: toplam_agirlik,
      toplam_hacim_m3: toplam_hacim,
      preparation_checks: urun_listesi.map((u) => ({
        stok_kodu: u.stok_kodu,
        stok_adi: u.stok_adi,
        is_stock_sufficient: false,
        is_product_ready: false,
        is_quality_approved: false,
        is_warehouse_suitable: false,
        notes: '',
      })),
    };
  }

  private calculateDataHash(header: any, details: any[]): string {
    const data = JSON.stringify({ header, details });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private estimatePackageDimensions(urun: OrderProduct) {
    if (urun.palet_sayisi > 0) {
      return {
        length_mm: 1200,
        width_mm: 1000,
        height_mm: 1500,
      };
    }

    if (urun.koli_uzunluk_m && urun.koli_genislik_m && urun.koli_yukseklik_m) {
      return {
        length_mm: Math.round(urun.koli_uzunluk_m * 1000),
        width_mm: Math.round(urun.koli_genislik_m * 1000),
        height_mm: Math.round(urun.koli_yukseklik_m * 1000),
      };
    }

    const unitVolume = Math.max(0.04, urun.hacim_m3 / Math.max(1, urun.koli_sayisi || 1));
    const cube = Math.cbrt(unitVolume) * 1000;
    const base = Math.min(1200, Math.max(400, Math.round(cube)));
    return {
      length_mm: base,
      width_mm: Math.round(base * 0.8),
      height_mm: Math.round(Math.max(350, Math.min(1200, base * 0.75))),
    };
  }

  // ─── Durum Yönetimi (FSM) ────────────────────────────────────────────────

  async transitionStatus(id: string, targetStatus: ShipmentStatus): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    const allowedTransitions = this.VALID_TRANSITIONS[plan.status];

    if (!allowedTransitions.includes(targetStatus)) {
      throw new BadRequestException(
        `Geçersiz durum geçişi: ${plan.status} → ${targetStatus}. İzin verilenler: [${allowedTransitions.join(', ')}]`,
      );
    }

    // SHIPPED için tüm taramaların tamamlandığını kontrol et
    if (targetStatus === ShipmentStatus.SHIPPED) {
      const allScanned = plan.urun_listesi?.every(
        (u) => u.scanned_quantity >= u.miktar,
      );
      if (!allScanned) {
        throw new BadRequestException('Tüm ürünler taranmadan sevkiyat kapatılamaz. Eksik ürünler: ' +
          plan.urun_listesi?.filter((u) => u.scanned_quantity < u.miktar).map((u) => u.stok_kodu).join(', '));
      }
    }

    // PARTIAL_SHIPMENT -> planı güncelle
    if (targetStatus === ShipmentStatus.PARTIAL_SHIPMENT) {
      plan.is_partial_shipment = true;
      plan.partial_shipment_percentage = plan.partial_shipment_percentage || 0;
    }

    // PICKING geçişi için operasyonların oluşturulmuş olması gerek
    if (targetStatus === ShipmentStatus.PICKING && (!plan.operations || plan.operations.length === 0)) {
      throw new BadRequestException('Operasyonlar oluşturulmadan PICKING durumuna geçilemez.');
    }

    plan.status = targetStatus;
    return this.repo.save(plan);
  }

  // ─── Hazırlık Kontrolü ───────────────────────────────────────────────────

  async updatePreparationCheck(
    id: string,
    checks: PreparationCheck[],
  ): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    plan.preparation_checks = checks;

    // Tüm kontroller başarılı mı?
    const allPassed = checks.every(
      (c) => c.is_stock_sufficient && c.is_product_ready && c.is_quality_approved && c.is_warehouse_suitable,
    );
    const anyBlocked = checks.some(
      (c) => !c.is_stock_sufficient || !c.is_warehouse_suitable,
    );

    if (allPassed) {
      plan.status = ShipmentStatus.READY_FOR_PLANNING;
    } else if (anyBlocked) {
      plan.status = ShipmentStatus.BLOCKED;
    } else {
      plan.status = ShipmentStatus.WAITING_STOCK;
    }

    return this.repo.save(plan);
  }

  // ─── Operasyon Yönetimi ──────────────────────────────────────────────────

  async createOperations(id: string, pickingMin: number, packingMin: number, loadingMin: number): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    if (plan.status !== ShipmentStatus.READY_FOR_PLANNING && plan.status !== ShipmentStatus.PLANNED) {
      throw new BadRequestException('Operasyonlar sadece READY_FOR_PLANNING veya PLANNED durumunda oluşturulabilir.');
    }

    const now = new Date();
    const operations: Operation[] = [
      {
        id: `OP-${plan.sevkiyat_no}-PICK`,
        type: OperationType.PICKING,
        personel_ids: [],
        personel_names: [],
        planned_start: now.toISOString(),
        planned_end: new Date(now.getTime() + pickingMin * 60000).toISOString(),
        actual_start: null,
        actual_end: null,
        planned_duration_minutes: pickingMin,
        actual_duration_minutes: null,
        status: OperationStatus.PENDING,
      },
      {
        id: `OP-${plan.sevkiyat_no}-PACK`,
        type: OperationType.PACKING,
        personel_ids: [],
        personel_names: [],
        planned_start: new Date(now.getTime() + pickingMin * 60000).toISOString(),
        planned_end: new Date(now.getTime() + (pickingMin + packingMin) * 60000).toISOString(),
        actual_start: null,
        actual_end: null,
        planned_duration_minutes: packingMin,
        actual_duration_minutes: null,
        status: OperationStatus.PENDING,
      },
      {
        id: `OP-${plan.sevkiyat_no}-LOAD`,
        type: OperationType.LOADING,
        personel_ids: [],
        personel_names: [],
        planned_start: new Date(now.getTime() + (pickingMin + packingMin) * 60000).toISOString(),
        planned_end: new Date(now.getTime() + (pickingMin + packingMin + loadingMin) * 60000).toISOString(),
        actual_start: null,
        actual_end: null,
        planned_duration_minutes: loadingMin,
        actual_duration_minutes: null,
        status: OperationStatus.PENDING,
      },
    ];

    plan.operations = operations;
    plan.status = ShipmentStatus.PLANNED;
    return this.repo.save(plan);
  }

  async assignPersonnelToOperation(
    id: string,
    operationId: string,
    personelIds: string[],
    personelNames: string[],
  ): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    const opIndex = plan.operations?.findIndex((o) => o.id === operationId);
    if (opIndex === -1 || opIndex === undefined) {
      throw new NotFoundException(`Operasyon bulunamadı: ${operationId}`);
    }

    plan.operations[opIndex].personel_ids = personelIds;
    plan.operations[opIndex].personel_names = personelNames;
    return this.repo.save(plan);
  }

  async updateOperationTimes(
    id: string,
    operationId: string,
    plannedStart: string,
    plannedDurationMinutes: number,
  ): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    const opIndex = plan.operations?.findIndex((o) => o.id === operationId);
    if (opIndex === -1 || opIndex === undefined) {
      throw new NotFoundException(`Operasyon bulunamadı: ${operationId}`);
    }

    const start = new Date(plannedStart);
    const end = new Date(start.getTime() + plannedDurationMinutes * 60000);
    plan.operations[opIndex].planned_start = start.toISOString();
    plan.operations[opIndex].planned_end = end.toISOString();
    plan.operations[opIndex].planned_duration_minutes = plannedDurationMinutes;

    // Bağımlı operasyonların zamanlarını güncelle (PACKING, LOADING)
    if (operationId.endsWith('-PICK')) {
      const packOp = plan.operations?.find((o) => o.id.endsWith('-PACK'));
      if (packOp) {
        packOp.planned_start = end.toISOString();
        packOp.planned_end = new Date(end.getTime() + (packOp.planned_duration_minutes || 0) * 60000).toISOString();
      }
      const loadOp = plan.operations?.find((o) => o.id.endsWith('-LOAD'));
      if (loadOp && packOp) {
        loadOp.planned_start = new Date(end.getTime() + (packOp.planned_duration_minutes || 0) * 60000).toISOString();
        loadOp.planned_end = new Date(
          new Date(end.getTime() + (packOp.planned_duration_minutes || 0) * 60000).getTime() +
          (loadOp.planned_duration_minutes || 0) * 60000,
        ).toISOString();
      }
    } else if (operationId.endsWith('-PACK')) {
      const loadOp = plan.operations?.find((o) => o.id.endsWith('-LOAD'));
      if (loadOp) {
        loadOp.planned_start = end.toISOString();
        loadOp.planned_end = new Date(end.getTime() + (loadOp.planned_duration_minutes || 0) * 60000).toISOString();
      }
    }

    return this.repo.save(plan);
  }

  async startOperation(id: string, operationId: string): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    const op = plan.operations?.find((o) => o.id === operationId);
    if (!op) throw new NotFoundException(`Operasyon bulunamadı: ${operationId}`);

    // Bağımlılık kontrolü: PACKING -> PICKING tamamlanmalı
    if (op.type === OperationType.PACKING) {
      const picking = plan.operations?.find((o) => o.type === OperationType.PICKING);
      if (picking && picking.status !== OperationStatus.COMPLETED) {
        throw new BadRequestException('PACKING başlamadan önce PICKING tamamlanmalıdır.');
      }
    }
    // LOADING -> PACKING tamamlanmalı
    if (op.type === OperationType.LOADING) {
      const packing = plan.operations?.find((o) => o.type === OperationType.PACKING);
      if (packing && packing.status !== OperationStatus.COMPLETED) {
        throw new BadRequestException('LOADING başlamadan önce PACKING tamamlanmalıdır.');
      }
    }

    op.status = OperationStatus.IN_PROGRESS;
    op.actual_start = new Date().toISOString();
    return this.repo.save(plan);
  }

  async completeOperation(id: string, operationId: string): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    const op = plan.operations?.find((o) => o.id === operationId);
    if (!op) throw new NotFoundException(`Operasyon bulunamadı: ${operationId}`);

    op.status = OperationStatus.COMPLETED;
    op.actual_end = new Date().toISOString();
    if (op.actual_start) {
      const durationMs = new Date(op.actual_end).getTime() - new Date(op.actual_start).getTime();
      op.actual_duration_minutes = Math.round(durationMs / 60000);
    }

    return this.repo.save(plan);
  }

  // ─── Araç Atama ──────────────────────────────────────────────────────────

  async assignVehicle(
    id: string,
    vehicleId: string,
    plate: string,
    driverName: string,
    loadPercentage: number,
  ): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    const assignments = plan.vehicle_assignments || [];
    const maxSeq = assignments.length > 0 ? Math.max(...assignments.map((a) => a.delivery_sequence)) : 0;

    const assignment: VehicleAssignment = {
      id: `VA-${Date.now()}`,
      vehicle_id: vehicleId,
      plate,
      driver_name: driverName,
      load_percentage: loadPercentage,
      delivery_sequence: maxSeq + 1,
    };

    plan.vehicle_assignments = [...assignments, assignment];
    plan.is_partial_shipment = loadPercentage < 100;
    return this.repo.save(plan);
  }

  // ─── Yükleme Sırası Oluşturma ─────────────────────────────────────────────

  async generateLoadingSequence(id: string): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    if (!plan.vehicle_assignments || plan.vehicle_assignments.length === 0) {
      throw new BadRequestException('Yükleme sırası oluşturmak için en az bir araç atanmalıdır.');
    }

    const sequences: LoadingSequence[] = [];
    const sortedAssignments = [...plan.vehicle_assignments].sort((a, b) => a.delivery_sequence - b.delivery_sequence);

    for (const va of sortedAssignments) {
      const isFirst = va.delivery_sequence === Math.min(...sortedAssignments.map((a) => a.delivery_sequence));
      const isLast = va.delivery_sequence === Math.max(...sortedAssignments.map((a) => a.delivery_sequence));

      (plan.urun_listesi || []).forEach((urun, idx) => {
        const { length_mm, width_mm, height_mm } = this.estimatePackageDimensions(urun);
        sequences.push({
          id: `LS-${Date.now()}-${idx}`,
          vehicle_assignment_id: va.id,
          product_code: urun.stok_kodu,
          product_name: urun.stok_adi,
          pallet_count: urun.palet_sayisi,
          box_count: urun.koli_sayisi,
          sequence_order: va.delivery_sequence * 100 + idx,
          is_first_delivery: isFirst,
          is_last_delivery: isLast,
          weight_kg: urun.agirlik,
          volume_m3: urun.hacim_m3,
          length_mm,
          width_mm,
          height_mm,
        });
      });
    }

    // Yükleme sırası: İlk teslimat aracın arkasına (yüksek sequence), son teslimat aracın önüne (düşük sequence)
    // Paletler aşağı, koliler yukarı
    sequences.sort((a, b) => {
      if (a.is_first_delivery !== b.is_first_delivery) return a.is_first_delivery ? 1 : -1;
      if (a.is_last_delivery !== b.is_last_delivery) return a.is_last_delivery ? -1 : 1;
      // Paletler önce (daha ağır)
      if (a.pallet_count > 0 && b.pallet_count === 0) return -1;
      if (a.pallet_count === 0 && b.pallet_count > 0) return 1;
      return a.sequence_order - b.sequence_order;
    });

    // Sıra numaralarını yeniden ata
    sequences.forEach((s, idx) => { s.sequence_order = idx + 1; });

    plan.loading_sequences = sequences;
    return this.repo.save(plan);
  }
  async getVehiclePlacement(id: string): Promise<VehiclePlacementResult> {
    const plan = await this.findOne(id);
    const vehicleIds = (plan.vehicle_assignments || []).map((assignment) => assignment.vehicle_id).filter(Boolean);
    const vehicles = vehicleIds.length > 0
      ? await this.vehicleRepo.findBy({ id: In(vehicleIds) })
      : [];
    const vehicleMap = vehicles.reduce<Record<string, Vehicle>>((acc, vehicle) => {
      acc[vehicle.id] = vehicle;
      return acc;
    }, {});
    return calculateVehiclePlacement(plan, vehicleMap);
  }

  // ─── Barkod Tarama ────────────────────────────────────────────────────────

  async scanProduct(
    id: string,
    stokKodu: string,
    miktar: number,
  ): Promise<{ result: 'OK' | 'WRONG_PRODUCT' | 'EXCESS' | 'COMPLETE'; plan: ShipmentPlan }> {
    const plan = await this.findOne(id);
    const urun = plan.urun_listesi?.find((u) => u.stok_kodu === stokKodu);

    if (!urun) {
      return { result: 'WRONG_PRODUCT', plan };
    }

    const newScanned = urun.scanned_quantity + miktar;
    if (newScanned > urun.miktar) {
      return { result: 'EXCESS', plan };
    }

    urun.scanned_quantity = newScanned;
    await this.repo.save(plan);

    const allScanned = plan.urun_listesi?.every((u) => u.scanned_quantity >= u.miktar);
    return { result: allScanned ? 'COMPLETE' : 'OK', plan };
  }

  // ─── Sorgular ────────────────────────────────────────────────────────────

  async findAll(filters?: {
    status?: ShipmentStatus;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<ShipmentPlan[]> {
    const qb = this.repo.createQueryBuilder('sp');
    const conditions: string[] = [];
    const params: any = {};

    if (filters?.status) {
      conditions.push('sp.status = :status');
      params.status = filters.status;
    }
    if (filters?.dateFrom) {
      conditions.push('sp.termin_tarihi >= :dateFrom');
      params.dateFrom = filters.dateFrom;
    }
    if (filters?.dateTo) {
      conditions.push('sp.termin_tarihi <= :dateTo');
      params.dateTo = filters.dateTo;
    }
    if (filters?.search) {
      conditions.push('(sp.sevkiyat_no LIKE :search OR sp.cari_ad LIKE :search OR sp.siparis_no LIKE :search)');
      params.search = `%${filters.search}%`;
    }

    if (conditions.length > 0) {
      qb.where(conditions.join(' AND '), params);
    }

    return qb.orderBy('sp.termin_tarihi', 'ASC').addOrderBy('sp.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<ShipmentPlan> {
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Sevkiyat bulunamadı: ${id}`);
    return plan;
  }

  async findByShipmentNo(sevkiyatNo: string): Promise<ShipmentPlan> {
    const plan = await this.repo.findOne({ where: { sevkiyat_no: sevkiyatNo } });
    if (!plan) throw new NotFoundException(`Sevkiyat bulunamadı: ${sevkiyatNo}`);
    return plan;
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  async getDashboardStats() {
    try {
      const all = await this.repo.find();
      const now = new Date();

    const total = all.length;
    const delayed = all.filter((s) => s.status !== ShipmentStatus.SHIPPED && s.status !== ShipmentStatus.CANCELLED && new Date(s.termin_tarihi) < now).length;
    const in_progress = all.filter((s) =>
      [ShipmentStatus.PICKING, ShipmentStatus.PACKING, ShipmentStatus.LOADING].includes(s.status),
    ).length;
    const shipped = all.filter((s) => s.status === ShipmentStatus.SHIPPED).length;
    const planned = all.filter((s) => s.status === ShipmentStatus.PLANNED).length;
    const waiting_preparation = all.filter((s) =>
      [ShipmentStatus.ERP_IMPORTED, ShipmentStatus.WAITING_STOCK, ShipmentStatus.WAITING_QUALITY].includes(s.status),
    ).length;
    const revision_required = all.filter((s) => s.status === ShipmentStatus.REVISION_REQUIRED).length;
    const partial = all.filter((s) => s.is_partial_shipment).length;

    const totalHacim = all.reduce((s, p) => s + Number(p.toplam_hacim_m3 || 0), 0);
    const totalAgirlik = all.reduce((s, p) => s + Number(p.toplam_agirlik_kg || 0), 0);

    const operationsCount = all.reduce((s, p) => s + (p.operations?.length || 0), 0);
    const completedOps = all.reduce((s, p) => s + (p.operations?.filter((o) => o.status === OperationStatus.COMPLETED).length || 0), 0);
    const efficiency = operationsCount > 0 ? Math.round((completedOps / operationsCount) * 100) : 0;

    return {
      total,
      delayed,
      in_progress,
      shipped,
      planned,
      waiting_preparation,
      revision_required,
      partial_shipments: partial,
      total_hacim_m3: totalHacim,
      total_agirlik_kg: totalAgirlik,
      operation_efficiency: efficiency,
    };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }

  // ─── Öncelik Güncelleme ──────────────────────────────────────────────────

  async updatePriority(id: string, priority: ShipmentPriority): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);
    plan.priority = priority;
    return this.repo.save(plan);
  }

  // ─── Silme ────────────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const plan = await this.findOne(id);
    if (![ShipmentStatus.ERP_IMPORTED, ShipmentStatus.BLOCKED].includes(plan.status)) {
      throw new BadRequestException('Sadece ERP_IMPORTED veya BLOCKED durumundaki sevkiyatlar silinebilir.');
    }
    await this.repo.delete(id);
    return { message: 'Sevkiyat silindi.' };
  }
}