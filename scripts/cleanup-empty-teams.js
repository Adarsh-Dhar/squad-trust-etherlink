const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupEmptyTeams() {
  try {
    console.log('Checking for teams with 0 members or 0 admin members...\n');
    
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        projects: true,
      },
    });

    const teamsToDelete = [];

    teams.forEach((team) => {
      const totalMembers = team.members.length;
      const adminMembers = team.members.filter(member => member.role === 'ADMIN').length;
      
      console.log(`Team: ${team.name} (ID: ${team.id})`);
      console.log(`  Total members: ${totalMembers}`);
      console.log(`  Admin members: ${adminMembers}`);
      
      if (totalMembers === 0 || adminMembers === 0) {
        teamsToDelete.push(team);
        console.log(`  ❌ Will be deleted (${totalMembers === 0 ? '0 members' : '0 admin members'})`);
      } else {
        console.log(`  ✅ OK`);
      }
      console.log('');
    });

    if (teamsToDelete.length === 0) {
      console.log('No teams need to be deleted.');
      return;
    }

    console.log(`Found ${teamsToDelete.length} teams to delete:`);
    teamsToDelete.forEach(team => {
      console.log(`  - ${team.name} (${team.id})`);
    });

    console.log('\nDeleting teams...');
    
    for (const team of teamsToDelete) {
      console.log(`Deleting team: ${team.name}...`);
      
      // Use a transaction to ensure all related records are deleted
      await prisma.$transaction(async (tx) => {
        // Delete all team members first
        await tx.teamMember.deleteMany({
          where: { teamId: team.id }
        });

        // Delete all projects and their related data
        for (const project of team.projects) {
          // Delete funding records
          await tx.funding.deleteMany({
            where: { projectId: project.id }
          });
          
          // Delete contributor roles
          await tx.contributorRole.deleteMany({
            where: { projectId: project.id }
          });
          
          // Delete milestones and their signatures
          const milestones = await tx.milestone.findMany({
            where: { projectId: project.id }
          });
          
          for (const milestone of milestones) {
            // Delete milestone signatures
            await tx.taskSignature.deleteMany({
              where: { milestoneId: milestone.id }
            });
            
            // Delete milestone verifications
            await tx.milestoneVerification.deleteMany({
              where: { milestoneId: milestone.id }
            });
          }
          
          // Delete milestones
          await tx.milestone.deleteMany({
            where: { projectId: project.id }
          });
          
          // Delete project signatures
          await tx.projectSignature.deleteMany({
            where: { projectId: project.id }
          });
          
          // Delete investor signatures
          await tx.investorSignature.deleteMany({
            where: { projectId: project.id }
          });
        }
        
        // Delete projects
        await tx.project.deleteMany({
          where: { teamId: team.id }
        });
        
        // Delete credibility score
        await tx.credibilityScore.deleteMany({
          where: { teamId: team.id }
        });
        
        // Finally, delete the team
        await tx.team.delete({
          where: { id: team.id }
        });
      });
      
      console.log(`✅ Deleted team: ${team.name}`);
    }

    console.log('\nCleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupEmptyTeams(); 