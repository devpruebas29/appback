const { pool } = require("../src/config/database");

async function setupRefreshTokensTable() {
    try {
        const query = `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expira_en DATETIME NOT NULL,
        revocado TINYINT(1) DEFAULT 0,
        ip_creacion VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (token_hash),
        FOREIGN KEY (id_usuario) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `;
        await pool.query(query);
        console.log("Tabla refresh_tokens creada o ya existente.");
        process.exit(0);
    } catch (err) {
        console.error("Error creando tabla refresh_tokens:", err);
        process.exit(1);
    }
}

setupRefreshTokensTable();
