export type Task = {
  id: string | number;
  title: string;
  description?: string | null;
  completed: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type NewTask = {
  title: string;
  description: string;
};
