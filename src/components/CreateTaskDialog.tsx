
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";
import { User } from "@/types/user";
import { Avatar } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { Sprint } from "@/types/sprint";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  projectId: string;
  onTaskCreated: (task: Task) => void;
  sprints?: Sprint[];
  selectedSprintId?: string;
}

const CreateTaskDialog = ({ open, onOpenChange, onTaskCreated, userId, projectId, sprints, selectedSprintId }: CreateTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [points, setPoints] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [sprintId, setSprintId] = useState(selectedSprintId || "");
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const { user } = useAuth();

  // Fetch project members when the dialog opens and project ID is available
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!projectId || !open) return;
      
      try {
        // This is a simplified approach - in a real app, you'd query the members from the projects table
        // and then get their user details
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
          
        if (error) throw error;
        
        // Convert profiles to User objects
        const users: User[] = data.map(profile => ({
          id: profile.id,
          name: profile.name || 'Unknown User',
          email: '',  // You might want to fetch this separately due to privacy concerns
          avatarUrl: profile.avatar_url || undefined,
        }));
        
        setProjectMembers(users);
      } catch (error) {
        console.error('Error fetching project members:', error);
      }
    };
    
    fetchProjectMembers();
  }, [projectId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      priority: priority || "medium", // Default to medium if not selected
      points: Number(points) || 1, // Default to 1 if not valid
      status: "todo", // All new tasks start as "todo" regardless of where they're created
      assignees,
      userId: user?.id || "", // Attach the current user ID
      projectId: projectId || "", // Attach the project ID if available
      sprintId: sprintId || undefined,
    };
    onTaskCreated(newTask);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setPoints("");
    setAssignees([]);
    setSprintId(selectedSprintId || "");
  };

  const toggleAssignee = (userId: string) => {
    setAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only positive numbers
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 1)) {
      setPoints(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />
          </div>
          <div className="space-y-2">
            <Label>Assignees</Label>
            {projectMembers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {projectMembers.map((member) => (
                  <Button
                    key={member.id}
                    type="button"
                    variant={assignees.includes(member.id) ? "default" : "outline"}
                    className="flex items-center gap-2"
                    onClick={() => toggleAssignee(member.id)}
                  >
                    <Avatar className="w-6 h-6">
                      <img 
                        src={member.avatarUrl || "https://github.com/shadcn.png"} 
                        alt={member.name} 
                      />
                    </Avatar>
                    {member.name}
                    {assignees.includes(member.id) && (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No project members available. Tasks will be unassigned.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Story Points</Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={points}
              onChange={handlePointsChange}
              placeholder="Enter story points"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
