import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personnel } from './personnel.entity';
import { CreatePersonnelDto, UpdatePersonnelDto } from './dto/create-personnel.dto';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(Personnel, 'MES_DB')
    private readonly repo: Repository<Personnel>,
  ) {}

  async create(dto: CreatePersonnelDto): Promise<Personnel> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(): Promise<Personnel[]> {
    return this.repo.find({ where: { isActive: true }, order: { ad_soyad: 'ASC' } });
  }

  async findByRole(role: string): Promise<Personnel[]> {
    return this.repo.find({ where: { role: role as any, isActive: true } });
  }

  async findOne(id: string): Promise<Personnel> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Personel bulunamadı.');
    return p;
  }

  async update(id: string, dto: UpdatePersonnelDto): Promise<Personnel> {
    await this.findOne(id);
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.repo.update(id, { isActive: false });
    return { message: 'Personel pasife alındı.' };
  }

  // Vardiya kontrolü - personelin o saatte çalışıp çalışmadığını kontrol eder
  async isWithinShift(personnelId: string, saat: string): Promise<boolean> {
    const p = await this.findOne(personnelId);
    const [checkH, checkM] = saat.split(':').map(Number);
    const [startH, startM] = p.vardiya_baslangic.split(':').map(Number);
    const [endH, endM] = p.vardiya_bitis.split(':').map(Number);
    const checkMinutes = checkH * 60 + checkM;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return checkMinutes >= startMinutes && checkMinutes <= endMinutes;
  }
}