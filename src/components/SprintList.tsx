
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Sprint } from '@/types/sprint';

interface SprintListProps {
  sprints: Sprint[];
  projectId: string;
}

const SprintList = ({ sprints, projectId }: SprintListProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (sprintId: string) => {
    setExpanded(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  const handleNavigateToSprint = (sprintId: string) => {
    navigate(`/sprint/${sprintId}`);
  };

  const getStatusBadge = (sprint: Sprint) => {
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const today = new Date();

    if (today < startDate) {
      return <Badge variant="outline">Scheduled</Badge>;
    } else if (today > endDate) {
      return <Badge variant="secondary">Completed</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  if (sprints.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-muted-foreground">No sprints yet</h3>
        <p className="mt-2">Create your first sprint to start tracking tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sprints.map(sprint => (
        <Card key={sprint.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{sprint.name}</CardTitle>
              {getStatusBadge(sprint)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d, yyyy")}
              </span>
            </div>
            
            <Button 
              variant="default" 
              className="w-full mt-2"
              onClick={() => handleNavigateToSprint(sprint.id)}
            >
              View Sprint <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SprintList;
