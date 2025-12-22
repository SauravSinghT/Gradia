import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";

import StudySets from "./pages/StudySets";
import PriorityTopics from "./pages/PriorityTopics";
import Summaries from "./pages/Summaries";
import Flashcards from "./pages/Flashcards";
import Tests from "./pages/Tests";
import Assessment from "./pages/Assessment";
import CareerRoadmap from "./pages/CareerRoadmap";
import TaskDetailPage from "./pages/TaskDetailPage";
import DailyTasks from "./pages/DailyTasks";
import Modules from "./pages/Modules";
import CareerAnalytics from "./pages/CareerAnalytics";
import AITutor from "./pages/AITutor";
import Community from "./pages/Community";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/dashboard/roadmap/task/:taskId" element={<TaskDetailPage />} />
            <Route path="study-sets" element={<StudySets />} />
            <Route path="priority" element={<PriorityTopics />} />
            <Route path="summaries" element={<Summaries />} />
            <Route path="flashcards" element={<Flashcards />} />
            <Route path="tests" element={<Tests />} />
            <Route path="assessment" element={<Assessment />} />
            <Route path="career" element={<CareerRoadmap />} />
            <Route path="tasks" element={<DailyTasks />} />
            <Route path="modules" element={<Modules />} />
            <Route path="career-analytics" element={<CareerAnalytics />} />
            <Route path="tutor" element={<AITutor />} />
            <Route path="community" element={<Community />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
