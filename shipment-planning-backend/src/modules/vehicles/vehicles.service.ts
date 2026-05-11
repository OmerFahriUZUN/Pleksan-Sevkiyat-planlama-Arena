import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle, 'MES_DB')
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findOne({
      where: { plateNumber: dto.plateNumber },
    });
    if (existing) {
      throw new ConflictException(
        `${dto.plateNumber} plakalı araç zaten mevcut.`,
      );
    }
    const vehicle = this.vehicleRepo.create(dto);
    return this.vehicleRepo.save(vehicle);
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepo.find({
      where: { isActive: true },
      order: { plateNumber: 'ASC' },
    });
  }

  async findAvailable(): Promise<Vehicle[]> {
    return this.vehicleRepo.find({
      where: { status: VehicleStatus.AVAILABLE, isActive: true },
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Araç bulunamadı.');
    return vehicle;
  }

  async update(id: string, dto: Partial<CreateVehicleDto>): Promise<Vehicle> {
    await this.findOne(id);
    await this.vehicleRepo.update(id, dto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    await this.findOne(id);
    await this.vehicleRepo.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.vehicleRepo.update(id, { isActive: false });
    return { message: 'Araç pasife alındı.' };
  }
}