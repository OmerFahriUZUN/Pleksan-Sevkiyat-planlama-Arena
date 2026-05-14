import { DeepPartial } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AppDataSource } from './data-source';
import { User, UserRole } from '../modules/users/user.entity';
import { Personnel, PersonnelRole } from '../modules/personnel/personnel.entity';
import { Vehicle, VehicleStatus } from '../modules/vehicles/vehicle.entity';
import {
  ShipmentPlan,
  ShipmentStatus,
  ShipmentPriority,
  OrderProduct,
  LoadingSequence,
  Operation,
  OperationType,
  OperationStatus,
} from '../modules/shipment-plans/shipment-plan.entity';
const SAMPLE_OPERATOR_PASSWORD = '123456';

function hashData(data: any) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function buildProduct(detail: any, idx: number): OrderProduct {
  const volume = detail.hacim_m3 ?? (detail.koli_uzunluk_m && detail.koli_genislik_m && detail.koli_yukseklik_m
    ? detail.koli_uzunluk_m * detail.koli_genislik_m * detail.koli_yukseklik_m
    : 0.1);

  return {
    id: `prod-${Date.now()}-${idx}`,
    stok_kodu: detail.stok_kodu,
    stok_adi: detail.stok_adi,
    miktar: detail.sevk_emir_miktari,
    kalan_miktar: detail.sevk_emri_kalan,
    koli_sayisi: detail.koli_sayisi ?? 1,
    palet_sayisi: detail.palet_sayisi ?? 0,
    hacim_m3: volume,
    agirlik: detail.agirlik ?? 0,
    depo_kodu: detail.depo_kodu || 'DEPO-01',
    scanned_quantity: 0,
    koli_uzunluk_m: detail.koli_uzunluk_m,
    koli_genislik_m: detail.koli_genislik_m,
    koli_yukseklik_m: detail.koli_yukseklik_m,
  };
}

function estimateProductDimensions(product: OrderProduct) {
  if (product.palet_sayisi > 0) {
    return { length_mm: 1200, width_mm: 1000, height_mm: 1500 };
  }

  if (product.koli_uzunluk_m && product.koli_genislik_m && product.koli_yukseklik_m) {
    return {
      length_mm: Math.round(product.koli_uzunluk_m * 1000),
      width_mm: Math.round(product.koli_genislik_m * 1000),
      height_mm: Math.round(product.koli_yukseklik_m * 1000),
    };
  }

  const unitVolume = Math.max(0.04, product.hacim_m3 / Math.max(1, product.koli_sayisi || 1));
  const base = Math.min(1200, Math.max(400, Math.round(Math.cbrt(unitVolume) * 1000)));
  return {
    length_mm: base,
    width_mm: Math.max(400, Math.round(base * 0.85)),
    height_mm: Math.max(350, Math.round(base * 0.7)),
  };
}

