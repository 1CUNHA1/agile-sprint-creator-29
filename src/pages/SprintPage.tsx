
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Sprint } from "@/types/sprint";
import { Task } from "@/types/task";
import { Project } from "@/types/user";
import { 
  Calendar, ChevronRight, Plus, MoreHorizontal, 
  Clock, CheckCircle2, Circle, Timer 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SprintPage = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Group tasks by status
  const todoTasks = tasks.filter(task => task.status === "todo");
  const inProgressTasks = tasks.filter(task => task.status === "in-progress");
  const doneTasks = tasks.filter(task => task.status === "done");

  useEffect(() => {
    const fetchSprintData = async () => {
      if (!sprintId || !user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch sprint data
        const { data: sprintData, error: sprintError } = await supabase
          .from('sprints')
          .select('*')
          .eq('id', sprintId)
          .single();
          
        if (sprintError) {
          toast({
            title: 'Error',
            description: 'Sprint not found',
            variant: 'destructive',
            duration: 5000,
          });
          navigate('/projects');
          return;
        }
        
        // Transform to match our Sprint type
        const formattedSprint: Sprint = {
          id: sprintData.id,
          name: sprintData.name,
          startDate: sprintData.start_date,
          endDate: sprintData.end_date,
          tasks: sprintData.tasks || [],
        };
        
        setSprint(formattedSprint);
        
        // Fetch project data
        if (sprintData.project_id) {
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', sprintData.project_id)
            .single();
            
          if (!projectError) {
            setProject(projectData as Project);
            
            // Check if user has access to this project
            if (!projectData.members?.includes(user.id)) {
              toast({
                title: 'Error',
                description: 'You do not have access to this sprint',
                variant: 'destructive',
                duration: 5000,
              });
              navigate('/projects');
              return;
            }
          }
        }
        
        // Fetch tasks for this sprint
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('sprint_id', sprintId);
          
        if (!taskError && taskData) {
          // Transform to match our Task type
          const formattedTasks: Task[] = taskData.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            points: task.estimate || 0,
            status: task.status as "todo" | "in-progress" | "done",
            assignees: task.assignee_ids || [],
          }));
          
          setTasks(formattedTasks);
        }
      } catch (error) {
        console.error('Error fetching sprint data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load sprint data',
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSprintData();
  }, [sprintId, user, toast, navigate]);

  const handleTaskStatusChange = async (taskId: string, newStatus: "todo" | "in-progress" | "done") => {
    try {
      // Update in the database
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      toast({
        title: 'Success',
        description: 'Task status updated',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleCreateTask = () => {
    // Navigate to dashboard with sprint ID
    navigate(`/dashboard?sprint=${sprintId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading sprint board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Sprint Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Link to="/projects" className="hover:underline">Projects</Link>
          {project && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link to={`/project/${project.id}`} className="hover:underline">{project.name}</Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span>Sprint</span>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{sprint?.name}</h1>
            {sprint && (
              <div className="flex items-center text-muted-foreground mt-1">
                <Calendar className="mr-1 h-4 w-4" />
                <span>
                  {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <Button onClick={handleCreateTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-t-lg">
            <div className="flex items-center">
              <Circle className="mr-2 h-5 w-5 text-slate-500" />
              <h2 className="font-medium">To Do</h2>
            </div>
            <span className="bg-muted px-2 py-1 rounded-full text-xs font-medium">
              {todoTasks.length}
            </span>
          </div>
          
          {todoTasks.length > 0 ? (
            <div className="space-y-3">
              {todoTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleTaskStatusChange} 
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed rounded-lg p-4 text-center">
              <p className="text-muted-foreground">No tasks to do</p>
            </div>
          )}
        </div>

        {/* In Progress Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-t-lg">
            <div className="flex items-center">
              <Timer className="mr-2 h-5 w-5 text-amber-500" />
              <h2 className="font-medium">In Progress</h2>
            </div>
            <span className="bg-muted px-2 py-1 rounded-full text-xs font-medium">
              {inProgressTasks.length}
            </span>
          </div>
          
          {inProgressTasks.length > 0 ? (
            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleTaskStatusChange} 
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed rounded-lg p-4 text-center">
              <p className="text-muted-foreground">No tasks in progress</p>
            </div>
          )}
        </div>

        {/* Done Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-t-lg">
            <div className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              <h2 className="font-medium">Done</h2>
            </div>
            <span className="bg-muted px-2 py-1 rounded-full text-xs font-medium">
              {doneTasks.length}
            </span>
          </div>
          
          {doneTasks.length > 0 ? (
            <div className="space-y-3">
              {doneTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleTaskStatusChange} 
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed rounded-lg p-4 text-center">
              <p className="text-muted-foreground">No completed tasks yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: "todo" | "in-progress" | "done") => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onStatusChange(task.id, "todo")}
                disabled={task.status === "todo"}
              >
                Move to To Do
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusChange(task.id, "in-progress")}
                disabled={task.status === "in-progress"}
              >
                Move to In Progress
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusChange(task.id, "done")}
                disabled={task.status === "done"}
              >
                Move to Done
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {task.points > 0 && (
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              {task.points} {task.points === 1 ? 'point' : 'points'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SprintPage;
