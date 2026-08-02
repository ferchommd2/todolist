import { Module, Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '../db';

@Controller('tasks')
class TasksController {
  @Get()
  async findAll() {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT t.*, c.name AS category_name, c.color AS category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
    `);
    return rows;
  }

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

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT t.*, c.name AS category_name, c.color AS category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [id]);
    if (!rows[0]) throw new NotFoundException('Tarea no encontrada');
    return rows[0];
  }

  @Post()
  async create(@Body() body: { title: string; description?: string; status?: string; due_date?: string; category_id?: number }) {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO tasks (title, description, status, due_date, category_id) VALUES (?, ?, ?, ?, ?)',
      [body.title, body.description ?? null, body.status ?? 'pending', body.due_date ?? null, body.category_id ?? null],
    );
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: { title?: string; description?: string; status?: string; due_date?: string; category_id?: number | null }) {
    if (body.title !== undefined)       await db.query('UPDATE tasks SET title = ? WHERE id = ?',       [body.title, id]);
    if (body.description !== undefined) await db.query('UPDATE tasks SET description = ? WHERE id = ?', [body.description, id]);
    if (body.status !== undefined)      await db.query('UPDATE tasks SET status = ? WHERE id = ?',      [body.status, id]);
    if (body.due_date !== undefined)    await db.query('UPDATE tasks SET due_date = ? WHERE id = ?',    [body.due_date, id]);
    if (body.category_id !== undefined) await db.query('UPDATE tasks SET category_id = ? WHERE id = ?', [body.category_id, id]);
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [id]);
    return rows[0];
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
  }
}

@Module({ controllers: [TasksController] })
export class TasksModule {}
