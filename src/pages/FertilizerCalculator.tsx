import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FlaskConical, Leaf, Droplets, Calculator, Info, ShoppingCart, ExternalLink, Sparkles, Loader2, Calendar, IndianRupee } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useFarmingAI } from '@/hooks/use-farming-ai';
import { AIAdvisoryNotice } from '@/components/AIAdvisoryNotice';
import { useToast } from "@/hooks/use-toast";

const cropTranslations: Record<string, Record<Language, string>> = {
  Wheat: { english: "Wheat", hindi: "गेहूं", marathi: "गहू" },
  Rice: { english: "Rice", hindi: "चावल", marathi: "तांदूळ" },
  Cotton: { english: "Cotton", hindi: "कपास", marathi: "कापूस" },
  Soybean: { english: "Soybean", hindi: "सोयाबीन", marathi: "सोयाबीन" },
  Maize: { english: "Maize", hindi: "मक्का", marathi: "मका" },
  Potato: { english: "Potato", hindi: "आलू", marathi: "बटाटा" },
  Tomato: { english: "Tomato", hindi: "टमाटर", marathi: "टोमॅटो" },
  Onion: { english: "Onion", hindi: "प्याज", marathi: "कांदा" },
  Sugarcane: { english: "Sugarcane", hindi: "गन्ना", marathi: "ऊस" },
  Groundnut: { english: "Groundnut", hindi: "मूंगफली", marathi: "भुईमूग" },
};

interface AIResults {
  npk?: { nitrogen: number; phosphorus: number; potassium: number };
  fertilizers?: { urea: number; dap: number; mop: number };
  schedule?: { stage: string; fertilizer: string; quantity: string; days: string }[];
  organicAlternatives?: { name: string; quantity: string; benefit: string }[];
  tips?: string[];
  estimatedCost?: { urea: number; dap: number; mop: number; total: number };
  rawResponse?: string;
}

