import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, FileText, Settings, LogOut, FileEdit, Briefcase, ChevronDown, ChevronLeft, ChevronRight, Home, ClipboardList } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
//import { useView } from "@/hooks/useView";
import { useView } from "@/context/ViewContext";
import { logout } from "@/store/userSlice";
import { postRequest } from "@/utils/apis";
import { deleteCookie } from "@/utils/cookieManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

export default function UserDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentView, setCurrentView } = useView();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const sidebarItems = [
    { name: "Home", icon: Home, path: "/dashboard/home" },
    { name: "Resumes", icon: FileText, path: "/dashboard/resumes" },
    { name: "Resume Builder", icon: FileEdit, path: "/dashboard/resume-builder" },
    //{ name: "Tailor Resume", icon: Sparkles, path: "/dashboard/tailor-resume" },
    { name: "Applications", icon: ClipboardList, path: "/dashboard/applications" },
    { name: "Jobs", icon: Briefcase, path: "/dashboard/jobs" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  const handleNavigation = (itemName: string, path: string) => {
    setCurrentView(itemName.toLowerCase());
    navigate(path);
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/auth/logout/`;
      await postRequest(url, {});
      deleteCookie('token');
      dispatch(logout());
      
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if the API call fails, we should still log out locally
      deleteCookie('token');
      dispatch(logout());
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 w-full">
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your dashboard and resumes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutDialog(false)} disabled={isLoggingOut}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm} className="bg-red-600 hover:bg-red-700" disabled={isLoggingOut}>
              {isLoggingOut ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging out...
                </span>
              ) : (
                'Logout'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" onClick={toggleSidebar} className="mr-4 md:hidden">
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              JobEdge
            </h1>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user?.firstName || "User"} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      {user?.firstName?.[0] || "U"}
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
                <DropdownMenuItem onClick={handleLogoutClick}>
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
        <aside
          className={`absolute bg-white shadow-md inset-y-0 left-0 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0 transition-all duration-200 ease-in-out z-10 ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} w-64`}
        >
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
                        currentView === item.name.toLowerCase()
                          ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 font-semibold"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => handleNavigation(item.name, item.path)}
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
            
            <div className="border-t border-gray-200 mt-4 pt-4">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'px-6'} py-3 text-gray-700 w-full rounded-lg hover:bg-gray-100 transition-colors`}
                      onClick={handleLogoutClick}
                    >
                      <LogOut className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                      {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right">
                      <p>Logout</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto py-8 px-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
