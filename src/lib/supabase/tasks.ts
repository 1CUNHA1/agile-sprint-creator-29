
import { supabase } from './client';
import { type Task } from '@/types/task';

export async function fetchTasks(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  
  return data as Task[];
}

export async function createTask(task: Omit<Task, 'id'> & { user_id: string }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }
  
  return data as Task;
}

export async function updateTask(task: Task & { user_id: string }) {
  const { error } = await supabase
    .from('tasks')
    .update(task)
    .eq('id', task.id);
  
  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }
  
  return true;
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
  
  return true;
}

// Product Backlog (stored as tasks without a sprint)
export async function fetchProductBacklog(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .is('sprint_id', null);
  
  if (error) {
    console.error('Error fetching product backlog:', error);
    return [];
  }
  
  return data as Task[];
}
