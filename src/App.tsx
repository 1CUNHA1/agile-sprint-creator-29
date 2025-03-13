
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ProjectSelector from "@/components/ProjectSelector";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import ProjectPage from "./pages/ProjectPage";
import SprintPage from "./pages/SprintPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Landing page as the root path */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Project selection screen */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectSelector />
                </ProtectedRoute>
              }
            />
            
            {/* Project page */}
            <Route
              path="/project/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectPage />
                </ProtectedRoute>
              }
            />
            
            {/* Sprint page with Kanban board */}
            <Route
              path="/sprint/:sprintId"
              element={
                <ProtectedRoute>
                  <SprintPage />
                </ProtectedRoute>
              }
            />
            
            {/* Dashboard for viewing/editing a specific project */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
