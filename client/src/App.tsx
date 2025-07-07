import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CityProvider } from "@/contexts/CityContext";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PushNotificationService } from "@/lib/pushNotifications";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Communities from "@/pages/communities";
import Events from "@/pages/events";
import Schools from "@/pages/schools";
import SchoolDetail from "@/pages/school-detail";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import Families from "@/pages/families";

import BottomNav from "@/components/bottom-nav";
import SidebarNav from "@/components/sidebar-nav";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [currentUrl, setCurrentUrl] = useState(window.location.href);
  
  // Update URL state whenever location changes or URL changes
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, [location]);
  
  // Also listen for direct URL changes and custom navigation events
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentUrl(window.location.href);
    };
    
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('urlchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleUrlChange);
    };
  }, []);
  
  // Check if we're in a chat room by examining URL parameters
  const urlParams = new URLSearchParams(new URL(currentUrl).search);
  const isInChatRoom = location === '/chat' && urlParams.has('chat');
  const isInAnyChat = isInChatRoom;
  

  

  


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <>
      {/* Desktop/Tablet Sidebar Navigation */}
      {isAuthenticated && <SidebarNav />}
      
      {/* Main Content with responsive padding */}
      <div className={cn(
        isAuthenticated ? "pb-16 md:pb-0" : "", // Mobile bottom padding, none on desktop
        isAuthenticated ? "md:ml-64" : "" // Desktop left margin for sidebar
      )}>
        <Switch>
          <Route path="/">
            {isAuthenticated ? <Home /> : <Landing />}
          </Route>
          <Route path="/schools" component={Schools} />
          <Route path="/schools/:id" component={SchoolDetail} />
          <Route path="/chat" component={Chat} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </div>
      
      {/* Mobile Bottom Navigation - Hide when in active chat */}
      <BottomNav isHidden={!isAuthenticated || isInAnyChat} />
    </>
  );
}

function App() {
  useEffect(() => {
    // Initialize push notifications on app start
    PushNotificationService.initialize().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CityProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
