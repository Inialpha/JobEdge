import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
//import { useSelector } from 'react-redux';
import { getRequest } from '@/utils/apis';

import { Users, Calendar, Activity, ThumbsUp } from 'lucide-react';
import CircularLoader from '@/components/ui/circularLoader';

type Stat = {
  title: string;
  value: number;
  icon: any;
  color: string;
}

export default function AnalyticsComponent() {

  //const user = useSelector((state) => state.user);                                        console.log(user)

  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true)


  useEffect(() => {
    const fetchStats = async () => {
      const url = `${import.meta.env.VITE_API_URL}/stats/`;
      try {
        const res = await getRequest(url);
        if (res.ok) {
          const stats = await res.json()
          console.log(stats)
          const statsList = [
    { title: "Total Users", value: stats.users, icon: Users, color: "text-blue-500" },
    { title: "Active Treatments", value: stats.treatments, icon: Activity, color: "text-green-500" },
    { title: "Appointments This Month", value: 0, icon: Calendar, color: "text-yellow-500" },
    { title: "Positive Reviews", value: 0, icon: ThumbsUp, color: "text-purple-500" },
    {title: "Total Waitlist", value: stats.waitlist_users, icon: Users, color: "text-blue-500" }
  ]
          setStats(statsList);
          setIsLoading(false)
        } else {
          console.log("unable to load users")
          setIsLoading(false)
        }
      } catch (error) {
        console.log(error)
        setIsLoading(false)
      }
    }
    fetchStats()
  },[]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularLoader size="large" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
      <Tabs defaultValue="published" className="w-full">
        <TabsList className="grid w-full grid-cols-4 
">
          <TabsTrigger value=""></TabsTrigger>
          <TabsTrigger value=""></TabsTrigger>
          <TabsTrigger value=""></TabsTrigger>
        </TabsList>
        <TabsContent value="">
        </TabsContent>
        <TabsContent value="">
        </TabsContent>
        <TabsContent value="">
        </TabsContent>
      </Tabs>
    </div>
  )
}
