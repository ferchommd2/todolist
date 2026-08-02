export type Task = {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done';
  due_date: string;
  created_at: string;
  category_id: number;
};
