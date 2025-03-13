
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Project } from '@/types/user';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gtgxsngjmzugzdbbbxph.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Z3hzbmdqbXp1Z3pkYmJieHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDkwMDgsImV4cCI6MjA1NjkyNTAwOH0.SRuu-GP5zq4OjTgnHBmvAbm1j0dR3e0bLJ8hO-Cz5pI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Auth helper functions
export const signUp = async (email: string, password: string, metadata: { name: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
};

// GitHub OAuth helper function
export const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  });
  
  return { data, error };
};

// Logout helper function
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Profile helper functions
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
};

export const updateProfile = async (userId: string, updates: { name?: string, avatar_url?: string }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  return { data, error };
};

// Project helper functions
export const createProject = async (project: Omit<Project, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  
  return { data, error };
};

export const getProject = async (projectId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  return { data, error };
};

export const getUserProjects = async (userId: string) => {
  // Get projects where user is owner
  const { data: ownedProjects, error: ownedError } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', userId);
  
  if (ownedError) throw ownedError;
  
  // Get projects where user is a member
  const { data: memberProjects, error: memberError } = await supabase
    .from('projects')
    .select('*')
    .contains('members', [userId]);
  
  if (memberError) throw memberError;
  
  // Combine and deduplicate
  const allProjects = [...(ownedProjects || []), ...(memberProjects || [])];
  const uniqueProjectIds = new Set();
  const uniqueProjects = allProjects.filter(project => {
    if (uniqueProjectIds.has(project.id)) {
      return false;
    }
    uniqueProjectIds.add(project.id);
    return true;
  });
  
  return uniqueProjects;
};

export const joinProject = async (projectCode: string, userId: string) => {
  // Find project by code
  const { data: project, error: findError } = await supabase
    .from('projects')
    .select('*')
    .eq('code', projectCode)
    .single();
  
  if (findError) throw findError;
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  // Check if user is already a member
  if (project.members && project.members.includes(userId)) {
    return { data: project, error: null };
  }
  
  // Add user to members
  const updatedMembers = [...(project.members || []), userId];
  
  const { data, error } = await supabase
    .from('projects')
    .update({ members: updatedMembers })
    .eq('id', project.id)
    .select()
    .single();
  
  return { data, error };
};
