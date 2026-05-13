import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonnelService } from './personnel.service';
import { PersonnelController } from './personnel.controller';
import { Personnel } from './personnel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Personnel], 'MES_DB')],
  providers: [PersonnelService],
  controllers: [PersonnelController],
  exports: [PersonnelService],
})
export class PersonnelModule {}