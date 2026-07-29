import { Module, Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { db } from '../db';

@Controller('tasks')
class TasksController {
  @Get()
  async findAll() {
    const [rows] = await db.query(`
      SELECT t.*, u.name AS user_name, c.name AS category_name, c.color AS category_color
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
    `);
    return rows;
  }

  @Get('user/:userId')
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    const [rows] = await db.query(`
      SELECT t.*, u.name AS user_name, c.name AS category_name, c.color AS category_color
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `, [userId]);
    return rows;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const [rows]: any = await db.query(`
      SELECT t.*, u.name AS user_name, c.name AS category_name, c.color AS category_color
      FROM tasks t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [id]);
    if (!rows[0]) throw new NotFoundException('Tarea no encontrada');
    return rows[0];
  }

  @Post()
  async create(@Body() body: { title: string; description?: string; status?: string; due_date?: string; user_id: number; category_id?: number }) {
    const [result]: any = await db.query(
      'INSERT INTO tasks (title, description, status, due_date, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?)',
      [body.title, body.description ?? null, body.status ?? 'pending', body.due_date ?? null, body.user_id, body.category_id ?? null],
    );
    const [rows]: any = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: { title?: string; description?: string; status?: string; due_date?: string; category_id?: number }) {
    if (body.title !== undefined)       await db.query('UPDATE tasks SET title = ? WHERE id = ?',       [body.title, id]);
    if (body.description !== undefined) await db.query('UPDATE tasks SET description = ? WHERE id = ?', [body.description, id]);
    if (body.status !== undefined)      await db.query('UPDATE tasks SET status = ? WHERE id = ?',      [body.status, id]);
    if (body.due_date !== undefined)    await db.query('UPDATE tasks SET due_date = ? WHERE id = ?',    [body.due_date, id]);
    if (body.category_id !== undefined) await db.query('UPDATE tasks SET category_id = ? WHERE id = ?', [body.category_id, id]);
    const [rows]: any = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    return rows[0];
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
  }
}

@Module({ controllers: [TasksController] })
export class TasksModule {}
