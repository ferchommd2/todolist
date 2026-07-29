import { Module, Controller, Get, Post, Patch, Delete, Param, Body, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { db } from '../db';

@Controller('users')
class UsersController {
  @Get()
  async findAll() {
    const [rows] = await db.query('SELECT * FROM users');
    return rows;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const [rows]: any = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (!rows[0]) throw new NotFoundException('Usuario no encontrado');
    return rows[0];
  }

  @Post()
  async create(@Body() body: { name: string; email: string }) {
    const [result]: any = await db.query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [body.name, body.email],
    );
    const [rows]: any = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; email?: string }) {
    if (body.name)  await db.query('UPDATE users SET name = ? WHERE id = ?',  [body.name, id]);
    if (body.email) await db.query('UPDATE users SET email = ? WHERE id = ?', [body.email, id]);
    const [rows]: any = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
  }
}

@Module({ controllers: [UsersController] })
export class UsersModule {}
