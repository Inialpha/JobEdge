import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRequest } from '@/utils/apis';
import { Users, FileText, ClipboardList, Loader2, TrendingUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateCount {
  date: string;
  count: number;
}

interface AnalyticsData {
  users_over_time: DateCount[];
  resumes_over_time: DateCount[];
  applications_over_time: DateCount[];
  today: {
    users: number;
    resumes: number;
    applications: number;
  };
  yesterday: {
    users: number;
    resumes: number;
    applications: number;
  };
  date_range: {
    start: string;
    end: string;
  };
}

export default function AnalyticsComponent() {
  const [days, setDays] = useState(30);

  const fetchAnalytics = async () => {
    const url = `${import.meta.env.VITE_API_URL}/admin/analytics/?days=${days}`;
    try {
      const res = await getRequest(url);
      if (res.ok) {
        const data = await res.json();
        return data as AnalyticsData;
      }
      throw new Error("Unable to load analytics");
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['adminAnalytics', days],
    queryFn: fetchAnalytics,
  });

  useEffect(() => {
    refetch();
  }, [days, refetch]);

  // Calculate max for chart scaling
  const getMaxCount = (data: DateCount[] = []) => {
    if (data.length === 0) return 10;
    return Math.max(...data.map(d => d.count), 1);
  };

  // Simple bar chart component
  const SimpleBarChart = ({ 
    data, 
    color, 
    label 
  }: { 
    data: DateCount[]; 
    color: string; 
    label: string;
  }) => {
    const maxCount = getMaxCount(data);
    const lastNDays = data.slice(-Math.min(7, data.length));
    
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-400">
          No data available for this period
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-600">{label}</div>
        <div className="flex items-end space-x-1 h-32">
          {lastNDays.map((item, index) => {
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const formattedDate = new Date(item.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-1">{item.count}</div>
                <div 
                  className={`w-full rounded-t transition-all duration-300 ${color}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${formattedDate}: ${item.count}`}
                />
                <div className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                  {formattedDate}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track platform activity over time</p>
        </div>
        <Select value={days.toString()} onValueChange={(val) => setDays(parseInt(val))}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Today vs Yesterday Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Today</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.today.users || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {analytics?.yesterday.users || 0} yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumes Today</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.today.resumes || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {analytics?.yesterday.resumes || 0} yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Today</CardTitle>
            <ClipboardList className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.today.applications || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {analytics?.yesterday.applications || 0} yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              User Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart 
              data={analytics?.users_over_time || []} 
              color="bg-blue-500" 
              label="New users per day"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-purple-500" />
              Resume Creations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart 
              data={analytics?.resumes_over_time || []} 
              color="bg-purple-500" 
              label="New resumes per day"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ClipboardList className="h-4 w-4 mr-2 text-green-500" />
              Application Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart 
              data={analytics?.applications_over_time || []} 
              color="bg-green-500" 
              label="New applications per day"
            />
          </CardContent>
        </Card>
      </div>

      {/* Date Range Info */}
      <div className="text-sm text-gray-500 flex items-center">
        <Calendar className="h-4 w-4 mr-2" />
        Showing data from {analytics?.date_range.start} to {analytics?.date_range.end}
      </div>
    </div>
  );
}
