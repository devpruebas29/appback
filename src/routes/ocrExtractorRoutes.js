const express = require('express');
const router = express.Router();
const multer = require('multer');
const ocrController = require('../controllers/ocrExtractorController');

// Configuración de Multer (Memoria o Disco)
// Usamos memoria para consistencia, el controller se encarga de guardar temp si es necesario
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF para OCR'));
        }
    }
});

// Rutas
router.post('/extraer-ficha', upload.single('file'), ocrController.extraerDatosFicha);
router.post('/extraer-n8n', upload.single('file'), ocrController.extraerConN8N);

module.exports = router;
