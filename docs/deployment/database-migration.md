# Migration vers une base de données réelle

Ce guide explique comment migrer de la base de données simulée vers une vraie base de données MySQL pour le déploiement en production.

## Vue d'ensemble

SMI Corporation utilise actuellement une base de données simulée (`USE_MOCK_DB=true`) pour le développement. Pour le déploiement en production, vous devez migrer vers une vraie base de données MySQL.

## Schéma de base de données

### Tables principales

```sql
-- Création des tables
CREATE DATABASE smi_corporation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smi_corporation;

-- Table des rôles
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des permissions
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table de liaison rôles-permissions
CREATE TABLE role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- Table des utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Table des pages
CREATE TABLE pages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('draft', 'published') DEFAULT 'draft',
    parent_id INT NULL,
    level INT DEFAULT 0,
    order_index INT DEFAULT 0,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_parent (parent_id)
);

-- Table des images
CREATE TABLE images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    size INT,
    width INT,
    height INT,
    alt VARCHAR(255),
    caption TEXT,
    user_id INT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_filename (filename),
    INDEX idx_user (user_id)
);

-- Table des organigrammes
CREATE TABLE organigrammes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('draft', 'published') DEFAULT 'draft',
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_status (status)
);

-- Table des employés
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    parent_id INT NULL,
    organigramme_id INT NOT NULL,
    level INT DEFAULT 0,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (organigramme_id) REFERENCES organigrammes(id) ON DELETE CASCADE,
    INDEX idx_organigramme (organigramme_id),
    INDEX idx_parent (parent_id)
);

-- Table des logs d'audit
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    user_id INT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_action (action),
    INDEX idx_user (user_id),
    INDEX idx_timestamp (timestamp)
);
```

## Données initiales

### Insertion des données de base

```sql
-- Insertion des rôles
INSERT INTO roles (id, name) VALUES
(1, 'admin'),
(2, 'editor'),
(3, 'user');

-- Insertion des permissions
INSERT INTO permissions (id, name, description) VALUES
(1, 'admin', 'Permission administrateur complète'),
(2, 'edit', 'Permission d\'édition de contenu'),
(3, 'view', 'Permission de lecture'),
(4, 'manage_users', 'Gestion des utilisateurs'),
(5, 'manage_roles', 'Gestion des rôles'),
(6, 'manage_permissions', 'Gestion des permissions'),
(7, 'manage_user_roles', 'Attribution des rôles utilisateur'),
(8, 'view_audit_logs', 'Consultation des logs d\'audit'),
(9, 'manage_content', 'Gestion du contenu des pages'),
(10, 'manage_media', 'Gestion des médias et images'),
(11, 'manage_organigrammes', 'Gestion des organigrammes');

-- Attribution des permissions aux rôles
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Admin - toutes les permissions
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11),
-- Editor - permissions d'édition
(2, 2), (2, 3), (2, 9), (2, 10), (2, 11),
-- User - lecture seulement
(3, 3);

-- Création de l'utilisateur administrateur initial
-- Mot de passe : admin123 (haché avec bcrypt)
INSERT INTO users (email, name, username, password, role_id, status) VALUES
('admin@exemple.fr', 'Administrateur', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBP3MNcMDLZa5C', 1, 'active');

-- Pages par défaut
INSERT INTO pages (title, content, slug, status, level, order_index) VALUES
('Accueil', 'Bienvenue sur le site de SMI Corporation', 'accueil', 'published', 0, 0),
('À propos', 'À propos de SMI Corporation', 'a-propos', 'published', 0, 1),
('Services', 'Nos services', 'services', 'published', 0, 2);

-- Images par défaut
INSERT INTO images (filename, original_name, url, mime_type, size, width, height, alt, caption, user_id, is_public) VALUES
('logo-smi.jpg', 'logo-smi-corporation.jpg', '/uploads/images/logo-smi.jpg', 'image/jpeg', 45678, 800, 600, 'Logo SMI Corporation', 'Logo officiel de SMI Corporation', 1, TRUE);

-- Organigramme exemple
INSERT INTO organigrammes (title, description, slug, status, user_id) VALUES
('Direction Générale', 'Structure organisationnelle de la direction générale de SMI Corporation', 'direction-generale', 'published', 1);

-- Employés exemple
INSERT INTO employees (name, position, email, phone, organigramme_id, level, order_index) VALUES
('Marie Dubois', 'Directrice Générale', 'marie.dubois@smi-corp.fr', '01 23 45 67 89', 1, 0, 0),
('Pierre Martin', 'Directeur des Opérations', 'pierre.martin@smi-corp.fr', '01 23 45 67 90', 1, 1, 0),
('Sophie Laurent', 'Directrice des Ressources Humaines', 'sophie.laurent@smi-corp.fr', '01 23 45 67 91', 1, 1, 1);

-- Mettre à jour les relations parent-enfant pour les employés
UPDATE employees SET parent_id = 1 WHERE id IN (2, 3);
```

