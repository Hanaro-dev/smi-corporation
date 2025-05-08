-- Création de la base de données `smi_corporation`
CREATE DATABASE smi_corporation;

-- Sélection de la base de données à utiliser
USE smi_corporation;

-- Création de la table `users` pour stocker les informations des utilisateurs
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY, -- Identifiant unique de l'utilisateur
    name VARCHAR(255) NOT NULL, -- Nom de l'utilisateur, obligatoire
    role_id INT NOT NULL, -- Référence à l'identifiant du rôle (clé étrangère)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date et heure de création de l'utilisateur
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Date et heure de la dernière mise à jour
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE -- Clé étrangère vers la table `roles`, suppression en cascade
);

-- Création de la table `roles` pour stocker les rôles disponibles
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY, -- Identifiant unique du rôle
    name VARCHAR(255) NOT NULL UNIQUE, -- Nom du rôle, obligatoire et unique
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date et heure de création du rôle
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Date et heure de la dernière mise à jour
);

-- Création de la table `permissions` pour stocker les permissions disponibles
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY, -- Identifiant unique de la permission
    name VARCHAR(255) NOT NULL UNIQUE, -- Nom de la permission, obligatoire et unique
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date et heure de création de la permission
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Date et heure de la dernière mise à jour
);

-- Création de la table `role_permissions` pour lier les rôles aux permissions
CREATE TABLE role_permissions (
    role_id INT NOT NULL, -- Référence à l'identifiant du rôle
    permission_id INT NOT NULL, -- Référence à l'identifiant de la permission
    PRIMARY KEY (role_id, permission_id), -- Clé primaire combinée (rôle et permission)
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE, -- Clé étrangère vers la table `roles`, suppression en cascade
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE -- Clé étrangère vers la table `permissions`, suppression en cascade
);

-- Insertion des rôles prédéfinis
INSERT INTO roles (name) VALUES ('admin'), ('editor'), ('viewer');

-- Insertion des permissions prédéfinies
INSERT INTO permissions (name) VALUES 
('create_user'), -- Créer un utilisateur
('edit_user'), -- Modifier un utilisateur
('delete_user'), -- Supprimer un utilisateur
('view_user'); -- Voir un utilisateur

-- Attribution des permissions aux rôles
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), -- Le rôle `admin` peut créer des utilisateurs
(1, 2), -- Le rôle `admin` peut modifier des utilisateurs
(1, 3), -- Le rôle `admin` peut supprimer des utilisateurs
(1, 4), -- Le rôle `admin` peut voir des utilisateurs
(2, 2), -- Le rôle `editor` peut modifier des utilisateurs
(2, 4), -- Le rôle `editor` peut voir des utilisateurs
(3, 4); -- Le rôle `viewer` peut voir des utilisateurs

-- Insertion des utilisateurs avec leurs rôles respectifs
INSERT INTO users (name, role_id) VALUES 
('Alice', 1), -- Alice a le rôle `admin`
('Bob', 2), -- Bob a le rôle `editor`
('Charlie', 3); -- Charlie a le rôle `viewer`

-- Requête pour afficher les informations des utilisateurs
SELECT users.id, users.name, users.role_id, users.created_at
FROM users;

-- Requête pour afficher les permissions associées au rôle `admin`
SELECT permissions.name
FROM permissions
JOIN role_permissions ON permissions.id = role_permissions.permission_id
WHERE role_permissions.role_id = 1; -- ID du rôle (1 pour `admin`)

-- Requête pour afficher les permissions d'un utilisateur spécifique (exemple : utilisateur avec l'ID 1)
SELECT p.name AS permission
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = 1; -- ID de l'utilisateur (1 pour `Alice`)
