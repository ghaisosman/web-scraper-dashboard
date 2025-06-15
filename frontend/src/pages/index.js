
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Activity, 
  Target, 
  Database, 
  Settings, 
  Plus, 
  Play, 
  Trash2, 
  Edit,
  TrendingUp,
  Clock,
  Globe
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const API_BASE = 'http://localhost:5000/api';

// API functions
const api = {
  getTargets: () => fetch(`${API_BASE}/targets`).then(res => res.json()),
  addTarget: (target: any) => fetch(`${API_BASE}/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(target)
  }).then(res => res.json()),
  updateTarget: (id: number, target: any) => fetch(`${API_BASE}/targets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(target)
  }).then(res => res.json()),
  deleteTarget: (id: number) => fetch(`${API_BASE}/targets/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),
  getScrapedData: (targetId?: number) => fetch(`${API_BASE}/data${targetId ? `?targetId=${targetId}` : ''}`).then(res => res.json()),
  manualScrape: (id: number) => fetch(`${API_BASE}/scrape/${id}`, {
    method: 'POST'
  }).then(res => res.json()),
  getStats: () => fetch(`${API_BASE}/stats`).then(res => res.json()),
  getSettings: () => fetch(`${API_BASE}/settings`).then(res => res.json()),
  updateSettings: (settings: any) => fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  }).then(res => res.json())
};

interface Target {
  id: number;
  name: string;
  url: string;
  selector: string;
  type: string;
  category: string;
  active: number;
  created_at: string;
}

interface ScrapedData {
  id: number;
  target_id: number;
  target_name: string;
  category: string;
  data: string[];
  scraped_at: string;
}

interface Stats {
  totalTargets: number;
  activeTargets: number;
  todayData: number;
  totalData: number;
}

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Queries
  const { data: targets = [], isLoading: targetsLoading } = useQuery({
    queryKey: ['targets'],
    queryFn: api.getTargets
  });

  const { data: scrapedData = [], isLoading: dataLoading } = useQuery({
    queryKey: ['scrapedData'],
    queryFn: () => api.getScrapedData()
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats
  });

  // Mutations
  const addTargetMutation = useMutation({
    mutationFn: api.addTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setIsAddDialogOpen(false);
      toast({ title: 'Target added successfully!' });
    },
    onError: () => {
      toast({ title: 'Error adding target', variant: 'destructive' });
    }
  });

  const updateTargetMutation = useMutation({
    mutationFn: ({ id, target }: { id: number; target: any }) => api.updateTarget(id, target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      setIsEditDialogOpen(false);
      toast({ title: 'Target updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Error updating target', variant: 'destructive' });
    }
  });

  const deleteTargetMutation = useMutation({
    mutationFn: api.deleteTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({ title: 'Target deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Error deleting target', variant: 'destructive' });
    }
  });

  const manualScrapeMutation = useMutation({
    mutationFn: api.manualScrape,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scrapedData'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({ title: `Scraped ${data.dataCount} items successfully!` });
    },
    onError: () => {
      toast({ title: 'Error during scraping', variant: 'destructive' });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Web Scraper Dashboard</h1>
          <p className="text-gray-600">Manage your scraping targets and monitor collected data</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Targets</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTargets || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Targets</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.activeTargets || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Data</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.todayData || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.totalData || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="targets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="targets">Scraping Targets</TabsTrigger>
            <TabsTrigger value="data">Scraped Data</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Targets Tab */}
          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Scraping Targets</CardTitle>
                    <CardDescription>Manage your web scraping targets</CardDescription>
                  </div>
                  <AddTargetDialog 
                    isOpen={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    onAdd={(target) => addTargetMutation.mutate(target)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {targets.map((target: Target) => (
                    <div key={target.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{target.name}</h3>
                            <Badge variant={target.active ? "default" : "secondary"}>
                              {target.active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{target.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <Globe className="inline h-3 w-3 mr-1" />
                            {target.url}
                          </p>
                          <p className="text-sm text-gray-500">
                            Selector: <code className="bg-gray-100 px-1 rounded">{target.selector}</code>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => manualScrapeMutation.mutate(target.id)}
                            disabled={manualScrapeMutation.isPending}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTarget(target);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTargetMutation.mutate(target.id)}
                            disabled={deleteTargetMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scraped Data</CardTitle>
                <CardDescription>View and analyze collected data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scrapedData.map((item: ScrapedData) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{item.target_name}</h3>
                          <p className="text-sm text-gray-500">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {new Date(item.scraped_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <div className="grid gap-2">
                        {item.data.slice(0, 5).map((dataItem, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            {dataItem}
                          </div>
                        ))}
                        {item.data.length > 5 && (
                          <p className="text-sm text-gray-500">
                            ... and {item.data.length - 5} more items
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <SettingsPanel />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        {selectedTarget && (
          <EditTargetDialog
            target={selectedTarget}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onUpdate={(target) => updateTargetMutation.mutate({ id: selectedTarget.id, target })}
          />
        )}
      </div>
    </div>
  );
};

// Add Target Dialog Component
const AddTargetDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (target: any) => void;
}> = ({ isOpen, onOpenChange, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    selector: '',
    type: 'text',
    category: 'general'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ name: '', url: '', selector: '', type: 'text', category: 'general' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Target
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Scraping Target</DialogTitle>
          <DialogDescription>Configure a new website to scrape data from</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Target Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Latest News Headlines"
              required
            />
          </div>
          <div>
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="selector">CSS Selector</Label>
            <Input
              id="selector"
              value={formData.selector}
              onChange={(e) => setFormData(prev => ({ ...prev, selector: e.target.value }))}
              placeholder="h1, .title, #content"
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Scraping Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Static Content</SelectItem>
                <SelectItem value="dynamic">Dynamic Content (JS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="news, products, etc."
            />
          </div>
          <Button type="submit" className="w-full">Add Target</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Target Dialog Component
const EditTargetDialog: React.FC<{
  target: Target;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (target: any) => void;
}> = ({ target, isOpen, onOpenChange, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: target.name,
    url: target.url,
    selector: target.selector,
    type: target.type,
    category: target.category,
    active: target.active
  });

  useEffect(() => {
    setFormData({
      name: target.name,
      url: target.url,
      selector: target.selector,
      type: target.type,
      category: target.category,
      active: target.active
    });
  }, [target]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Scraping Target</DialogTitle>
          <DialogDescription>Update the scraping target configuration</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Target Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-url">Website URL</Label>
            <Input
              id="edit-url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-selector">CSS Selector</Label>
            <Input
              id="edit-selector"
              value={formData.selector}
              onChange={(e) => setFormData(prev => ({ ...prev, selector: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-type">Scraping Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Static Content</SelectItem>
                <SelectItem value="dynamic">Dynamic Content (JS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-category">Category</Label>
            <Input
              id="edit-category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-active"
              checked={!!formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked ? 1 : 0 }))}
            />
            <Label htmlFor="edit-active">Active</Label>
          </div>
          <Button type="submit" className="w-full">Update Target</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Settings Panel Component
const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState({
    scrape_time: '09:00',
    max_retries: '3',
    timeout: '30000'
  });

  const { data: currentSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  const updateSettingsMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      toast({ title: 'Settings updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Error updating settings', variant: 'destructive' });
    }
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Settings</CardTitle>
        <CardDescription>Configure scraping behavior and schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="scrape_time">Daily Scrape Time</Label>
            <Input
              id="scrape_time"
              type="time"
              value={settings.scrape_time}
              onChange={(e) => setSettings(prev => ({ ...prev, scrape_time: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="max_retries">Max Retries</Label>
            <Input
              id="max_retries"
              type="number"
              value={settings.max_retries}
              onChange={(e) => setSettings(prev => ({ ...prev, max_retries: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="timeout">Request Timeout (ms)</Label>
            <Input
              id="timeout"
              type="number"
              value={settings.timeout}
              onChange={(e) => setSettings(prev => ({ ...prev, timeout: e.target.value }))}
            />
          </div>
          <Button type="submit" disabled={updateSettingsMutation.isPending}>
            <Settings className="h-4 w-4 mr-2" />
            Update Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
