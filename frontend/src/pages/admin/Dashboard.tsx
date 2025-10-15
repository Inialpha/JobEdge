import { useState, useEffect } from "react";
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
import { useLocation } from 'react-router-dom';
import AnalyticsComponent from '@/components/dashboard/admin/Analytics'
import UsersComponent from '@/components/dashboard/admin/Users'
import { RootState } from '@/store/store';
import ResumeComponent from "@/components/dashboard/admin/Resume"


const DashboardHome = () => <div className="p-4">Dashboard Home Content</div>


export default function AdminDashboard() {
  const [activeItem, setActiveItem] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useSelector((state: RootState) => state.user);
  console.log(user)
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const sidebarItems = [
    { name: "Dashboard", icon: Layout, component: DashboardHome },
    { name: "Analytics", icon: BarChart, component: AnalyticsComponent },
    { name: "Settings", icon: Settings, component: SettingsComponent },
    { name: "Users", icon: Users, component: UsersComponent },
    { name: "Resumes", icon: FileText, component: ResumeComponent },
  ]
  
  const location = useLocation();

  const state = location.state || {};
  useEffect(() => {
    if (state && state.component) {
      console.log(state.component)
      setActiveItem(state.component);
    }
  }, []);
      

  const MainComponent = sidebarItems.find((item) => item.name.toLowerCase() === activeItem)?.component || DashboardHome

  return (
    <div className=" h-screen bg-gray-100 w-full">
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" onClick={toggleSidebar} className="mr-4 md:hidden">

            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <div className="relative md:ml-60 ">
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 rounded-full"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex ml-4 items-center">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="ml- flex items-center">
              <Avatar>
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              </div>
            </div>
          </div>
        </header>
      <div className="flex h-screen w-full relative space-x-">
      {/* Sidebar */}
      {/*<aside className="absolute w-64 bg-white shadow-md">*/}
       <aside className={`absolute w-64 space-y-6 py-7 px-2  inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}  md:relative md:translate-x-0 transition duration-200 ease-in-out`}>
        <nav className="">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              className={`flex items-center px-6 py-3 text-gray-700 w-full ${
                activeItem === item.name.toLowerCase() ? "bg-gray-200" : ""
              }`}
              onClick={() => setActiveItem(item.name.toLowerCase())}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      {/*<div className="flex-1 flex flex-col overflow-hidden">*/}
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="container mx-auto px-6 py-8">
            <MainComponent />

          </div>
        </main>
      </div>
    </div>
  )
}
