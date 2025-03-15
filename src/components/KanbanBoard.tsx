
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Task } from "@/types/task";
import { fetchSprintTasks, updateTask, deleteTask } from "@/lib/supabase/tasks";
import TaskCard from "@/components/TaskCard";
import { useToast } from "@/hooks/use-toast";
import EditTaskDialog from "@/components/EditTaskDialog";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

interface KanbanBoardProps {
  sprintId: string;
}

// Sortable task wrapper
const SortableTaskCard = ({ task, onEdit, onDelete }: { task: Task; onEdit: (task: Task) => void; onDelete: (taskId: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

// Individual Kanban column
const KanbanColumn = ({ title, tasks, onEdit, onDelete }: KanbanColumnProps) => {
  return (
    <Card className="flex-1 min-w-[250px] max-w-[350px] bg-secondary/30">
      <CardHeader className="bg-muted/30 pb-2">
        <CardTitle className="text-md font-medium">{title} ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <SortableTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </SortableContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Main Kanban Board
const KanbanBoard = ({ sprintId }: KanbanBoardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const sprintTasks = await fetchSprintTasks(sprintId);
      setTasks(sprintTasks);
    } catch (error) {
      console.error("Failed to fetch sprint tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load sprint tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sprintId) {
      fetchTasks();
    }
  }, [sprintId]);

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

  const onTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    setIsEditDialogOpen(false);
    setSelectedTask(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task || !user) return;
    
    // Determine which column the task was dropped into
    const columns = document.querySelectorAll('.kanban-column');
    let newStatus = task.status;
    
    columns.forEach((column, index) => {
      if (column.contains(over.node as Node)) {
        switch (index) {
          case 0: newStatus = "todo"; break;
          case 1: newStatus = "in-progress"; break;
          case 2: newStatus = "in-review"; break;
          case 3: newStatus = "done"; break;
        }
      }
    });
    
    if (newStatus === task.status) return;
    
    try {
      const updatedTask = { ...task, status: newStatus, user_id: user.id };
      await updateTask(updatedTask);
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      toast({
        title: "Task updated",
        description: `Task moved to ${newStatus.replace("-", " ")}`,
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const todoTasks = tasks.filter(task => task.status === "todo");
  const inProgressTasks = tasks.filter(task => task.status === "in-progress");
  const inReviewTasks = tasks.filter(task => task.status === "in-review");
  const doneTasks = tasks.filter(task => task.status === "done");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <h2 className="text-xl font-semibold mb-4">Sprint Board</h2>
      
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <div className="kanban-column">
            <KanbanColumn 
              title="To Do" 
              tasks={todoTasks} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask} 
            />
          </div>
          <div className="kanban-column">
            <KanbanColumn 
              title="In Progress" 
              tasks={inProgressTasks} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask} 
            />
          </div>
          <div className="kanban-column">
            <KanbanColumn 
              title="In Review" 
              tasks={inReviewTasks} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask} 
            />
          </div>
          <div className="kanban-column">
            <KanbanColumn 
              title="Done" 
              tasks={doneTasks} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask} 
            />
          </div>
        </div>
      </DndContext>

      {user && selectedTask && (
        <EditTaskDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          task={selectedTask}
          userId={user.id}
          onTaskUpdated={onTaskUpdated}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
