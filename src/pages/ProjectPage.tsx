
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Project } from "@/types/user";
import { Sprint } from "@/types/sprint";
import { 
  Calendar, ChevronRight, Users, BarChart, ClipboardList, 
  Clock, Plus, ChevronDown, ChevronUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [pastSprints, setPastSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [expandedSprintId, setExpandedSprintId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !user) return;
      
      try {
        setIsLoading(true);
        
        // Check if projects table exists
        const { error: tableError } = await supabase
          .from('projects')
          .select('count')
          .limit(1)
          .single();
          
        if (tableError && tableError.code === '42P01') {
          // Table doesn't exist yet - show error
          toast({
            title: 'Error',
            description: 'Project not found. Please create a project first.',
            variant: 'destructive',
            duration: 5000,
          });
          navigate('/projects');
          return;
        }
        
        // Get the project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
          
        if (projectError) {
          toast({
            title: 'Error',
            description: 'Project not found',
            variant: 'destructive',
            duration: 5000,
          });
          navigate('/projects');
          return;
        }
        
        if (!projectData.members?.includes(user.id)) {
          toast({
            title: 'Error',
            description: 'You do not have access to this project',
            variant: 'destructive',
            duration: 5000,
          });
          navigate('/projects');
          return;
        }
        
        setProject(projectData as Project);
        
        // Fetch current sprint and past sprints
        const today = new Date().toISOString();
        
        const { data: sprintsData, error: sprintsError } = await supabase
          .from('sprints')
          .select('*')
          .eq('project_id', projectId)
          .order('start_date', { ascending: false });
          
        if (sprintsError && sprintsError.code !== '42P01') {
          console.error('Error fetching sprints:', sprintsError);
        }
        
        if (sprintsData?.length) {
          // Find current sprint (active sprint with closest end date to today)
          const activeSprints = sprintsData.filter(
            sprint => sprint.start_date <= today && sprint.end_date >= today
          );
          
          if (activeSprints.length > 0) {
            setCurrentSprint(activeSprints[0] as unknown as Sprint);
          }
          
          // Past sprints
          const pastSprintsList = sprintsData.filter(
            sprint => sprint.end_date < today
          ).map(sprint => ({
            ...sprint,
            startDate: sprint.start_date,
            endDate: sprint.end_date,
            tasks: sprint.tasks || [],
          }));
          
          setPastSprints(pastSprintsList as Sprint[]);
        }
        
        // Fetch team members
        if (projectData.members?.length) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', projectData.members);
            
          if (profilesError && profilesError.code !== '42P01') {
            console.error('Error fetching profiles:', profilesError);
          }
          
          setMembers(profilesData || []);
        }
        
        // Mock recent activity for now
        setRecentActivity([
          { id: 1, text: "Sprint 'March Release' was created", timestamp: "2 hours ago" },
          { id: 2, text: "Task 'Fix login bug' was moved to Done", timestamp: "5 hours ago" },
          { id: 3, text: "Sarah joined the project", timestamp: "1 day ago" },
        ]);
      } catch (error) {
        console.error('Error fetching project data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project data',
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, user, toast, navigate]);

  const handleCreateSprint = () => {
    // For now, just navigate to the dashboard with the project ID
    navigate(`/dashboard?project=${projectId}`);
  };

  const handleViewSprint = (sprintId: string) => {
    navigate(`/sprint/${sprintId}`);
  };

  const toggleSprintExpansion = (sprintId: string) => {
    setExpandedSprintId(expandedSprintId === sprintId ? null : sprintId);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Project Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Link to="/projects" className="hover:underline">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <span>{project?.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{project?.name}</h1>
          <p className="text-muted-foreground mt-1">{project?.description || "No description provided"}</p>
        </div>
        <Button onClick={handleCreateSprint}>
          <Plus className="mr-2 h-4 w-4" />
          Create Sprint
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content (2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          {/* Current Sprint */}
          <Card>
            <CardHeader>
              <CardTitle>Current Sprint</CardTitle>
              <CardDescription>Active sprint progress and tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {currentSprint ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{currentSprint.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-4 w-4" />
                        {new Date(currentSprint.startDate).toLocaleDateString()} - {new Date(currentSprint.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => handleViewSprint(currentSprint.id)}
                    >
                      View Board
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Progress indicators would go here */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">4</div>
                      <div className="text-xs text-muted-foreground">To Do</div>
                    </div>
                    <div className="p-2 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">6</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div className="p-2 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Sprint</h3>
                  <p className="text-muted-foreground mb-4">Create a new sprint to start tracking your work</p>
                  <Button onClick={handleCreateSprint}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Sprint
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Sprints */}
          <Card>
            <CardHeader>
              <CardTitle>Past Sprints</CardTitle>
              <CardDescription>View completed sprints and their results</CardDescription>
            </CardHeader>
            <CardContent>
              {pastSprints.length > 0 ? (
                <div className="space-y-2">
                  {pastSprints.map((sprint) => (
                    <Collapsible
                      key={sprint.id}
                      className="border rounded-md"
                      open={expandedSprintId === sprint.id}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <h3 className="font-medium">{sprint.name}</h3>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSprint(sprint.id)}
                          >
                            View
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleSprintExpansion(sprint.id)}
                            >
                              {expandedSprintId === sprint.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="p-4 pt-0 border-t">
                          <div className="grid grid-cols-3 gap-4 text-center mb-4">
                            <div className="p-2 bg-muted/30 rounded-lg">
                              <div className="text-xl font-bold">12</div>
                              <div className="text-xs text-muted-foreground">Total Tasks</div>
                            </div>
                            <div className="p-2 bg-muted/30 rounded-lg">
                              <div className="text-xl font-bold">10</div>
                              <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                            <div className="p-2 bg-muted/30 rounded-lg">
                              <div className="text-xl font-bold">83%</div>
                              <div className="text-xs text-muted-foreground">Completion</div>
                            </div>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => handleViewSprint(sprint.id)}
                          >
                            View Sprint Details
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Past Sprints</h3>
                  <p className="text-muted-foreground">
                    Past sprints will appear here once they're completed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {member.name?.charAt(0) || member.id.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{member.name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">{member.email || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No team members yet</p>
                </div>
              )}
              <Button className="w-full mt-4" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </CardContent>
          </Card>

          {/* Project Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5" />
                Project Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Sprints</span>
                  <span className="font-medium">{pastSprints.length + (currentSprint ? 1 : 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Tasks</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">68%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Team Size</span>
                  <span className="font-medium">{members.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="border-l-2 border-muted-foreground/20 pl-4 pb-4 relative">
                    <div className="absolute w-2 h-2 rounded-full bg-primary -left-[4.5px] top-1"></div>
                    <p className="text-sm">{activity.text}</p>
                    <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
