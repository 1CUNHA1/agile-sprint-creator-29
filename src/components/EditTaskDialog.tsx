
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

const MOCK_USERS: User[] = [
  { id: "1", name: "John Doe", email: "john.doe@example.com", avatarUrl: "https://github.com/shadcn.png" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com", avatarUrl: "https://github.com/shadcn.png" },
  { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com", avatarUrl: "https://github.com/shadcn.png" },
];

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onTaskUpdated: (task: Task) => void;
}

const EditTaskDialog = ({ task, open, onOpenChange, userId, onTaskUpdated }: EditTaskDialogProps) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [points, setPoints] = useState(task.points.toString());
  const [status, setStatus] = useState(task.status);
  const [assignees, setAssignees] = useState(task.assignees);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setPoints(task.points.toString());
    setStatus(task.status);
    setAssignees(task.assignees);
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTask: Task = {
      ...task,
      title,
      description,
      priority,
      points: Number(points),
      status,
      assignees,
    };
    onTaskUpdated(updatedTask);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as "todo" | "in-progress" | "in-review" | "done");
  };

  const toggleAssignee = (userId: string) => {
    setAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
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
            <div className="flex flex-wrap gap-2">
              {MOCK_USERS.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant={assignees.includes(user.id) ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => toggleAssignee(user.id)}
                >
                  <Avatar className="w-6 h-6">
                    <img src={user.avatarUrl} alt={user.name} />
                  </Avatar>
                  {user.name}
                  {assignees.includes(user.id) && (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              ))}
            </div>
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
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Story Points</Label>
            <Select value={points} onValueChange={setPoints}>
              <SelectTrigger>
                <SelectValue placeholder="Select points" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 8, 13].map((point) => (
                  <SelectItem key={point} value={point.toString()}>
                    {point}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
