import { useState } from "react";
import { 
  //ChevronDown,
  Layout,
  Settings,
  Users,
  //Mic,
  BarChart,
  FileText,
  Menu,
  X,
  FileEdit,
  Sparkles,
  Briefcase,
  ChevronDown,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SettingsComponent from '@/components/dashboard/admin/setting/settings';
import { useSelector } from 'react-redux';
import AnalyticsComponent from '@/components/dashboard/admin/Analytics'
import UsersComponent from '@/components/dashboard/admin/Users'
import { RootState } from '@/store/store';
import ResumeComponent from "@/components/dashboard/admin/Resume"
import { useView } from "@/hooks/useView";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const DashboardHome = () => <div className="p-4">Dashboard Home Content</div>


export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const user = useSelector((state: RootState) => state.user);
  const { activeView, setActiveView } = useView("dashboard");
  const navigate = useNavigate();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed)

  const sidebarItems = [
    { name: "Dashboard", icon: Layout, component: DashboardHome },
    { name: "Analytics", icon: BarChart, component: AnalyticsComponent },
    { name: "Users", icon: Users, component: UsersComponent },
    { name: "Resumes", icon: FileText, component: ResumeComponent },
    { name: "Resume Builder", icon: FileEdit, path: "/dashboard/resume-builder" },
    { name: "Tailor Resume", icon: Sparkles, path: "/dashboard/tailor-resume" },
    { name: "Jobs", icon: Briefcase, path: "/dashboard/jobs" },
    { name: "Settings", icon: Settings, component: SettingsComponent },
  ]
  
  const MainComponent = sidebarItems.find((item) => item.name.toLowerCase() === activeView)?.component || DashboardHome

  return (
    <div className="h-screen bg-gray-50 w-full">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" onClick={toggleSidebar} className="mr-4 md:hidden">

            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              JobEdge Admin
            </h1>
          </div>
          
          <div className="flex-1"></div>

          <div className="flex ml-4 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      {user?.firstName?.[0] || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  navigate('/login');
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="flex h-[calc(100vh-73px)] w-full relative">
      {/* Sidebar */}
       <aside className={`absolute bg-white shadow-md inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}  md:relative md:translate-x-0 transition-all duration-200 ease-in-out z-10 ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} w-64`}>
        {/* Collapse/Expand Button - Only visible on medium screens and above */}
        <div className="hidden md:flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapse}
            className="h-8 w-8"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <nav className="py-4 px-2">
          <TooltipProvider delayDuration={0}>
            {sidebarItems.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <button
                    className={`flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'px-6'} py-3 text-gray-700 w-full rounded-lg transition-colors ${
                      activeView === item.name.toLowerCase() 
                        ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 font-semibold" 
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      if (item.path) {
                        // If navigating to resume-builder or tailor-resume, set the component state
                        const viewName = item.name.toLowerCase();
                        navigate(item.path, { state: { component: viewName } });
                      } else {
                        setActiveView(item.name.toLowerCase());
                      }
                    }}
                  >
                    <item.icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <MainComponent />

          </div>
        </main>
      </div>
    </div>
  )
}
