
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/types/user";
import LogoutButton from "@/components/LogoutButton";

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch all projects from Supabase
        const { data, error } = await supabase
          .from('projects')
          .select('*');
          
        if (error) throw error;
        
        setProjects(data as Project[] || []);

        // Collect all unique user IDs from projects
        const userIds = new Set<string>();
        data?.forEach(project => {
          if (project.user_id) userIds.add(project.user_id);
        });

        // Fetch user profiles for those IDs
        if (userIds.size > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', Array.from(userIds));

          if (!profilesError && profiles) {
            const nameMap: Record<string, string> = {};
            profiles.forEach(profile => {
              nameMap[profile.id] = profile.name || 'Unknown User';
            });
            setUserNames(nameMap);
          }
        }
      } catch (error) {
        console.error('Failed to load projects', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchProjects();
    }
  }, [user, toast]);

  const handleViewProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const getUserName = (userId: string) => {
    return userNames[userId] || userId.substring(0, 8) + "...";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-background">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Projects Dashboard</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <LogoutButton variant="outline" />
          </div>
        </header>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">All Projects</h2>
            {projects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Project Name</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Owner</th>
                      <th className="text-left py-3 px-4">Members</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{project.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {project.description || "No description"}
                        </td>
                        <td className="py-3 px-4">
                          {getUserName(project.user_id || '')}
                        </td>
                        <td className="py-3 px-4">
                          {project.members ? project.members.length : 0} members
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleViewProject(project.id)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">No projects found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
