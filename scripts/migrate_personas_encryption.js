const { pool } = require("../src/config/database");

async function migratePersonasForEncryption() {
    try {
        const queries = [
            "ALTER TABLE personas ADD COLUMN IF NOT EXISTS dni_hash VARCHAR(64) AFTER dni",
            "ALTER TABLE personas ADD COLUMN IF NOT EXISTS telefono_hash VARCHAR(64) AFTER telefono",
            "ALTER TABLE personas MODIFY COLUMN dni VARCHAR(255)",
            "ALTER TABLE personas MODIFY COLUMN telefono VARCHAR(255)",
            "CREATE INDEX IF NOT EXISTS idx_dni_hash ON personas(dni_hash)",
            "CREATE INDEX IF NOT EXISTS idx_telefono_hash ON personas(telefono_hash)"
        ];

        for (const q of queries) {
            console.log(`Ejecutando: ${q}`);
            try {
                await pool.query(q);
            } catch (e) {
                if (!e.message.includes("Duplicate column") && !e.message.includes("Duplicate key")) {
                    throw e;
                }
            }
        }

        console.log("Migración de personas completada.");
        process.exit(0);
    } catch (err) {
        console.error("Error en migración:", err);
        process.exit(1);
    }
}

migratePersonasForEncryption();
