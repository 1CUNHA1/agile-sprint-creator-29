
export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  tasks: string[]; // Array of task IDs
  projectId?: string; // Reference to the project
}
