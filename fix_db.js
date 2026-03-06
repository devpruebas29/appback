const { pool } = require("./src/config/database");

async function fixConstraint() {
    try {
        console.log("Iniciando corrección de restricción única...");

        // 1. Eliminar la restricción antigua que es demasiado restrictiva
        try {
            await pool.query("ALTER TABLE asignaciones DROP INDEX uk_curso_grado;");
            console.log("- Restricción antigua 'uk_curso_grado' eliminada.");
        } catch (e) {
            console.log("- No se pudo eliminar 'uk_curso_grado' (tal vez no existe o ya fue eliminada).");
        }

        // 2. Agregar la nueva restricción que incluye el periodo
        // Nota: Usamos una restricción que incluya curso, grado, periodo y sección para permitir flexibilidad total
        await pool.query("ALTER TABLE asignaciones ADD UNIQUE KEY uk_asignacion_periodo (id_curso, id_grado, id_periodo, id_seccion);");
        console.log("- Nueva restricción 'uk_asignacion_periodo' (curso, grado, periodo, sección) creada con éxito.");

        process.exit(0);
    } catch (error) {
        console.error("Error al corregir la restricción:", error);
        process.exit(1);
    }
}

fixConstraint();
