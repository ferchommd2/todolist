# Documentación Técnica Completa — To-Do List API

**Materia:** Base de Datos Avanzadas  
**Grupo:** TIID05D  
**Integrantes:**
- Fernando Michelle Martínez Díaz — UP240793
- Baruch Hernández Montes — UP240947
- Diego Calva Álvarez — UP240133

---

## ¿Qué es este proyecto?

Es una **API REST** (una aplicación de servidor) que permite gestionar tareas y categorías. Una API REST es un programa que recibe solicitudes HTTP (como las que hace un navegador o una app) y devuelve datos en formato JSON.

Ejemplo sencillo:
- Tú le preguntas: `GET /tasks` → la API te responde con todas las tareas guardadas en la base de datos.
- Tú le dices: `POST /tasks` con los datos de una tarea → la API la guarda y te regresa la tarea creada.

---

## Tecnologías usadas y por qué

### Node.js
Es el entorno que permite ejecutar JavaScript fuera del navegador, directamente en el servidor. Sin Node.js no podríamos correr nuestro programa.

### NestJS
Es un framework (conjunto de herramientas y reglas) para construir APIs en Node.js de forma organizada. Nos da una estructura clara de carpetas y usa decoradores (`@Get`, `@Post`, etc.) para definir rutas de manera simple.

### TypeScript
Es JavaScript con tipos. En vez de escribir `let nombre = "hola"` y no saber qué tipo de dato es, en TypeScript escribimos `let nombre: string = "hola"`. Esto ayuda a encontrar errores antes de ejecutar el programa.

### MySQL
Es el sistema manejador de base de datos relacional donde guardamos toda la información. Las tablas se relacionan entre sí mediante llaves foráneas.

### mysql2
Es la librería (paquete npm) que le permite a NestJS conectarse y enviar consultas SQL a MySQL desde Node.js.

---

## Estructura de carpetas

```
src/
├── main.ts                        ← Punto de entrada: arranca el servidor
├── app.module.ts                  ← Módulo raíz: registra todos los módulos
├── db.ts                          ← Conexión a la base de datos MySQL
│
├── categories/
│   ├── categories.module.ts       ← Módulo + Controlador de categorías
│   ├── category.entity.ts         ← Tipo TypeScript que representa una categoría
│   └── dto/
│       ├── create-category.dto.ts ← Qué datos se necesitan para crear una categoría
│       └── update-category.dto.ts ← Qué datos se pueden actualizar
│
└── tasks/
    ├── tasks.module.ts            ← Módulo + Controlador de tareas
    ├── task.entity.ts             ← Tipo TypeScript que representa una tarea
    └── dto/
        ├── create-task.dto.ts     ← Qué datos se necesitan para crear una tarea
        └── update-task.dto.ts     ← Qué datos se pueden actualizar
```

---

## Base de datos

### Diagrama de relación

```
┌─────────────────┐          ┌──────────────────────────────────┐
│   categories    │          │              tasks                │
├─────────────────┤          ├──────────────────────────────────┤
│ id (PK)         │◄────────┐│ id (PK)                          │
│ name            │         ││ title                            │
│ color           │         └│ category_id (FK, permite NULL)   │
└─────────────────┘          │ description                      │
                             │ status                           │
                             │ due_date                         │
                             │ created_at                       │
                             └──────────────────────────────────┘
```

Una tarea **puede tener** una categoría (relación opcional: `category_id` puede ser NULL).  
Una categoría **puede tener muchas** tareas.

### Tabla: `categories`

| Columna | Tipo        | Descripción                                  |
|---------|-------------|----------------------------------------------|
| id      | INT (PK)    | Identificador único, se incrementa solo      |
| name    | VARCHAR(80) | Nombre de la categoría. Es ÚNICO (no se repite) |
| color   | VARCHAR(7)  | Color en formato hexadecimal, ej: `#3498db`  |

### Tabla: `tasks`

