
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/types/task";
import { fetchProductBacklog, deleteTask } from "@/lib/supabase/tasks";
import TaskCard from "@/components/TaskCard";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import EditTaskDialog from "@/components/EditTaskDialog";

interface ProductBacklogListProps {
  projectId: string;
}

const ProductBacklogList = ({ projectId }: ProductBacklogListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const backlogTasks = await fetchProductBacklog(projectId);
      setTasks(backlogTasks);
    } catch (error) {
      console.error("Failed to fetch product backlog:", error);
      toast({
        title: "Error",
        description: "Failed to load product backlog",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const handleCreateTask = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const onTaskCreated = (task: Task) => {
    setTasks([...tasks, task]);
    setIsCreateDialogOpen(false);
  };

  const onTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    setIsEditDialogOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Product Backlog</h2>
        <Button onClick={handleCreateTask} size="sm">
          <Plus size={16} className="mr-1" /> Add Task
        </Button>
      </div>
      
      <ScrollArea className="flex-1 pr-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No tasks in the product backlog. Create your first task!
          </div>
        ) : (
          <div>
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {user && (
        <>
          <CreateTaskDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            userId={user.id}
            projectId={projectId}
            onTaskCreated={onTaskCreated}
          />
          
          {selectedTask && (
            <EditTaskDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              task={selectedTask}
              userId={user.id}
              onTaskUpdated={onTaskUpdated}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProductBacklogList;
