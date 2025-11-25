import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequest } from "@/utils/apis";
import { Users, FileText, ClipboardList, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useQuery } from '@tanstack/react-query';

interface Stats {
  users: number;
  resumes: number;
  applications: number;
}

export default function AdminHomeComponent() {
  const user = useSelector((state: RootState) => state.user);

  const fetchStats = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/admin/stats/`;
      const response = await getRequest(url);
      if (response.ok) {
        const data = await response.json();
        return data as Stats;
      }
      throw new Error('Failed to fetch stats');
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    }
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{stats?.users || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Resumes</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{stats?.resumes || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
            <ClipboardList className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{stats?.applications || 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
