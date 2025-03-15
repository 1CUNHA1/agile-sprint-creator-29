
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProjects, createProject, joinProject } from "@/lib/supabase/projects";
import { AlertCircle, Plus, Users, Home, LogOut } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ProjectSelector = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const userProjects = await fetchProjects(user.id);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your projects',
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
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
      const ts = new Date().toISOString();
      
      const newProject = await createProject({
        name: projectName.trim(),
        description: projectDescription.trim(),
        created_at: ts,
        user_id: user.id,
        code: projectCode,
        members: [user.id],
      });
      
      toast({
        title: 'Success',
        description: 'Project created successfully',
        duration: 3000,
      });
      
      // Navigate to the project
      navigate(`/project/${newProject.id}`);
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
      const project = await joinProject(joinCode.trim(), user.id);
      
      toast({
        title: 'Success',
        description: `You've joined ${project.name}`,
        duration: 3000,
      });
      
      // Navigate to the project
      navigate(`/project/${project.id}`);
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
