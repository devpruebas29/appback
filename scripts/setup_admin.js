require('dotenv').config();
const { pool, withTransaction } = require('../src/config/database');
const Persona = require('../src/models/Persona');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

/**
 * SCRIPT DE CONFIGURACIÓN INICIAL DEL DIRECTOR (ADMIN)
 * 
 * Este script garantiza que el primer administrador sea creado con todas
 * las medidas de seguridad activas (contraseña hasheada y PII encriptado).
 */
async function setupAdmin() {
    console.log('--- Iniciando configuración de Administrador ---');

    try {
        await withTransaction(async (connection) => {
            // 1. Verificar si YA existe un Administrador (Rol 1)
            const [existingAdmins] = await connection.query(
                "SELECT id FROM users WHERE id_rol = 1"
            );

            if (existingAdmins.length > 0) {
                console.error('⚠️ ERROR: Ya existe un Administrador en el sistema. Por seguridad, no se creará otro por este medio.');
                process.exit(0);
            }

            // --- CONFIGURA LOS DATOS DEL DIRECTOR AQUÍ ---
            const adminData = {
                dni: "12345678",               // DNI Real (se encriptará)
                nombres: "Wilmer",
                apellido_paterno: "Espinal",
                apellido_materno: "Villa",
                fecha_nacimiento: "1990-01-01",
                email: "admin@colegio.edu.pe",
                username: "admin",    // Tu usuario para Postman/Web
                password: "Password123",      // Tu contraseña (se hasheará)
                telefono: "987654321",
                direccion: "Sede Central Colegio"
            };

            console.log(`Registrando a: ${adminData.nombres} ${adminData.apellido_paterno}...`);

            // 2. Crear Registro de Persona (Aplica encriptación AES-256)
            const personaId = await Persona.crear(
                connection,
                adminData.dni,
                adminData.nombres,
                adminData.apellido_paterno,
                adminData.apellido_materno,
                adminData.fecha_nacimiento,
                adminData.email,
                adminData.telefono,
                adminData.direccion,
                'M' // Sexo
            );

            // 3. Crear Registro de Usuario (Aplica hashing Bcrypt)
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(adminData.password, salt);

            await User.crear(connection, {
                id_persona: personaId,
                username: adminData.username,
                email: adminData.email,
                password: hashedPassword,
                id_rol: 1 // ROL DIRECTOR
            });

            console.log('✅ ÉXITO: Administrador registrado correctamente.');
            console.log(`USUARIO: ${adminData.username}`);
            console.log(`PASSWORD: ${adminData.password}`);
            console.log('------------------------------------------------');
        });
    } catch (error) {
        console.error('❌ ERROR CRÍTICO:', error.message);
    } finally {
        await pool.end();
    }
}

setupAdmin();
