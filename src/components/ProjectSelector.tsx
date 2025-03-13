import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Plus, Users, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ProjectSelector = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // First, check if projects table exists
        const { error: checkError } = await supabase.from('projects').select('id').limit(1);
        
        // If table doesn't exist, create it
        if (checkError && checkError.code === '42P01') {
          console.log('Projects table does not exist, attempting to create it');
          
          try {
            // Try to create the table via RPC (this may fail in development)
            // Fix: Remove the .catch() method which is causing TypeScript errors
            await supabase.rpc('create_projects_table_if_not_exists');
            console.log('RPC call completed');
          } catch (e) {
            console.log('RPC unavailable:', e);
            // This is expected to fail in development, we'll handle project creation in the UI
          }
          
          // Try again after creating the table
          const secondCheck = await supabase.from('projects').select('id').limit(1);
          
          if (secondCheck.error && secondCheck.error.code === '42P01') {
            console.log('Still no projects table, setting empty projects array');
            setProjects([]);
            setIsLoading(false);
            return;
          }
        }
        
        // Get projects the user has created
        const { data: ownedProjects, error: ownedError } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id);
          
        if (ownedError && ownedError.code !== '42P01') throw ownedError;
        
        // Get projects the user is a member of
        const { data: memberProjects, error: memberError } = await supabase
          .from('projects')
          .select('*')
          .contains('members', [user.id]);
          
        if (memberError && memberError.code !== '42P01') throw memberError;
        
        // Combine and deduplicate projects
        const allProjects = [...(ownedProjects || []), ...(memberProjects || [])];
        const uniqueProjects = Array.from(
          new Map(allProjects.map((project) => [project.id, project])).values()
        );
        
        setProjects(uniqueProjects as Project[]);
      } catch (error) {
        console.error('Error fetching projects:', error);
        if (error instanceof Error && !error.message.includes('42P01')) {
          toast({
            title: 'Error',
            description: 'Failed to load your projects',
            variant: 'destructive',
            duration: 5000,
          });
        }
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [user, toast]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!projectName.trim()) {
      toast({
        title: 'Error',
        description: 'Project name cannot be empty',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }
    
    try {
      // Generate a unique project code
      const projectCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // First check if the table exists
      const { error: checkError } = await supabase.from('projects').select('id').limit(1);
      
      // If table doesn't exist, create it first
      if (checkError && checkError.code === '42P01') {
        console.log('Projects table does not exist, creating it first');
        
        // Fix: Remove the .catch() method which is causing TypeScript errors
        try {
          await supabase.rpc('create_projects_table_if_not_exists');
          console.log('RPC call completed for table creation');
        } catch (tableErr) {
          console.error('Unable to create table via RPC:', tableErr);
          // Continue anyway
        }
      }
      
      // Now try to insert the project
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectName.trim(),
          description: projectDescription.trim(),
          owner_id: user.id,
          code: projectCode,
          members: [user.id],
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          toast({
            title: 'Database Setup Required',
            description: 'Please contact your administrator to set up the database schema',
            variant: 'destructive',
            duration: 5000,
          });
        } else {
          throw error;
        }
      } else if (data) {
        toast({
          title: 'Success',
          description: 'Project created successfully',
          duration: 3000,
        });
        
        // Navigate to the project
        navigate(`/project/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    
    if (!user) return;
    
    if (!joinCode.trim()) {
      setJoinError("Project code cannot be empty");
      return;
    }
    
    try {
      // Find the project with the given code
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('code', joinCode.trim())
        .single();
        
      if (error) throw error;
      
      if (!data) {
        setJoinError("Project not found with this code");
        return;
      }
      
      // Check if user is already a member
      if (data.members && data.members.includes(user.id)) {
        navigate(`/project/${data.id}`);
        return;
      }
      
      // Add user to project members
      const updatedMembers = [...(data.members || []), user.id];
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({ members: updatedMembers })
        .eq('id', data.id);
        
      if (updateError) throw updateError;
      
      toast({
        title: 'Success',
        description: `You've joined ${data.name}`,
        duration: 3000,
      });
      
      // Navigate to the project
      navigate(`/project/${data.id}`);
    } catch (error) {
      console.error('Error joining project:', error);
      setJoinError("Invalid project code or project not found");
    }
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">Your Projects</h1>
        <Button variant="outline" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>
      
      {projects.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Select a Project</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="cursor-pointer hover:border-primary transition-colors" 
                onClick={() => handleSelectProject(project.id)}>
                <CardHeader className="pb-2">
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {project.members?.length || 1} member{project.members?.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || "No description provided"}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">Select Project</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8 text-center p-8 border border-dashed rounded-lg bg-muted/30">
          <h2 className="text-xl font-semibold mb-2">Welcome to Sprint Manager!</h2>
          <p className="text-muted-foreground mb-4">
            You don't have any projects yet. Create your first project or join an existing one.
          </p>
        </div>
      )}
      
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Project</TabsTrigger>
          <TabsTrigger value="join">Join Project</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Project</CardTitle>
              <CardDescription>
                Start a new project and invite team members to collaborate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Project Name
                  </label>
                  <Input
                    id="name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Amazing Project"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Input
                    id="description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="A brief description of your project"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle>Join an Existing Project</CardTitle>
              <CardDescription>
                Enter the project code provided by the project owner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinProject} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium">
                    Project Code
                  </label>
                  <Input
                    id="code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="uppercase"
                    maxLength={6}
                    required
                  />
                </div>
                
                {joinError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{joinError}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full">
                  Join Project
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectSelector;
