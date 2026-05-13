import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type UserWithoutPassword = Omit<User, 'password'> & { passwordHint?: string };

const PASSWORD_HINTS: Record<string, string> = {
  admin: 'Admin123!',
  planner01: 'Planner123!',
  warehouse01: 'Warehouse123!',
  viewer01: 'Viewer123!',
  'ali.boran': '123456',
  'berkay.kircay': '123456',
  'burak.kircay': '123456',
  'efe.deniz.bolat': '123456',
  'halil.bolat': '123456',
  'mehmet.albayrak': '123456',
  'mehmet.kuzu': '123456',
  'mert.ilkbas': '123456',
  'mustafa.colak': '123456',
  'samiye.hundi': '123456',
  'sefa.demirkol': '123456',
  'suat.korucuoglu': '123456',
  'yunus.emre.bolat': '123456',
  'zerrin.duman': '123456',
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User, 'MES_DB')
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existing) {
      throw new ConflictException(
        'Bu kullanıcı adı veya e-posta zaten kullanımda.',
      );
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      12,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const saved = (await this.userRepository.save(
      user,
    )) as unknown as User;

    const { password: _pw, ...result } = saved;
    return result as Omit<User, 'password'>;
  }

  private attachPasswordHint(user: User): UserWithoutPassword {
    const { password: _pw, ...rest } = user;
    return {
      ...rest,
      passwordHint: PASSWORD_HINTS[user.username],
    };
  }

  async findAll(): Promise<UserWithoutPassword[]> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return users.map((u: User) => this.attachPasswordHint(u));
  }

  async findById(id: string): Promise<UserWithoutPassword> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    return this.attachPasswordHint(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async deactivate(id: string): Promise<{ message: string }> {
    await this.findById(id);
    await this.userRepository.update(id, { isActive: false });
    return { message: 'Kullanıcı pasife alındı.' };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.findById(id);

    const updateData: Partial<User> = {};

    if (updateUserDto.role) {
      updateData.role = updateUserDto.role;
    }

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(id, updateData);
    }

    // Güncellenmiş kullanıcıyı döndür
    return this.findById(id);
  }
}