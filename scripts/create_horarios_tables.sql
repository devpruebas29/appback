-- Nuevas tablas para control por bloques (sin romper asistencia diaria)

CREATE TABLE IF NOT EXISTS horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_asignacion INT NOT NULL,
  dia_semana ENUM('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo') NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  aula VARCHAR(100) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_horarios_asignacion FOREIGN KEY (id_asignacion) REFERENCES asignaciones(id) ON DELETE CASCADE,
  CONSTRAINT chk_horarios_rango CHECK (hora_inicio < hora_fin),
  UNIQUE KEY uk_horario_bloque (id_asignacion, dia_semana, hora_inicio, hora_fin),
  INDEX idx_horarios_asignacion_dia (id_asignacion, dia_semana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS asistencia_horario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_horario INT NOT NULL,
  id_alumno INT NOT NULL,
  fecha DATE NOT NULL,
  estado ENUM('Presente','Ausente','Tardanza','Justificado') NOT NULL,
  observacion TEXT NULL,
  registrado_por INT NULL,
  id_asistencia INT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_asistencia_horario_horario FOREIGN KEY (id_horario) REFERENCES horarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_asistencia_horario_alumno FOREIGN KEY (id_alumno) REFERENCES alumnos(id) ON DELETE CASCADE,
  CONSTRAINT fk_asistencia_horario_usuario FOREIGN KEY (registrado_por) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_asistencia_horario_asistencia FOREIGN KEY (id_asistencia) REFERENCES asistencia(id) ON DELETE SET NULL,
  UNIQUE KEY uk_asistencia_horario (id_horario, id_alumno, fecha),
  INDEX idx_asistencia_horario_alumno_fecha (id_alumno, fecha),
  INDEX idx_asistencia_horario_asistencia (id_asistencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