| Columna     | Tipo                             | Descripción                                               |
|-------------|----------------------------------|-----------------------------------------------------------|
| id          | INT (PK)                         | Identificador único, se incrementa solo                   |
| title       | VARCHAR(200)                     | Título de la tarea. Obligatorio                           |
| description | TEXT                             | Descripción larga. Opcional (puede ser NULL)              |
| status      | ENUM('pending','in_progress','done') | Estado de la tarea. Solo acepta esos 3 valores       |
| due_date    | DATE                             | Fecha límite. Opcional (puede ser NULL)                   |
| created_at  | DATETIME                         | Fecha de creación. Se asigna automáticamente              |
| category_id | INT (FK → categories.id)         | Categoría asignada. Opcional. Si la categoría se borra, queda NULL |

### Llave Foránea (Foreign Key)

```sql
CONSTRAINT fk_tasks_category
  FOREIGN KEY (category_id) REFERENCES categories(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE
```

- `ON DELETE SET NULL`: si borras una categoría, las tareas que la tenían asignada no se borran; su `category_id` simplemente se pone en NULL.
- `ON UPDATE CASCADE`: si cambia el `id` de una categoría (aunque es raro), se actualiza automáticamente en las tareas.

---

## Archivos explicados uno por uno

### `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
```

- Es el **punto de entrada** del programa. Lo primero que se ejecuta.
- `NestFactory.create(AppModule)`: crea la aplicación tomando `AppModule` como módulo raíz.
- `app.enableCors()`: permite que otros dominios (como un frontend en otro puerto) llamen a esta API.
- `app.listen(3000)`: el servidor escucha en el puerto 3000. Para probar: `http://localhost:3000`

---

### `src/db.ts`

```typescript
import { createPool } from 'mysql2/promise';

export const db = createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'todolist_db',
});
```

- Crea un **pool de conexiones** a MySQL. Un pool es un grupo de conexiones reutilizables para no abrir y cerrar una conexión por cada consulta (más eficiente).
- `mysql2/promise`: usamos la versión con promesas para poder usar `async/await`.
- Esta constante `db` es importada por los módulos para ejecutar consultas SQL.

---

### `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [CategoriesModule, TasksModule],
})
export class AppModule {}
```

- Es el **módulo raíz** que une todo.
- `@Module({ imports: [...] })`: le dice a NestJS qué módulos existen en la aplicación.
- Sin registrar aquí un módulo, sus rutas no existirán.

---

### `src/categories/category.entity.ts`

```typescript
export type Category = {
  id: number;
  name: string;
  color: string;
};
```

- Define en TypeScript cómo luce un objeto `Category`.
- Esto no crea nada en la base de datos; solo le dice al editor qué campos tiene una categoría para detectar errores de tipado.

---

### `src/categories/dto/create-category.dto.ts`

```typescript
export class CreateCategoryDto {
  name: string;
  color?: string;
}
```

- **DTO** = Data Transfer Object. Define los datos que esperamos recibir en el body de una petición.
- `name: string` → obligatorio. `color?: string` → opcional (el `?` significa que puede no venir).

---

### `src/categories/categories.module.ts` — El más importante de categorías

Este archivo agrupa en un solo lugar el **Módulo** y el **Controlador** de categorías.

#### ¿Qué es un Controlador?
Es la clase que recibe las peticiones HTTP y devuelve respuestas. Cada método dentro del controlador corresponde a una ruta.

```typescript
@Controller('categories')
class CategoriesController {
  // Todas las rutas comienzan con /categories
}
```

#### Rutas disponibles

| Método HTTP | Ruta              | Qué hace                        |
|-------------|-------------------|---------------------------------|
| GET         | /categories       | Devuelve todas las categorías   |
| GET         | /categories/:id   | Devuelve una categoría por ID   |
| POST        | /categories       | Crea una nueva categoría        |
| PATCH       | /categories/:id   | Actualiza una categoría         |
| DELETE      | /categories/:id   | Elimina una categoría           |

#### Ejemplo de método GET todas:

```typescript
@Get()
async findAll() {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM categories');
  return rows;
}
```

- `@Get()`: este método responde a peticiones GET en `/categories`.
- `db.query(...)`: ejecuta la consulta SQL. Devuelve un array donde el primer elemento `[rows]` son los resultados.
- `return rows`: NestJS convierte automáticamente el array a JSON y lo manda como respuesta.

#### Ejemplo de método POST crear:

```typescript
@Post()
async create(@Body() body: { name: string; color?: string }) {
  const [result] = await db.query<ResultSetHeader>(
    'INSERT INTO categories (name, color) VALUES (?, ?)',
    [body.name, body.color ?? '#3498db'],
  );
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM categories WHERE id = ?', [result.insertId]);
  return rows[0];
}
```

- `@Body()`: extrae el JSON que vino en el cuerpo de la petición.
- `?` en la consulta SQL: son **parámetros preparados**. Evitan SQL Injection porque mysql2 escapa los valores automáticamente.
- `body.color ?? '#3498db'`: si no viene el color, usa `#3498db` como valor por defecto.
- `result.insertId`: el ID que MySQL asignó automáticamente al registro recién insertado.
- Se hace una segunda consulta para devolver el registro completo tal como quedó en la base de datos.

