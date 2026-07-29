import { createPool } from 'mysql2/promise';

export const db = createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'todolist_db',
});
