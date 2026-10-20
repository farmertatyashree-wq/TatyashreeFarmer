import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FolderOpen, 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText,
  Plus,
  Edit2,
  Trash2,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface SavedScheme {
  id: string;
  name: string;
  benefit: string;
  status: "pending" | "applied" | "approved" | "rejected";
  applicationNumber?: string;
  appliedDate?: string;
  documents: { name: string; completed: boolean }[];
  notes?: string;
}

const initialSchemes: SavedScheme[] = [
  {
    id: "1",
    name: "PM-KISAN Samman Nidhi",
    benefit: "₹6,000/year",
    status: "approved",
    applicationNumber: "PMKISAN2024567890",
    appliedDate: "Oct 15, 2024",
    documents: [
      { name: "Aadhaar Card", completed: true },
      { name: "Land Records", completed: true },
      { name: "Bank Details", completed: true },
      { name: "Photograph", completed: true }
    ]
  },
  {
    id: "2",
    name: "PM Fasal Bima Yojana",
    benefit: "Up to ₹2 lakh",
    status: "applied",
    applicationNumber: "PMFBY2024123456",
    appliedDate: "Nov 20, 2024",
    documents: [
      { name: "Land Records", completed: true },
      { name: "Bank Details", completed: true },
      { name: "Sowing Certificate", completed: false },
      { name: "Aadhaar Card", completed: true }
    ]
  },
  {
    id: "3",
    name: "Micro Irrigation Subsidy",
    benefit: "Up to 90% subsidy",
    status: "pending",
    documents: [
      { name: "Land Records", completed: true },
      { name: "Quotation from vendor", completed: false },
      { name: "Bank Details", completed: true },
      { name: "Aadhaar Card", completed: true }
    ]
  },
];

const MySchemes = () => {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState(initialSchemes);
  const [activeTab, setActiveTab] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [applicationNum, setApplicationNum] = useState("");
  const { toast } = useToast();

  const statusConfig = {
    pending: { label: t('myschemes.pending'), color: "text-muted-foreground", bg: "bg-muted", icon: Clock },
    applied: { label: t('myschemes.applied'), color: "text-info", bg: "bg-info/10", icon: FileText },
    approved: { label: t('myschemes.approved'), color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
    rejected: { label: "Rejected", color: "text-destructive", bg: "bg-destructive/10", icon: Circle },
  };

  const toggleDocument = (schemeId: string, docIndex: number) => {
    setSchemes(prev => prev.map(s => {
      if (s.id === schemeId) {
        const newDocs = [...s.documents];
        newDocs[docIndex].completed = !newDocs[docIndex].completed;
        return { ...s, documents: newDocs };
      }
      return s;
    }));
  };

  const updateApplicationNumber = (schemeId: string) => {
    setSchemes(prev => prev.map(s => {
      if (s.id === schemeId) {
        return { 
          ...s, 
          applicationNumber: applicationNum, 
          status: "applied" as const,
          appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
      return s;
    }));
    setEditingId(null);
    setApplicationNum("");
    toast({ title: "Application number saved!" });
  };

  const removeScheme = (schemeId: string) => {
    setSchemes(prev => prev.filter(s => s.id !== schemeId));
    toast({ title: "Scheme removed from tracking" });
  };

  const filteredSchemes = activeTab === "all" 
    ? schemes 
    : schemes.filter(s => s.status === activeTab);

  const getDocumentProgress = (scheme: SavedScheme) => {
    const completed = scheme.documents.filter(d => d.completed).length;
    return Math.round((completed / scheme.documents.length) * 100);
  };

  return (
    <AppLayout title={t('myschemes.title')} showBack>
      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card variant="outlined" className="border-success/30 bg-success/5">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-success">
                {schemes.filter(s => s.status === "approved").length}
              </p>
              <p className="text-xs text-muted-foreground">{t('myschemes.approved')}</p>
            </CardContent>
          </Card>
          <Card variant="outlined" className="border-info/30 bg-info/5">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-info">
                {schemes.filter(s => s.status === "applied").length}
              </p>
              <p className="text-xs text-muted-foreground">{t('myschemes.applied')}</p>
            </CardContent>
          </Card>
          <Card variant="outlined" className="border-muted-foreground/30">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">
                {schemes.filter(s => s.status === "pending").length}
              </p>
              <p className="text-xs text-muted-foreground">{t('myschemes.pending')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">{t('myschemes.all')}</TabsTrigger>
            <TabsTrigger value="pending">{t('myschemes.pending')}</TabsTrigger>
            <TabsTrigger value="applied">{t('myschemes.applied')}</TabsTrigger>
            <TabsTrigger value="approved">{t('myschemes.approved')}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {filteredSchemes.length === 0 ? (
              <Card variant="outlined" className="border-dashed">
                <CardContent className="p-8 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t('myschemes.noSchemes')}</p>
                  <Button variant="link" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('myschemes.browse')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredSchemes.map((scheme) => {
                const status = statusConfig[scheme.status];
                const StatusIcon = status.icon;
                const progress = getDocumentProgress(scheme);

                return (
                  <Card key={scheme.id} variant="elevated">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{scheme.name}</CardTitle>
                          <p className="text-sm text-primary font-medium mt-1">{scheme.benefit}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Application Number */}
                      {scheme.status !== "pending" && scheme.applicationNumber && (
                        <div className="p-3 rounded-xl bg-muted">
                          <p className="text-xs text-muted-foreground">{t('myschemes.appNumber')}</p>
                          <p className="font-mono font-semibold mt-1">{scheme.applicationNumber}</p>
                          {scheme.appliedDate && (
                            <p className="text-xs text-muted-foreground mt-1">{t('myschemes.appliedOn')}: {scheme.appliedDate}</p>
                          )}
                        </div>
                      )}

                      {/* Add Application Number */}
                      {scheme.status === "pending" && (
                        editingId === scheme.id ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder={t('myschemes.appNumber')}
                              value={applicationNum}
                              onChange={(e) => setApplicationNum(e.target.value)}
                            />
                            <Button size="icon" onClick={() => updateApplicationNumber(scheme.id)}>
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setEditingId(scheme.id)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            {t('myschemes.addAppNumber')}
                          </Button>
                        )
                      )}

                      {/* Document Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">{t('myschemes.documents')}</p>
                          <span className="text-xs text-muted-foreground">{progress}% {t('myschemes.complete')}</span>
                        </div>
                        <Progress value={progress} className="h-2 mb-3" />
                        <div className="space-y-2">
                          {scheme.documents.map((doc, index) => (
                            <div 
                              key={index}
                              className="flex items-center gap-3 p-2 rounded-lg bg-muted cursor-pointer hover:bg-muted/80"
                              onClick={() => toggleDocument(scheme.id, index)}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                doc.completed 
                                  ? 'bg-success border-success' 
                                  : 'border-muted-foreground'
                              }`}>
                                {doc.completed && <CheckCircle2 className="h-3 w-3 text-success-foreground" />}
                              </div>
                              <span className={`text-sm ${doc.completed ? 'text-muted-foreground line-through' : ''}`}>
                                {doc.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
                        onClick={() => removeScheme(scheme.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('myschemes.remove')}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MySchemes;