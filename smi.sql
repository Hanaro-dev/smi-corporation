CREATE DATABASE smi_corporation;
USE smi_corporation;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

INSERT INTO roles (name) VALUES ('admin'), ('editor'), ('viewer');

INSERT INTO permissions (name) VALUES 
('create_user'), 
('edit_user'), 
('delete_user'), 
('view_user');

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), -- admin peut créer des utilisateurs
(1, 2), -- admin peut éditer des utilisateurs
(1, 3), -- admin peut supprimer des utilisateurs
(1, 4), -- admin peut voir des utilisateurs
(2, 2), -- editor peut éditer des utilisateurs
(2, 4), -- editor peut voir des utilisateurs
(3, 4); -- viewer peut voir des utilisateurs

INSERT INTO users (name, role_id) VALUES 
('Alice', 1),
('Bob', 2),
('Charlie', 3);

SELECT users.id, users.name, users.role_id, users.created_at
FROM users;

SELECT permissions.name
FROM permissions
JOIN role_permissions ON permissions.id = role_permissions.permission_id
WHERE role_permissions.role_id = 1; -- ID du rôle

SELECT p.name AS permission
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = 1; -- ID de l'utilisateur

