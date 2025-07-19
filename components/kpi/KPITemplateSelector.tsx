"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Shield, 
  Handshake,
  Zap,
  Search,
  Filter,
  BookOpen,
  CheckCircle
} from "lucide-react";
import { KPI_CATEGORIES, DIFFICULTY_TIERS } from "@/lib/credibility/kpi-scoring";

interface KPITemplate {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  description: string;
  kpis: any[];
  isPublic: boolean;
  createdAt: string;
}

interface KPITemplateSelectorProps {
  onSelect: (template: KPITemplate) => void;
  selectedTemplate?: KPITemplate | null;
  trigger?: React.ReactNode;
}

export function KPITemplateSelector({ onSelect, selectedTemplate, trigger }: KPITemplateSelectorProps) {
  const [templates, setTemplates] = useState<KPITemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/kpi-templates');
      const data = await response.json();
      if (response.ok) {
        setTemplates(data);
      } else {
        setError(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError('Failed to load KPI templates');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      DEVELOPMENT: <Zap className="w-4 h-4" />,
      GROWTH: <TrendingUp className="w-4 h-4" />,
      COMMUNITY: <Users className="w-4 h-4" />,
      FUNDING: <DollarSign className="w-4 h-4" />,
      SECURITY: <Shield className="w-4 h-4" />,
      PARTNERSHIP: <Handshake className="w-4 h-4" />,
    };
    return icons[category as keyof typeof icons] || <Target className="w-4 h-4" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      EASY: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HARD: "bg-orange-100 text-orange-800",
      EXPERT: "bg-red-100 text-red-800",
    };
    return colors[difficulty as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || template.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleTemplateSelect = (template: KPITemplate) => {
    onSelect(template);
    setDialogOpen(false);
  };

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, KPITemplate[]>);

  const CustomTrigger = () => (
    <DialogTrigger asChild>
      {trigger || (
        <Button variant="outline" className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Select KPI Template
        </Button>
      )}
    </DialogTrigger>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <CustomTrigger />
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Select KPI Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {Object.entries(KPI_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(key)}
                      {value}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                {Object.entries(DIFFICULTY_TIERS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <Badge className={getDifficultyColor(key)}>
                      {value}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Loading templates...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-2">{error}</p>
              <Button onClick={fetchTemplates} size="sm">
                Retry
              </Button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No templates found</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Tabs defaultValue="grid" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="category">By Category</TabsTrigger>
                </TabsList>

                <TabsContent value="grid" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(template.category)}
                              <CardTitle className="text-sm">{template.name}</CardTitle>
                            </div>
                            <Badge className={getDifficultyColor(template.difficulty)}>
                              {template.difficulty}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground mb-3">
                            {template.description}
                          </p>
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">
                              KPIs included:
                            </div>
                            <div className="space-y-1">
                              {template.kpis.slice(0, 3).map((kpi, index) => (
                                <div key={index} className="text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span>{kpi.metric}: {kpi.target} {kpi.unit}</span>
                                </div>
                              ))}
                              {template.kpis.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{template.kpis.length - 3} more...
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="category" className="space-y-6">
                  {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <h3 className="font-medium">{KPI_CATEGORIES[category as keyof typeof KPI_CATEGORIES]}</h3>
                        <Badge variant="outline">{categoryTemplates.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryTemplates.map((template) => (
                          <Card
                            key={template.id}
                            className="cursor-pointer hover:border-primary transition-all duration-200"
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-sm">{template.name}</CardTitle>
                                <Badge className={getDifficultyColor(template.difficulty)}>
                                  {template.difficulty}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-xs text-muted-foreground mb-2">
                                {template.description}
                              </p>
                              <div className="text-xs text-muted-foreground">
                                {template.kpis.length} KPIs • {template.kpis.slice(0, 2).map(k => k.metric).join(', ')}
                                {template.kpis.length > 2 && '...'}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {selectedTemplate && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Selected Template:</span>
              <Badge variant="secondary">{selectedTemplate.name}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedTemplate.description}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 