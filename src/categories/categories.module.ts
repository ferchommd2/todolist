import { Module, Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '../db';

@Controller('categories')
class CategoriesController {
  @Get()
  async findAll() {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM categories');
    return rows;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM categories WHERE id = ?', [id]);
    if (!rows[0]) throw new NotFoundException('Categoría no encontrada');
    return rows[0];
  }

  @Post()
  async create(@Body() body: { name: string; color?: string }) {
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO categories (name, color) VALUES (?, ?)',
      [body.name, body.color ?? '#3498db'],
    );
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; color?: string }) {
    if (body.name)  await db.query('UPDATE categories SET name = ? WHERE id = ?',  [body.name, id]);
    if (body.color) await db.query('UPDATE categories SET color = ? WHERE id = ?', [body.color, id]);
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
  }
}

@Module({ controllers: [CategoriesController] })
export class CategoriesModule {}
