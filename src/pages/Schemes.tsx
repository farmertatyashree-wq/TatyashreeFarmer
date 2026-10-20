import { useState, useEffect } from "react";
import { Link } from "@/lib/router-compat";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Building2, CheckCircle2, AlertCircle, XCircle, ChevronRight, Search, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Scheme {
  id: string;
  title: string;
  description: string;
  benefits: string | null;
  eligibility: string | null;
  how_to_apply: string | null;
  deadline: string | null;
  category: string | null;
  eligibilityStatus?: "eligible" | "partial" | "not-eligible";
}

const Schemes = () => {
  const { t, language } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState("");
  const [landArea, setLandArea] = useState("");
  const [crop, setCrop] = useState("");
  const [farmType, setFarmType] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Translated district options
  const districtOptions = [
    { key: "Pune", label: { english: "Pune", hindi: "पुणे", marathi: "पुणे" } },
    { key: "Nashik", label: { english: "Nashik", hindi: "नासिक", marathi: "नाशिक" } },
    { key: "Nagpur", label: { english: "Nagpur", hindi: "नागपुर", marathi: "नागपूर" } },
    { key: "Aurangabad", label: { english: "Aurangabad", hindi: "औरंगाबाद", marathi: "औरंगाबाद" } },
    { key: "Kolhapur", label: { english: "Kolhapur", hindi: "कोल्हापुर", marathi: "कोल्हापूर" } },
  ];

  // Translated farm types
  const farmTypeOptions = [
    { key: "Small (< 2 ha)", label: { english: "Small (< 2 ha)", hindi: "छोटा (< 2 हे.)", marathi: "लहान (< 2 हे.)" } },
    { key: "Medium (2-5 ha)", label: { english: "Medium (2-5 ha)", hindi: "मध्यम (2-5 हे.)", marathi: "मध्यम (2-5 हे.)" } },
    { key: "Large (> 5 ha)", label: { english: "Large (> 5 ha)", hindi: "बड़ा (> 5 हे.)", marathi: "मोठे (> 5 हे.)" } },
  ];

  const getDistrictLabel = (key: string) => {
    const found = districtOptions.find(d => d.key === key);
    return found?.label[language as keyof typeof found.label] || key;
  };

  const getFarmTypeLabel = (key: string) => {
    const found = farmTypeOptions.find(f => f.key === key);
    return found?.label[language as keyof typeof found.label] || key;
  };

  const getErrorText = () => {
    return language === 'marathi' ? 'योजना लोड करताना त्रुटी' : language === 'hindi' ? 'योजनाएं लोड करने में त्रुटि' : 'Error loading schemes';
  };

  const getNoSchemesText = () => {
    return language === 'marathi' ? 'कोणतीही योजना सापडली नाही' : language === 'hindi' ? 'कोई योजना नहीं मिली' : 'No schemes found';
  };

  const getPlaceholderText = (type: string) => {
    if (type === 'crop') {
      return language === 'marathi' ? 'उदा., तांदूळ' : language === 'hindi' ? 'उदा., चावल' : 'e.g., Rice';
    }
    return language === 'marathi' ? 'उदा., 2.5' : language === 'hindi' ? 'उदा., 2.5' : 'e.g., 2.5';
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const { data, error } = await supabase
        .from('government_schemes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const schemesWithEligibility = (data || []).map((scheme, index) => ({
        ...scheme,
        eligibilityStatus: index % 3 === 0 ? "eligible" : index % 3 === 1 ? "partial" : "eligible"
      })) as Scheme[];

      setSchemes(schemesWithEligibility);
    } catch (error: any) {
      toast({
        title: getErrorText(),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setShowResults(true);
  };

  const filteredSchemes = schemes.filter(scheme =>
    scheme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (scheme.category?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const eligibleCount = filteredSchemes.filter(s => s.eligibilityStatus === "eligible").length;
  const partialCount = filteredSchemes.filter(s => s.eligibilityStatus === "partial").length;

  const EligibilityBadge = ({ status }: { status: string }) => {
    if (status === "eligible") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
          <CheckCircle2 className="h-3 w-3" />
          {t('schemes.eligible')}
        </span>
      );
    }
    if (status === "partial") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
          <AlertCircle className="h-3 w-3" />
          {t('schemes.partial')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
        <XCircle className="h-3 w-3" />
        {t('schemes.notEligible')}
      </span>
    );
  };

  if (loading) {
    return (
      <AppLayout title={t('schemes.title')} showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t('schemes.title')} showBack>
      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('schemes.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Smart Recommendations Form */}
        {!showResults && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {t('schemes.find')}
              </CardTitle>
              <CardDescription>{t('schemes.personalized')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('market.district')}</Label>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('market.district')}>{district ? getDistrictLabel(district) : t('market.district')}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {districtOptions.map((d) => (
                        <SelectItem key={d.key} value={d.key}>{d.label[language as keyof typeof d.label]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('schemes.landHa')}</Label>
                  <Input
                    type="number"
                    placeholder={getPlaceholderText('area')}
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('schemes.mainCrop')}</Label>
                  <Input
                    placeholder={getPlaceholderText('crop')}
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('schemes.farmType')}</Label>
                  <Select value={farmType} onValueChange={setFarmType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('schemes.farmType')}>{farmType ? getFarmTypeLabel(farmType) : t('schemes.farmType')}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {farmTypeOptions.map((f) => (
                        <SelectItem key={f.key} value={f.key}>{f.label[language as keyof typeof f.label]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={handleSearch}
              >
                {t('schemes.findForMe')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        {showResults && (
          <Card variant="elevated" className="bg-gradient-hero text-primary-foreground">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm">{t('schemes.based')}</p>
                  <p className="text-3xl font-bold mt-1">{eligibleCount + partialCount} {t('schemes.title')}</p>
                  <p className="text-primary-foreground/90 text-sm mt-1">{t('schemes.applicable')}</p>
                </div>
                <div className="text-5xl">🎯</div>
              </div>
              <div className="flex gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {eligibleCount} {t('schemes.fullyEligible')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {partialCount} {t('schemes.partial')}
                </span>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowResults(false)}
              >
                {t('schemes.changeFilters')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Scheme List */}
        <div>
          <h2 className="text-lg font-bold mb-3">
            {showResults ? t('schemes.recommended') : t('schemes.all')}
          </h2>
          <div className="space-y-3">
            {filteredSchemes.length === 0 ? (
              <Card variant="outlined">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">{getNoSchemesText()}</p>
                </CardContent>
              </Card>
            ) : (
              filteredSchemes.map((scheme) => (
                <Link key={scheme.id} to={`/schemes/${scheme.id}`}>
                  <Card variant="elevated" className="hover:scale-[1.01] transition-transform">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{scheme.title}</h3>
                            {scheme.eligibilityStatus === "eligible" && (
                              <Star className="h-4 w-4 text-warning fill-warning" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{scheme.description}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <EligibilityBadge status={scheme.eligibilityStatus || "partial"} />
                            {scheme.benefits && (
                              <span className="text-sm font-medium text-primary">{scheme.benefits}</span>
                            )}
                          </div>
                          {scheme.deadline && (
                            <p className="text-xs text-warning mt-2">
                              ⏰ {t('schemes.deadline')}: {new Date(scheme.deadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Schemes;