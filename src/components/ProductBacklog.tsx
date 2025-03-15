
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/types/task";
import { fetchProductBacklog } from "@/lib/supabase/tasks";
import { Plus, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreateTaskDialog from "./CreateTaskDialog";

interface ProductBacklogProps {
  projectId: string;
  onRefresh?: () => void;
}

const ProductBacklog = ({ projectId, onRefresh }: ProductBacklogProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadBacklog = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const backlogTasks = await fetchProductBacklog(projectId);
      // Filter for tasks associated with current project
      const projectTasks = backlogTasks.filter(task => task.projectId === projectId);
      setTasks(projectTasks);
    } catch (error) {
      console.error('Error loading product backlog:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product backlog',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBacklog();
  }, [projectId, user]);

  const handleCreateTask = async (task: Task) => {
    if (!user) return;
    
    try {
      // Save task to Supabase
      const savedTask = await import('@/lib/supabase/tasks').then(
        module => module.createTask({
          ...task,
          user_id: user.id,
        })
      );
      
      setTasks(prev => [...prev, savedTask]);
      setShowCreateTaskDialog(false);
      
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <ListChecks className="mr-2 h-5 w-5" />
            Product Backlog
          </CardTitle>
          <CardDescription>Tasks that need to be scheduled into sprints</CardDescription>
        </div>
        <Button onClick={() => setShowCreateTaskDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mb-2 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading backlog...</p>
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="p-3 border rounded-md hover:bg-accent/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full bg-muted ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                )}
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{task.points} {task.points === 1 ? 'point' : 'points'}</span>
                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-2">
                      {task.assignees.slice(0, 3).map((assigneeId) => (
                        <div key={assigneeId} className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                          {assigneeId.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ListChecks className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
            <h3 className="text-lg font-medium mb-2">No tasks in backlog</h3>
            <p className="text-muted-foreground mb-4">Add tasks to your product backlog to start planning your sprints</p>
            <Button onClick={() => setShowCreateTaskDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Task
            </Button>
          </div>
        )}
      </CardContent>

      {/* Create Task Dialog */}
      {user && (
        <CreateTaskDialog
          open={showCreateTaskDialog}
          onOpenChange={setShowCreateTaskDialog}
          onTaskCreated={handleCreateTask}
          projectId={projectId}
          userId={user.id}
        />
      )}
    </Card>
  );
};

export default ProductBacklog;
