
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800",
  "in-progress": "bg-blue-100 text-blue-800",
  "in-review": "bg-purple-100 text-purple-800",
  done: "bg-green-100 text-green-800",
};

const TaskCard = ({ task, onEdit, onDelete }: TaskCardProps) => {
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline" className={priorityColors[task.priority as keyof typeof priorityColors] || "bg-gray-100"}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={statusColors[task.status as keyof typeof statusColors] || "bg-gray-100"}>
              {task.status.replace("-", " ")}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm text-gray-500">
          Points: {task.points}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-gray-700">{task.description}</p>
      </CardContent>
      <CardFooter className="flex justify-end pt-2 gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(task)}
        >
          <Edit size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(task.id)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
