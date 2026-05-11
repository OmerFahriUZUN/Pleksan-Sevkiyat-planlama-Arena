import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../modules/users/user.entity';
import { AppDataSource } from './data-source';

async function seed() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepository = AppDataSource.getRepository(User);

  // Admin kullanıcısını kontrol et
  let adminUser = await userRepository.findOne({
    where: { username: 'admin' },
  });

  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  if (adminUser) {
    // Var olanı güncelle
    adminUser.password = hashedPassword;
    adminUser.isActive = true;
    await userRepository.save(adminUser);
    console.log('✓ Admin kullanıcısı güncellendi');
  } else {
    // Yeni oluştur
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

  // Test kullanıcıları
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
    let user = await userRepository.findOne({
      where: { username: userData.username },
    });

    const hashedPwd = await bcrypt.hash(userData.password, 12);

    if (user) {
      user.password = hashedPwd;
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

  console.log('\n✓ Seeding tamamlandı!');
  console.log('\n--- Test Hesapları ---');
  console.log('Admin     | admin     | admin');
  console.log('Planner   | planner01 | Planner123!');
  console.log('Warehouse | warehouse01 | Warehouse123!');
  console.log('Viewer    | viewer01  | Viewer123!');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding hatası:', err);
  process.exit(1);
});
