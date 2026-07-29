export class CreateTaskDto {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'done';
  due_date?: string;
  user_id: number;
  category_id?: number;
}