async function seed() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepository = AppDataSource.getRepository(User);
  const personnelRepository = AppDataSource.getRepository(Personnel);
  const vehicleRepository = AppDataSource.getRepository(Vehicle);
  const shipmentRepository = AppDataSource.getRepository(ShipmentPlan);

  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  let adminUser = await userRepository.findOne({ where: { username: 'admin' } });

  if (adminUser) {
    adminUser.password = hashedPassword;
    adminUser.isActive = true;
    await userRepository.save(adminUser);
    console.log('✓ Admin kullanıcısı güncellendi');
  } else {
    adminUser = userRepository.create({
      username: 'admin',
      email: 'admin@pleksan.com',
      password: hashedPassword,
      fullName: 'Sistem Yöneticisi',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepository.save(adminUser);
    console.log('✓ Admin kullanıcısı oluşturuldu');
  }

  const testUsers = [
    {
      username: 'planner01',
      email: 'planner01@pleksan.com',
      password: 'Planner123!',
      fullName: 'Planlama Uzmanı 1',
      role: UserRole.PLANNER,
    },
    {
      username: 'warehouse01',
      email: 'warehouse01@pleksan.com',
      password: 'Warehouse123!',
      fullName: 'Depo Görevlisi 1',
      role: UserRole.WAREHOUSE,
    },
    {
      username: 'viewer01',
      email: 'viewer01@pleksan.com',
      password: 'Viewer123!',
      fullName: 'Görüntüleyen 1',
      role: UserRole.VIEWER,
    },
  ];

  for (const userData of testUsers) {
    let user = await userRepository.findOne({ where: { username: userData.username } });
    const hashedPwd = await bcrypt.hash(userData.password, 12);

    if (user) {
      user.password = hashedPwd;
      user.role = userData.role;
      user.isActive = true;
      await userRepository.save(user);
      console.log(`✓ ${userData.username} kullanıcısı güncellendi`);
    } else {
      user = userRepository.create({
        ...userData,
        password: hashedPwd,
        isActive: true,
      });
      await userRepository.save(user);
      console.log(`✓ ${userData.username} kullanıcısı oluşturuldu`);
    }
  }

  const operatorUsers = [
    { username: 'ali.boran', email: 'ali.boran@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Ali Boran Bolat', role: UserRole.OPERATOR },
    { username: 'berkay.kircay', email: 'berkay.kircay@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Berkay Kırçay', role: UserRole.OPERATOR },
    { username: 'burak.kircay', email: 'burak.kircay@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Burak Kırçay', role: UserRole.OPERATOR },
    { username: 'efe.deniz.bolat', email: 'efe.deniz.bolat@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Efe Deniz Bolat', role: UserRole.OPERATOR },
    { username: 'halil.bolat', email: 'halil.bolat@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Halil Bolat', role: UserRole.OPERATOR },
    { username: 'mehmet.albayrak', email: 'mehmet.albayrak@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Mehmet Albayrak', role: UserRole.OPERATOR },
    { username: 'mehmet.kuzu', email: 'mehmet.kuzu@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Mehmet Kuzu', role: UserRole.OPERATOR },
    { username: 'mert.ilkbas', email: 'mert.ilkbas@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Mert İlkbaş', role: UserRole.OPERATOR },
    { username: 'mustafa.colak', email: 'mustafa.colak@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Mustafa Çolak', role: UserRole.OPERATOR },
    { username: 'samiye.hundi', email: 'samiye.hundi@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Samiye Hundi', role: UserRole.OPERATOR },
    { username: 'sefa.demirkol', email: 'sefa.demirkol@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Sefa Demirkol', role: UserRole.OPERATOR },
    { username: 'suat.korucuoglu', email: 'suat.korucuoglu@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Suat Korucuoğlu', role: UserRole.OPERATOR },
    { username: 'yunus.emre.bolat', email: 'yunus.emre.bolat@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Yunus Emre Bolat', role: UserRole.OPERATOR },
    { username: 'zerrin.duman', email: 'zerrin.duman@pleksan.com', password: SAMPLE_OPERATOR_PASSWORD, fullName: 'Zerrin Duman', role: UserRole.OPERATOR },
  ];

  for (const userData of operatorUsers) {
    let user = await userRepository.findOne({ where: { username: userData.username } });
    const hashedPwd = await bcrypt.hash(userData.password, 12);

    if (user) {
      user.password = hashedPwd;
      user.role = userData.role;
      user.isActive = true;
      await userRepository.save(user);
      console.log(`✓ ${userData.username} operatör kullanıcısı güncellendi`);
    } else {
      user = userRepository.create({
        ...userData,
        password: hashedPwd,
        isActive: true,
      });
      await userRepository.save(user);
      console.log(`✓ ${userData.username} operatör kullanıcısı oluşturuldu`);
    }
  }

  const samplePersonnel = [
    { ad_soyad: 'Ali Boran Bolat', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Berkay Kırçay', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Burak Kırçay', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Efe Deniz Bolat', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Halil Bolat', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Mehmet Albayrak', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Mehmet Kuzu', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Mert İlkbaş', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Mustafa Çolak', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Samiye Hundi', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Sefa Demirkol', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Suat Korucuoğlu', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Yunus Emre Bolat', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
    { ad_soyad: 'Zerrin Duman', role: PersonnelRole.MULTI, vardiya_baslangic: '08:00', vardiya_bitis: '17:00' },
  ];

  for (const person of samplePersonnel) {
    let existing = await personnelRepository.findOne({ where: { ad_soyad: person.ad_soyad } });
    if (existing) {
      existing.role = person.role;
      existing.vardiya_baslangic = person.vardiya_baslangic;
      existing.vardiya_bitis = person.vardiya_bitis;
      existing.isActive = true;
      await personnelRepository.save(existing);
      console.log(`✓ Personel ${person.ad_soyad} güncellendi`);
    } else {
      existing = personnelRepository.create({
        ...person,
        isActive: true,
      });
      await personnelRepository.save(existing);
      console.log(`✓ Personel ${person.ad_soyad} oluşturuldu`);
    }
  }

  const sampleVehicles = [
    {
      arac_tipi: 'Panel Van',
      plaka: '34PLS123',
      sofor_adi: 'Mehmet Şahin',
      sofor_telefon: '05551234567',
      ic_uzunluk_mm: 6000,
      ic_genislik_mm: 2400,
      ic_yukseklik_mm: 2500,
      max_agirlik_kg: 3500,
      palet_kapasitesi: 10,
      status: VehicleStatus.AVAILABLE,
    },
    {
      arac_tipi: 'Panel Van',
      plaka: '34PLS124',
      sofor_adi: 'Ayşe Yıldız',
      sofor_telefon: '05552345678',
      ic_uzunluk_mm: 6000,
      ic_genislik_mm: 2400,
      ic_yukseklik_mm: 2500,
      max_agirlik_kg: 3500,
      palet_kapasitesi: 10,
      status: VehicleStatus.AVAILABLE,
    },
    {
      arac_tipi: 'Kamyonet',
      plaka: '34PLS125',
      sofor_adi: 'Cem Alp',
      sofor_telefon: '05553456789',
      ic_uzunluk_mm: 7000,
      ic_genislik_mm: 2500,
      ic_yukseklik_mm: 2600,
      max_agirlik_kg: 4500,
      palet_kapasitesi: 12,
      status: VehicleStatus.AVAILABLE,
    },
  ];

  for (const vehicle of sampleVehicles) {
    let existing = await vehicleRepository.findOne({ where: { plaka: vehicle.plaka } });
    if (existing) {
      Object.assign(existing, vehicle, { isActive: true });
      await vehicleRepository.save(existing);
      console.log(`✓ Araç ${vehicle.plaka} güncellendi`);
    } else {
      existing = vehicleRepository.create({
        ...vehicle,
        isActive: true,
      });
      await vehicleRepository.save(existing);
      console.log(`✓ Araç ${vehicle.plaka} oluşturuldu`);
    }
  }

  const defaultVehicle = await vehicleRepository.findOne({ where: { plaka: '34PLS123' } });

  const sampleErpHeader = {
    is_yeri: 'Merkez Depo',
    kart_bilgisi: 'YURTICI',
    sevkiyat_no: 'ERP-1001',
    siparis_no: 'SIP-1524',
    cari_kod: 'C12345',
    cari_ad: 'Pleksan Müşteri A.Ş.',
    nakliye_yeri: 'İstanbul Merkez',
    islem_tarihi: new Date().toISOString(),
    termin_tarihi: new Date(Date.now() + 2 * 24 * 60 * 60000).toISOString(),
    sevkiyat_tarihi: new Date(Date.now() + 3 * 24 * 60 * 60000).toISOString(),
    cari_ulke: 'Türkiye',
    cari_sehir: 'İstanbul',
    cari_ilce: 'Ümraniye',
  };

  const sampleErpDetails = [
    {
      stok_kodu: 'PLS-100',
      stok_adi: 'Pleksan Model 100',
      sevk_emir_miktari: 8,
      sevk_emri_kalan: 8,
      depo_kodu: 'DEPO-01',
      sevk_tarihi: new Date().toISOString(),
      koli_sayisi: 4,
      palet_sayisi: 1,
      hacim_m3: 0.36,
      agirlik: 220,
      koli_uzunluk_m: 1.2,
      koli_genislik_m: 0.8,
      koli_yukseklik_m: 0.4,
    },
    {
      stok_kodu: 'PLS-200',
      stok_adi: 'Pleksan Model 200',
      sevk_emir_miktari: 6,
      sevk_emri_kalan: 6,
      depo_kodu: 'DEPO-01',
      sevk_tarihi: new Date().toISOString(),
      koli_sayisi: 3,
      palet_sayisi: 0,
      hacim_m3: 0.18,
      agirlik: 120,
      koli_uzunluk_m: 0.8,
      koli_genislik_m: 0.6,
      koli_yukseklik_m: 0.5,
    },
    {
      stok_kodu: 'PLS-300',
      stok_adi: 'Pleksan Model 300',
      sevk_emir_miktari: 5,
      sevk_emri_kalan: 5,
      depo_kodu: 'DEPO-01',
      sevk_tarihi: new Date().toISOString(),
      koli_sayisi: 2,
      palet_sayisi: 0,
      hacim_m3: 0.14,
      agirlik: 90,
      koli_uzunluk_m: 0.9,
      koli_genislik_m: 0.7,
      koli_yukseklik_m: 0.35,
    },
  ];

  const sampleShipmentHash = hashData({ header: sampleErpHeader, details: sampleErpDetails });
  let sampleShipment = await shipmentRepository.findOne({ where: { sevkiyat_no: sampleErpHeader.sevkiyat_no } });

  const sampleProducts = sampleErpDetails.map(buildProduct);
  const sampTotals = {
    toplam_koli: sampleProducts.reduce((sum, p) => sum + p.koli_sayisi, 0),
    toplam_palet: sampleProducts.reduce((sum, p) => sum + p.palet_sayisi, 0),
    toplam_agirlik_kg: sampleProducts.reduce((sum, p) => sum + p.agirlik, 0),
    toplam_hacim_m3: sampleProducts.reduce((sum, p) => sum + p.hacim_m3, 0),
  };

  const vehicleAssignmentId = `VA-${Date.now()}-1`;
  const sampleAssignment = {
    id: vehicleAssignmentId,
    vehicle_id: defaultVehicle?.id || 'vehicle-sample-1',
    plate: defaultVehicle?.plaka || '34PLS123',
    driver_name: defaultVehicle?.sofor_adi || 'Mehmet Şahin',
    load_percentage: 80,
    delivery_sequence: 1,
  };

  const sampleLoadingSequences: LoadingSequence[] = sampleProducts.map((product, idx) => {
    const dims = estimateProductDimensions(product);
    return {
      id: `LS-${Date.now()}-${idx}`,
      vehicle_assignment_id: vehicleAssignmentId,
      product_code: product.stok_kodu,
      product_name: product.stok_adi,
      pallet_count: product.palet_sayisi,
      box_count: product.koli_sayisi,
      sequence_order: idx + 1,
      is_first_delivery: true,
      is_last_delivery: false,
      weight_kg: product.agirlik,
      volume_m3: product.hacim_m3,
      length_mm: dims.length_mm,
      width_mm: dims.width_mm,
      height_mm: dims.height_mm,
    };
  });

  const sampleShipmentData = {
    sevkiyat_no: sampleErpHeader.sevkiyat_no,
    siparis_no: sampleErpHeader.siparis_no,
    kart_bilgisi: sampleErpHeader.kart_bilgisi,
    cari_kod: sampleErpHeader.cari_kod,
    cari_ad: sampleErpHeader.cari_ad,
    nakliye_yeri: sampleErpHeader.nakliye_yeri,
    cari_ulke: sampleErpHeader.cari_ulke,
    cari_sehir: sampleErpHeader.cari_sehir,
    cari_ilce: sampleErpHeader.cari_ilce,
    termin_tarihi: new Date(sampleErpHeader.termin_tarihi),
    sevkiyat_tarihi: sampleErpHeader.sevkiyat_tarihi ? new Date(sampleErpHeader.sevkiyat_tarihi) : null,
    islem_tarihi: sampleErpHeader.islem_tarihi ? new Date(sampleErpHeader.islem_tarihi) : null,
    teslimat_adresi: `${sampleErpHeader.nakliye_yeri || ''}, ${sampleErpHeader.cari_ilce || ''}/${sampleErpHeader.cari_sehir || ''}`,
    erp_raw_header: sampleErpHeader,
    erp_raw_details: sampleErpDetails,
    erp_data_hash: sampleShipmentHash,
    urun_listesi: sampleProducts,
    toplam_koli: sampTotals.toplam_koli,
    toplam_palet: sampTotals.toplam_palet,
    toplam_agirlik_kg: sampTotals.toplam_agirlik_kg,
    toplam_hacim_m3: sampTotals.toplam_hacim_m3,
    preparation_checks: sampleProducts.map((product) => ({
      stok_kodu: product.stok_kodu,
      stok_adi: product.stok_adi,
      is_stock_sufficient: true,
      is_product_ready: true,
      is_quality_approved: true,
      is_warehouse_suitable: true,
      notes: '',
    })),
    status: ShipmentStatus.ERP_IMPORTED,
    priority: ShipmentPriority.NORMAL,
    is_partial_shipment: false,
    partial_shipment_percentage: 0,
    vehicle_assignments: [sampleAssignment],
    loading_sequences: sampleLoadingSequences,
  };

  if (sampleShipment) {
    Object.assign(sampleShipment, sampleShipmentData);
    await shipmentRepository.save(sampleShipment);
    console.log('✓ ERP havuzuna örnek sevkiyat güncellendi');
  } else {
    sampleShipment = shipmentRepository.create(
      sampleShipmentData as DeepPartial<ShipmentPlan>
    );
    await shipmentRepository.save(sampleShipment);
    console.log('✓ ERP havuzuna örnek sevkiyat oluşturuldu');
  }

  const additionalErpPoolShipments = [
    {
      header: {
        is_yeri: 'Merkez Depo',
        kart_bilgisi: 'YURTICI',
        sevkiyat_no: 'ERP-1002',
        siparis_no: 'SIP-1525',
        cari_kod: 'C54321',
        cari_ad: 'Pleksan Bayi B',
        nakliye_yeri: 'İstanbul Anadolu',
        islem_tarihi: new Date().toISOString(),
        termin_tarihi: new Date(Date.now() + 4 * 24 * 60 * 60000).toISOString(),
        sevkiyat_tarihi: new Date(Date.now() + 5 * 24 * 60 * 60000).toISOString(),
        cari_ulke: 'Türkiye',
        cari_sehir: 'İstanbul',
        cari_ilce: 'Kadıköy',
      },
      details: [
        {
          stok_kodu: 'ERP-PRD-01',
          stok_adi: 'Beyaz Ev Aletleri Seti',
          sevk_emir_miktari: 10,
          sevk_emri_kalan: 10,
          depo_kodu: 'DEPO-01',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 5,
          palet_sayisi: 1,
          hacim_m3: 0.5,
          agirlik: 280,
          koli_uzunluk_m: 1.1,
          koli_genislik_m: 0.8,
          koli_yukseklik_m: 0.6,
        },
        {
          stok_kodu: 'ERP-PRD-02',
          stok_adi: 'Mutfak Aksesuarı Paketi',
          sevk_emir_miktari: 12,
          sevk_emri_kalan: 12,
          depo_kodu: 'DEPO-01',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 6,
          palet_sayisi: 1,
          hacim_m3: 0.36,
          agirlik: 180,
          koli_uzunluk_m: 1.0,
          koli_genislik_m: 0.75,
          koli_yukseklik_m: 0.48,
        },
        {
          stok_kodu: 'ERP-PRD-03',
          stok_adi: 'Ofis Malzemeleri Seti',
          sevk_emir_miktari: 8,
          sevk_emri_kalan: 8,
          depo_kodu: 'DEPO-01',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 4,
          palet_sayisi: 0,
          hacim_m3: 0.24,
          agirlik: 96,
          koli_uzunluk_m: 0.9,
          koli_genislik_m: 0.6,
          koli_yukseklik_m: 0.45,
        },
      ],
    },
    {
      header: {
        is_yeri: 'Bölge Depo',
        kart_bilgisi: 'YURTICI',
        sevkiyat_no: 'ERP-1003',
        siparis_no: 'SIP-1526',
        cari_kod: 'C67890',
        cari_ad: 'Pleksan Ticaret C',
        nakliye_yeri: 'Ankara Depo',
        islem_tarihi: new Date().toISOString(),
        termin_tarihi: new Date(Date.now() + 6 * 24 * 60 * 60000).toISOString(),
        sevkiyat_tarihi: new Date(Date.now() + 7 * 24 * 60 * 60000).toISOString(),
        cari_ulke: 'Türkiye',
        cari_sehir: 'Ankara',
        cari_ilce: 'Çankaya',
      },
      details: [
        {
          stok_kodu: 'ERP-PRD-04',
          stok_adi: 'Toner Kartuşu Seti',
          sevk_emir_miktari: 20,
          sevk_emri_kalan: 20,
          depo_kodu: 'DEPO-02',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 10,
          palet_sayisi: 1,
          hacim_m3: 0.6,
          agirlik: 160,
          koli_uzunluk_m: 1.2,
          koli_genislik_m: 0.8,
          koli_yukseklik_m: 0.5,
        },
        {
          stok_kodu: 'ERP-PRD-05',
          stok_adi: 'Endüstriyel Temizlik Kimyasalı',
          sevk_emir_miktari: 15,
          sevk_emri_kalan: 15,
          depo_kodu: 'DEPO-02',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 5,
          palet_sayisi: 0,
          hacim_m3: 0.35,
          agirlik: 140,
          koli_uzunluk_m: 0.85,
          koli_genislik_m: 0.6,
          koli_yukseklik_m: 0.7,
        },
        {
          stok_kodu: 'ERP-PRD-06',
          stok_adi: 'Ağır Sanayi Yedek Parça',
          sevk_emir_miktari: 6,
          sevk_emri_kalan: 6,
          depo_kodu: 'DEPO-02',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 3,
          palet_sayisi: 1,
          hacim_m3: 0.72,
          agirlik: 360,
          koli_uzunluk_m: 1.5,
          koli_genislik_m: 1.0,
          koli_yukseklik_m: 0.48,
        },
        {
          stok_kodu: 'ERP-PRD-07',
          stok_adi: 'Elektrik Panosu Modülü',
          sevk_emir_miktari: 4,
          sevk_emri_kalan: 4,
          depo_kodu: 'DEPO-02',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 2,
          palet_sayisi: 0,
          hacim_m3: 0.3,
          agirlik: 180,
          koli_uzunluk_m: 1.0,
          koli_genislik_m: 0.75,
          koli_yukseklik_m: 0.4,
        },
      ],
    },
    {
      header: {
        is_yeri: 'Lojistik Merkezi',
        kart_bilgisi: 'YURTDISI',
        sevkiyat_no: 'ERP-1004',
        siparis_no: 'SIP-1527',
        cari_kod: 'C24680',
        cari_ad: 'Pleksan Dış Ticaret',
        nakliye_yeri: 'İzmir Liman',
        islem_tarihi: new Date().toISOString(),
        termin_tarihi: new Date(Date.now() + 8 * 24 * 60 * 60000).toISOString(),
        sevkiyat_tarihi: new Date(Date.now() + 9 * 24 * 60 * 60000).toISOString(),
        cari_ulke: 'Yunanistan',
        cari_sehir: 'İzmir',
        cari_ilce: 'Gaziemir',
      },
      details: [
        {
          stok_kodu: 'ERP-PRD-08',
          stok_adi: 'Dış Mekan Aydınlatma Armatürü',
          sevk_emir_miktari: 14,
          sevk_emri_kalan: 14,
          depo_kodu: 'DEPO-03',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 7,
          palet_sayisi: 1,
          hacim_m3: 0.7,
          agirlik: 210,
          koli_uzunluk_m: 1.4,
          koli_genislik_m: 0.75,
          koli_yukseklik_m: 0.6,
        },
        {
          stok_kodu: 'ERP-PRD-09',
          stok_adi: 'Güvenlik Kamera Sistemi',
          sevk_emir_miktari: 5,
          sevk_emri_kalan: 5,
          depo_kodu: 'DEPO-03',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 3,
          palet_sayisi: 0,
          hacim_m3: 0.27,
          agirlik: 135,
          koli_uzunluk_m: 1.1,
          koli_genislik_m: 0.8,
          koli_yukseklik_m: 0.35,
        },
        {
          stok_kodu: 'ERP-PRD-10',
          stok_adi: 'Endüstriyel Fan Motoru',
          sevk_emir_miktari: 7,
          sevk_emri_kalan: 7,
          depo_kodu: 'DEPO-03',
          sevk_tarihi: new Date().toISOString(),
          koli_sayisi: 4,
          palet_sayisi: 1,
          hacim_m3: 0.5,
          agirlik: 280,
          koli_uzunluk_m: 1.2,
          koli_genislik_m: 0.9,
          koli_yukseklik_m: 0.45,
        },
      ],
    },
  ];

  for (const entry of additionalErpPoolShipments) {
    const existingShipment = await shipmentRepository.findOne({ where: { sevkiyat_no: entry.header.sevkiyat_no } });
    const products = entry.details.map(buildProduct);
    const totals = {
      toplam_koli: products.reduce((sum, p) => sum + p.koli_sayisi, 0),
      toplam_palet: products.reduce((sum, p) => sum + p.palet_sayisi, 0),
      toplam_agirlik_kg: products.reduce((sum, p) => sum + p.agirlik, 0),
      toplam_hacim_m3: products.reduce((sum, p) => sum + p.hacim_m3, 0),
    };

    const shipmentData = {
      sevkiyat_no: entry.header.sevkiyat_no,
      siparis_no: entry.header.siparis_no,
      kart_bilgisi: entry.header.kart_bilgisi,
      cari_kod: entry.header.cari_kod,
      cari_ad: entry.header.cari_ad,
      nakliye_yeri: entry.header.nakliye_yeri,
      cari_ulke: entry.header.cari_ulke,
      cari_sehir: entry.header.cari_sehir,
      cari_ilce: entry.header.cari_ilce,
      termin_tarihi: new Date(entry.header.termin_tarihi),
      sevkiyat_tarihi: new Date(entry.header.sevkiyat_tarihi),
      islem_tarihi: new Date(entry.header.islem_tarihi),
      teslimat_adresi: `${entry.header.nakliye_yeri || ''}, ${entry.header.cari_ilce || ''}/${entry.header.cari_sehir || ''}`,
      erp_raw_header: entry.header,
      erp_raw_details: entry.details,
      erp_data_hash: hashData({ header: entry.header, details: entry.details }),
      urun_listesi: products,
      toplam_koli: totals.toplam_koli,
      toplam_palet: totals.toplam_palet,
      toplam_agirlik_kg: totals.toplam_agirlik_kg,
      toplam_hacim_m3: totals.toplam_hacim_m3,
      preparation_checks: products.map((product) => ({
        stok_kodu: product.stok_kodu,
        stok_adi: product.stok_adi,
        is_stock_sufficient: true,
        is_product_ready: true,
        is_quality_approved: true,
        is_warehouse_suitable: true,
        notes: '',
      })),
      status: ShipmentStatus.ERP_IMPORTED,
      priority: ShipmentPriority.NORMAL,
      is_partial_shipment: false,
      partial_shipment_percentage: 0,
    };

    if (existingShipment) {
      Object.assign(existingShipment, shipmentData);
      await shipmentRepository.save(existingShipment);
      console.log(`✓ ERP havuzuna ek sevkiyat güncellendi: ${entry.header.sevkiyat_no}`);
    } else {
      const createdShipment = shipmentRepository.create(shipmentData as DeepPartial<ShipmentPlan>);
      await shipmentRepository.save(createdShipment);
      console.log(`✓ ERP havuzuna ek sevkiyat oluşturuldu: ${entry.header.sevkiyat_no}`);
    }
  }

  const personnelList = await personnelRepository.find();
  const multiOperators = personnelList.filter((p) => p.role === PersonnelRole.MULTI);
  const picker = multiOperators[0] || personnelList.find((p) => p.role === PersonnelRole.PICKER);
  const packer = multiOperators[1] || personnelList.find((p) => p.role === PersonnelRole.PACKER) || multiOperators[0];
  const loader = multiOperators[2] || personnelList.find((p) => p.role === PersonnelRole.LOADER) || multiOperators[0];

  const samplePlannedHeader = {
    is_yeri: 'Merkez Depo',
    kart_bilgisi: 'YURTICI',
    sevkiyat_no: 'ERP-PLN-2001',
    siparis_no: 'SIP-2002',
    cari_kod: 'C98765',
    cari_ad: 'Pleksan Tedarik Zinciri',
    nakliye_yeri: 'İstanbul Depo',
    islem_tarihi: new Date().toISOString(),
    termin_tarihi: new Date(Date.now() + 5 * 24 * 60 * 60000).toISOString(),
    sevkiyat_tarihi: new Date(Date.now() + 6 * 24 * 60 * 60000).toISOString(),
    cari_ulke: 'Türkiye',
    cari_sehir: 'İstanbul',
    cari_ilce: 'Ataşehir',
  };

  const samplePlannedDetails = [
    {
      stok_kodu: 'PLN-501',
      stok_adi: 'Planlama Ürünü 501',
      sevk_emir_miktari: 10,
      sevk_emri_kalan: 10,
      depo_kodu: 'DEPO-02',
      sevk_tarihi: new Date().toISOString(),
      koli_sayisi: 5,
      palet_sayisi: 1,
      hacim_m3: 0.45,
      agirlik: 250,
      koli_uzunluk_m: 1.2,
      koli_genislik_m: 0.8,
      koli_yukseklik_m: 0.5,
    },
  ];

  const samplePlannedHash = hashData({ header: samplePlannedHeader, details: samplePlannedDetails });
  let samplePlannedShipment = await shipmentRepository.findOne({ where: { sevkiyat_no: samplePlannedHeader.sevkiyat_no } });
  const samplePlannedProducts = samplePlannedDetails.map(buildProduct);

  const operations: Operation[] = [];
  const now = new Date();
  if (picker && packer && loader) {
    operations.push({
      id: `OP-${samplePlannedHeader.sevkiyat_no}-PICK`,
      type: OperationType.PICKING,
      personel_ids: [picker.id],
      personel_names: [picker.ad_soyad],
      planned_start: now.toISOString(),
      planned_end: new Date(now.getTime() + 20 * 60000).toISOString(),
      actual_start: null,
      actual_end: null,
      planned_duration_minutes: 20,
      actual_duration_minutes: null,
      status: OperationStatus.PENDING,
    });
    operations.push({
      id: `OP-${samplePlannedHeader.sevkiyat_no}-PACK`,
      type: OperationType.PACKING,
      personel_ids: [packer.id],
      personel_names: [packer.ad_soyad],
      planned_start: new Date(now.getTime() + 20 * 60000).toISOString(),
      planned_end: new Date(now.getTime() + 45 * 60000).toISOString(),
      actual_start: null,
      actual_end: null,
      planned_duration_minutes: 25,
      actual_duration_minutes: null,
      status: OperationStatus.PENDING,
    });
    operations.push({
      id: `OP-${samplePlannedHeader.sevkiyat_no}-LOAD`,
      type: OperationType.LOADING,
      personel_ids: [loader.id],
      personel_names: [loader.ad_soyad],
      planned_start: new Date(now.getTime() + 45 * 60000).toISOString(),
      planned_end: new Date(now.getTime() + 60 * 60000).toISOString(),
      actual_start: null,
      actual_end: null,
      planned_duration_minutes: 15,
      actual_duration_minutes: null,
      status: OperationStatus.PENDING,
    });
  }

  const samplePlannedData = {
    sevkiyat_no: samplePlannedHeader.sevkiyat_no,
    siparis_no: samplePlannedHeader.siparis_no,
    kart_bilgisi: samplePlannedHeader.kart_bilgisi,
    cari_kod: samplePlannedHeader.cari_kod,
    cari_ad: samplePlannedHeader.cari_ad,
    nakliye_yeri: samplePlannedHeader.nakliye_yeri,
    cari_ulke: samplePlannedHeader.cari_ulke,
    cari_sehir: samplePlannedHeader.cari_sehir,
    cari_ilce: samplePlannedHeader.cari_ilce,
    termin_tarihi: new Date(samplePlannedHeader.termin_tarihi),
    sevkiyat_tarihi: samplePlannedHeader.sevkiyat_tarihi ? new Date(samplePlannedHeader.sevkiyat_tarihi) : null,
    islem_tarihi: samplePlannedHeader.islem_tarihi ? new Date(samplePlannedHeader.islem_tarihi) : null,
    teslimat_adresi: `${samplePlannedHeader.nakliye_yeri || ''}, ${samplePlannedHeader.cari_ilce || ''}/${samplePlannedHeader.cari_sehir || ''}`,
    erp_raw_header: samplePlannedHeader,
    erp_raw_details: samplePlannedDetails,
    erp_data_hash: samplePlannedHash,
    urun_listesi: samplePlannedProducts,
    toplam_koli: samplePlannedProducts.reduce((sum, p) => sum + p.koli_sayisi, 0),
    toplam_palet: samplePlannedProducts.reduce((sum, p) => sum + p.palet_sayisi, 0),
    toplam_agirlik_kg: samplePlannedProducts.reduce((sum, p) => sum + p.agirlik, 0),
    toplam_hacim_m3: samplePlannedProducts.reduce((sum, p) => sum + p.hacim_m3, 0),
    preparation_checks: samplePlannedProducts.map((product) => ({
      stok_kodu: product.stok_kodu,
      stok_adi: product.stok_adi,
      is_stock_sufficient: true,
      is_product_ready: true,
      is_quality_approved: true,
      is_warehouse_suitable: true,
      notes: '',
    })),
    status: ShipmentStatus.PLANNED,
    priority: ShipmentPriority.NORMAL,
    is_partial_shipment: false,
    partial_shipment_percentage: 0,
    operations: operations.length > 0 ? operations : undefined,
  };

  if (samplePlannedShipment) {
    Object.assign(samplePlannedShipment, samplePlannedData);
    await shipmentRepository.save(samplePlannedShipment);
    console.log('✓ Planlama örneği sevkiyat güncellendi');
  } else {
    samplePlannedShipment = shipmentRepository.create(
      samplePlannedData as DeepPartial<ShipmentPlan>
    );
    await shipmentRepository.save(samplePlannedShipment);
    console.log('✓ Planlama örneği sevkiyat oluşturuldu');
  }

  const secondVehicle = await vehicleRepository.findOne({ where: { plaka: '34PLS124' } });
  const thirdVehicle = await vehicleRepository.findOne({ where: { plaka: '34PLS125' } });
  const multiList = personnelList.filter((p) => p.role === PersonnelRole.MULTI);

  const samplePickedHeader = {
    is_yeri: 'Merkez Depo',
    kart_bilgisi: 'YURTICI',
    sevkiyat_no: 'ERP-PICK-3001',
    siparis_no: 'SIP-3001',
    cari_kod: 'C11111',
    cari_ad: 'Pleksan Müşteri B',
    nakliye_yeri: 'İstanbul Avrupa',
    islem_tarihi: new Date().toISOString(),
    termin_tarihi: new Date(Date.now() + 3 * 24 * 60 * 60000).toISOString(),
    sevkiyat_tarihi: new Date(Date.now() + 4 * 24 * 60 * 60000).toISOString(),
    cari_ulke: 'Türkiye',
    cari_sehir: 'İstanbul',
    cari_ilce: 'Kağıthane',
  };

  const samplePickedDetails = [
    {
      stok_kodu: 'PCK-101',
      stok_adi: 'Seçim Ürünü 101',
      sevk_emir_miktari: 12,
      sevk_emri_kalan: 12,
      depo_kodu: 'DEPO-03',
      sevk_tarihi: new Date().toISOString(),
      koli_sayisi: 6,
      palet_sayisi: 1,
      hacim_m3: 0.54,
      agirlik: 300,
      koli_uzunluk_m: 1.2,
      koli_genislik_m: 0.8,
      koli_yukseklik_m: 0.6,
    },
    {
      stok_kodu: 'PCK-102',
      stok_adi: 'Seçim Ürünü 102',
      sevk_emir_miktari: 8,
      sevk_emri_kalan: 8,
      depo_kodu: 'DEPO-03',
      sevk_tarihi: new Date().toISOString(),
      koli_sayisi: 4,
      palet_sayisi: 0,
      hacim_m3: 0.32,
      agirlik: 160,
      koli_uzunluk_m: 1.0,
      koli_genislik_m: 0.7,
      koli_yukseklik_m: 0.5,
    },
  ];

  const samplePickedHash = hashData({ header: samplePickedHeader, details: samplePickedDetails });
  let samplePickedShipment = await shipmentRepository.findOne({ where: { sevkiyat_no: samplePickedHeader.sevkiyat_no } });
  const samplePickedProducts = samplePickedDetails.map(buildProduct);
  const pickedId = `VA-${Date.now()}-2`;

  const samplePickedAssignments = [
    {
      id: pickedId,
      vehicle_id: secondVehicle?.id || 'vehicle-sample-2',
      plate: secondVehicle?.plaka || '34PLS124',
      driver_name: secondVehicle?.sofor_adi || 'Ayşe Yıldız',
      load_percentage: 60,
      delivery_sequence: 1,
    },
  ];

  const pickedOps: Operation[] = [];
  if (multiList.length > 0) {
    pickedOps.push({
      id: `OP-${samplePickedHeader.sevkiyat_no}-PICK`,
      type: OperationType.PICKING,
      personel_ids: [multiList[0].id],
      personel_names: [multiList[0].ad_soyad],
      planned_start: new Date(Date.now() - 20 * 60000).toISOString(),
      planned_end: new Date(Date.now() + 10 * 60000).toISOString(),
      actual_start: new Date(Date.now() - 20 * 60000).toISOString(),
      actual_end: null,
      planned_duration_minutes: 30,
      actual_duration_minutes: null,
      status: OperationStatus.IN_PROGRESS,
    });
    pickedOps.push({
      id: `OP-${samplePickedHeader.sevkiyat_no}-PACK`,
      type: OperationType.PACKING,
      personel_ids: [multiList[1]?.id || multiList[0].id],
      personel_names: [multiList[1]?.ad_soyad || multiList[0].ad_soyad],
      planned_start: new Date(Date.now() + 10 * 60000).toISOString(),
      planned_end: new Date(Date.now() + 40 * 60000).toISOString(),
      actual_start: null,
      actual_end: null,
      planned_duration_minutes: 30,
      actual_duration_minutes: null,
      status: OperationStatus.PENDING,
    });
    pickedOps.push({
      id: `OP-${samplePickedHeader.sevkiyat_no}-LOAD`,
      type: OperationType.LOADING,
      personel_ids: [multiList[2]?.id || multiList[0].id],
      personel_names: [multiList[2]?.ad_soyad || multiList[0].ad_soyad],
      planned_start: new Date(Date.now() + 40 * 60000).toISOString(),
      planned_end: new Date(Date.now() + 55 * 60000).toISOString(),
      actual_start: null,
      actual_end: null,
      planned_duration_minutes: 15,
      actual_duration_minutes: null,
      status: OperationStatus.PENDING,
    });
  }

  const samplePickedData = {
    sevkiyat_no: samplePickedHeader.sevkiyat_no,
    siparis_no: samplePickedHeader.siparis_no,
    kart_bilgisi: samplePickedHeader.kart_bilgisi,
    cari_kod: samplePickedHeader.cari_kod,
    cari_ad: samplePickedHeader.cari_ad,
    nakliye_yeri: samplePickedHeader.nakliye_yeri,
    cari_ulke: samplePickedHeader.cari_ulke,
    cari_sehir: samplePickedHeader.cari_sehir,
    cari_ilce: samplePickedHeader.cari_ilce,
    termin_tarihi: new Date(samplePickedHeader.termin_tarihi),
    sevkiyat_tarihi: samplePickedHeader.sevkiyat_tarihi ? new Date(samplePickedHeader.sevkiyat_tarihi) : null,
    islem_tarihi: samplePickedHeader.islem_tarihi ? new Date(samplePickedHeader.islem_tarihi) : null,
    teslimat_adresi: `${samplePickedHeader.nakliye_yeri || ''}, ${samplePickedHeader.cari_ilce || ''}/${samplePickedHeader.cari_sehir || ''}`,
    erp_raw_header: samplePickedHeader,
    erp_raw_details: samplePickedDetails,
    erp_data_hash: samplePickedHash,
    urun_listesi: samplePickedProducts,
    toplam_koli: samplePickedProducts.reduce((sum, p) => sum + p.koli_sayisi, 0),
    toplam_palet: samplePickedProducts.reduce((sum, p) => sum + p.palet_sayisi, 0),
    toplam_agirlik_kg: samplePickedProducts.reduce((sum, p) => sum + p.agirlik, 0),
    toplam_hacim_m3: samplePickedProducts.reduce((sum, p) => sum + p.hacim_m3, 0),
    preparation_checks: samplePickedProducts.map((product) => ({
      stok_kodu: product.stok_kodu,
      stok_adi: product.stok_adi,
      is_stock_sufficient: true,
      is_product_ready: true,
      is_quality_approved: true,
      is_warehouse_suitable: true,
      notes: '',
    })),
    status: ShipmentStatus.PICKING,
    priority: ShipmentPriority.NORMAL,
    is_partial_shipment: false,
    partial_shipment_percentage: 0,
    vehicle_assignments: samplePickedAssignments,
    loading_sequences: samplePickedProducts.map((product, idx) => {
      const dims = estimateProductDimensions(product);
      return {
        id: `LS-${Date.now()}-${idx}-PICK`,
        vehicle_assignment_id: pickedId,
        product_code: product.stok_kodu,
        product_name: product.stok_adi,
        pallet_count: product.palet_sayisi,
        box_count: product.koli_sayisi,
        sequence_order: idx + 1,
        is_first_delivery: true,
        is_last_delivery: false,
        weight_kg: product.agirlik,
        volume_m3: product.hacim_m3,
        length_mm: dims.length_mm,
        width_mm: dims.width_mm,
        height_mm: dims.height_mm,
      };
    }),
    operations: pickedOps.length > 0 ? pickedOps : undefined,
  };

  if (samplePickedShipment) {
    Object.assign(samplePickedShipment, samplePickedData);
    await shipmentRepository.save(samplePickedShipment);
    console.log('✓ Picking örnek sevkiyat güncellendi');
  } else {
    samplePickedShipment = shipmentRepository.create(samplePickedData as DeepPartial<ShipmentPlan>);
    await shipmentRepository.save(samplePickedShipment);
    console.log('✓ Picking örnek sevkiyat oluşturuldu');
  }

  const sampleLoadingHeader = {
    is_yeri: 'Merkez Depo',
    kart_bilgisi: 'YURTICI',
    sevkiyat_no: 'ERP-LOAD-4001',
    siparis_no: 'SIP-4001',
    cari_kod: 'C22222',
    cari_ad: 'Pleksan Müşteri C',
    nakliye_yeri: 'İstanbul Anadolu',
    islem_tarihi: new Date().toISOString(),
    termin_tarihi: new Date(Date.now() + 4 * 24 * 60 * 60000).toISOString(),
    sevkiyat_tarihi: new Date(Date.now() + 5 * 24 * 60 * 60000).toISOString(),
    cari_ulke: 'Türkiye',
    cari_sehir: 'İstanbul',
    cari_ilce: 'Ümraniye',
  };

  const sampleLoadingDetails = [
    {
      stok_kodu: 'LOD-201',
      stok_adi: 'Yükleme Ürünü 201',
      sevk_emir_miktari: 7,
      sevk_emri_kalan: 7,
      depo_kodu: 'DEPO-04',
      sevk_tarihi: new Date().toISOString(),
      koli_sayisi: 3,
      palet_sayisi: 0,
      hacim_m3: 0.28,
      agirlik: 140,
      koli_uzunluk_m: 0.9,
      koli_genislik_m: 0.7,
      koli_yukseklik_m: 0.45,
    },
  ];

  const sampleLoadingHash = hashData({ header: sampleLoadingHeader, details: sampleLoadingDetails });
  let sampleLoadingShipment = await shipmentRepository.findOne({ where: { sevkiyat_no: sampleLoadingHeader.sevkiyat_no } });
  const sampleLoadingProducts = sampleLoadingDetails.map(buildProduct);
  const loadingId = `VA-${Date.now()}-3`;

  const sampleLoadingAssignments = [
    {
      id: loadingId,
      vehicle_id: thirdVehicle?.id || 'vehicle-sample-3',
      plate: thirdVehicle?.plaka || '34PLS125',
      driver_name: thirdVehicle?.sofor_adi || 'Cem Alp',
      load_percentage: 70,
      delivery_sequence: 1,
    },
  ];

  const loadingOps: Operation[] = [];
  if (multiList.length > 0) {
    loadingOps.push({
      id: `OP-${sampleLoadingHeader.sevkiyat_no}-PICK`,
      type: OperationType.PICKING,
      personel_ids: [multiList[0].id],
      personel_names: [multiList[0].ad_soyad],
      planned_start: new Date(Date.now() - 60 * 60000).toISOString(),
      planned_end: new Date(Date.now() - 30 * 60000).toISOString(),
      actual_start: new Date(Date.now() - 60 * 60000).toISOString(),
      actual_end: new Date(Date.now() - 30 * 60000).toISOString(),
      planned_duration_minutes: 30,
      actual_duration_minutes: 30,
      status: OperationStatus.COMPLETED,
    });
    loadingOps.push({
      id: `OP-${sampleLoadingHeader.sevkiyat_no}-PACK`,
      type: OperationType.PACKING,
      personel_ids: [multiList[1]?.id || multiList[0].id],
      personel_names: [multiList[1]?.ad_soyad || multiList[0].ad_soyad],
      planned_start: new Date(Date.now() - 30 * 60000).toISOString(),
      planned_end: new Date(Date.now() + 10 * 60000).toISOString(),
      actual_start: new Date(Date.now() - 30 * 60000).toISOString(),
      actual_end: null,
      planned_duration_minutes: 40,
      actual_duration_minutes: null,
      status: OperationStatus.IN_PROGRESS,
    });
    loadingOps.push({
      id: `OP-${sampleLoadingHeader.sevkiyat_no}-LOAD`,
      type: OperationType.LOADING,
      personel_ids: [multiList[2]?.id || multiList[0].id],
      personel_names: [multiList[2]?.ad_soyad || multiList[0].ad_soyad],
      planned_start: new Date(Date.now() + 10 * 60000).toISOString(),
      planned_end: new Date(Date.now() + 40 * 60000).toISOString(),
      actual_start: null,
      actual_end: null,
      planned_duration_minutes: 30,
      actual_duration_minutes: null,
      status: OperationStatus.PENDING,
    });
  }

  const sampleLoadingData = {
    sevkiyat_no: sampleLoadingHeader.sevkiyat_no,
    siparis_no: sampleLoadingHeader.siparis_no,
    kart_bilgisi: sampleLoadingHeader.kart_bilgisi,
    cari_kod: sampleLoadingHeader.cari_kod,
    cari_ad: sampleLoadingHeader.cari_ad,
    nakliye_yeri: sampleLoadingHeader.nakliye_yeri,
    cari_ulke: sampleLoadingHeader.cari_ulke,
    cari_sehir: sampleLoadingHeader.cari_sehir,
    cari_ilce: sampleLoadingHeader.cari_ilce,
    termin_tarihi: new Date(sampleLoadingHeader.termin_tarihi),
    sevkiyat_tarihi: sampleLoadingHeader.sevkiyat_tarihi ? new Date(sampleLoadingHeader.sevkiyat_tarihi) : null,
    islem_tarihi: sampleLoadingHeader.islem_tarihi ? new Date(sampleLoadingHeader.islem_tarihi) : null,
    teslimat_adresi: `${sampleLoadingHeader.nakliye_yeri || ''}, ${sampleLoadingHeader.cari_ilce || ''}/${sampleLoadingHeader.cari_sehir || ''}`,
    erp_raw_header: sampleLoadingHeader,
    erp_raw_details: sampleLoadingDetails,
    erp_data_hash: sampleLoadingHash,
    urun_listesi: sampleLoadingProducts,
    toplam_koli: sampleLoadingProducts.reduce((sum, p) => sum + p.koli_sayisi, 0),
    toplam_palet: sampleLoadingProducts.reduce((sum, p) => sum + p.palet_sayisi, 0),
    toplam_agirlik_kg: sampleLoadingProducts.reduce((sum, p) => sum + p.agirlik, 0),
    toplam_hacim_m3: sampleLoadingProducts.reduce((sum, p) => sum + p.hacim_m3, 0),
    preparation_checks: sampleLoadingProducts.map((product) => ({
      stok_kodu: product.stok_kodu,
      stok_adi: product.stok_adi,
      is_stock_sufficient: true,
      is_product_ready: true,
      is_quality_approved: true,
      is_warehouse_suitable: true,
      notes: '',
    })),
    status: ShipmentStatus.LOADING,
    priority: ShipmentPriority.NORMAL,
    is_partial_shipment: false,
    partial_shipment_percentage: 0,
    vehicle_assignments: sampleLoadingAssignments,
    loading_sequences: sampleLoadingProducts.map((product, idx) => {
      const dims = estimateProductDimensions(product);
      return {
        id: `LS-${Date.now()}-${idx}-LOAD`,
        vehicle_assignment_id: loadingId,
        product_code: product.stok_kodu,
        product_name: product.stok_adi,
        pallet_count: product.palet_sayisi,
        box_count: product.koli_sayisi,
        sequence_order: idx + 1,
        is_first_delivery: true,
        is_last_delivery: false,
        weight_kg: product.agirlik,
        volume_m3: product.hacim_m3,
        length_mm: dims.length_mm,
        width_mm: dims.width_mm,
        height_mm: dims.height_mm,
      };
    }),
    operations: loadingOps.length > 0 ? loadingOps : undefined,
  };

  if (sampleLoadingShipment) {
    Object.assign(sampleLoadingShipment, sampleLoadingData);
    await shipmentRepository.save(sampleLoadingShipment);
    console.log('✓ Loading örnek sevkiyat güncellendi');
  } else {
    sampleLoadingShipment = shipmentRepository.create(sampleLoadingData as DeepPartial<ShipmentPlan>);
    await shipmentRepository.save(sampleLoadingShipment);
    console.log('✓ Loading örnek sevkiyat oluşturuldu');
  }

  console.log('\n✓ Seeding tamamlandı!');
  console.log('\n--- Test Hesapları ---');
  console.log('Admin     | admin     | Admin123!');
  console.log('Planner   | planner01 | Planner123!');
  console.log('Warehouse | warehouse01 | Warehouse123!');
  console.log('Viewer    | viewer01  | Viewer123!');
  console.log('Operator  | ali.boran | 123456');
  console.log('Operator  | berkay.kircay | 123456');
  console.log('Operator  | burak.kircay | 123456');
  console.log('Operator  | efe.deniz.bolat | 123456');
  console.log('Operator  | halil.bolat | 123456');
  console.log('Operator  | mehmet.albayrak | 123456');
  console.log('Operator  | mehmet.kuzu | 123456');
  console.log('Operator  | mert.ilkbas | 123456');
  console.log('Operator  | mustafa.colak | 123456');
  console.log('Operator  | samiye.hundi | 123456');
  console.log('Operator  | sefa.demirkol | 123456');
  console.log('Operator  | suat.korucuoglu | 123456');
  console.log('Operator  | yunus.emre.bolat | 123456');
  console.log('Operator  | zerrin.duman | 123456');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding hatası:', err);
  process.exit(1);
});
