import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Bell,
  //ChevronDown,
  Layout,
  Settings,
  Users,
  //Mic,
  BarChart,
  FileText,
  Search,
  Menu,
  X,
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


const DashboardHome = () => <div className="p-4">Dashboard Home Content</div>


export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useSelector((state: RootState) => state.user);
  const { activeView, setActiveView } = useView("dashboard");
  //console.log(user)
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const sidebarItems = [
    { name: "Dashboard", icon: Layout, component: DashboardHome },
    { name: "Analytics", icon: BarChart, component: AnalyticsComponent },
    { name: "Settings", icon: Settings, component: SettingsComponent },
    { name: "Users", icon: Users, component: UsersComponent },
    { name: "Resumes", icon: FileText, component: ResumeComponent },
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
          <div className="flex ml-4 items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
              <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                {user?.firstName?.[0] || "A"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <div className="flex h-[calc(100vh-73px)] w-full relative">
      {/* Sidebar */}
       <aside className={`absolute w-64 bg-white shadow-md inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}  md:relative md:translate-x-0 transition duration-200 ease-in-out z-10`}>
        <nav className="py-4 px-2">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              className={`flex items-center px-6 py-3 text-gray-700 w-full rounded-lg transition-colors ${
                activeView === item.name.toLowerCase() 
                  ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 font-semibold" 
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveView(item.name.toLowerCase())}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </button>
          ))}
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
