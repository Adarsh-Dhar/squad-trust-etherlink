"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { KPI_CATEGORIES, DIFFICULTY_TIERS, VERIFICATION_TYPES, getDifficultyTier } from "@/lib/credibility/kpi-scoring";

interface KPITemplate {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  description: string;
  kpis: any[];
}

interface MilestoneFormProps {
  projectId: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function MilestoneForm({ projectId, onSubmit, onCancel, loading = false }: MilestoneFormProps) {
  const [isKPIMode, setIsKPIMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<KPITemplate | null>(null);
  const [templates, setTemplates] = useState<KPITemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm();

  const watchedKPI = watch("kpi");
  const watchedTargetValue = watch("targetValue");

  // Auto-detect difficulty when KPI and target value change
  useEffect(() => {
    if (watchedKPI && watchedTargetValue) {
      const difficulty = getDifficultyTier(watchedKPI, watchedTargetValue);
      setValue("difficulty", difficulty);
    }
  }, [watchedKPI, watchedTargetValue, setValue]);

  // Load KPI templates
  useEffect(() => {
    async function loadTemplates() {
      setTemplatesLoading(true);
      try {
        const response = await fetch('/api/kpi-templates');
        const data = await response.json();
        if (response.ok) {
          setTemplates(data);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setTemplatesLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const handleTemplateSelect = (template: KPITemplate) => {
    setSelectedTemplate(template);
    setValue("kpiCategory", template.category);
    setValue("difficulty", template.difficulty);
    setValue("description", template.description);
    setIsKPIMode(true);
    setTemplateDialogOpen(false);
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

  const getStatusIcon = (status: string) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      IN_PROGRESS: <AlertCircle className="w-4 h-4" />,
      ACHIEVED: <CheckCircle className="w-4 h-4" />,
      FAILED: <XCircle className="w-4 h-4" />,
      AT_RISK: <AlertCircle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />;
  };

  const onFormSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      reset();
      setIsKPIMode(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to submit milestone:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          {isKPIMode ? "Create KPI Milestone" : "Create Milestone"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Milestone</TabsTrigger>
            <TabsTrigger value="kpi">KPI Milestone</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register("title", { required: "Title is required" })}
                  placeholder="e.g., Deploy to mainnet"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.title.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe what needs to be accomplished..."
                />
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register("dueDate")}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Milestone"}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="kpi" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="font-medium">KPI Milestone</span>
              </div>
              <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Select KPI Template</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {templatesLoading ? (
                      <div className="col-span-2 text-center py-8">Loading templates...</div>
                    ) : (
                      templates.map((template) => (
                        <Card
                          key={template.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">{template.name}</CardTitle>
                              {getCategoryIcon(template.category)}
                            </div>
                            <Badge className={getDifficultyColor(template.difficulty)}>
                              {template.difficulty}
                            </Badge>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
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

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="kpi-title">Title</Label>
                <Input
                  id="kpi-title"
                  {...register("title", { required: "Title is required" })}
                  placeholder="e.g., Acquire 1,000 users"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.title.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="kpi">KPI Description</Label>
                <Input
                  id="kpi"
                  {...register("kpi", { required: "KPI description is required" })}
                  placeholder="e.g., Acquire 1,000 users"
                />
                {errors.kpi && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.kpi.message as string}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    step="any"
                    {...register("targetValue", { 
                      required: "Target value is required",
                      valueAsNumber: true 
                    })}
                    placeholder="1000"
                  />
                  {errors.targetValue && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.targetValue.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="kpiCategory">Category</Label>
                  <Select onValueChange={(value) => setValue("kpiCategory", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select onValueChange={(value) => setValue("difficulty", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-detected" />
                    </SelectTrigger>
                    <SelectContent>
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

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...register("dueDate")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="verificationMethod">Verification Method</Label>
                <Select onValueChange={(value) => setValue("verificationMethod", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification method" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VERIFICATION_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="oracleSource">Data Source</Label>
                <Input
                  id="oracleSource"
                  {...register("oracleSource")}
                  placeholder="e.g., Google Analytics, DefiLlama, Etherscan"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Additional details about this KPI milestone..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stakeTokens"
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setValue("stakedAmount", 0);
                      setValue("stakeCurrency", "ETH");
                    } else {
                      setValue("stakedAmount", undefined);
                      setValue("stakeCurrency", undefined);
                    }
                  }}
                />
                <Label htmlFor="stakeTokens">Stake tokens for ambitious KPI</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create KPI Milestone"}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 