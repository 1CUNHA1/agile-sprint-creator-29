
import { supabase } from './client';
import { type Task } from '@/types/task';

/**
 * Fetches all tasks for a user
 * @param userId - The user's ID
 * @returns Array of tasks
 */
export async function fetchTasks(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching tasks:', error);
    if (error.code === '42P01') {
      // Table doesn't exist yet
      return [];
    }
    throw error;
  }
  
  // Map from database schema to our application schema
  const mappedTasks = data.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium',
    points: task.estimate || 0,
    status: task.status as "todo" | "in-progress" | "in-review" | "done",
    assignees: task.assignee_ids || [],
    userId: task.user_id,
    projectId: task.project_id,
    sprintId: task.sprint_id
  }));
  
  return mappedTasks as Task[];
}

/**
 * Creates a new task
 * @param task - The task data with user_id
 * @returns The created task
 */
export async function createTask(task: Omit<Task, 'id'> & { user_id: string }) {
  // Map from our application schema to database schema
  const dbTask = {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    estimate: task.points,
    user_id: task.user_id,
    sprint_id: task.sprintId,
    created_at: new Date().toISOString(),
    project_id: task.projectId
  };
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(dbTask)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }
  
  // Map back to our application schema
  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    priority: data.priority || 'medium',
    points: data.estimate || 0,
    status: data.status as "todo" | "in-progress" | "in-review" | "done",
    assignees: data.assignee_ids || [],
    userId: data.user_id,
    projectId: data.project_id,
    sprintId: data.sprint_id
  } as Task;
}

/**
 * Updates an existing task
 * @param task - The task data with user_id
 * @returns boolean indicating success
 */
export async function updateTask(task: Task & { user_id: string }) {
  // Map from our application schema to database schema
  const dbTask = {
    title: task.title,
    description: task.description,
    priority: task.priority,
    estimate: task.points,
    status: task.status,
    assignee_ids: task.assignees,
    user_id: task.user_id,
    project_id: task.projectId,
    sprint_id: task.sprintId
  };
  
  const { error } = await supabase
    .from('tasks')
    .update(dbTask)
    .eq('id', task.id);
  
  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }
  
  return true;
}

/**
 * Deletes a task
 * @param id - The task ID
 * @returns boolean indicating success
 */
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

/**
 * Fetches tasks without a sprint (product backlog)
 * @param projectId - The project's ID
 * @returns Array of tasks
 */
export async function fetchProductBacklog(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .is('sprint_id', null);
  
  if (error) {
    console.error('Error fetching product backlog:', error);
    if (error.code === '42P01') {
      // Table doesn't exist yet
      return [];
    }
    throw error;
  }
  
  // Map from database schema to our application schema
  const mappedTasks = data.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium',
    points: task.estimate || 0,
    status: task.status as "todo" | "in-progress" | "in-review" | "done",
    assignees: task.assignee_ids || [],
    userId: task.user_id,
    projectId: task.project_id,
    sprintId: task.sprint_id
  }));
  
  return mappedTasks as Task[];
}

/**
 * Fetches all tasks for a sprint
 * @param sprintId - The sprint's ID
 * @returns Array of tasks
 */
export async function fetchSprintTasks(sprintId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('sprint_id', sprintId);
  
  if (error) {
    console.error('Error fetching sprint tasks:', error);
    if (error.code === '42P01') {
      // Table doesn't exist yet
      return [];
    }
    throw error;
  }
  
  // Map from database schema to our application schema
  const mappedTasks = data.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium',
    points: task.estimate || 0,
    status: task.status as "todo" | "in-progress" | "in-review" | "done",
    assignees: task.assignee_ids || [],
    userId: task.user_id,
    projectId: task.project_id,
    sprintId: task.sprint_id
  }));
  
  return mappedTasks as Task[];
}
