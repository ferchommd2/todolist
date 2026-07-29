-- ============================================================
-- Sistema de Gestión de Tareas — To-Do List
-- Base de Datos Avanzadas | UPA TIID05D
-- ============================================================

CREATE DATABASE IF NOT EXISTS todolist_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE todolist_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id         INT           NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id    INT         NOT NULL AUTO_INCREMENT,
  name  VARCHAR(80) NOT NULL,
  color VARCHAR(7)  NOT NULL DEFAULT '#3498db',
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB;

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
  id           INT                                   NOT NULL AUTO_INCREMENT,
  title        VARCHAR(200)                          NOT NULL,
  description  TEXT                                  NULL,
  status       ENUM('pending','in_progress','done')  NOT NULL DEFAULT 'pending',
  due_date     DATE                                  NULL,
  created_at   DATETIME                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id      INT                                   NOT NULL,
  category_id  INT                                   NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_tasks_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tasks_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Datos de prueba
-- ============================================================
INSERT INTO users (name, email) VALUES
  ('Fernando Martínez', 'fernando@email.com'),
  ('Baruch Hernández',  'baruch@email.com'),
  ('Diego Calva',       'diego@email.com');

INSERT INTO categories (name, color) VALUES
  ('Trabajo',  '#e74c3c'),
  ('Estudio',  '#3498db'),
  ('Personal', '#2ecc71'),
  ('Urgente',  '#f39c12');

INSERT INTO tasks (title, description, status, due_date, user_id, category_id) VALUES
  ('Entregar proyecto de BD', 'Subir al portal el PDF y el código', 'in_progress', '2025-12-15', 1, 2),
  ('Comprar despensa',        NULL,                                  'pending',     '2025-12-10', 1, 3),
  ('Estudiar para examen',    'Repasar temas del parcial 3',         'pending',     '2025-12-12', 2, 2),
  ('Llamar al médico',        'Agendar cita de revisión',            'done',        NULL,         2, 3),
  ('Revisar correos',         NULL,                                  'pending',     NULL,         3, 1);
