import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentPlan } from '../shipment-plans/shipment-plan.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ShipmentPlan, 'MES_DB')
    private readonly shipmentPlanRepo: Repository<ShipmentPlan>,
  ) {}

  async getDailyShipmentReport(date: string) {
    const plans = await this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .where('CONVERT(DATE, sp.sevkiyat_tarihi) = :date', { date })
      .orderBy('sp.priority', 'DESC')
      .getMany();

    const summary = {
      date,
      totalPlans: plans.length,
      totalWeightKg: plans.reduce(
        (s: number, p: ShipmentPlan) => s + Number(p.toplam_agirlik_kg || 0),
        0,
      ),
      totalPallets: plans.reduce(
        (s: number, p: ShipmentPlan) => s + (p.toplam_palet || 0),
        0,
      ),
      byStatus: {} as Record<string, number>,
      plans,
    };

    plans.forEach((p: ShipmentPlan) => {
      summary.byStatus[p.status] =
        (summary.byStatus[p.status] || 0) + 1;
    });

    return summary;
  }

  async getMonthlyReport(year: number, month: number) {
    return this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .select('CONVERT(DATE, sp.sevkiyat_tarihi)', 'date')
      .addSelect('COUNT(*)', 'totalPlans')
      .addSelect('SUM(sp.toplam_agirlik_kg)', 'totalWeightKg')
      .addSelect('SUM(sp.toplam_palet)', 'totalPallets')
      .where('YEAR(sp.sevkiyat_tarihi) = :year', { year })
      .andWhere('MONTH(sp.sevkiyat_tarihi) = :month', { month })
      .groupBy('CONVERT(DATE, sp.sevkiyat_tarihi)')
      .orderBy('CONVERT(DATE, sp.sevkiyat_tarihi)', 'ASC')
      .getRawMany();
  }

  async getVehicleUtilizationReport(dateFrom: string, dateTo: string) {
    return this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .select('va.plate', 'plate')
      .addSelect('COUNT(sp.id)', 'tripCount')
      .addSelect('SUM(sp.toplam_agirlik_kg)', 'totalWeightKg')
      .addSelect('SUM(sp.toplam_palet)', 'totalPallets')
      .where('sp.sevkiyat_tarihi BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .groupBy('va.plate')
      .orderBy('COUNT(sp.id)', 'DESC')
      .getRawMany();
  }

  async getDashboardStats() {
    const total = await this.shipmentPlanRepo.count();

    const byStatus = await this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .select('sp.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('sp.status')
      .getRawMany();

    const todayPlanned = await this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .where('CONVERT(DATE, sp.sevkiyat_tarihi) = CONVERT(DATE, GETDATE())')
      .andWhere("sp.status NOT IN ('shipped', 'cancelled')")
      .getCount();

    const criticalPending = await this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .where("sp.priority = 'critical'")
      .andWhere("sp.status NOT IN ('shipped', 'cancelled')")
      .getCount();

    return { total, byStatus, todayPlanned, criticalPending };
  }
}