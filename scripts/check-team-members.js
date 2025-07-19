const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTeamMembers() {
  try {
    console.log('Checking all teams and their members...\n');
    
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    teams.forEach((team, index) => {
      console.log(`Team ${index + 1}: ${team.name} (ID: ${team.id})`);
      console.log(`Created: ${team.createdAt}`);
      console.log(`Members (${team.members.length}):`);
      
      team.members.forEach((member, memberIndex) => {
        console.log(`  ${memberIndex + 1}. ${member.user.name || 'Unknown'} (${member.user.walletAddress}) - Role: ${member.role}`);
      });
      console.log('');
    });

    console.log('Total teams:', teams.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamMembers(); 