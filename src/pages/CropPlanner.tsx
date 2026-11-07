import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sprout, IndianRupee, Calendar, Droplets, FlaskConical, TrendingUp, CheckCircle2, Sparkles, Loader2, Bug, ShoppingBag, AlertTriangle } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useFarmingAI } from '@/hooks/use-farming-ai';
import { AIAdvisoryNotice } from '@/components/AIAdvisoryNotice';
import { useToast } from "@/hooks/use-toast";

const getTranslatedOptions = (language: Language) => {
  const cropTranslations: Record<string, Record<Language, string>> = {
    Rice: { english: "Rice", hindi: "चावल", marathi: "तांदूळ" },
    Wheat: { english: "Wheat", hindi: "गेहूं", marathi: "गहू" },
    Cotton: { english: "Cotton", hindi: "कपास", marathi: "कापूस" },
    Sugarcane: { english: "Sugarcane", hindi: "गन्ना", marathi: "ऊस" },
    Maize: { english: "Maize", hindi: "मक्का", marathi: "मका" },
    Soybean: { english: "Soybean", hindi: "सोयाबीन", marathi: "सोयाबीन" },
    Groundnut: { english: "Groundnut", hindi: "मूंगफली", marathi: "भुईमूग" },
    Tomato: { english: "Tomato", hindi: "टमाटर", marathi: "टोमॅटो" },
    Onion: { english: "Onion", hindi: "प्याज", marathi: "कांदा" },
    Potato: { english: "Potato", hindi: "आलू", marathi: "बटाटा" },
  };
  
  const soilTranslations: Record<string, Record<Language, string>> = {
    Clay: { english: "Clay", hindi: "चिकनी मिट्टी", marathi: "चिकणमाती" },
    Sandy: { english: "Sandy", hindi: "रेतीली", marathi: "वाळूमिश्रित" },
    Loamy: { english: "Loamy", hindi: "दोमट", marathi: "गाळाची माती" },
    "Black Cotton": { english: "Black Cotton", hindi: "काली मिट्टी", marathi: "काळी माती" },
    "Red Soil": { english: "Red Soil", hindi: "लाल मिट्टी", marathi: "तांबडी माती" },
    Alluvial: { english: "Alluvial", hindi: "जलोढ़ मिट्टी", marathi: "गाळाची जमीन" },
  };
  
  const waterTranslations: Record<string, Record<Language, string>> = {
    "Canal Irrigation": { english: "Canal Irrigation", hindi: "नहर सिंचाई", marathi: "कालवा सिंचन" },
    Borewell: { english: "Borewell", hindi: "बोरवेल", marathi: "बोअरवेल" },
    "Rain-fed": { english: "Rain-fed", hindi: "वर्षा आधारित", marathi: "पावसावर आधारित" },
    "Drip Irrigation": { english: "Drip Irrigation", hindi: "ड्रिप सिंचाई", marathi: "ठिबक सिंचन" },
    Sprinkler: { english: "Sprinkler", hindi: "स्प्रिंकलर", marathi: "तुषार सिंचन" },
  };
  
  return {
    crops: Object.keys(cropTranslations),
    getCropLabel: (key: string) => cropTranslations[key]?.[language] || key,
    soilTypes: Object.keys(soilTranslations),
    getSoilLabel: (key: string) => soilTranslations[key]?.[language] || key,
    waterOptions: Object.keys(waterTranslations),
    getWaterLabel: (key: string) => waterTranslations[key]?.[language] || key,
  };
};

interface AICropPlan {
  crop?: string;
  area?: number;
  estimatedCost?: {
    seed: number;
    fertilizer: number;
    pesticide: number;
    irrigation?: number;
    labor?: number;
    total: number;
  };
  profitRange?: {
    min: number;
    max: number;
    factors?: string[];
  };
  timeline?: {
    stage: string;
    days: number;
    duration?: string;
    tasks: string[];
    criticalPoints?: string[];
  }[];
  fertilizerSchedule?: {
    stage: string;
    fertilizer: string;
    quantity: string;
    method?: string;
  }[];
  waterSchedule?: {
    frequency: string;
    method?: string;
    criticalStages?: string[];
    tips?: string[];
  };
  pestManagement?: {
    pest: string;
    stage: string;
    prevention: string;
    treatment: string;
  }[];
  harvestGuidelines?: {
    expectedDays: number;
    signs: string[];
    method: string;
    postHarvest: string[];
  };
  marketTips?: {
    bestSellTime: string;
    grading: string;
    expectedPrice: string;
  };
  rawResponse?: string;
}

