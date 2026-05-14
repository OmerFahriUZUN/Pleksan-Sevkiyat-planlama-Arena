import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ParseUUIDPipe, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ShipmentPlansService } from './shipment-plans.service';
import { CreateShipmentPlanDto } from './dto/create-shipment-plan.dto';
import { UpdateShipmentPlanDto } from './dto/update-shipment-plan.dto';
import { ShipmentStatus, ShipmentPriority, PreparationCheck } from './shipment-plan.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Shipment Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shipment-plans')
export class ShipmentPlansController {
  constructor(private readonly service: ShipmentPlansService) {}

  // ─── ERP İmport ──────────────────────────────────────────────────────────
  @Post('import-erp')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'ERP\'den sevkiyat verisi al' })
  async importFromErp(@Body() body: { header: any; details: any[] }) {
    return this.service.importFromErp(body.header, body.details);
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────
  @Post()
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Yeni sevkiyat planı oluştur' })
  async create(@Body() dto: CreateShipmentPlanDto) {
    return this.service.importFromErp(
      {
        is_yeri: '',
        sevkiyat_no: dto.sevkiyat_no,
        siparis_no: dto.siparis_no,
        kart_bilgisi: dto.kart_bilgisi as 'YURTICI' | 'YURTDISI',
        cari_kod: dto.cari_kod,
        cari_ad: dto.cari_ad,
        nakliye_yeri: dto.nakliye_yeri || '',
        islem_tarihi: new Date().toISOString(),
        termin_tarihi: dto.termin_tarihi,
        sevkiyat_tarihi: dto.sevkiyat_tarihi || '',
        cari_ulke: dto.cari_ulke || '',
        cari_sehir: dto.cari_sehir || '',
        cari_ilce: dto.cari_ilce || '',
      },
      (dto.urun_listesi || []).map((u) => ({
        stok_kodu: u.stok_kodu,
        stok_adi: u.stok_adi,
        sevk_emir_miktari: u.miktar,
        sevk_emri_kalan: u.kalan_miktar,
        depo_kodu: u.depo_kodu || 'DEPO-01',
        sevk_tarihi: dto.sevkiyat_tarihi || '',
      })),
    );
  }

  // ─── Sorgular ────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Tüm sevkiyatları listele' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query('status') status?: ShipmentStatus, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string, @Query('search') search?: string) {
    return this.service.findAll({ status, dateFrom, dateTo, search });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard istatistikleri' })
  async getDashboard() {
    return this.service.getDashboardStats();
  }

  @Get('gantt')
  @ApiOperation({ summary: 'Gantt için aktif sevkiyatları al' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getGantt(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.service.getGanttPlans({ dateFrom, dateTo });
  }

  @Get('erp-pool')
  @ApiOperation({ summary: 'ERP havuzundaki sevkiyatlar (bekleyen)' })
  async getErpPool() {
    return this.service.findAll({ status: ShipmentStatus.ERP_IMPORTED });
  }

  @Get('ready-for-planning')
  @ApiOperation({ summary: 'Planlamaya hazır sevkiyatlar' })
  async getReadyForPlanning() {
    return this.service.findAll({ status: ShipmentStatus.READY_FOR_PLANNING });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sevkiyat detayı' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get('by-shipment-no/:no')
  @ApiOperation({ summary: 'Sevkiyat no ile getir' })
  async findByShipmentNo(@Param('no') no: string) {
    return this.service.findByShipmentNo(no);
  }

  // ─── Hazırlık Kontrolü ──────────────────────────────────────────────────
  @Patch(':id/preparation-check')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: 'Hazırlık kontrolü güncelle' })
  async updatePreparationCheck(@Param('id', ParseUUIDPipe) id: string, @Body('checks') checks: PreparationCheck[]) {
    return this.service.updatePreparationCheck(id, checks);
  }

  // ─── Operasyon Yönetimi ──────────────────────────────────────────────────
  @Post(':id/operations')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Operasyonları oluştur (PICKING, PACKING, LOADING)' })
  async createOperations(@Param('id', ParseUUIDPipe) id: string, @Body('picking_minutes') pickingMin: number, @Body('packing_minutes') packingMin: number, @Body('loading_minutes') loadingMin: number) {
    return this.service.createOperations(id, pickingMin || 20, packingMin || 25, loadingMin || 15);
  }

  @Patch(':id/operations/:operationId/assign')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Operasyona personel ata' })
  async assignPersonnel(@Param('id', ParseUUIDPipe) id: string, @Param('operationId') operationId: string, @Body('personel_ids') personelIds: string[], @Body('personel_names') personelNames: string[]) {
    return this.service.assignPersonnelToOperation(id, operationId, personelIds || [], personelNames || []);
  }

  @Patch(':id/operations/:operationId/times')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Operasyon zamanlarını güncelle' })
  async updateOperationTimes(@Param('id', ParseUUIDPipe) id: string, @Param('operationId') operationId: string, @Body('planned_start') plannedStart: string, @Body('planned_duration_minutes') durationMinutes: number) {
    return this.service.updateOperationTimes(id, operationId, plannedStart, durationMinutes);
  }

  @Patch(':id/operations/:operationId/start')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: 'Operasyonu başlat' })
  async startOperation(@Param('id', ParseUUIDPipe) id: string, @Param('operationId') operationId: string) {
    return this.service.startOperation(id, operationId);
  }

  @Patch(':id/operations/:operationId/complete')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: 'Operasyonu tamamla' })
  async completeOperation(@Param('id', ParseUUIDPipe) id: string, @Param('operationId') operationId: string) {
    return this.service.completeOperation(id, operationId);
  }

  // ─── Araç Atama ──────────────────────────────────────────────────────────
  @Post(':id/assign-vehicle')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Sevkiyata araç ata' })
  async assignVehicle(@Param('id', ParseUUIDPipe) id: string, @Body('vehicle_id') vehicleId: string, @Body('plate') plate: string, @Body('driver_name') driverName: string, @Body('load_percentage') loadPercentage: number) {
    return this.service.assignVehicle(id, vehicleId, plate, driverName, loadPercentage || 100);
  }

  @Post(':id/generate-loading-sequence')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Yükleme sırasını otomatik oluştur' })
  async generateLoadingSequence(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.generateLoadingSequence(id);
  }

  @Get(':id/vehicle-placement')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: 'Araca yüklenecek paket yerleşimini hesapla' })
  async getVehiclePlacement(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getVehiclePlacement(id);
  }

  // ─── Barkod Tarama ───────────────────────────────────────────────────────
  @Post(':id/scan')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: 'Barkod ile ürün tara (yanlış ürün/hata/uyarı kontrolü)' })
  async scanProduct(@Param('id', ParseUUIDPipe) id: string, @Body('stok_kodu') stokKodu: string, @Body('miktar') miktar: number) {
    return this.service.scanProduct(id, stokKodu, miktar || 1);
  }

  // ─── Durum ve Öncelik ───────────────────────────────────────────────────
  @Patch(':id/status')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: 'Sevkiyat durumunu güncelle (FSM kontrolü ile)' })
  async transitionStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: ShipmentStatus) {
    return this.service.transitionStatus(id, status);
  }

  @Patch(':id/priority')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Öncelik seviyesini güncelle (LOW/NORMAL/HIGH/CRITICAL)' })
  async updatePriority(@Param('id', ParseUUIDPipe) id: string, @Body('priority') priority: ShipmentPriority) {
    return this.service.updatePriority(id, priority);
  }

  // ─── 3D Yükleme Yönetimi ────────────────────────────────────────────────
  @Post(':id/3d-loading-start')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: '3D yüklemeyi başlat' })
  async start3DLoading(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.start3DLoading(id);
  }

  @Post(':id/3d-loading-confirm')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: '3D yüklemede bir blok/ürünü onayla' })
  async confirm3DLoadingItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('product_code') productCode: string,
    @Body('block_id') blockId: string,
    @Body('confirmed_by') confirmedBy: string,
  ) {
    return this.service.confirm3DLoadingItem(id, productCode, blockId, confirmedBy || 'operator');
  }

  @Post(':id/3d-loading-complete')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: '3D yüklemeyi tamamla' })
  async complete3DLoading(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.complete3DLoading(id);
  }

  // ─── İrsaliye ────────────────────────────────────────────────────────────
  @Post(':id/generate-irsaliye')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'İrsaliye oluştur' })
  async generateIrsaliye(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.generateIrsaliye(id);
  }

  // ─── Araç Planlama için Ek Sorgular ─────────────────────────────────────
  @Get('active-for-planning')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Planlama için aktif sevkiyatlar' })
  async getActiveForPlanning() {
    return this.service.getActiveShipmentsForPlanning();
  }

  @Get('planned-shipments')
  @Roles('admin', 'planner', 'warehouse')
  @ApiOperation({ summary: 'Planlanmış sevkiyatlar (devam eden operasyonlar)' })
  async getPlannedShipments() {
    return this.service.getPlannedShipments();
  }

  // ─── Araç Atama (Planlama) ──────────────────────────────────────────────
  @Post(':id/assign-shipment-to-vehicle')
  @Roles('admin', 'planner')
  @ApiOperation({ summary: 'Sevkiyatı araca ata (planlama sayfası)' })
  async assignShipmentToVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('vehicle_id') vehicleId: string,
    @Body('plate') plate: string,
    @Body('driver_name') driverName: string,
    @Body('load_percentage') loadPercentage: number,
  ) {
    return this.service.assignShipmentToVehicle(id, vehicleId, plate, driverName, loadPercentage || 100);
  }

  // ─── Silme ────────────────────────────────────────────────────────────────
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sevkiyat sil (sadece ERP_IMPORTED veya BLOCKED)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
