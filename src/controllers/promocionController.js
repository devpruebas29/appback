const { withTransaction, pool } = require("../config/database");

class PromocionController {
    // A. Listado de Períodos
    static async listarPeriodos(req, res) {
        try {
            const [rows] = await pool.query("SELECT * FROM periodos_academicos ORDER BY anio DESC");
            return res.status(200).json({ status: true, data: rows });
        } catch (error) {
            console.error("Error al listar períodos:", error);
            return res.status(500).json({ status: false, message: "Error al listar períodos" });
        }
    }

    // B. Cerrar Período
    static async cerrarPeriodo(req, res) {
        try {
            const { id } = req.params;
            await pool.query("UPDATE periodos_academicos SET estado = 'Cerrado', activo = 0 WHERE id = ?", [id]);
            return res.status(200).json({ status: true, message: "Período cerrado correctamente. Se ha habilitado la promoción masiva." });
        } catch (error) {
            console.error("Error al cerrar período:", error);
            return res.status(500).json({ status: false, message: "Error al cerrar período" });
        }
    }

    // C. Listar Alumnos y Estado (GET /alumnos-estado)
    static async listarAlumnosEstado(req, res) {
        try {
            const { periodId, gradoId } = req.query;

            if (!periodId || !gradoId) {
                return res.status(400).json({ status: false, message: "Faltan parámetros periodId o gradoId" });
            }

            const query = `
        SELECT 
          m.id as id_matricula,
          a.id as id_alumno,
          p.dni,
          CONCAT(p.apellido_paterno, ' ', p.apellido_materno, ', ', p.nombres) as nombre_completo,
          m.puede_promover,
          m.estado as estado_matricula,
          EXISTS (
            SELECT 1 FROM cuotas c 
            WHERE c.id_matricula = m.id AND c.estado != 'Pagada'
          ) as hasDebt
        FROM matriculas m
        JOIN alumnos a ON m.id_alumno = a.id
        JOIN personas p ON a.id_persona = p.id
        WHERE m.id_periodo = ? AND m.id_grado = ?
      `;

            const [rows] = await pool.query(query, [periodId, gradoId]);
            return res.status(200).json({ status: true, data: rows });
        } catch (error) {
            console.error("Error al listar alumnos y estado:", error);
            return res.status(500).json({ status: false, message: "Error al listar alumnos y estado" });
        }
    }

    // D. Actualizar Switch de Promoción (Individual)
    static async togglePromocion(req, res) {
        try {
            const { matriculaId } = req.params;
            const { puede_promover } = req.body; // 0 o 1

            await pool.query("UPDATE matriculas SET puede_promover = ? WHERE id = ?", [puede_promover, matriculaId]);

            return res.status(200).json({ status: true, message: "Permiso de promoción actualizado" });
        } catch (error) {
            console.error("Error al actualizar permiso:", error);
            return res.status(500).json({ status: false, message: "Error al actualizar permiso" });
        }
    }

