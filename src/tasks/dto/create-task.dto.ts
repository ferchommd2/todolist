export class CreateTaskDto {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'done';
  due_date?: string;
  category_id?: number;
}
