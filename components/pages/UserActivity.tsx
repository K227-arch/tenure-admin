'use client'

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserCheck, UserX, Activity, User } from "lucide-react";

async function fetchUserActivity() {
  const response = await fetch('/api/users/activity');
  if (!response.ok) {
    throw new Error('Failed to fetch user activity');
  }
  return response.json();
}

export default function UserActivity() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-activity'],
    queryFn: fetchUserActivity,
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">User Activity</h1>
          <p className="text-muted-foreground">Loading user activity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">User Activity</h1>
          <p className="text-muted-foreground text-red-500">Error loading user activity. Please check your database connection.</p>
        </div>
      </div>
    );
  }

  const { metrics, users } = data;

  const stats = [
    {
      title: "Total Users",
      value: metrics.totalUsers.toString(),
      change: `${metrics.totalUsers} registered`,
      icon: Users,
      gradient: "bg-gradient-primary",
    },
    {
      title: "Online Now",
      value: metrics.onlineNow.toString(),
      change: "Active in last 30 min",
      icon: UserCheck,
      gradient: "bg-gradient-success",
    },
    {
      title: "Active Today",
      value: metrics.activeToday.toString(),
      change: `${metrics.dailyRetention}% retention`,
      icon: Activity,
      gradient: "bg-gradient-warning",
    },
    {
      title: "Inactive Users",
      value: metrics.inactiveUsers.toString(),
      change: "No recent activity",
      icon: UserX,
      gradient: "bg-destructive",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          User Activity Dashboard
        </h1>
        <p className="text-muted-foreground">
          Real-time user activity and engagement metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.gradient}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Retention Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Retention Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Retention</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${metrics.dailyRetention}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold">{metrics.dailyRetention}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Weekly Retention</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full" 
                      style={{ width: `${metrics.weeklyRetention}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold">{metrics.weeklyRetention}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Online Now</span>
                </div>
                <span className="text-sm font-bold">{metrics.onlineNow}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Active Today</span>
                </div>
                <span className="text-sm font-bold">{metrics.activeToday - metrics.onlineNow}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Active This Week</span>
                </div>
                <span className="text-sm font-bold">{metrics.activeThisWeek - metrics.activeToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm">Inactive</span>
                </div>
                <span className="text-sm font-bold">{metrics.inactiveUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Online Users */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Online Users ({users.online.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.online.length > 0 ? users.online.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No users currently online</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recently Active */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Recently Active ({users.today.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.today.length > 0 ? users.today.slice(0, 10).map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Last active: {user.last_active ? new Date(user.last_active).toLocaleTimeString() : 'Unknown'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity today</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inactive Users */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Inactive Users ({users.inactive.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
            {users.inactive.length > 0 ? users.inactive.slice(0, 12).map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.last_active ? `Last: ${new Date(user.last_active).toLocaleDateString()}` : 'Never active'}
                  </p>
                </div>
                <Badge 
                  variant={user.status === 'suspended' ? 'destructive' : 'secondary'} 
                  className="text-xs"
                >
                  {user.status}
                </Badge>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4 col-span-full">All users are active!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}