#### Ejemplo de método PATCH actualizar:

```typescript
@Patch(':id')
async update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; color?: string }) {
  if (body.name)  await db.query('UPDATE categories SET name = ? WHERE id = ?',  [body.name, id]);
  if (body.color) await db.query('UPDATE categories SET color = ? WHERE id = ?', [body.color, id]);
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0];
}
```

- `@Param('id', ParseIntPipe)`: extrae `:id` de la URL y lo convierte a número entero. Si no es número, NestJS responde automáticamente con error 400.
- Solo actualiza los campos que vengan en el body (si `name` no viene, no lo toca).

---

### `src/tasks/tasks.module.ts` — El más importante de tareas

#### Rutas disponibles

| Método HTTP | Ruta                 | Qué hace                                   |
|-------------|----------------------|--------------------------------------------|
| GET         | /tasks               | Devuelve todas las tareas con su categoría |
| GET         | /tasks/status/:status| Devuelve tareas filtradas por estado       |
| GET         | /tasks/:id           | Devuelve una tarea por ID                  |
| POST        | /tasks               | Crea una nueva tarea                       |
| PATCH       | /tasks/:id           | Actualiza una tarea                        |
| DELETE      | /tasks/:id           | Elimina una tarea                          |

#### El JOIN en las consultas

```sql
SELECT t.*, c.name AS category_name, c.color AS category_color
FROM tasks t
LEFT JOIN categories c ON t.category_id = c.id
```

- `LEFT JOIN`: trae la tarea junto con su categoría. Si la tarea no tiene categoría (`category_id = NULL`), igual aparece la tarea (con los campos de categoría en NULL).
- `t.*`: todos los campos de la tabla `tasks`.
- `c.name AS category_name`: el nombre de la categoría aparece en el resultado como `category_name`.

#### Filtrar por estado:

```typescript
@Get('status/:status')
async findByStatus(@Param('status') status: string) {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.status = ?
  `, [status]);
  return rows;
}
```

- Ejemplo: `GET /tasks/status/pending` devuelve solo las tareas pendientes.
- Los posibles valores de status son: `pending`, `in_progress`, `done`.

#### Manejo de error 404:

```typescript
if (!rows[0]) throw new NotFoundException('Tarea no encontrada');
```

- Si no hay resultados (el array está vacío), lanzamos un error 404 con el mensaje `Tarea no encontrada`.
- NestJS lo convierte automáticamente a una respuesta HTTP con código 404.

---

## Cómo ejecutar el proyecto

### 1. Requisitos previos

- Node.js instalado (versión 18 o superior)
- MySQL instalado y corriendo en el puerto 3306
- El usuario `root` sin contraseña (o ajustar `src/db.ts`)

### 2. Crear la base de datos

Abre MySQL Workbench o la terminal de MySQL y ejecuta el archivo `database.sql`:

```sql
SOURCE ruta/al/archivo/database.sql;
```

O copia y pega el contenido del archivo en tu cliente MySQL.

### 3. Instalar dependencias

```bash
npm install
```

### 4. Iniciar el servidor

```bash
npm run start:dev
```

El servidor queda corriendo en `http://localhost:3000`

