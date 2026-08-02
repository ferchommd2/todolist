# Sistema de Gestión de Tareas — To-Do List
## Presentación del Proyecto

**Materia:** Base de Datos Avanzadas  
**Grupo:** TIID05D  
**Institución:** Universidad Politécnica de Aguascalientes  

**Integrantes:**
| Nombre | Matrícula |
|--------|-----------|
| Fernando Michelle Martínez Díaz | UP240793 |
| Baruch Hernández Montes | UP240947 |
| Diego Calva Álvarez | UP240133 |

---

## ¿Qué es el proyecto?

**To-Do List** es una API REST para gestionar tareas del día a día, organizadas por categorías. Permite crear, consultar, actualizar y eliminar tanto tareas como categorías mediante peticiones HTTP.

La aplicación demuestra el uso de una base de datos relacional MySQL integrada con un servidor moderno en Node.js usando el framework NestJS.

---

## Objetivo

Construir una API funcional que aplique los conceptos de Bases de Datos Avanzadas:
- Diseño de esquema relacional con llaves primarias y foráneas
- Consultas SQL con `JOIN`, filtros y parámetros preparados
- Gestión de integridad referencial (`ON DELETE SET NULL`, `ON UPDATE CASCADE`)
- Tipos de datos especializados (`ENUM`, `DATE`, `DATETIME`, `TEXT`)

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│           CLIENTE (Navegador/Postman)   │
│         Envía peticiones HTTP           │
└──────────────────────┬──────────────────┘
                       │ HTTP Request
                       ▼
┌─────────────────────────────────────────┐
│         SERVIDOR — NestJS (Puerto 3000) │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │        CategoriesModule         │    │
│  │  GET/POST/PATCH/DELETE          │    │
│  │  /categories                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │           TasksModule           │    │
│  │  GET/POST/PATCH/DELETE          │    │
│  │  /tasks                         │    │
│  └─────────────────────────────────┘    │
└──────────────────────┬──────────────────┘
                       │ Consultas SQL (mysql2)
                       ▼
┌─────────────────────────────────────────┐
│         BASE DE DATOS — MySQL           │
│                                         │
│  ┌────────────┐    ┌─────────────────┐  │
│  │ categories │◄───│ tasks           │  │
│  │            │    │ (category_id FK)│  │
│  └────────────┘    └─────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Modelo de Datos

### Tabla `categories`

Almacena las categorías que el usuario puede asignar a sus tareas.

```
┌──────────────────────────────────┐
│           categories             │
├──────────────────────────────────┤
│ id    INT          PK AUTO       │
│ name  VARCHAR(80)  NOT NULL UNIK │
│ color VARCHAR(7)   DEFAULT #blue │
└──────────────────────────────────┘
```

**Ejemplo de datos:**

| id | name     | color   |
|----|----------|---------|
| 1  | Trabajo  | #e74c3c |
| 2  | Estudio  | #3498db |
| 3  | Personal | #2ecc71 |
| 4  | Urgente  | #f39c12 |

---

### Tabla `tasks`

Almacena las tareas. Se relaciona con `categories` mediante una llave foránea.

```
┌──────────────────────────────────────┐
│                tasks                 │
├──────────────────────────────────────┤
│ id          INT       PK AUTO        │
│ title       VARCHAR   NOT NULL       │
│ description TEXT      NULL           │
│ status      ENUM      DEFAULT pending│
│ due_date    DATE      NULL           │
│ created_at  DATETIME  AUTO NOW       │
│ category_id INT       FK → categ.id  │
└──────────────────────────────────────┘
```

**El campo `status` acepta exactamente 3 valores:**

| Valor       | Significado     |
|-------------|-----------------|
| pending     | Pendiente       |
| in_progress | En progreso     |
| done        | Completada      |

**Ejemplo de datos:**

| id | title                    | status      | due_date   | category_id |
|----|--------------------------|-------------|------------|-------------|
| 1  | Entregar proyecto de BD  | in_progress | 2025-12-15 | 2 (Estudio) |
| 2  | Comprar despensa         | pending     | 2025-12-10 | 3 (Personal)|
| 3  | Estudiar para examen     | pending     | 2025-12-12 | 2 (Estudio) |
| 4  | Llamar al médico         | done        | NULL       | 3 (Personal)|

---

## Relación entre tablas

```
categories ──< tasks
(uno a muchos)
```