const FertilizerCalculator = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const askAI = useFarmingAI();
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [landArea, setLandArea] = useState<string>("");
  const [landUnit, setLandUnit] = useState<string>("acre");
  const [results, setResults] = useState<AIResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCropLabel = (cropName: string) => {
    return cropTranslations[cropName]?.[language] || cropName;
  };

  const getUnitLabel = (unit: string) => {
    const units: Record<string, Record<Language, string>> = {
      acre: { english: "Acre", hindi: "एकड़", marathi: "एकर" },
      hectare: { english: "Hectare", hindi: "हेक्टेयर", marathi: "हेक्टर" },
      guntha: { english: "Guntha", hindi: "गुंठा", marathi: "गुंठा" },
    };
    return units[unit]?.[language] || unit;
  };

  const calculateFertilizer = async () => {
    if (!selectedCrop || !Number.isFinite(Number(landArea)) || Number(landArea) <= 0) {
      toast({
        title: language === 'marathi' ? 'अपूर्ण माहिती' : language === 'hindi' ? 'अपूर्ण जानकारी' : 'Incomplete Information',
        description: language === 'marathi' ? 'कृपया पीक आणि जमीन क्षेत्र निवडा' : language === 'hindi' ? 'कृपया फसल और भूमि क्षेत्र चुनें' : 'Please select crop and land area',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await askAI<AIResults>('fertilizer', {
          crop: selectedCrop,
          landArea: parseFloat(landArea),
          landUnit,
        }, language);
      setResults(data);
      
      toast({
        title: language === 'marathi' ? 'AI शिफारस तयार' : language === 'hindi' ? 'AI सिफारिश तैयार' : 'AI Recommendation Ready',
        description: language === 'marathi' ? 'खत शिफारस मिळाली' : language === 'hindi' ? 'खाद सिफारिश मिली' : 'Fertilizer recommendation generated',
      });
    } catch (error) {
      console.error('AI Fertilizer error:', error);
      toast({
        title: language === 'marathi' ? 'त्रुटी' : language === 'hindi' ? 'त्रुटि' : 'Error',
        description: error instanceof Error ? error.message : 'AI service unavailable',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetCalculator = () => {
    setSelectedCrop("");
    setLandArea("");
    setLandUnit("acre");
    setResults(null);
  };

  const getLabels = () => {
    if (language === 'marathi') {
      return {
        title: 'AI खत कॅल्क्युलेटर',
        subtitle: 'AI द्वारे तुमच्या पिकासाठी खत शिफारस',
        selectCrop: 'पीक निवडा',
        landArea: 'जमीन क्षेत्र',
        unit: 'एकक',
        calculate: 'AI शिफारस मिळवा',
        reset: 'रीसेट',
        results: 'AI खत शिफारस',
        npkRequired: 'NPK आवश्यकता (kg)',
        fertilizerRequired: 'खत आवश्यकता',
        urea: 'युरिया',
        dap: 'DAP',
        mop: 'MOP',
        schedule: 'खत वेळापत्रक',
        organic: 'सेंद्रिय पर्याय',
        tips: 'AI टिप्स',
        cost: 'अंदाजित खर्च',
        buyOnline: 'ऑनलाइन खरेदी करा',
        loading: 'AI विश्लेषण करत आहे...',
      };
    } else if (language === 'hindi') {
      return {
        title: 'AI खाद कैल्कुलेटर',
        subtitle: 'AI द्वारा आपकी फसल के लिए खाद सिफारिश',
        selectCrop: 'फसल चुनें',
        landArea: 'भूमि क्षेत्र',
        unit: 'इकाई',
        calculate: 'AI सिफारिश पाएं',
        reset: 'रीसेट',
        results: 'AI खाद सिफारिश',
        npkRequired: 'NPK आवश्यकता (kg)',
        fertilizerRequired: 'खाद आवश्यकता',
        urea: 'यूरिया',
        dap: 'DAP',
        mop: 'MOP',
        schedule: 'खाद कार्यक्रम',
        organic: 'जैविक विकल्प',
        tips: 'AI टिप्स',
        cost: 'अनुमानित लागत',
        buyOnline: 'ऑनलाइन खरीदें',
        loading: 'AI विश्लेषण कर रहा है...',
      };
    }
    return {
      title: 'AI Fertilizer Calculator',
      subtitle: 'AI-powered fertilizer recommendations for your crop',
      selectCrop: 'Select Crop',
      landArea: 'Land Area',
      unit: 'Unit',
      calculate: 'Get AI Recommendation',
      reset: 'Reset',
      results: 'AI Fertilizer Recommendation',
      npkRequired: 'NPK Required (kg)',
      fertilizerRequired: 'Fertilizer Required',
      urea: 'Urea',
      dap: 'DAP',
      mop: 'MOP',
      schedule: 'Fertilizer Schedule',
      organic: 'Organic Alternatives',
      tips: 'AI Tips',
      cost: 'Estimated Cost',
      buyOnline: 'Buy Online',
      loading: 'AI is analyzing...',
    };
  };

  const labels = getLabels();

  return (
    <AppLayout title={labels.title} showBack>
      <div className="px-4 py-5 space-y-5 animate-fade-in">
        <AIAdvisoryNotice />
        {/* Calculator Form */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {labels.title}
            </CardTitle>
            <CardDescription>{labels.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Crop Selection */}
            <div className="space-y-2">
              <Label>{labels.selectCrop}</Label>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger>
                  <SelectValue placeholder={labels.selectCrop} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(cropTranslations).map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {getCropLabel(crop)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Land Area */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.landArea}</Label>
                <Input
                  type="number"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label>{labels.unit}</Label>
                <Select value={landUnit} onValueChange={setLandUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acre">{getUnitLabel('acre')}</SelectItem>
                    <SelectItem value="hectare">{getUnitLabel('hectare')}</SelectItem>
                    <SelectItem value="guntha">{getUnitLabel('guntha')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button onClick={calculateFertilizer} className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {labels.loading}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {labels.calculate}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetCalculator}>
                {labels.reset}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-4 animate-slide-up">
            {/* NPK Requirements */}
            {results.npk && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-primary" />
                    {labels.npkRequired}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-center">
                      <p className="text-2xl font-bold text-blue-600">{results.npk.nitrogen}</p>
                      <p className="text-xs text-muted-foreground mt-1">N (Nitrogen)</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-500/10 text-center">
                      <p className="text-2xl font-bold text-orange-600">{results.npk.phosphorus}</p>
                      <p className="text-xs text-muted-foreground mt-1">P (Phosphorus)</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/10 text-center">
                      <p className="text-2xl font-bold text-purple-600">{results.npk.potassium}</p>
                      <p className="text-xs text-muted-foreground mt-1">K (Potassium)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fertilizer Quantities */}
            {results.fertilizers && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-success" />
                    {labels.fertilizerRequired}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Urea */}
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-success">{labels.urea}</p>
                        <p className="text-xs text-muted-foreground">(46% N)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{results.fertilizers.urea} kg</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => window.open(`https://www.agrostar.in/search?searchKey=urea`, '_blank')}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        AgroStar
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* DAP */}
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-warning">{labels.dap}</p>
                        <p className="text-xs text-muted-foreground">(18% N, 46% P)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{results.fertilizers.dap} kg</p>
                      </div>
                    </div>
                  </div>

                  {/* MOP */}
                  <div className="p-3 rounded-xl bg-info/10 border border-info/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-info">{labels.mop}</p>
                        <p className="text-xs text-muted-foreground">(60% K)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{results.fertilizers.mop} kg</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fertilizer Schedule */}
            {results.schedule && results.schedule.length > 0 && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {labels.schedule}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {results.schedule.map((item, index) => (
                    <div key={index} className="p-3 rounded-xl bg-muted">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{item.stage}</p>
                          <p className="text-xs text-muted-foreground">{item.fertilizer}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.quantity}</p>
                          <p className="text-xs text-muted-foreground">{item.days}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Estimated Cost */}
            {results.estimatedCost && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-success" />
                    {labels.cost}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">{labels.urea}</p>
                      <p className="font-semibold">₹{results.estimatedCost.urea}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">{labels.dap}</p>
                      <p className="font-semibold">₹{results.estimatedCost.dap}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">{labels.mop}</p>
                      <p className="font-semibold">₹{results.estimatedCost.mop}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <p className="text-xs text-primary">Total</p>
                      <p className="font-bold text-primary">₹{results.estimatedCost.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organic Alternatives */}
            {results.organicAlternatives && results.organicAlternatives.length > 0 && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-success" />
                    {labels.organic}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {results.organicAlternatives.map((item, index) => (
                    <div key={index} className="p-3 rounded-xl bg-success/5 border border-success/20">
                      <p className="font-semibold text-sm text-success">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity}</p>
                      <p className="text-xs mt-1">{item.benefit}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* AI Tips */}
            {results.tips && results.tips.length > 0 && (
              <Card variant="outlined" className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    {labels.tips}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Raw Response Fallback */}
            {results.rawResponse && !results.npk && (
              <Card variant="elevated">
                <CardContent className="p-4">
                  <p className="text-sm whitespace-pre-wrap">{results.rawResponse}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default FertilizerCalculator;
