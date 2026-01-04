CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role_id INT,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,sn
    permission_name VARCHAR(100) NOT NULL UNIQUE, 
    description TEXT
);

CREATE TABLE role_permissions (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

INSERT INTO permissions (permission_name) VALUES 
('view_dashboard'), 
('manage_users'), 
('edit_data'), 
('view_only');
INSERT INTO role_permissions VALUES (1, 1), (1, 2), (1, 3);
INSERT INTO role_permissions VALUES (2, 1), (2, 3);
INSERT INTO role_permissions VALUES (3, 4);
INSERT INTO roles (id, role_name) VALUES 
(1, 'Internal FIFA'), 
(2, 'Club Manager'),       
(3, 'Supporter');                

INSERT INTO users (username, password, full_name, role_id) VALUES 
('admin_fifa', 'admin123', 'Gianni Infantino', 1),
('manager_club', 'manager123', 'Pep Guardiola', 2),
('fans_bola', 'fans123', 'Budi Suporter', 3);
SELECT 'players' AS Nama_Tabel, COUNT(*) AS Jumlah_Data FROM players
UNION
SELECT 'player_stats', COUNT(*) FROM player_stats;

SELECT players.*.


