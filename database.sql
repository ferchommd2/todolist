-- ============================================================
--  Sistema de Gestión de Tareas — To-Do List
--  Base de Datos Avanzadas | UPA TIID05D
--  Integrantes:
--    Fernando Michelle Martínez Díaz  UP240793
--    Baruch Hernández Montes          UP240947
--    Diego Calva Álvarez              UP240133
-- ============================================================

CREATE DATABASE IF NOT EXISTS todolist_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE todolist_db;

-- ============================================================
--  TABLAS
-- ============================================================

-- Tabla 1: categories
-- Almacena las categorías que se pueden asignar a las tareas.
-- Cada categoría tiene un nombre único y un color (en formato HEX).

CREATE TABLE IF NOT EXISTS categories (
  id    INT         NOT NULL AUTO_INCREMENT,
  name  VARCHAR(80) NOT NULL,
  color VARCHAR(7)  NOT NULL DEFAULT '#3498db',
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE = InnoDB;

-- ------------------------------------------------------------

-- Tabla 2: tasks
-- Almacena las tareas del sistema.
-- Cada tarea puede pertenecer a una categoría (opcional).
-- Si se elimina la categoría, el campo category_id queda en NULL (SET NULL).

CREATE TABLE IF NOT EXISTS tasks (
  id          INT                                  NOT NULL AUTO_INCREMENT,
  title       VARCHAR(200)                         NOT NULL,
  description TEXT                                 NULL,
  status      ENUM('pending','in_progress','done') NOT NULL DEFAULT 'pending',
  due_date    DATE                                 NULL,
  created_at  DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  category_id INT                                  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_tasks_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB;

-- ============================================================
--  DATOS DE PRUEBA
-- ============================================================

INSERT INTO categories (name, color) VALUES
  ('Trabajo',  '#e74c3c'),
  ('Estudio',  '#3498db'),
  ('Personal', '#2ecc71'),
  ('Urgente',  '#f39c12');

INSERT INTO tasks (title, description, status, due_date, category_id) VALUES
  ('Entregar proyecto de BD',       'Subir al portal el PDF y el código fuente', 'in_progress', '2025-12-15', 2),
  ('Comprar despensa',               NULL,                                         'pending',     '2025-12-10', 3),
  ('Estudiar para examen',           'Repasar temas del parcial 3',                'pending',     '2025-12-12', 2),
  ('Llamar al médico',               'Agendar cita de revisión general',           'done',        NULL,         3),
  ('Revisar correos del trabajo',    NULL,                                          'pending',     NULL,         1),
  ('Pagar renta',                    'Transferencia antes del día 5',              'pending',     '2025-12-05', 4),
  ('Preparar presentación',          'Diapositivas para el proyecto final',        'in_progress', '2025-12-20', 2),
  ('Limpiar cuarto',                 NULL,                                          'done',        NULL,         3);
