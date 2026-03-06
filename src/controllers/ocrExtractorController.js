require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');

// Configuración de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * CONVIERTE PDF A IMÁGENES (Optimizado para evitar el error de fuentes)
 */
async function convertirPDFaImagenes(pdfBuffer) {
    try {
        console.log("📄 Convirtiendo PDF a imágenes de alta calidad...");

        const uint8Array = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            useSystemFonts: false, // Forzamos el uso de fuentes del PDF
            disableFontFace: false, // Permitimos cargar fuentes del documento
            verbosity: 0 // Silenciar warnings innecesarios
        });

        const pdf = await loadingTask.promise;
        const imageBuffers = [];
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);

            // Usamos un factor de escala de 2.5 para mucha mejor nitidez
            const viewport = page.getViewport({ scale: 2.5 });

            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            // Aseguramos que el fondo sea blanco (importante para la IA)
            context.fillStyle = "white";
            context.fillRect(0, 0, viewport.width, viewport.height);

            // Renderizar con configuración de alta calidad
            const renderTask = page.render({
                canvasContext: context,
                viewport: viewport,
                intent: 'print' // Modo impresión para mejor detalle
            });

            await renderTask.promise;

            const buffer = canvas.toBuffer('image/png');
            imageBuffers.push(buffer);
            console.log(`✅ Página ${i} procesada y nítida`);
        }

        console.log(`📸 Total procesado: ${imageBuffers.length} páginas`);
        return imageBuffers;

    } catch (error) {
        console.error("❌ Fallo en conversión visual:", error);
        throw error;
    }
}

async function interpretarFichaConImagenes(imageBuffers) {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    console.log("🤖 Analizando imágenes con Gemini 1.5 Flash (Visión)...");

    const imageParts = imageBuffers.map(buffer => ({
        inlineData: {
            data: buffer.toString('base64'),
            mimeType: 'image/png'
        }
    }));

    const prompt = `
Analiza esta FICHA ÚNICA DE MATRÍCULA y extrae los datos estrictamente en el siguiente formato JSON para registrar la matrícula directamente:

{
  "estudiante": {
    "dni": "",
    "nombres": "",
    "apellido_paterno": "",
    "apellido_materno": "",
    "fecha_nacimiento": "YYYY-MM-DD",
    "email": "",
    "sexo": "M/F",
    "lengua_materna": "",
    "tipo_ingreso": "Regular",
    "religion": "",
    "telefono": "",
    "direccion": "",
    "id_grado": 1
  },
  "padre": {
    "dni": "",
    "nombres": "",
    "apellido_paterno": "",
    "apellido_materno": "",
    "fecha_nacimiento": "YYYY-MM-DD",
    "telefono": "",
    "ocupacion": ""
  },
  "madre": {
    "dni": "",
    "nombres": "",
    "apellido_paterno": "",
    "apellido_materno": "",
    "fecha_nacimiento": "YYYY-MM-DD",
    "telefono": "",
    "ocupacion": ""
  },
  "economica": {
    "precio_matricula": 0.0,
    "costo_cuota_mensual": 0.0
  },
  "documentos": {
    "dni_entregado": true,
    "certificado_estudios": true,
    "partida_nacimiento": false
  }
}

Importante: 
1. No incluyas el campo 'email' en los objetos 'padre' o 'madre'.
2. El campo 'id_grado' debe ser un número entero (ej. 1 para primer grado, 2 para segundo, etc.).
3. Si algún dato no es visible, deja el campo como string vacío o null según corresponda.
`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response.text();
    const jsonString = response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
}

exports.extraerDatosFicha = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se subió archivo" });

        const pdfBuffer = req.file.buffer || fs.readFileSync(req.file.path);

        // 1. Convertir a fotos (Pure JS, alta calidad)
        const imageBuffers = await convertirPDFaImagenes(pdfBuffer);

        // 2. Analizar con Gemini
        const datos = await interpretarFichaConImagenes(imageBuffers);

        res.json({ success: true, datos });

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * ENVIAR A n8n Y OBTENER RESULTADO
 */
exports.extraerConN8N = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No se subió archivo" });

        const axios = require('axios');
        const FormData = require('form-data');

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        console.log("📤 Enviando a n8n (Modo Test)...");
        const response = await axios.post('https://n8n-production-1089.up.railway.app/webhook/upload-pdf', formData, {
            headers: { ...formData.getHeaders() }
        });

        // n8n suele devolver un array. Tomamos el primer elemento para que el JSON sea directo.
        const output = Array.isArray(response.data) ? response.data[0] : response.data;

        res.json({ success: true, datos: output });

    } catch (error) {
        console.error("❌ Error en n8n:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: "Error al procesar con n8n" });
    }
};