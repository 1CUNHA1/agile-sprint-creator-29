
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  CheckSquare, 
  Users, 
  Layout, 
  Star 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Sprint Planning",
      description: "Easily create and manage sprints with intuitive planning tools."
    },
    {
      icon: <CheckSquare className="h-8 w-8 text-primary" />,
      title: "Task Management",
      description: "Organize tasks with priorities, status tracking, and detailed information."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Team Collaboration",
      description: "Work together seamlessly with shared backlog and task assignments."
    },
    {
      icon: <Layout className="h-8 w-8 text-primary" />,
      title: "Product Backlog",
      description: "Keep track of all future work items in a well-organized product backlog."
    }
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-background border-b border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Sprint Master</span>
          </div>
          <div className="space-x-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
                <Button onClick={() => navigate('/signup')}>Sign up</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary to-background py-20 px-6 flex-grow">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              Manage Your Sprints <span className="text-primary">Effortlessly</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Sprint Master helps teams organize tasks, plan sprints, and deliver projects on time with a simple yet powerful interface.
            </p>
            <div className="space-y-4">
              <Button size="lg" onClick={handleGetStarted} className="group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-primary/10 rounded-lg -rotate-3 scale-95 transform"></div>
            <div className="bg-card border border-border rounded-lg shadow-xl p-6">
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-md">
                  <div className="h-4 w-3/4 bg-muted-foreground/20 rounded"></div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-background p-3 rounded-md border border-border flex items-center">
                      <div className="h-4 w-4 bg-primary/20 rounded mr-3"></div>
                      <div className="h-4 w-2/3 bg-muted-foreground/20 rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <div className="h-8 w-24 bg-primary/20 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your agile development process
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-background p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-primary/20 to-secondary/20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to boost your team's productivity?</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of teams who use Sprint Master to organize their work and deliver on time.
          </p>
          <Button size="lg" onClick={handleGetStarted}>
            Start for free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-semibold">Sprint Master</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Sprint Master. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
