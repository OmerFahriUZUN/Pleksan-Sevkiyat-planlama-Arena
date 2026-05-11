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

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return users.map((u: User) => {
      const { password: _pw, ...rest } = u;
      return rest as Omit<User, 'password'>;
    });
  }

  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    const { password: _pw, ...result } = user;
    return result as Omit<User, 'password'>;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async deactivate(id: string): Promise<{ message: string }> {
    await this.findById(id);
    await this.userRepository.update(id, { isActive: false });
    return { message: 'Kullanıcı pasife alındı.' };
  }
}