
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/types/user";
import { Sprint } from "@/types/sprint";
import { 
  Calendar, ChevronRight, Users, BarChart, ClipboardList, 
  Clock, Plus, ChevronDown, ChevronUp, RefreshCw
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
import ProductBacklog from "@/components/ProductBacklog";
import CreateSprintDialog from "@/components/CreateSprintDialog";

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [pastSprints, setPastSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [expandedSprintId, setExpandedSprintId] = useState<string | null>(null);
  const [showCreateSprintDialog, setShowCreateSprintDialog] = useState(false);
  const [projectStats, setProjectStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadProjectData = async () => {
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
        navigate('/dashboard');
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
        navigate('/dashboard');
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
          const currentSprintData = activeSprints[0];
          setCurrentSprint({
            id: currentSprintData.id,
            name: currentSprintData.name,
            startDate: currentSprintData.start_date || '',
            endDate: currentSprintData.end_date || '',
            tasks: currentSprintData.tasks || [],
            projectId: projectId
          });
        }
        
        // Past sprints
        const pastSprintsList = sprintsData
          .filter(sprint => sprint.end_date < today)
          .map(sprint => ({
            id: sprint.id,
            name: sprint.name,
            startDate: sprint.start_date || '',
            endDate: sprint.end_date || '',
            tasks: sprint.tasks || [],
            projectId: projectId
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
      
      // Fetch project statistics
      await loadProjectStats();
      
      // Recent activity (most recent tasks)
      const { data: recentTasksData, error: recentTasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (!recentTasksError && recentTasksData?.length) {
        setRecentActivity(recentTasksData.map(task => ({
          id: task.id,
          text: `Task "${task.title}" was ${task.status}`,
          timestamp: new Date(task.created_at).toLocaleDateString()
        })));
      } else {
        // Default activity if no tasks found
        setRecentActivity([
          { id: 1, text: `Project "${projectData.name}" was created`, timestamp: new Date().toLocaleDateString() }
        ]);
      }
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
  
  const loadProjectStats = async () => {
    if (!projectId || !user) return;
    
    try {
      // Fetch all tasks for the project to calculate stats
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);
        
      if (tasksError) throw tasksError;
      
      if (tasksData) {
        const totalTasks = tasksData.length;
        const completedTasks = tasksData.filter(task => task.status === 'done').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        setProjectStats({
          totalTasks,
          completedTasks,
          completionRate
        });
      }
    } catch (error) {
      console.error('Error loading project stats:', error);
    }
  };
  
  useEffect(() => {
    loadProjectData();
  }, [projectId, user]);

  const handleCreateSprint = async (sprint: Sprint) => {
    if (!user || !projectId) return;
    
    try {
      // Prepare sprint data for Supabase
      const sprintData = {
        name: sprint.name,
        start_date: sprint.startDate,
        end_date: sprint.endDate,
        tasks: [],
        user_id: user.id,
        project_id: projectId
      };
      
      // Create sprint in Supabase
      const { data, error } = await supabase
        .from('sprints')
        .insert(sprintData)
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Sprint created successfully',
      });
      
      // Close dialog and reload data
      setShowCreateSprintDialog(false);
      loadProjectData();
      
    } catch (error) {
      console.error('Error creating sprint:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sprint',
        variant: 'destructive',
      });
    }
  };

  const handleViewSprint = (sprintId: string) => {
    navigate(`/sprint/${sprintId}`);
  };

  const toggleSprintExpansion = (sprintId: string) => {
    setExpandedSprintId(expandedSprintId === sprintId ? null : sprintId);
  };

  const handleRefresh = () => {
    loadProjectData();
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
            <Link to="/dashboard" className="hover:underline">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <span>{project?.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{project?.name}</h1>
          <p className="text-muted-foreground mt-1">{project?.description || "No description provided"}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateSprintDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Sprint
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="backlog">Product Backlog</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
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
                      <Button onClick={() => setShowCreateSprintDialog(true)}>
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
                      <span className="font-medium">{projectStats.totalTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-medium">{projectStats.completionRate}%</span>
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
        </TabsContent>
        
        <TabsContent value="backlog">
          {projectId && <ProductBacklog projectId={projectId} onRefresh={handleRefresh} />}
        </TabsContent>
      </Tabs>

      {/* Create Sprint Dialog */}
      <CreateSprintDialog
        open={showCreateSprintDialog}
        onClose={() => setShowCreateSprintDialog(false)}
        onCreateSprint={handleCreateSprint}
      />
    </div>
  );
};

export default ProjectPage;