    // E. EL PROCESO MASIVO (POST /procesar-masivo) -> EL MÁS IMPORTANTE
    static async procesarPromocionMasiva(req, res) {
        try {
            const { periodIdActual, periodIdSiguiente } = req.body;

            if (!periodIdActual || !periodIdSiguiente) {
                return res.status(400).json({ status: false, message: "Faltan IDs de periodo actual y destino" });
            }

            // Validar periodo destino
            const [nextPeriodRows] = await pool.query("SELECT * FROM periodos_academicos WHERE id = ? AND estado = 'Abierto'", [periodIdSiguiente]);
            if (nextPeriodRows.length === 0) {
                return res.status(400).json({ status: false, message: "El periodo de destino no existe o no está abierto para matrículas" });
            }
            const nextPeriod = nextPeriodRows[0];

            const resultado = await withTransaction(async (connection) => {
                // 1. Identificar Candidatos: periodo actual, puede_promover=1, estado='Activo'
                const queryCandidatos = `
          SELECT m.id as id_matricula_actual, m.id_alumno, m.id_grado, g.numero_grado
          FROM matriculas m
          JOIN grados g ON m.id_grado = g.id
          WHERE m.id_periodo = ? AND m.puede_promover = 1 AND m.estado = 'Activo'
          -- Evitar duplicados en el destino
          AND NOT EXISTS (
            SELECT 1 FROM matriculas m2 
            WHERE m2.id_alumno = m.id_alumno AND m2.id_periodo = ?
          )
        `;

                const [candidatos] = await connection.query(queryCandidatos, [periodIdActual, periodIdSiguiente]);

                const summary = {
                    encontrados: candidatos.length,
                    promovidos: 0,
                    errores: 0,
                    detalles: []
                };

                for (const candidato of candidatos) {
                    try {
                        // 2. Calcular Siguiente Grado (numero_grado + 1)
                        const [nextGradeRows] = await connection.query(
                            "SELECT id, nombre FROM grados WHERE numero_grado = ?",
                            [candidato.numero_grado + 1]
                        );

                        if (nextGradeRows.length === 0) {
                            // Si no hay grado siguiente, podría ser egresado
                            await connection.execute(
                                "UPDATE matriculas SET estado = 'Promovido' WHERE id = ?",
                                [candidato.id_matricula_actual]
                            );
                            await connection.execute(
                                "UPDATE alumnos SET estado = 'Egresado' WHERE id = ?",
                                [candidato.id_alumno]
                            );
                            summary.promovidos++;
                            continue;
                        }

                        const nextGrade = nextGradeRows[0];

                        // 3. Crear Nueva Matrícula
                        const [newMatResult] = await connection.execute(
                            `INSERT INTO matriculas (id_alumno, id_grado, id_periodo, fecha_matricula, estado, puede_promover) 
               VALUES (?, ?, ?, CURDATE(), 'Activo', 1)`,
                            [candidato.id_alumno, nextGrade.id, periodIdSiguiente]
                        );
                        const newMatriculaId = newMatResult.insertId;

                        // 4. Generar 10 Cuotas (y matrícula) automáticamente
                        // Cuota de Matrícula (Cuota 0)
                        if (nextPeriod.costo_matricula > 0) {
                            await connection.execute(
                                "INSERT INTO cuotas (id_matricula, tipo, numero_cuota, monto, fecha_vencimiento, estado) VALUES (?, 'Matricula', 0, ?, CURDATE(), 'Pendiente')",
                                [newMatriculaId, nextPeriod.costo_matricula]
                            );
                        }

                        // 10 Cuotas Mensuales
                        const montoMensual = nextPeriod.costo_cuota_mensual || 0;
                        if (montoMensual > 0) {
                            let mesInicio = 2; // Marzo (mes 2 en JS es Marzo? No, mes 2 es Marzo si 0=Enero)
                            // En el script anterior usamos mesInicio = 2 (Marzo)
                            for (let i = 1; i <= (nextPeriod.numero_cuotas || 10); i++) {
                                let year = nextPeriod.anio;
                                let month = mesInicio + (i - 1);
                                if (month > 11) { year++; month -= 12; }
                                const fechaVenc = new Date(year, month + 1, 0).toISOString().split('T')[0];
                                await connection.execute(
                                    "INSERT INTO cuotas (id_matricula, tipo, numero_cuota, monto, fecha_vencimiento, estado) VALUES (?, 'Cuota', ?, ?, ?, 'Pendiente')",
                                    [newMatriculaId, i, montoMensual, fechaVenc]
                                );
                            }
                        }

                        // 5. Actualizar Origen: Cambiar estado a 'Promovido'
                        await connection.execute(
                            "UPDATE matriculas SET estado = 'Promovido' WHERE id = ?",
                            [candidato.id_matricula_actual]
                        );

                        summary.promovidos++;
                    } catch (err) {
                        summary.errores++;
                        summary.detalles.push({ alumnoId: candidato.id_alumno, error: err.message });
                    }
                }

                return summary;
            });

            return res.status(200).json({ status: true, message: "Proceso de promoción masiva finalizado", data: resultado });
        } catch (error) {
            console.error("Error en proceso masivo:", error);
            return res.status(500).json({ status: false, message: "Error crítico en el proceso de promoción", error: error.message });
        }
    }

    // F. Estadísticas Dashboard (Mantenido)
    static async obtenerEstadisticas(req, res) {
        try {
            const { periodId } = req.params;
            const query = `
        SELECT 
          g.nombre, 
          COUNT(m.id) as total,
          COUNT(CASE WHEN m.estado = 'Promovido' THEN 1 END) as promovidos,
          COUNT(CASE WHEN m.estado = 'Activo' AND m.puede_promover = 0 THEN 1 END) as repitentes_bloqueados
        FROM grados g
        LEFT JOIN matriculas m ON g.id = m.id_grado AND m.id_periodo = ?
        GROUP BY g.id, g.nombre
      `;
            const [rows] = await pool.query(query, [periodId]);
            return res.status(200).json({ status: true, data: rows });
        } catch (error) {
            return res.status(500).json({ status: false, message: "Error al obtener estadísticas" });
        }
    }
}

module.exports = PromocionController;
