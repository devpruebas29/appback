const express = require("express");
const router = express.Router();
const PromocionController = require("../controllers/promocionController");

// A. Listar Alumnos y su estado de deuda/switch (Front-End Dashboard)
router.get("/alumnos-estado", PromocionController.listarAlumnosEstado);

// B. Toggle Switch "puede_promover" (Individual)
router.patch("/matricula/:matriculaId/toggle-promocion", PromocionController.togglePromocion);

// C. El Botón Mágico (Proceso Masivo Automático)
router.post("/procesar-masivo", PromocionController.procesarPromocionMasiva);

// D. Gestión de Períodos
router.get("/periodos", PromocionController.listarPeriodos);
router.patch("/periodos/:id/cerrar", PromocionController.cerrarPeriodo);

// E. Estadísticas para el Dashboard
router.get("/estadisticas/:periodId", PromocionController.obtenerEstadisticas);

module.exports = router;
