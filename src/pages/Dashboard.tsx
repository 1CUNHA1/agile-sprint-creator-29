
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, LogOut } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import LogoutButton from '@/components/LogoutButton';

// Define Project type based on Supabase schema
interface Project {
  id: string;
  name: string;
  description: string | null;
  code: string;
  user_id: string;
  members: string[] | null;
  created_at: string;
}

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch all projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*');

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Failed to load projects',
          description: 'There was an error loading the projects.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navbar */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto py-4 px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Sprint Master</h1>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-8 px-6">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Project Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No projects available.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow 
                        key={project.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.description || 'No description'}</TableCell>
                        <TableCell>{project.code}</TableCell>
                        <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
