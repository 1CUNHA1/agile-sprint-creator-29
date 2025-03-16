
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprint } from "@/types/sprint";
import { useAuth } from "@/contexts/AuthContext";
import { createSprint } from "@/lib/supabase/sprints";
import { useToast } from "@/hooks/use-toast";

interface CreateSprintDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateSprint: (sprint: Sprint) => void;
  projectId: string;
}

const CreateSprintDialog = ({ open, onClose, onCreateSprint, projectId }: CreateSprintDialogProps) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a sprint",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the sprint in Supabase
      const newSprint = await createSprint({
        name,
        startDate,
        endDate,
        userId: user.id,
        projectId, // Pass the projectId to the createSprint function
        tasks: []
      });
      
      // Notify parent component of new sprint
      onCreateSprint(newSprint);
      
      // Reset form
      setName("");
      setStartDate("");
      setEndDate("");
      
      // Close dialog
      onClose();
      
      toast({
        title: "Success",
        description: "Sprint created successfully",
      });
    } catch (error) {
      console.error("Error creating sprint:", error);
      toast({
        title: "Error",
        description: "Failed to create sprint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Sprint</DialogTitle>
          <DialogDescription>
            Add a new sprint to your project. Enter the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sprint Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sprint name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Sprint"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSprintDialog;