## Scripts de migration

### Script d'export des données mock

Créez `scripts/export-mock-data.js` :

```javascript
#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { userDb, roleDb, permissionDb, pageDb, imageDb, organigrammeDb, employeeDb } from '../server/utils/mock-db.js'

const exportData = () => {
  const data = {
    users: userDb.getAll(),
    roles: roleDb.findAll(),
    permissions: permissionDb.findAll(),
    pages: pageDb.findAll(),
    images: imageDb.findAll(),
    organigrammes: organigrammeDb.findAll(),
    employees: employeeDb.findAll()
  }

  const outputPath = path.join(process.cwd(), 'data-export.json')
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
  
  console.log(`✅ Données exportées vers ${outputPath}`)
  console.log(`📊 Statistiques:`)
  console.log(`   - Utilisateurs: ${data.users.length}`)
  console.log(`   - Rôles: ${data.roles.length}`)
  console.log(`   - Permissions: ${data.permissions.length}`)
  console.log(`   - Pages: ${data.pages.length}`)
  console.log(`   - Images: ${data.images.length}`)
  console.log(`   - Organigrammes: ${data.organigrammes.length}`)
  console.log(`   - Employés: ${data.employees.length}`)
}

exportData()
```

### Script de migration vers MySQL

Créez `scripts/migrate-to-mysql.js` :

```javascript
#!/usr/bin/env node

import mysql from 'mysql2/promise'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const migrateData = async () => {
  // Connexion à MySQL
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  console.log('✅ Connexion à MySQL établie')

  try {
    // Lire les données exportées
    const data = JSON.parse(fs.readFileSync('data-export.json', 'utf8'))

    // Migrer les rôles
    console.log('📝 Migration des rôles...')
    for (const role of data.roles) {
      await connection.execute(
        'INSERT IGNORE INTO roles (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [role.id, role.name, role.createdAt, role.updatedAt]
      )
    }

    // Migrer les permissions
    console.log('📝 Migration des permissions...')
    for (const permission of data.permissions) {
      await connection.execute(
        'INSERT IGNORE INTO permissions (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [permission.id, permission.name, permission.createdAt, permission.updatedAt]
      )
    }

    // Migrer les utilisateurs
    console.log('📝 Migration des utilisateurs...')
    for (const user of data.users) {
      await connection.execute(
        'INSERT IGNORE INTO users (id, email, name, username, password, role_id, status, last_login, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.email, user.name, user.username, user.password, user.role_id, user.status, user.lastLogin, user.createdAt, user.updatedAt]
      )
    }

    // Migrer les pages
    console.log('📝 Migration des pages...')
    for (const page of data.pages) {
      await connection.execute(
        'INSERT IGNORE INTO pages (id, title, content, slug, status, parent_id, level, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [page.id, page.title, page.content, page.slug, page.status, page.parentId, page.level, page.order, page.createdAt, page.updatedAt]
      )
    }

    // Migrer les organigrammes
    console.log('📝 Migration des organigrammes...')
    for (const org of data.organigrammes) {
      await connection.execute(
        'INSERT IGNORE INTO organigrammes (id, title, description, slug, status, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [org.id, org.title, org.description, org.slug, org.status, org.userId, org.createdAt, org.updatedAt]
      )
    }

    // Migrer les employés
    console.log('📝 Migration des employés...')
    for (const employee of data.employees) {
      await connection.execute(
        'INSERT IGNORE INTO employees (id, name, position, email, phone, parent_id, organigramme_id, level, order_index, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [employee.id, employee.name, employee.position, employee.email, employee.phone, employee.parentId, employee.organigrammeId, employee.level, employee.orderIndex, employee.isActive, employee.createdAt, employee.updatedAt]
      )
    }

    console.log('✅ Migration terminée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  } finally {
    await connection.end()
  }
}

migrateData()
```

## Configuration Sequelize

Créez `config/database.js` :

```javascript
import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
)

export default sequelize
```

## Commandes NPM

Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "db:export": "node scripts/export-mock-data.js",
    "db:migrate": "node scripts/migrate-to-mysql.js",
    "db:reset": "node scripts/reset-database.js",
    "db:seed": "node scripts/seed-database.js"
  }
}
```

## Checklist de migration

- [ ] Créer la base de données MySQL sur Infomaniak
- [ ] Configurer les variables d'environnement
- [ ] Exporter les données mock : `npm run db:export`
- [ ] Créer les tables avec le script SQL
- [ ] Migrer les données : `npm run db:migrate`
- [ ] Tester la connexion
- [ ] Changer `USE_MOCK_DB=false`
- [ ] Redémarrer l'application
- [ ] Vérifier que tout fonctionne

## Rollback

En cas de problème, vous pouvez revenir à la base simulée :

1. Changer `USE_MOCK_DB=true` dans `.env`
2. Redémarrer l'application
3. Les données mock seront de nouveau utilisées

---

**Important** : Sauvegardez toujours vos données avant une migration !