const CropPlanner = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const askAI = useFarmingAI();
  const [crop, setCrop] = useState("");
  const [area, setArea] = useState("");
  const [water, setWater] = useState("");
  const [soil, setSoil] = useState("");
  const [plan, setPlan] = useState<AICropPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const options = getTranslatedOptions(language);

  const handleSubmit = async () => {
    if (!crop || !Number.isFinite(Number(area)) || Number(area) <= 0 || !water || !soil) {
      toast({
        title: language === 'marathi' ? 'अपूर्ण माहिती' : language === 'hindi' ? 'अपूर्ण जानकारी' : 'Incomplete Information',
        description: language === 'marathi' ? 'कृपया सर्व माहिती भरा' : language === 'hindi' ? 'कृपया सभी जानकारी भरें' : 'Please fill all information',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await askAI<AICropPlan>('planner', {
          crop,
          area: parseFloat(area),
          waterSource: water,
          soilType: soil,
        }, language);
      setPlan(data);
      
      toast({
        title: language === 'marathi' ? 'AI योजना तयार' : language === 'hindi' ? 'AI योजना तैयार' : 'AI Plan Ready',
        description: language === 'marathi' ? 'तुमची पीक योजना तयार आहे' : language === 'hindi' ? 'आपकी फसल योजना तैयार है' : 'Your crop plan is ready',
      });
    } catch (error) {
      console.error('AI Crop Planner error:', error);
      toast({
        title: language === 'marathi' ? 'त्रुटी' : language === 'hindi' ? 'त्रुटि' : 'Error',
        description: error instanceof Error ? error.message : 'AI service unavailable',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLabels = () => {
    if (language === 'marathi') {
      return {
        title: 'AI पीक नियोजक',
        description: 'AI द्वारे संपूर्ण पीक नियोजन',
        generate: 'AI योजना बनवा',
        loading: 'AI विश्लेषण करत आहे...',
        cost: 'अंदाजित खर्च',
        profit: 'अंदाजित नफा',
        timeline: 'पीक कालावधी',
        fertSchedule: 'खत वेळापत्रक',
        waterSchedule: 'पाणी व्यवस्थापन',
        pestManagement: 'कीड व्यवस्थापन',
        harvest: 'काढणी मार्गदर्शक',
        market: 'बाजार टिप्स',
      };
    } else if (language === 'hindi') {
      return {
        title: 'AI फसल नियोजक',
        description: 'AI द्वारा संपूर्ण फसल नियोजन',
        generate: 'AI योजना बनाएं',
        loading: 'AI विश्लेषण कर रहा है...',
        cost: 'अनुमानित लागत',
        profit: 'अनुमानित लाभ',
        timeline: 'फसल समयरेखा',
        fertSchedule: 'खाद कार्यक्रम',
        waterSchedule: 'पानी प्रबंधन',
        pestManagement: 'कीट प्रबंधन',
        harvest: 'कटाई मार्गदर्शिका',
        market: 'बाजार टिप्स',
      };
    }
    return {
      title: 'AI Crop Planner',
      description: 'Complete AI-powered crop planning',
      generate: 'Generate AI Plan',
      loading: 'AI is analyzing...',
      cost: 'Estimated Cost',
      profit: 'Expected Profit',
      timeline: 'Crop Timeline',
      fertSchedule: 'Fertilizer Schedule',
      waterSchedule: 'Water Management',
      pestManagement: 'Pest Management',
      harvest: 'Harvest Guidelines',
      market: 'Market Tips',
    };
  };

  const labels = getLabels();

  return (
    <AppLayout title={labels.title} showBack>
      <div className="px-4 py-5 space-y-5 animate-fade-in">
        <AIAdvisoryNotice />
        {/* Input Form */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {labels.title}
            </CardTitle>
            <CardDescription>{labels.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('planner.selectCrop')}</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger>
                  <SelectValue placeholder={t('planner.selectCrop')}>{crop ? options.getCropLabel(crop) : t('planner.selectCrop')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.crops.map((c) => (
                    <SelectItem key={c} value={c}>{options.getCropLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('planner.landArea')}</Label>
              <Input
                type="number"
                placeholder={language === 'marathi' ? 'उदा., 2.5' : language === 'hindi' ? 'उदा., 2.5' : 'e.g., 2.5'}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('planner.waterSource')}</Label>
              <Select value={water} onValueChange={setWater}>
                <SelectTrigger>
                  <SelectValue placeholder={t('planner.waterSource')}>{water ? options.getWaterLabel(water) : t('planner.waterSource')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.waterOptions.map((w) => (
                    <SelectItem key={w} value={w}>{options.getWaterLabel(w)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('planner.soilType')}</Label>
              <Select value={soil} onValueChange={setSoil}>
                <SelectTrigger>
                  <SelectValue placeholder={t('planner.soilType')}>{soil ? options.getSoilLabel(soil) : t('planner.soilType')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.soilTypes.map((s) => (
                    <SelectItem key={s} value={s}>{options.getSoilLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="hero" 
              size="lg" 
              className="w-full mt-2"
              onClick={handleSubmit}
              disabled={!crop || !area || !water || !soil || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {labels.loading}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {labels.generate}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {plan && (
          <div className="space-y-4 animate-slide-up">
            {/* Cost & Profit Summary */}
            {plan.estimatedCost && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-success" />
                    {labels.cost}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted">
                      <p className="text-xs text-muted-foreground">{t('planner.seedCost')}</p>
                      <p className="text-lg font-bold">₹{plan.estimatedCost.seed?.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted">
                      <p className="text-xs text-muted-foreground">{t('planner.fertilizer')}</p>
                      <p className="text-lg font-bold">₹{plan.estimatedCost.fertilizer?.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted">
                      <p className="text-xs text-muted-foreground">{t('planner.pesticide')}</p>
                      <p className="text-lg font-bold">₹{plan.estimatedCost.pesticide?.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10">
                      <p className="text-xs text-primary">{t('planner.totalCost')}</p>
                      <p className="text-lg font-bold text-primary">₹{plan.estimatedCost.total?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {plan.profitRange && (
                    <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-success" />
                        <span className="font-semibold text-success">{labels.profit}</span>
                      </div>
                      <p className="text-2xl font-bold">
                        ₹{plan.profitRange.min?.toLocaleString()} - ₹{plan.profitRange.max?.toLocaleString()}
                      </p>
                      {plan.profitRange.factors && (
                        <div className="mt-2 space-y-1">
                          {plan.profitRange.factors.map((factor, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {factor}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            {plan.timeline && plan.timeline.length > 0 && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-info" />
                    {labels.timeline}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {plan.timeline.map((stage, index) => (
                      <div key={stage.stage} className="flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            {index === (plan.timeline?.length ?? 0) - 1 ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span className="text-sm font-bold">{index + 1}</span>
                            )}
                          </div>
                          {index < (plan.timeline?.length ?? 0) - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{stage.stage}</h4>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              Day {stage.days}
                            </span>
                          </div>
                          {stage.duration && (
                            <p className="text-xs text-primary mt-1">{stage.duration}</p>
                          )}
                          <ul className="mt-2 space-y-1">
                            {stage.tasks?.map((task, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {task}
                              </li>
                            ))}
                          </ul>
                          {stage.criticalPoints && stage.criticalPoints.length > 0 && (
                            <div className="mt-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                              {stage.criticalPoints.map((point, i) => (
                                <p key={i} className="text-xs text-warning flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {point}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fertilizer Schedule */}
            {plan.fertilizerSchedule && plan.fertilizerSchedule.length > 0 && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-warning" />
                    {labels.fertSchedule}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.fertilizerSchedule.map((item, index) => (
                    <div key={index} className="p-3 rounded-xl bg-muted">
                      <p className="font-semibold text-sm">{item.stage}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="text-foreground">{item.fertilizer}</span> • {item.quantity}
                      </p>
                      {item.method && (
                        <p className="text-xs text-primary mt-1">{item.method}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Water Schedule */}
            {plan.waterSchedule && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-info" />
                    {labels.waterSchedule}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 rounded-xl bg-info/10">
                    <p className="font-semibold text-sm text-info">{plan.waterSchedule.frequency}</p>
                    {plan.waterSchedule.method && (
                      <p className="text-sm text-muted-foreground mt-1">{plan.waterSchedule.method}</p>
                    )}
                    {plan.waterSchedule.tips && plan.waterSchedule.tips.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {plan.waterSchedule.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pest Management */}
            {plan.pestManagement && plan.pestManagement.length > 0 && (
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bug className="h-5 w-5 text-destructive" />
                    {labels.pestManagement}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.pestManagement.map((item, index) => (
                    <div key={index} className="p-3 rounded-xl bg-muted">
                      <p className="font-semibold text-sm text-destructive">{item.pest}</p>
                      <p className="text-xs text-muted-foreground">{item.stage}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs"><span className="text-success">Prevention:</span> {item.prevention}</p>
                        <p className="text-xs"><span className="text-warning">Treatment:</span> {item.treatment}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Market Tips */}
            {plan.marketTips && (
              <Card variant="outlined" className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    {labels.market}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><strong>Best time to sell:</strong> {plan.marketTips.bestSellTime}</p>
                  <p className="text-sm"><strong>Grading:</strong> {plan.marketTips.grading}</p>
                  <p className="text-sm"><strong>Expected price:</strong> {plan.marketTips.expectedPrice}</p>
                </CardContent>
              </Card>
            )}

            {/* Raw Response Fallback */}
            {plan.rawResponse && !plan.estimatedCost && (
              <Card variant="elevated">
                <CardContent className="p-4">
                  <p className="text-sm whitespace-pre-wrap">{plan.rawResponse}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CropPlanner;
