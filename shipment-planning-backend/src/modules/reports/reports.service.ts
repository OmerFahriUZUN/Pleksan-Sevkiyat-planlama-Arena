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
      .leftJoinAndSelect('sp.vehicle', 'vehicle')
      .leftJoinAndSelect('sp.assignedTo', 'assignedTo')
      // MSSQL: DATE() yok → CONVERT(DATE, column) kullanıyoruz
      .where('CONVERT(DATE, sp.plannedShipDate) = :date', { date })
      .orderBy('sp.priority', 'DESC')
      .getMany();

    const summary = {
      date,
      totalPlans: plans.length,
      totalWeightKg: plans.reduce(
        (s: number, p: ShipmentPlan) => s + Number(p.totalWeightKg || 0),
        0,
      ),
      totalPallets: plans.reduce(
        (s: number, p: ShipmentPlan) => s + (p.totalPalletCount || 0),
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
    // MSSQL: EXTRACT() yok → YEAR(), MONTH() kullanıyoruz
    return this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .select('CONVERT(DATE, sp.plannedShipDate)', 'date')
      .addSelect('COUNT(*)', 'totalPlans')
      .addSelect('SUM(sp.totalWeightKg)', 'totalWeightKg')
      .addSelect('SUM(sp.totalPalletCount)', 'totalPallets')
      .where('YEAR(sp.plannedShipDate) = :year', { year })
      .andWhere('MONTH(sp.plannedShipDate) = :month', { month })
      .groupBy('CONVERT(DATE, sp.plannedShipDate)')
      .orderBy('CONVERT(DATE, sp.plannedShipDate)', 'ASC')
      .getRawMany();
  }

  async getVehicleUtilizationReport(dateFrom: string, dateTo: string) {
    return this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .leftJoin('sp.vehicle', 'v')
      .select('v.plateNumber', 'plateNumber')
      .addSelect('v.driverName', 'driverName')
      .addSelect('COUNT(sp.id)', 'tripCount')
      .addSelect('SUM(sp.totalWeightKg)', 'totalWeightKg')
      .addSelect('SUM(sp.totalPalletCount)', 'totalPallets')
      .where('sp.plannedShipDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .andWhere('sp.vehicle IS NOT NULL')
      .groupBy('v.plateNumber, v.driverName')
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

    // MSSQL: CURRENT_DATE yok → CONVERT(DATE, GETDATE()) kullanıyoruz
    const todayPlanned = await this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .where('CONVERT(DATE, sp.plannedShipDate) = CONVERT(DATE, GETDATE())')
      .andWhere("sp.status NOT IN ('delivered', 'cancelled')")
      .getCount();

    const urgentPending = await this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .where("sp.priority = 'urgent'")
      .andWhere("sp.status NOT IN ('delivered', 'cancelled')")
      .getCount();

    return { total, byStatus, todayPlanned, urgentPending };
  }
}