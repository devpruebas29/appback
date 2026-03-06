-- Database: db_crayons
-- Normalized Schema (3NF)

-- 1. Table: personas
CREATE TABLE IF NOT EXISTS `personas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dni` VARCHAR(20) UNIQUE NOT NULL,
  `nombres` VARCHAR(100) NOT NULL,
  `apellido_paterno` VARCHAR(100) NOT NULL,
  `apellido_materno` VARCHAR(100) NOT NULL,
  `fecha_nacimiento` DATE NOT NULL,
  `email` VARCHAR(150),
  `telefono` VARCHAR(20),
  `direccion` TEXT,
  `sexo` ENUM('M', 'F', 'Otro'),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table: roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(50) UNIQUE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_persona` INT NOT NULL,
  `id_rol` INT NOT NULL,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `cambiar_password` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_persona`) REFERENCES `personas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table: alumnos
CREATE TABLE IF NOT EXISTS `alumnos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_persona` INT NOT NULL UNIQUE,
  `codigo_alumno` VARCHAR(50) UNIQUE NOT NULL,
  `religion` VARCHAR(100),
  `lengua_materna` VARCHAR(100),
  `tipo_ingreso` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_persona`) REFERENCES `personas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Table: apoderados
CREATE TABLE IF NOT EXISTS `apoderados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_persona` INT NOT NULL UNIQUE,
  `ocupacion` VARCHAR(150),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_persona`) REFERENCES `personas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Table: alumno_apoderado (N:M relationship)
CREATE TABLE IF NOT EXISTS `alumno_apoderado` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_alumno` INT NOT NULL,
  `id_apoderado` INT NOT NULL,
  `parentesco` ENUM('Padre', 'Madre', 'Tutor', 'Otros') DEFAULT 'Padre',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(`id_alumno`, `id_apoderado`),
  FOREIGN KEY (`id_alumno`) REFERENCES `alumnos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_apoderado`) REFERENCES `apoderados`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Table: docentes
CREATE TABLE IF NOT EXISTS `docentes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_persona` INT NOT NULL UNIQUE,
  `codigo_docente` VARCHAR(50) UNIQUE NOT NULL,
  `especialidad` VARCHAR(150),
  `grado_academico` VARCHAR(150),
  `fecha_ingreso` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_persona`) REFERENCES `personas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Table: periodos_academicos
CREATE TABLE IF NOT EXISTS `periodos_academicos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `anio` INT NOT NULL UNIQUE,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `costo_matricula` DECIMAL(10, 2) NOT NULL,
  `costo_cuota_mensual` DECIMAL(10, 2) NOT NULL,
  `numero_cuotas` INT NOT NULL,
  `activo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Table: grados
CREATE TABLE IF NOT EXISTS `grados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Table: secciones
CREATE TABLE IF NOT EXISTS `secciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(10) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Table: cursos
CREATE TABLE IF NOT EXISTS `cursos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Table: matriculas
CREATE TABLE IF NOT EXISTS `matriculas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_alumno` INT NOT NULL,
  `id_grado` INT NOT NULL,
  `id_seccion` INT NOT NULL,
  `id_periodo` INT NOT NULL,
  `fecha_matricula` DATE NOT NULL,
  `dni_entregado` BOOLEAN DEFAULT FALSE,
  `certificado_estudios` BOOLEAN DEFAULT FALSE,
  `partida_nacimiento` BOOLEAN DEFAULT FALSE,
  `fotos` BOOLEAN DEFAULT FALSE,
  `estado` ENUM('Pendiente', 'Activa', 'Inactiva', 'Retirado') DEFAULT 'Pendiente',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(`id_alumno`, `id_periodo`),
  FOREIGN KEY (`id_alumno`) REFERENCES `alumnos`(`id`),
  FOREIGN KEY (`id_grado`) REFERENCES `grados`(`id`),
  FOREIGN KEY (`id_seccion`) REFERENCES `secciones`(`id`),
  FOREIGN KEY (`id_periodo`) REFERENCES `periodos_academicos`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Table: asignaciones (Docente - Curso - Grado - Seccion)
CREATE TABLE IF NOT EXISTS `asignaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_docente` INT NOT NULL,
  `id_curso` INT NOT NULL,
  `id_grado` INT NOT NULL,
  `id_seccion` INT NOT NULL,
  `id_periodo` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(`id_docente`, `id_curso`, `id_grado`, `id_seccion`, `id_periodo`),
  FOREIGN KEY (`id_docente`) REFERENCES `docentes`(`id`),
  FOREIGN KEY (`id_curso`) REFERENCES `cursos`(`id`),
  FOREIGN KEY (`id_grado`) REFERENCES `grados`(`id`),
  FOREIGN KEY (`id_seccion`) REFERENCES `secciones`(`id`),
  FOREIGN KEY (`id_periodo`) REFERENCES `periodos_academicos`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Table: asistencia
CREATE TABLE IF NOT EXISTS `asistencia` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_alumno` INT NOT NULL,
  `id_asignacion` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `asistio` BOOLEAN DEFAULT TRUE,
  `observacion` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(`id_alumno`, `id_asignacion`, `fecha`),
  FOREIGN KEY (`id_alumno`) REFERENCES `alumnos`(`id`),
  FOREIGN KEY (`id_asignacion`) REFERENCES `asignaciones`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Table: cuotas
CREATE TABLE IF NOT EXISTS `cuotas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_matricula` INT NOT NULL,
  `tipo` ENUM('Matricula', 'Mensualidad', 'Otros') NOT NULL,
  `numero_cuota` INT DEFAULT 0,
  `monto` DECIMAL(10, 2) NOT NULL,
  `monto_pagado` DECIMAL(10, 2) DEFAULT 0.00,
  `fecha_vencimiento` DATE NOT NULL,
  `fecha_pago` DATE,
  `metodo_pago` VARCHAR(50),
  `numero_recibo` VARCHAR(50),
  `estado` ENUM('Pendiente', 'Pagada', 'Vencida', 'Anulada') DEFAULT 'Pendiente',
  `observaciones` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_matricula`) REFERENCES `matriculas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Table: justificaciones
CREATE TABLE IF NOT EXISTS `justificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_matricula` INT NOT NULL,
  `id_docente` INT,
  `titulo` VARCHAR(255) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `tipo` VARCHAR(100),
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `url_documento` TEXT,
  `cloudinary_public_id` VARCHAR(255),
  `estado` ENUM('Pendiente', 'Aprobada', 'Rechazada') DEFAULT 'Pendiente',
  `comentario_revision` TEXT,
  `fecha_revision` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_matricula`) REFERENCES `matriculas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_docente`) REFERENCES `docentes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Seed Roles for Initial Setup
INSERT IGNORE INTO `roles` (`nombre`) VALUES ('Administrador'), ('Docente'), ('Alumno'), ('Apoderado');
