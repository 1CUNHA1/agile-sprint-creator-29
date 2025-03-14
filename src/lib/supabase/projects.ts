
import { supabase } from './client';
import { type Project } from '@/types/user';

/**
 * Fetches all projects in the database
 * @returns Array of all projects
 */
export async function fetchProjects() {
  try {
    // Get all projects from the database
    const { data, error } = await supabase
      .from('projects')
      .select('*');
    
    if (error) throw error;
    
    return data as Project[];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

/**
 * Creates a new project
 * @param project - The project data
 * @returns The created project
 */
export async function createProject(project: Omit<Project, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }
    
    return data as Project;
  } catch (error) {
    console.error('Error in createProject:', error);
    throw error;
  }
}

/**
 * Joins a project using the project code
 * @param code - The project join code
 * @param userId - The user's ID
 * @returns The joined project
 */
export async function joinProject(code: string, userId: string) {
  try {
    // Find the project with the given code
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('code', code)
      .single();
      
    if (error) throw error;
    
    if (!data) {
      throw new Error('Project not found with this code');
    }
    
    // If user is already a member, just return the project
    if (data.members && data.members.includes(userId)) {
      return data as Project;
    }
    
    // Add user to project members
    const updatedMembers = [...(data.members || []), userId];
    
    const { error: updateError } = await supabase
      .from('projects')
      .update({ members: updatedMembers })
      .eq('id', data.id);
      
    if (updateError) throw updateError;
    
    // Return the updated project
    return {
      ...data,
      members: updatedMembers
    } as Project;
  } catch (error) {
    console.error('Error joining project:', error);
    throw error;
  }
}
