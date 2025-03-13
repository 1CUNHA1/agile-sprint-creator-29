
import { createClient } from '@supabase/supabase-js';
import { type Task } from '@/types/task';
import { type Sprint } from '@/types/sprint';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Tasks
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

// Sprints
export async function fetchSprints(userId: string) {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching sprints:', error);
    return [];
  }
  
  return data as Sprint[];
}

export async function createSprint(sprint: Omit<Sprint, 'id'> & { user_id: string }) {
  const { data, error } = await supabase
    .from('sprints')
    .insert(sprint)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating sprint:', error);
    throw error;
  }
  
  return data as Sprint;
}

export async function updateSprint(sprint: Sprint & { user_id: string }) {
  const { error } = await supabase
    .from('sprints')
    .update(sprint)
    .eq('id', sprint.id);
  
  if (error) {
    console.error('Error updating sprint:', error);
    throw error;
  }
  
  return true;
}

export async function deleteSprint(id: string) {
  const { error } = await supabase
    .from('sprints')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting sprint:', error);
    throw error;
  }
  
  return true;
}

export async function deleteTaskFromSprint(sprintId: string, taskId: string) {
  // First, get the current sprint
  const { data, error } = await supabase
    .from('sprints')
    .select('tasks')
    .eq('id', sprintId)
    .single();
  
  if (error) {
    console.error('Error fetching sprint:', error);
    throw error;
  }
  
  // Update the sprint's tasks array
  const updatedTasks = (data.tasks as string[]).filter(id => id !== taskId);
  
  const { error: updateError } = await supabase
    .from('sprints')
    .update({ tasks: updatedTasks })
    .eq('id', sprintId);
  
  if (updateError) {
    console.error('Error updating sprint tasks:', updateError);
    throw updateError;
  }
  
  return true;
}

export async function addTaskToSprint(sprintId: string, taskId: string) {
  // First, get the current sprint
  const { data, error } = await supabase
    .from('sprints')
    .select('tasks')
    .eq('id', sprintId)
    .single();
  
  if (error) {
    console.error('Error fetching sprint:', error);
    throw error;
  }
  
  // Update the sprint's tasks array
  const updatedTasks = [...(data.tasks as string[] || []), taskId];
  
  const { error: updateError } = await supabase
    .from('sprints')
    .update({ tasks: updatedTasks })
    .eq('id', sprintId);
  
  if (updateError) {
    console.error('Error updating sprint tasks:', updateError);
    throw updateError;
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
