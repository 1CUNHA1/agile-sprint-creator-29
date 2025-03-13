
import { supabase } from './client';
import { type Project } from '@/types/user';

/**
 * Fetches all projects a user has access to
 * @param userId - The user's ID
 * @returns Array of projects
 */
export async function fetchProjects(userId: string) {
  // Get projects the user owns
  const { data: ownedProjects, error: ownedError } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', userId);
  
  if (ownedError && ownedError.code !== '42P01') {
    console.error('Error fetching owned projects:', ownedError);
    return [];
  }
  
  // Get projects the user is a member of
  const { data: memberProjects, error: memberError } = await supabase
    .from('projects')
    .select('*')
    .contains('members', [userId]);
  
  if (memberError && memberError.code !== '42P01') {
    console.error('Error fetching member projects:', memberError);
    return [];
  }
  
  // Combine and deduplicate projects
  const allProjects = [...(ownedProjects || []), ...(memberProjects || [])];
  const uniqueProjects = Array.from(
    new Map(allProjects.map((project) => [project.id, project])).values()
  );
  
  return uniqueProjects as Project[];
}

/**
 * Creates a new project
 * @param project - The project data
 * @returns The created project
 */
export async function createProject(project: Omit<Project, 'id'>) {
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
}

/**
 * Attempts to create the projects table if it doesn't exist
 * @returns void
 */
export async function ensureProjectsTable() {
  try {
    await supabase.rpc('create_projects_table_if_not_exists');
    return true;
  } catch (error) {
    console.error('Failed to create projects table:', error);
    return false;
  }
}

/**
 * Joins a project using the project code
 * @param code - The project join code
 * @param userId - The user's ID
 * @returns The joined project
 */
export async function joinProject(code: string, userId: string) {
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
}
