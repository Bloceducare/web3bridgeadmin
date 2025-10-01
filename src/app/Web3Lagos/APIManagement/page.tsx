"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Database,
  Globe,
  Shield,
  Clock,
  Users,
  BookOpen,
  Calendar
} from 'lucide-react';
import { ScaleLoader } from "react-spinners";

// API Configuration
const API_ENDPOINTS = {
  main: {
    name: 'Main API',
    url: 'https://testy-leonanie-web3bridge-3c7204a2.koyeb.app',
    description: 'Primary production API'
  },
  secondary: {
    name: 'Secondary API',
    url: 'https://overall-ofella-web3bridge-270edff0.koyeb.app',
    description: 'Secondary backup API'
  },
  tertiary: {
    name: 'Tertiary API',
    url: 'https://giant-dorice-web3bridge-89722e9a.koyeb.app',
    description: 'Testing and development API'
  }
};

interface APIStatus {
  isOnline: boolean;
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

interface APIStats {
  participants: number;
  programs: number;
  registrations: number;
  courses: number;
}

export default function APIManagementPage() {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiStatuses, setApiStatuses] = useState<Record<string, APIStatus>>({});
  const [apiStats, setApiStats] = useState<Record<string, APIStats>>({});
  const [selectedApi, setSelectedApi] = useState("main");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      checkAllAPIs(storedToken);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && token) {
      interval = setInterval(() => {
        checkAllAPIs(token);
      }, 30000); // Check every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, token]);

  const checkAllAPIs = async (authToken: string) => {
    setLoading(true);
    const newStatuses: Record<string, APIStatus> = {};
    const newStats: Record<string, APIStats> = {};

    for (const [key, api] of Object.entries(API_ENDPOINTS)) {
      const startTime = Date.now();
      try {
        // Test basic connectivity
        const response = await fetch(`${api.url}/api/v2/cohort/participant/all/`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          newStatuses[key] = {
            isOnline: true,
            responseTime,
            lastChecked: new Date()
          };

          // Get stats if available
          if (data.success) {
            newStats[key] = {
              participants: data.data?.length || 0,
              programs: 0,
              registrations: 0,
              courses: 0
            };

            // Try to get other stats
            try {
              const programsResponse = await fetch(`${api.url}/api/v2/cohort/course/all/`, {
                headers: { Authorization: `Bearer ${authToken}` }
              });
              const programsData = await programsResponse.json();
              if (programsData.success) {
                newStats[key].programs = programsData.data?.length || 0;
              }

              const registrationsResponse = await fetch(`${api.url}/api/v2/cohort/registration/all/`, {
                headers: { Authorization: `Bearer ${authToken}` }
              });
              const registrationsData = await registrationsResponse.json();
              if (registrationsData.success) {
                newStats[key].registrations = registrationsData.data?.length || 0;
              }
            } catch (error) {
              // Ignore stats errors
            }
          }
        } else {
          newStatuses[key] = {
            isOnline: false,
            responseTime,
            lastChecked: new Date(),
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        newStatuses[key] = {
          isOnline: false,
          responseTime,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    setApiStatuses(newStatuses);
    setApiStats(newStats);
    setLoading(false);
  };

  const getStatusIcon = (status: APIStatus) => {
    if (status.isOnline) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: APIStatus) => {
    if (status.isOnline) {
      return <Badge variant="default" className="bg-green-600">Online</Badge>;
    } else {
      return <Badge variant="destructive">Offline</Badge>;
    }
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 1000) return "text-green-600";
    if (responseTime < 3000) return "text-yellow-600";
    return "text-red-600";
  };

  const formatLastChecked = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading && Object.keys(apiStatuses).length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ScaleLoader color="#000" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Management</h1>
            <p className="text-gray-600">Monitor and manage your backend APIs</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="autoRefresh" className="text-sm">Auto refresh</Label>
            </div>
            <Button onClick={() => checkAllAPIs(token)} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(API_ENDPOINTS).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online APIs</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(apiStatuses).filter(status => status.isOnline).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline APIs</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {Object.values(apiStatuses).filter(status => !status.isOnline).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(apiStatuses).length > 0 
                  ? Math.round(Object.values(apiStatuses).reduce((sum, status) => sum + status.responseTime, 0) / Object.values(apiStatuses).length)
                  : 0}ms
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(API_ENDPOINTS).map(([key, api]) => {
          const status = apiStatuses[key];
          const stats = apiStats[key];

          return (
            <Card key={key} className={`${status?.isOnline ? 'border-green-200' : 'border-red-200'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {status ? getStatusIcon(status) : <Activity className="w-5 h-5 text-gray-400" />}
                    <div>
                      <CardTitle className="text-lg">{api.name}</CardTitle>
                      <CardDescription>{api.description}</CardDescription>
                    </div>
                  </div>
                  {status && getStatusBadge(status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API URL */}
                <div>
                  <Label className="text-sm font-medium">Endpoint</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {api.url}
                    </code>
                  </div>
                </div>

                {/* Status Details */}
                {status && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Response Time:</span>
                      <span className={`text-sm font-medium ${getResponseTimeColor(status.responseTime)}`}>
                        {status.responseTime}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Checked:</span>
                      <span className="text-sm text-gray-600">
                        {formatLastChecked(status.lastChecked)}
                      </span>
                    </div>
                    {status.error && (
                      <div className="bg-red-50 p-2 rounded text-xs text-red-700">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {status.error}
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                {stats && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">Data Statistics</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-3 h-3 text-blue-600" />
                        <span>{stats.participants} Participants</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-3 h-3 text-green-600" />
                        <span>{stats.programs} Programs</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-purple-600" />
                        <span>{stats.registrations} Registrations</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Database className="w-3 h-3 text-orange-600" />
                        <span>{stats.courses} Courses</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedApi(key);
                      window.open(api.url, '_blank');
                    }}
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    Visit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedApi(key);
                      window.open(`${api.url}/swagger`, '_blank');
                    }}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Docs
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => checkAllAPIs(token)}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* API Selection for Testing */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              API Testing
            </CardTitle>
            <CardDescription>
              Test specific API endpoints and monitor performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Select API for Testing</Label>
                <Select value={selectedApi} onValueChange={setSelectedApi}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an API" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(API_ENDPOINTS).map(([key, api]) => (
                      <SelectItem key={key} value={key}>
                        {api.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => checkAllAPIs(token)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Selected API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
