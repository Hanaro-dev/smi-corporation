import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding de la base de données...');

  // 1. Permissions
  console.log('Création des permissions...');
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { name: 'view' },
      update: {},
      create: { name: 'view', description: 'Visualiser le contenu' }
    }),
    prisma.permission.upsert({
      where: { name: 'manage_users' },
      update: {},
      create: { name: 'manage_users', description: 'Gérer les utilisateurs' }
    }),
    prisma.permission.upsert({
      where: { name: 'manage_pages' },
      update: {},
      create: { name: 'manage_pages', description: 'Gérer les pages' }
    }),
    prisma.permission.upsert({
      where: { name: 'manage_images' },
      update: {},
      create: { name: 'manage_images', description: 'Gérer les images' }
    }),
    prisma.permission.upsert({
      where: { name: 'manage_organigrammes' },
      update: {},
      create: { name: 'manage_organigrammes', description: 'Gérer les organigrammes' }
    }),
    prisma.permission.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin', description: 'Administration complète' }
    }),
    prisma.permission.upsert({
      where: { name: 'edit' },
      update: {},
      create: { name: 'edit', description: 'Éditer le contenu' }
    }),
    prisma.permission.upsert({
      where: { name: 'manage_roles' },
      update: {},
      create: { name: 'manage_roles', description: 'Gérer les rôles' }
    }),
    prisma.permission.upsert({
      where: { name: 'manage_permissions' },
      update: {},
      create: { name: 'manage_permissions', description: 'Gérer les permissions' }
    }),
    prisma.permission.upsert({
      where: { name: 'manage_user_roles' },
      update: {},
      create: { name: 'manage_user_roles', description: 'Gérer les rôles utilisateurs' }
    }),
    prisma.permission.upsert({
      where: { name: 'view_audit_logs' },
      update: {},
      create: { name: 'view_audit_logs', description: 'Voir les logs d\'audit' }
    }),
    prisma.permission.upsert({
      where: { name: 'manage_content' },
      update: {},
      create: { name: 'manage_content', description: 'Gérer le contenu' }
    }),
    prisma.permission.upsert({
      where: { name: 'manage_media' },
      update: {},
      create: { name: 'manage_media', description: 'Gérer les médias' }
    })
  ]);

  console.log(`${permissions.length} permissions creees`);

  // 2. Rôles
  console.log('Creation des roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrateur système' }
  });

  const editorRole = await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: { name: 'editor', description: 'Éditeur de contenu' }
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user', description: 'Utilisateur standard' }
  });

  // 3. Relations rôle-permissions
  console.log('Creation des relations role-permissions...');
  
  // Admin - toutes les permissions
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id
      }
    });
  }

  // Editor - permissions d'édition
  const editorPermissions = permissions.filter(p => 
    ['view', 'edit', 'manage_pages', 'manage_images', 'manage_content', 'manage_media'].includes(p.name)
  );
  for (const permission of editorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: editorRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: editorRole.id,
        permissionId: permission.id
      }
    });
  }

  // User - permission de lecture seulement
  const viewPermission = permissions.find(p => p.name === 'view');
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: userRole.id,
        permissionId: viewPermission.id
      }
    },
    update: {},
    create: {
      roleId: userRole.id,
      permissionId: viewPermission.id
    }
  });

  // 4. Utilisateurs
  console.log('Creation des utilisateurs...');
  const hashedPassword = await bcrypt.hash('motdepasse123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smi-corporation.com' },
    update: {},
    create: {
      name: 'Administrateur',
      email: 'admin@smi-corporation.com',
      username: 'admin',
      password: hashedPassword,
      roleId: adminRole.id
    }
  });

  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@smi-corporation.com' },
    update: {},
    create: {
      name: 'Éditeur',
      email: 'editor@smi-corporation.com',
      username: 'editor',
      password: hashedPassword,
      roleId: editorRole.id
    }
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'user@smi-corporation.com' },
    update: {},
    create: {
      name: 'Utilisateur Test',
      email: 'user@smi-corporation.com',
      username: 'user',
      password: hashedPassword,
      roleId: userRole.id
    }
  });

  // 5. Pages d'exemple
  console.log('Creation des pages d\'exemple...');
  const homePage = await prisma.page.upsert({
    where: { slug: 'accueil' },
    update: {},
    create: {
      title: 'Accueil',
      slug: 'accueil',
      content: '<h1>Bienvenue sur SMI Corporation</h1><p>Site de gestion d\'entreprise moderne.</p>',
      excerpt: 'Page d\'accueil du site SMI Corporation',
      status: 'published',
      userId: adminUser.id,
      order: 1
    }
  });

  const aboutPage = await prisma.page.upsert({
    where: { slug: 'a-propos' },
    update: {},
    create: {
      title: 'À propos',
      slug: 'a-propos',
      content: '<h1>À propos de SMI Corporation</h1><p>Nous sommes une entreprise innovante...</p>',
      excerpt: 'Présentation de SMI Corporation',
      status: 'published',
      userId: adminUser.id,
      order: 2
    }
  });

  // 6. Images d'exemple
  console.log('Creation des images d\'exemple...');
  const logoImage = await prisma.image.upsert({
    where: { filename: 'logo-smi.jpg' },
    update: {},
    create: {
      filename: 'logo-smi.jpg',
      originalName: 'logo-smi-corporation.jpg',
      url: '/uploads/images/logo-smi.jpg',
      mimeType: 'image/jpeg',
      size: 45678,
      width: 800,
      height: 600,
      alt: 'Logo SMI Corporation',
      description: 'Logo officiel de SMI Corporation',
      userId: adminUser.id
    }
  });

  // 7. Organigramme d'exemple
  console.log('Creation de l\'organigramme d\'exemple...');
  const organigramme = await prisma.organigramme.upsert({
    where: { slug: 'direction-generale' },
    update: {},
    create: {
      title: 'Direction Générale',
      slug: 'direction-generale',
      description: 'Organigramme de la direction générale de SMI Corporation',
      status: 'published',
      userId: adminUser.id
    }
  });

  // Employés de l'organigramme
  const ceo = await prisma.employee.create({
    data: {
      name: 'Jean Dupont',
      position: 'Directeur Général',
      email: 'jean.dupont@smi-corporation.com',
      phone: '+33 1 23 45 67 89',
      level: 1,
      order: 1,
      organigrammeId: organigramme.id
    }
  });

  await prisma.employee.create({
    data: {
      name: 'Marie Martin',
      position: 'Directrice Technique',
      email: 'marie.martin@smi-corporation.com',
      phone: '+33 1 23 45 67 90',
      level: 2,
      order: 1,
      parentId: ceo.id,
      organigrammeId: organigramme.id
    }
  });

  await prisma.employee.create({
    data: {
      name: 'Pierre Durand',
      position: 'Directeur Commercial',
      email: 'pierre.durand@smi-corporation.com',
      phone: '+33 1 23 45 67 91',
      level: 2,
      order: 2,
      parentId: ceo.id,
      organigrammeId: organigramme.id
    }
  });

  console.log('Seeding termine avec succes!');
  console.log(`
Donnees creees:
- ${permissions.length} permissions
- 3 roles (admin, editor, user)
- 3 utilisateurs (admin, editor, user)
- 2 pages (accueil, a-propos)
- 1 image (logo)
- 1 organigramme avec 3 employes

Comptes de test:
- admin@smi-corporation.com / motdepasse123
- editor@smi-corporation.com / motdepasse123  
- user@smi-corporation.com / motdepasse123
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Erreur lors du seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });