import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import InitialLoader from "@/components/ui/InitialLoader";
import DashboardLayout from "./components/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Dashboard Pages...
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

const queryClient = new QueryClient();

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check session storage
    const hasVisited = sessionStorage.getItem("hasVisited");

    if (!hasVisited) {
      // CASE 1: First Visit (Full Experience)
      setIsFirstVisit(true);
      sessionStorage.setItem("hasVisited", "true");
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 5000); // 5 Seconds
      return () => clearTimeout(timer);

    } else {
      // CASE 2: Reload / Subsequent Visit (Minimal Experience)
      setIsFirstVisit(false);
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500); // 1.5 Seconds (Just enough to look smooth)
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          // Pass the 'minimal' prop if it's NOT the first visit
          <InitialLoader key="loader" minimal={!isFirstVisit} />
        )}
      </AnimatePresence>

      <div className={isLoading ? "h-screen overflow-hidden" : ""}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="roadmap/task/:taskId" element={<TaskDetailPage />} />
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
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;