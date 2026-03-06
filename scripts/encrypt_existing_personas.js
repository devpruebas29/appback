const { pool } = require("../src/config/database");
const { encrypt, blindIndex } = require("../src/utils/cryptoUtils");

async function encryptExistingData() {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query("SELECT id, dni, telefono FROM personas WHERE dni_hash IS NULL OR dni_hash = ''");
        console.log(`Cifrando ${rows.length} registros existentes...`);

        for (const row of rows) {
            const encryptedDni = encrypt(row.dni);
            const dniHash = blindIndex(row.dni);
            const encryptedTelefono = row.telefono ? encrypt(row.telefono) : null;
            const telefonoHash = row.telefono ? blindIndex(row.telefono) : null;

            await connection.query(
                "UPDATE personas SET dni = ?, dni_hash = ?, telefono = ?, telefono_hash = ? WHERE id = ?",
                [encryptedDni, dniHash, encryptedTelefono, telefonoHash, row.id]
            );
        }
        console.log("Cifrado de datos existentes completado con éxito.");
        process.exit(0);
    } catch (err) {
        console.error("Error cifrando datos existentes:", err);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}

encryptExistingData();