- Una **categoría** puede tener **muchas tareas**.
- Una **tarea** puede tener **una sola categoría** (o ninguna).
- Si se elimina una categoría, las tareas que la usaban **no se borran**; su `category_id` queda en `NULL`.

Esto se define en SQL así:

```sql
CONSTRAINT fk_tasks_category
  FOREIGN KEY (category_id) REFERENCES categories(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE
```

---

## Endpoints disponibles

### Categorías (`/categories`)

| Operación | Método | URL              | Body requerido          |
|-----------|--------|------------------|-------------------------|
| Ver todas | GET    | /categories      | —                       |
| Ver una   | GET    | /categories/:id  | —                       |
| Crear     | POST   | /categories      | `{ name, color? }`      |
| Actualizar| PATCH  | /categories/:id  | `{ name?, color? }`     |
| Eliminar  | DELETE | /categories/:id  | —                       |

### Tareas (`/tasks`)

| Operación       | Método | URL                       | Body requerido                              |
|-----------------|--------|---------------------------|---------------------------------------------|
| Ver todas       | GET    | /tasks                    | —                                           |
| Filtrar estado  | GET    | /tasks/status/:status     | —                                           |
| Ver una         | GET    | /tasks/:id                | —                                           |
| Crear           | POST   | /tasks                    | `{ title, description?, status?, due_date?, category_id? }` |
| Actualizar      | PATCH  | /tasks/:id                | `{ title?, description?, status?, due_date?, category_id? }` |
| Eliminar        | DELETE | /tasks/:id                | —                                           |

---

## Respuesta de ejemplo

### `GET /tasks` — Lista de tareas con categoría

```json
[
  {
    "id": 1,
    "title": "Entregar proyecto de BD",
    "description": "Subir al portal el PDF y el código fuente",
    "status": "in_progress",
    "due_date": "2025-12-15",
    "created_at": "2025-12-01T09:00:00.000Z",
    "category_id": 2,
    "category_name": "Estudio",
    "category_color": "#3498db"
  },
  {
    "id": 2,
    "title": "Comprar despensa",
    "description": null,
    "status": "pending",
    "due_date": "2025-12-10",
    "created_at": "2025-12-01T09:00:00.000Z",
    "category_id": 3,
    "category_name": "Personal",
    "category_color": "#2ecc71"
  }
]
```

Nota: La respuesta incluye `category_name` y `category_color` gracias al `JOIN` en la consulta SQL.

---

## Consulta SQL destacada — JOIN

Esta consulta muestra una característica clave del proyecto: usar `LEFT JOIN` para combinar datos de dos tablas en una sola respuesta.

```sql
SELECT
  t.*,
  c.name  AS category_name,
  c.color AS category_color
FROM tasks t
LEFT JOIN categories c ON t.category_id = c.id
```

**¿Por qué `LEFT JOIN` y no `INNER JOIN`?**  
Porque una tarea puede no tener categoría (`category_id = NULL`). Con `INNER JOIN` esa tarea desaparecería del resultado. Con `LEFT JOIN` la tarea aparece de todas formas, con los campos de categoría en `NULL`.

---

## Tecnologías del Stack

| Tecnología | Versión | Rol                                      |
|------------|---------|------------------------------------------|
| Node.js    | 18+     | Entorno de ejecución del servidor        |
| NestJS     | 10+     | Framework para construir la API REST     |
| TypeScript | 5+      | Lenguaje tipado sobre JavaScript         |
| MySQL      | 8+      | Sistema manejador de base de datos       |
| mysql2     | 3+      | Driver para conectar Node.js con MySQL   |

---

## Instrucciones para correr el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Crear la base de datos (ejecutar en MySQL)
#    Abrir el archivo database.sql y ejecutarlo en tu cliente MySQL

# 3. Iniciar el servidor
npm run start:dev

# El servidor corre en: http://localhost:3000
```

---

## Conclusión

Este proyecto aplica de manera práctica los conceptos fundamentales de bases de datos relacionales:

- **Diseño de esquema**: dos tablas normalizadas con relación uno-a-muchos
- **Integridad referencial**: llave foránea con comportamiento controlado al eliminar
- **Consultas avanzadas**: `JOIN`, `WHERE`, `ENUM`, parámetros preparados
- **API REST**: operaciones CRUD completas sobre cada entidad
- **Arquitectura modular**: cada entidad tiene su propio módulo aislado en NestJS
