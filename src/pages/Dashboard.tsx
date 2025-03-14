import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DatabaseService } from "@/services/DatabaseService";
import { Home } from "lucide-react";
import ProjectSelector from "@/components/ProjectSelector";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const dbService = user ? new DatabaseService(user.id) : null;
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      if (!dbService) return;
      
      try {
        setIsLoading(true);
      } catch (error) {
        console.error('Failed to load data', error);
        toast({
          title: 'Error',
          description: 'Failed to load your sprint data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      // The AuthContext will handle the state update and redirection
    } catch (error) {
      console.error('Logout failed', error);
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-background">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading your sprint backlog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <header className="text-center space-y-4 relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-left">Your Projects</h1>
          <div className="flex space-x-2 ml-auto">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <ProjectSelector />

        
      </div>
    </div>
  );
};

export default Index;
