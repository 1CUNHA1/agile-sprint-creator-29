
import { supabase } from './client';

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