import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Bell, Search, Menu, X, FileText, Settings, LogOut } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useView } from "@/hooks/useView";

export default function UserDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const { activeView, setActiveView } = useView("resumes");

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const sidebarItems = [
    { name: "Resumes", icon: FileText, path: "/dashboard/resumes" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  const handleNavigation = (itemName: string, path: string) => {
    setActiveView(itemName.toLowerCase());
    navigate(path);
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    // TODO: Implement logout functionality
    navigate("/login");
  };

  return (
    <div className="h-screen bg-gray-100 w-full">
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

          <div className="relative flex-1 max-w-md mx-4 hidden md:block">
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 rounded-full"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder-avatar.jpg" alt={user?.firstName || "User"} />
              <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                {user?.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)] w-full relative">
        {/* Sidebar */}
        <aside
          className={`absolute w-64 bg-white shadow-md inset-y-0 left-0 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0 transition duration-200 ease-in-out z-10`}
        >
          <nav className="py-4 px-2">
            {sidebarItems.map((item) => (
              <button
                key={item.name}
                className={`flex items-center px-6 py-3 text-gray-700 w-full rounded-lg transition-colors ${
                  activeView === item.name.toLowerCase()
                    ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 font-semibold"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => handleNavigation(item.name, item.path)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </button>
            ))}
            
            <div className="border-t border-gray-200 mt-4 pt-4">
              <button
                className="flex items-center px-6 py-3 text-gray-700 w-full rounded-lg hover:bg-gray-100 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
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
