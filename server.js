const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const app = express();

// --- KONFIGURASI APP ---
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'rahasia_bola_fifa',
    resave: false,
    saveUninitialized: true
}));

// --- KONEKSI DATABASE ---
const db = mysql.createPool({
    host: '127.0.0.1', 
    user: 'root', 
    password: '', 
    database: 'sepakbola',
    waitForConnections: true, 
    connectionLimit: 150, 
    queueLimit: 0
});

// --- CONSTANT QUERY ---
const GET_PLAYERS_BASE = `
    SELECT p.player_id, p.name, p.age, c.club_name AS club, co.country_name AS country 
    FROM players p
    LEFT JOIN clubs c ON p.club_id = c.club_id
    LEFT JOIN countries co ON p.country_id = co.country_id
`;

// --- TEMPLATE HEAD & FOOT ---
const headHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FIFA System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Poppins', sans-serif; background: #e0f2ff; min-height: 100vh; }
        .glass-panel { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 100%; max-width: 1000px; }
        
        .navbar-fifa { background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); }
        .btn-menu { display: block; width: 100%; border-radius: 8px; padding: 15px; margin-bottom: 15px; font-weight: 600; text-align: center; text-decoration: none; border: none; color: white; transition: 0.3s; }
        .btn-red { background-color: #dc3545; }
        .btn-yellow { background-color: #ffc107; color: black; }
        .btn-blue { background-color: #0d6efd; }
        .badge-role { background-color: #0d6efd; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; margin-bottom: 20px; display: inline-block; }

        .manager-header { background-color: #ffc107; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); width: 100%; position: fixed; top: 0; left: 0; z-index: 1000; }
        .manager-body { padding-top: 90px; } 
        .filter-box { background-color: #fff8dc; border: 1px solid #ffeeba; border-radius: 10px; padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        
        .admin-search-box { background: #f8d7da; padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #f5c6cb; }

        .btn-action-edit { background: #ffc107; color: black; border: none; font-weight: bold; padding: 5px 15px; border-radius: 5px; text-decoration: none; font-size: 0.8rem; margin-right: 5px; }
        .btn-action-del { background: #dc3545; color: white; border: none; font-weight: bold; padding: 5px 15px; border-radius: 5px; text-decoration: none; font-size: 0.8rem; }
        .pagination-area { display: flex; justify-content: center; margin-top: 20px; gap: 10px; }
        
        /* Style Tambahan untuk Kartu */
        .card-visual { width: 12px; height: 16px; display: inline-block; border-radius: 2px; box-shadow: 1px 1px 2px rgba(0,0,0,0.2); }
        .card-yellow { background-color: #ffc107; border: 1px solid #d39e00; }
        .card-red { background-color: #dc3545; border: 1px solid #a71d2a; }
    </style>
</head>
<body>
`;
const footHTML = `<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script></body></html>`;

// --- ROUTE: LOGIN ---
app.get('/login', (req, res) => {
    res.send(`${headHTML}<div class="container d-flex justify-content-center align-items-center vh-100"><div class="glass-panel text-center" style="max-width: 400px;"><h3>⚽ FIFA LOGIN</h3><form method="POST" action="/login"><input type="text" name="username" class="form-control mb-3" placeholder="Username" required><input type="password" name="password" class="form-control mb-3" required><button class="btn btn-primary w-100 rounded-pill">Masuk</button></form></div></div>${footHTML}`);
});

app.post('/login', (req, res) => {
    req.session.user = req.body.username;
    res.redirect('/dashboard');
});

// --- ROUTE: DASHBOARD ---
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const user = req.session.user;
    
    let buttons = '';
    let roleLabel = 'Supporter';
    
    if (user.includes('admin')) {
        roleLabel = 'Internal FIFA';
        buttons = `
            <a href="/admin/view" class="btn-menu btn-red">🛡️ MENU ADMIN (Authorized Only)</a>
            <a href="/manager/manage" class="btn-menu btn-yellow">📝 MENU EDIT (Admin & Manager)</a>
            <a href="/public/view" class="btn-menu btn-blue">📊 DATA PUBLIC</a>
        `;
    } else if (user.includes('manager')) {
        roleLabel = 'Club Manager';
        buttons = `
            <a href="/manager/manage" class="btn-menu btn-yellow">📝 MENU EDIT (Manager)</a>
            <a href="/public/view" class="btn-menu btn-blue">📊 DATA PUBLIC</a>
        `;
    } else {
        buttons = `<a href="/public/view" class="btn-menu btn-blue">📊 LIHAT DATA PUBLIC</a>`;
    }

    res.send(`${headHTML}
        <nav class="navbar navbar-fifa navbar-dark mb-5 px-4"><span class="navbar-brand fw-bold">FIFA System</span><a href="/logout" class="btn btn-sm btn-light fw-bold text-primary">Logout</a></nav>
        <div class="container d-flex justify-content-center">
            <div class="glass-panel text-center">
                <h2 class="mb-1">Halo, ${user}!</h2>
                <span class="badge-role">${roleLabel}</span>
                <div class="mt-4" style="max-width: 500px; margin: 0 auto;">${buttons}</div>
            </div>
        </div>${footHTML}`);
});

// --- ROUTE: MANAGER (EDIT) ---
app.get('/manager/manage', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const isAdmin = req.session.user.includes('admin');

    db.query("SELECT club_id, club_name FROM clubs ORDER BY club_name ASC", (err, clubs) => {
        if (err) return res.status(500).send("DB Error");

        let defaultClub = isAdmin ? 'all' : (clubs.length > 0 ? clubs[0].club_id : null);
        let selectedClubId = req.query.club_id || defaultClub;
        
        let query = "";
        let params = [];
        let isPaginationMode = false;
        const limit = 50;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        if (selectedClubId === 'all' && isAdmin) {
            query = `${GET_PLAYERS_BASE} ORDER BY p.player_id ASC LIMIT ? OFFSET ?`;
            params = [limit, offset];
            isPaginationMode = true;
        } else {
            query = `${GET_PLAYERS_BASE} WHERE p.club_id = ? ORDER BY p.name ASC`;
            params = [selectedClubId];
        }

        db.query(query, params, (err, players) => {
            if (err) return res.status(500).send("DB Error");

            let options = isAdmin ? `<option value="all" ${selectedClubId === 'all' ? 'selected' : ''}>-- 🛡️ ADMIN: SEMUA KLUB --</option>` : '';
            options += clubs.map(c => `<option value="${c.club_id}" ${c.club_id == selectedClubId ? 'selected' : ''}>${c.club_name}</option>`).join('');

            let rows = players.map(p => `
                <tr>
                    <td>${p.player_id}</td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.age} Thn</td>
                    <td>${p.club}</td>
                    <td>${p.country}</td>
                    <td><a href="#" class="btn-action-edit">📝 Edit</a><a href="#" class="btn-action-del">🗑️ Hapus</a></td>
                </tr>`).join('');

            let paginationHTML = isPaginationMode ? `
                <div class="pagination-area">
                    <a href="/manager/manage?club_id=all&page=${page > 1 ? page - 1 : 1}" class="btn btn-sm btn-outline-dark ${page<=1?'disabled':''}">⬅️ Prev</a>
                    <span class="align-self-center fw-bold">Halaman ${page}</span>
                    <a href="/manager/manage?club_id=all&page=${page + 1}" class="btn btn-sm btn-outline-dark">Next ➡️</a>
                </div>` : '';

            res.send(`
                ${headHTML}
                <div class="manager-header"><span class="manager-title">MANAJEMEN SKUAD</span><a href="/dashboard" class="btn btn-light btn-sm fw-bold">Kembali</a></div>
                <div class="container manager-body">
                    <div class="glass-panel mx-auto">
                        <div class="filter-box">
                            <div style="color: #664d03;"><strong>Mode Manager:</strong> ${selectedClubId === 'all' ? 'Mode Admin (Semua Klub)' : 'Mode Filter Klub'}</div>
                            <div class="d-flex align-items-center"><span class="me-2 text-muted">Ganti Klub:</span><select class="form-select" style="width: 250px;" onchange="window.location.href='/manager/manage?club_id=' + this.value">${options}</select></div>
                        </div>
                        <table class="table table-hover align-middle"><thead class="table-light"><tr><th>ID</th><th>Nama Pemain</th><th>Umur</th><th>Klub</th><th>Negara</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>
                        ${paginationHTML}
                    </div>
                </div>${footHTML}`);
        });
    });
});

// --- ROUTE: ADMIN (MASTER DATA) ---
app.get('/admin/view', (req, res) => {
    if (!req.session.user || !req.session.user.includes('admin')) return res.redirect('/dashboard');

    const limit = 20; 
    const page = parseInt(req.query.page) || 1; 
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || ''; 

    let countSql = "SELECT COUNT(*) AS total FROM players";
    let countParams = [];
    let dataSql = `${GET_PLAYERS_BASE} `;
    let dataParams = [];

    if (searchQuery) {
        countSql += " WHERE name LIKE ?";
        countParams.push(`%${searchQuery}%`);
        dataSql += " WHERE p.name LIKE ? ";
        dataParams.push(`%${searchQuery}%`);
    }

    dataSql += " ORDER BY p.player_id ASC LIMIT ? OFFSET ?";
    dataParams.push(limit, offset);

    db.query(countSql, countParams, (err, c) => {
        const totalRows = c[0].total;
        const totalPages = Math.ceil(totalRows / limit);

        db.query(dataSql, dataParams, (err, rows) => {
            let rowsHTML = rows.map(p => `<tr><td>${p.player_id}</td><td><b>${p.name}</b></td><td>${p.age}</td><td>${p.club}</td><td>${p.country}</td></tr>`).join('');
            
            res.send(`
                ${headHTML}
                <div class="container py-5">
                    <div class="glass-panel mx-auto">
                        <div class="d-flex justify-content-between mb-3"><h3 class="text-danger">🛡️ ADMIN MASTER DATA</h3><a href="/dashboard" class="btn btn-secondary btn-sm">Kembali</a></div>
                        <div class="admin-search-box d-flex"><form action="/admin/view" method="GET" class="d-flex w-100"><input type="text" name="q" class="form-control me-2" placeholder="Cari nama pemain..." value="${searchQuery}"><button type="submit" class="btn btn-danger">Cari</button>${searchQuery ? '<a href="/admin/view" class="btn btn-outline-secondary ms-2">Reset</a>' : ''}</form></div>
                        <div class="alert alert-danger py-2">Total ${totalRows} data. (Halaman ${page}/${totalPages})</div>
                        <table class="table table-striped table-sm"><thead class="table-danger"><tr><th>ID</th><th>Nama</th><th>Umur</th><th>Klub</th><th>Negara</th></tr></thead><tbody>${rows.length > 0 ? rowsHTML : '<tr><td colspan="5" class="text-center">Data tidak ditemukan</td></tr>'}</tbody></table>
                        <div class="pagination-area">${page > 1 ? `<a href="/admin/view?q=${searchQuery}&page=${page-1}" class="btn btn-sm btn-outline-danger">Prev</a>` : ''}<span class="fw-bold align-self-center">Hal ${page}</span>${page < totalPages ? `<a href="/admin/view?q=${searchQuery}&page=${page+1}" class="btn btn-sm btn-outline-danger">Next</a>` : ''}</div>
                    </div>
                </div>${footHTML}`);
        });
    });
});

// --- ROUTE: PUBLIC VIEW (MODIFIKASI DISINI) ---
app.get('/public/view', (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const limit = 50; 
    const page = parseInt(req.query.page) || 1; 
    const offset = (page - 1) * limit;

    // 1. Query Top 5 Klub Terbesar
    const queryStats = `
        SELECT c.club_name, COUNT(p.player_id) as total_squad 
        FROM clubs c 
        JOIN players p ON c.club_id = p.club_id 
        GROUP BY c.club_id 
        ORDER BY total_squad DESC 
        LIMIT 5
    `;

    db.query(queryStats, (err, statRows) => {
        if (err) return res.status(500).send("DB Error");

        // 2. Query Players (Simulasi G/A dan Kartu)
        const queryPlayers = `
            SELECT 
                p.player_id, p.name, p.age, 
                c.club_name AS club, 
                co.country_name AS country,
                /* Simulasi G/A berdasarkan ID agar datanya variatif */
                (p.player_id % 35 + 2) AS ga, 
                /* Simulasi Kartu Kuning (0-4) */
                (p.player_id % 5) AS yellow_cards,
                /* Simulasi Kartu Merah (1 untuk setiap 20 pemain) */
                (CASE WHEN p.player_id % 20 = 0 THEN 1 ELSE 0 END) AS red_cards 
            FROM players p
            LEFT JOIN clubs c ON p.club_id = c.club_id
            LEFT JOIN countries co ON p.country_id = co.country_id
            ORDER BY p.player_id ASC 
            LIMIT ? OFFSET ?
        `;

        db.query("SELECT COUNT(*) AS total FROM players", (err, countRes) => {
            const totalRows = countRes[0].total;
            const totalPages = Math.ceil(totalRows / limit);

            db.query(queryPlayers, [limit, offset], (err, rows) => {
                if (err) return res.status(500).send("DB Error");

                // Render Top 5 Klub
                let statsHTML = statRows.map((s, index) => `
                    <tr>
                        <td class="text-center fw-bold">${index + 1}</td>
                        <td>${s.club_name}</td>
                        <td class="text-center"><span class="badge bg-success rounded-pill px-3">${s.total_squad} Pemain</span></td>
                    </tr>
                `).join('');

                // Render Baris Pemain
                let rowsHTML = rows.map(p => {
                    // Logic Tampilan Kartu
                    let cardDisplay = '';
                    
                    if (p.yellow_cards > 0) {
                        cardDisplay += `<div class="d-flex align-items-center me-2" title="Kartu Kuning">
                            <span class="card-visual card-yellow me-1"></span>
                            <span class="small fw-bold">${p.yellow_cards}</span>
                        </div>`;
                    }
                    if (p.red_cards > 0) {
                        cardDisplay += `<div class="d-flex align-items-center" title="Kartu Merah">
                            <span class="card-visual card-red me-1"></span>
                            <span class="small fw-bold">${p.red_cards}</span>
                        </div>`;
                    }
                    if (p.yellow_cards === 0 && p.red_cards === 0) {
                        cardDisplay = '<span class="text-muted small">-</span>';
                    }

                    return `
                    <tr>
                        <td>${p.player_id}</td>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.age}</td>
                        <td>${p.club || '-'}</td>
                        <td>${p.country || '-'}</td>
                        <td class="text-center">
                            <span class="badge bg-primary rounded-pill" style="min-width: 40px;">${p.ga}</span>
                        </td>
                        <td class="text-center">
                            <div class="d-flex justify-content-center">${cardDisplay}</div>
                        </td>
                    </tr>`;
                }).join('');
                
                res.send(`
                    ${headHTML}
                    <div class="container py-5">
                        <div class="glass-panel mx-auto">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h3 class="text-primary m-0">📊 PUSAT STATISTIK PEMAIN</h3>
                                <a href="/dashboard" class="btn btn-secondary btn-sm">Kembali Dashboard</a>
                            </div>

                    

                            <h5 class="text-primary border-bottom pb-2 mb-3">📋 Statistik Individu (Halaman ${page}/${totalPages})</h5>
                            <div class="table-responsive">
                                <table class="table table-hover table-sm align-middle">
                                    <thead class="table-primary">
                                        <tr>
                                            <th>ID</th>
                                            <th>Nama Pemain</th>
                                            <th>Umur</th>
                                            <th>Klub</th>
                                            <th>Negara</th>
                                            <th class="text-center">G/A</th>
                                            <th class="text-center">Kartu</th>
                                        </tr>
                                    </thead>
                                    <tbody>${rowsHTML}</tbody>
                                </table>
                            </div>

                            <div class="pagination-area">
                                ${page > 1 ? `<a href="/public/view?page=${page-1}" class="btn btn-sm btn-outline-primary">Prev</a>` : ''}
                                <span class="fw-bold align-self-center px-3">Hal ${page}</span>
                                ${page < totalPages ? `<a href="/public/view?page=${page+1}" class="btn btn-sm btn-outline-primary">Next</a>` : ''}
                            </div>
                        </div>
                    </div>
                    ${footHTML}
                `);
            });
        });
    });
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

app.listen(3000, () => console.log('Server Aktif Port 3000'));