---

## Cómo probar la API (ejemplos con curl)

### Categorías

```bash
# Ver todas las categorías
GET http://localhost:3000/categories

# Ver una categoría específica
GET http://localhost:3000/categories/1

# Crear una categoría
POST http://localhost:3000/categories
Body: { "name": "Hogar", "color": "#9b59b6" }

# Actualizar una categoría
PATCH http://localhost:3000/categories/1
Body: { "color": "#e67e22" }

# Eliminar una categoría
DELETE http://localhost:3000/categories/1
```

### Tareas

```bash
# Ver todas las tareas
GET http://localhost:3000/tasks

# Ver tareas pendientes
GET http://localhost:3000/tasks/status/pending

# Ver tareas en progreso
GET http://localhost:3000/tasks/status/in_progress

# Ver tareas terminadas
GET http://localhost:3000/tasks/status/done

# Ver una tarea específica
GET http://localhost:3000/tasks/1

# Crear una tarea
POST http://localhost:3000/tasks
Body: { "title": "Hacer la tarea", "status": "pending", "category_id": 2 }

# Actualizar el estado de una tarea
PATCH http://localhost:3000/tasks/1
Body: { "status": "done" }

# Eliminar una tarea
DELETE http://localhost:3000/tasks/1
```

---

## Conceptos clave de base de datos usados

### AUTO_INCREMENT
MySQL asigna el `id` automáticamente. No tenemos que mandarlo al crear un registro; el manejador lo genera y lo incrementa solo.

### ENUM
El campo `status` solo acepta los valores `'pending'`, `'in_progress'` o `'done'`. Si intentas insertar otro valor, MySQL lo rechaza. Es más seguro que un VARCHAR libre.

### UNIQUE KEY
El campo `name` en categorías tiene una restricción UNIQUE. Esto significa que no puedes crear dos categorías con el mismo nombre; MySQL devolverá un error si lo intentas.

### DEFAULT
Si no mandas el campo `status` al crear una tarea, MySQL automáticamente pone `'pending'`. Lo mismo con `color` en categorías: el default es `'#3498db'`.

### NULL vs NOT NULL
- `NOT NULL`: el campo es obligatorio. Ejemplo: `title` en tasks.
- `NULL`: el campo es opcional. Ejemplo: `description` o `due_date` en tasks.

### Parámetros preparados (Prepared Statements)
En lugar de construir la consulta SQL con concatenación de strings (lo cual es peligroso):

```javascript
// PELIGROSO - susceptible a SQL Injection:
db.query(`SELECT * FROM tasks WHERE id = ${id}`)

// SEGURO - parámetro preparado:
db.query('SELECT * FROM tasks WHERE id = ?', [id])
```

mysql2 se encarga de escapar el valor, evitando que alguien inyecte SQL malicioso.

---

## Flujo completo de una petición

Ejemplo: `POST /tasks` con body `{ "title": "Estudiar", "category_id": 2 }`

```
1. Cliente envía POST a http://localhost:3000/tasks
2. NestJS recibe la petición y busca qué controlador maneja /tasks
3. Encuentra TasksController, método con @Post()
4. Extrae el body: { title: "Estudiar", category_id: 2 }
5. Ejecuta: INSERT INTO tasks (title, description, status, due_date, category_id)
            VALUES ('Estudiar', NULL, 'pending', NULL, 2)
6. MySQL inserta el registro y devuelve el ID generado (ej: 9)
7. Se ejecuta: SELECT * FROM tasks WHERE id = 9
8. NestJS devuelve el registro como JSON con código HTTP 201 (Created)
```

Respuesta que recibe el cliente:
```json
{
  "id": 9,
  "title": "Estudiar",
  "description": null,
  "status": "pending",
  "due_date": null,
  "created_at": "2025-12-15T10:30:00.000Z",
  "category_id": 2
}
```
