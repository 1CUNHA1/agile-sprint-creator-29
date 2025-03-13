
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Add back the Project interface since it's still being used in ProjectSelector.tsx
export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  code: string;
  members: string[];
  created_at?: string;
}
