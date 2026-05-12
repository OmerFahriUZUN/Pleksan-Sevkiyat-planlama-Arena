import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentPlan, ShipmentStatus, ShipmentTaskSnapshot } from './shipment-plan.entity';
import { CreateShipmentPlanDto } from './dto/create-shipment-plan.dto';
import { UpdateShipmentPlanDto } from './dto/update-shipment-plan.dto';
import { UpdateShipmentTaskDto } from './dto/shipment-plan-task.dto';

@Injectable()
export class ShipmentPlansService {
  constructor(
    @InjectRepository(ShipmentPlan, 'MES_DB')
    private readonly shipmentPlanRepo: Repository<ShipmentPlan>,
  ) {}

  private async generatePlanCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.shipmentPlanRepo.count();
    const seq = String(count + 1).padStart(4, '0');
    return `SHP-${year}-${seq}`;
  }

  private createDefaultTasks(planCode: string): ShipmentTaskSnapshot[] {
    return [
      {
        id: `TSK-${planCode}-PICK`,
        type: 'PICKING',
        assignedPersonIds: [],
        assignedPersonNames: [],
        durationMinutes: 20,
        status: 'PENDING',
      },
      {
        id: `TSK-${planCode}-PACK`,
        type: 'PACKING',
        assignedPersonIds: [],
        assignedPersonNames: [],
        durationMinutes: 25,
        status: 'PENDING',
      },
      {
        id: `TSK-${planCode}-LOAD`,
        type: 'LOADING',
        assignedPersonIds: [],
        assignedPersonNames: [],
        durationMinutes: 15,
        status: 'PENDING',
      },
    ];
  }

  async create(dto: CreateShipmentPlanDto, createdById: string): Promise<ShipmentPlan> {
    const planCode = await this.generatePlanCode();

    const plan = this.shipmentPlanRepo.create({
      planCode,
      description: dto.description,
      erpOrderId: dto.erpOrderId,
      erpCustomerId: dto.erpCustomerId,
      erpCustomerName: dto.erpCustomerName,
      erpCustomerAddress: dto.erpCustomerAddress,
      priority: dto.priority,
      plannedShipDate: new Date(dto.plannedShipDate),
      plannedDeliveryDate: new Date(dto.plannedDeliveryDate),
      totalWeightKg: dto.totalWeightKg,
      totalPalletCount: dto.totalPalletCount,
      totalBoxCount: dto.totalBoxCount,
      orderItems: dto.orderItems || [],
      workflowTasks: dto.workflowTasks ?? this.createDefaultTasks(planCode),
      notes: dto.notes,
      createdBy: { id: createdById } as any,
      assignedTo: dto.assignedToId ? ({ id: dto.assignedToId } as any) : null,
      vehicle: dto.vehicleId ? ({ id: dto.vehicleId } as any) : null,
    });

    return this.shipmentPlanRepo.save(plan);
  }

  async findAll(filters?: {
    status?: ShipmentStatus;
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
  }): Promise<ShipmentPlan[]> {
    const qb = this.shipmentPlanRepo
      .createQueryBuilder('sp')
      .leftJoinAndSelect('sp.vehicle', 'vehicle')
      .leftJoinAndSelect('sp.createdBy', 'createdBy')
      .leftJoinAndSelect('sp.assignedTo', 'assignedTo');

    if (filters?.status) {
      qb.andWhere('sp.status = :status', { status: filters.status });
    }
    if (filters?.dateFrom) {
      qb.andWhere('sp.plannedShipDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters?.dateTo) {
      qb.andWhere('sp.plannedShipDate <= :dateTo', { dateTo: filters.dateTo });
    }
    if (filters?.customerId) {
      qb.andWhere('sp.erpCustomerId = :customerId', { customerId: filters.customerId });
    }

    return qb.orderBy('sp.plannedShipDate', 'ASC').getMany();
  }

  async findOne(id: string): Promise<ShipmentPlan> {
    const plan = await this.shipmentPlanRepo.findOne({
      where: { id },
      relations: ['vehicle', 'createdBy', 'assignedTo'],
    });
    if (!plan) throw new NotFoundException(`Sevkiyat planı bulunamadı: ${id}`);
    if (!plan.workflowTasks || plan.workflowTasks.length === 0) {
      plan.workflowTasks = this.createDefaultTasks(plan.planCode);
    } else {
      plan.workflowTasks = plan.workflowTasks.map((task) => ({
        ...task,
        assignedPersonIds:
          task.assignedPersonIds ??
          (task.assignedPersonId ? [task.assignedPersonId] : []),
        assignedPersonNames:
          task.assignedPersonNames ??
          (task.assignedPersonName ? [task.assignedPersonName] : []),
      }));
    }
    return plan;
  }

  async update(id: string, dto: UpdateShipmentPlanDto): Promise<ShipmentPlan> {
    const plan = await this.findOne(id);

    if (
      plan.status === ShipmentStatus.DELIVERED ||
      plan.status === ShipmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Teslim edilmiş veya iptal edilmiş plan güncellenemez.',
      );
    }

    const updateData: any = {};

    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.erpOrderId !== undefined) updateData.erpOrderId = dto.erpOrderId;
    if (dto.erpCustomerId !== undefined) updateData.erpCustomerId = dto.erpCustomerId;
    if (dto.erpCustomerName !== undefined) updateData.erpCustomerName = dto.erpCustomerName;
    if (dto.erpCustomerAddress !== undefined) updateData.erpCustomerAddress = dto.erpCustomerAddress;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.totalWeightKg !== undefined) updateData.totalWeightKg = dto.totalWeightKg;
    if (dto.totalPalletCount !== undefined) updateData.totalPalletCount = dto.totalPalletCount;
    if (dto.totalBoxCount !== undefined) updateData.totalBoxCount = dto.totalBoxCount;
    if (dto.orderItems !== undefined) updateData.orderItems = dto.orderItems;
    if (dto.workflowTasks !== undefined) updateData.workflowTasks = dto.workflowTasks;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.plannedShipDate !== undefined) updateData.plannedShipDate = new Date(dto.plannedShipDate);
    if (dto.plannedDeliveryDate !== undefined) updateData.plannedDeliveryDate = new Date(dto.plannedDeliveryDate);
    if (dto.actualShipDate !== undefined) updateData.actualShipDate = new Date(dto.actualShipDate);
    if (dto.actualDeliveryDate !== undefined) updateData.actualDeliveryDate = new Date(dto.actualDeliveryDate);
    if (dto.vehicleId !== undefined) updateData.vehicle = { id: dto.vehicleId };
    if (dto.assignedToId !== undefined) updateData.assignedTo = { id: dto.assignedToId };

    await this.shipmentPlanRepo.save({ ...plan, ...updateData });
    return this.findOne(id);
  }

  async updateStatus(id: string, status: ShipmentStatus): Promise<ShipmentPlan> {
    await this.findOne(id);
    await this.shipmentPlanRepo.update(id, { status });
    return this.findOne(id);
  }

  async updateTask(shipmentId: string, taskId: string, dto: UpdateShipmentTaskDto): Promise<ShipmentTaskSnapshot> {
    const plan = await this.findOne(shipmentId);
    const tasks = plan.workflowTasks ?? this.createDefaultTasks(plan.planCode);
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      throw new NotFoundException(`Görev bulunamadı: ${taskId}`);
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...(dto.assigned_person_ids !== undefined
        ? { assignedPersonIds: dto.assigned_person_ids }
        : dto.assigned_person_id !== undefined
        ? { assignedPersonIds: dto.assigned_person_id ? [dto.assigned_person_id] : [] }
        : {}),
      ...(dto.duration_minutes !== undefined ? { durationMinutes: dto.duration_minutes } : {}),
    };

    tasks[taskIndex] = updatedTask;
    plan.workflowTasks = tasks;
    await this.shipmentPlanRepo.save(plan);
    return updatedTask;
  }

  async remove(id: string): Promise<{ message: string }> {
    const plan = await this.findOne(id);
    if (plan.status !== ShipmentStatus.DRAFT) {
      throw new BadRequestException('Sadece taslak durumdaki planlar silinebilir.');
    }
    await this.shipmentPlanRepo.delete(id);
    return { message: 'Sevkiyat planı silindi.' };
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
      .where('DATE(sp.plannedShipDate) = CURRENT_DATE')
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