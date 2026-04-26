const { PrismaClient } = require('../prisma/generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  const username = 'admin';
  const password = process.env.ADMIN_PASSWORD || '0916092075001AN!@@';
  
  console.log(`Checking user: ${username}...`);
  
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        passwordHash: passwordHash,
        role: 'ADMIN'
      },
      create: {
        username,
        passwordHash,
        role: 'ADMIN'
      }
    });
    
    console.log('Admin user updated/created successfully:', user.username);
  } catch (error) {
    console.error('Error resetting admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
