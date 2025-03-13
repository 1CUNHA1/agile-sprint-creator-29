
import { supabase } from './client';
import { type Sprint } from '@/types/sprint';

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
