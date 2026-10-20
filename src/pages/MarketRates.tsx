import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, IndianRupee, ArrowUpRight, ArrowDownRight, Loader2, Sparkles, Lightbulb, AlertCircle, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface CropPrice {
  id: string;
  crop_name: string;
  market_name: string;
  district: string | null;
  state: string | null;
  min_price: number | null;
  max_price: number | null;
  modal_price: number | null;
  updated_on: string;
  change?: number;
  trend?: "up" | "down" | "stable";
  weekData?: { day: string; price: number }[];
}

interface AIAnalysis {
  summary?: string;
  priceAnalysis?: {
    averagePrice: number;
    trend: string;
    recommendation: string;
  };
  marketInsights?: { insight: string; impact: string }[];
  bestMarkets?: { market: string; price: number; reason: string }[];
  pricePrediction?: {
    nextWeek: string;
    nextMonth: string;
    factors: string[];
  };
  sellingTips?: string[];
  alerts?: { type: string; message: string }[];
  rawResponse?: string;
}

const MarketRates = () => {
  const { t, language } = useLanguage();
  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState<CropPrice | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const { toast } = useToast();

  const getDistrictLabel = (district: string) => {
    const districtNames: Record<string, Record<string, string>> = {
      all: { english: "All Districts", hindi: "सभी जिले", marathi: "सर्व जिल्हे" },
      Pune: { english: "Pune", hindi: "पुणे", marathi: "पुणे" },
      Nashik: { english: "Nashik", hindi: "नासिक", marathi: "नाशिक" },
      Nagpur: { english: "Nagpur", hindi: "नागपुर", marathi: "नागपूर" },
      Aurangabad: { english: "Aurangabad", hindi: "औरंगाबाद", marathi: "औरंगाबाद" },
      Kolhapur: { english: "Kolhapur", hindi: "कोल्हापुर", marathi: "कोल्हापूर" },
    };
    return districtNames[district]?.[language] || district;
  };

  const getCropLabel = (crop: string) => {
    if (crop === "all") {
      return language === 'marathi' ? 'सर्व पिके' : language === 'hindi' ? 'सभी फसलें' : 'All Crops';
    }
    const cropNames: Record<string, Record<string, string>> = {
      Wheat: { english: "Wheat", hindi: "गेहूं", marathi: "गहू" },
      Rice: { english: "Rice", hindi: "चावल", marathi: "तांदूळ" },
      Cotton: { english: "Cotton", hindi: "कपास", marathi: "कापूस" },
      Soybean: { english: "Soybean", hindi: "सोयाबीन", marathi: "सोयाबीन" },
      Onion: { english: "Onion", hindi: "प्याज", marathi: "कांदा" },
      Tomato: { english: "Tomato", hindi: "टमाटर", marathi: "टोमॅटो" },
      Potato: { english: "Potato", hindi: "आलू", marathi: "बटाटा" },
      Sugarcane: { english: "Sugarcane", hindi: "गन्ना", marathi: "ऊस" },
      Maize: { english: "Maize", hindi: "मक्का", marathi: "मका" },
      Groundnut: { english: "Groundnut", hindi: "मूंगफली", marathi: "भुईमूग" },
    };
    return cropNames[crop]?.[language] || crop;
  };

  const districtOptions = ["all", "Pune", "Nashik", "Nagpur", "Aurangabad", "Kolhapur"];

  const getLabels = () => {
    if (language === 'marathi') {
      return {
        aiAnalysis: 'AI बाजार विश्लेषण',
        getAiInsights: 'AI शिफारसी मिळवा',
        loading: 'AI विश्लेषण करत आहे...',
        summary: 'सारांश',
        recommendation: 'शिफारस',
        insights: 'बाजार माहिती',
        bestMarkets: 'सर्वोत्तम बाजार',
        prediction: 'किंमत अंदाज',
        nextWeek: 'पुढील आठवडा',
        nextMonth: 'पुढील महिना',
        sellingTips: 'विक्री टिप्स',
        alerts: 'सूचना',
      };
    } else if (language === 'hindi') {
      return {
        aiAnalysis: 'AI बाजार विश्लेषण',
        getAiInsights: 'AI सुझाव पाएं',
        loading: 'AI विश्लेषण कर रहा है...',
        summary: 'सारांश',
        recommendation: 'सिफारिश',
        insights: 'बाजार जानकारी',
        bestMarkets: 'सर्वोत्तम बाजार',
        prediction: 'कीमत अनुमान',
        nextWeek: 'अगला सप्ताह',
        nextMonth: 'अगला महीना',
        sellingTips: 'बिक्री टिप्स',
        alerts: 'सूचनाएं',
      };
    }
    return {
      aiAnalysis: 'AI Market Analysis',
      getAiInsights: 'Get AI Insights',
      loading: 'AI is analyzing...',
      summary: 'Summary',
      recommendation: 'Recommendation',
      insights: 'Market Insights',
      bestMarkets: 'Best Markets',
      prediction: 'Price Prediction',
      nextWeek: 'Next Week',
      nextMonth: 'Next Month',
      sellingTips: 'Selling Tips',
      alerts: 'Alerts',
    };
  };

  const labels = getLabels();

  useEffect(() => {
    syncAndFetchPrices();
  }, []);

  const syncAndFetchPrices = async () => {
    try {
      await supabase.functions.invoke('mandi-prices-sync');
      await fetchPrices();
    } catch (error) {
      console.error("Sync error:", error);
      await fetchPrices();
    }
  };

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('mandi_prices')
        .select('*')
        .order('updated_on', { ascending: false });

      if (error) throw error;

      const pricesWithTrend = (data || []).map(price => {
        const change = (Math.random() - 0.3) * 15;
        const trend = change > 2 ? "up" : change < -2 ? "down" : "stable";
        const basePrice = price.modal_price || 3000;
        
        return {
          ...price,
          change: parseFloat(change.toFixed(1)),
          trend,
          weekData: Array.from({ length: 7 }, (_, i) => ({
            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
            price: Math.round(basePrice + (Math.random() - 0.5) * 300),
          })),
        };
      }) as CropPrice[];

      setPrices(pricesWithTrend);
    } catch (error: any) {
      toast({
        title: "Error loading prices",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: {
          crop: selectedCrop,
          district: selectedDistrict,
          language
        }
      });

      if (error) throw error;
      setAiAnalysis(data.analysis);
      
      toast({
        title: language === 'marathi' ? 'AI विश्लेषण तयार' : language === 'hindi' ? 'AI विश्लेषण तैयार' : 'AI Analysis Ready',
        description: language === 'marathi' ? 'बाजार विश्लेषण मिळाले' : language === 'hindi' ? 'बाजार विश्लेषण मिला' : 'Market analysis generated',
      });
    } catch (error) {
      console.error('AI Market Analysis error:', error);
      toast({
        title: language === 'marathi' ? 'त्रुटी' : language === 'hindi' ? 'त्रुटि' : 'Error',
        description: language === 'marathi' ? 'विश्लेषण मिळवता आले नाही' : language === 'hindi' ? 'विश्लेषण नहीं मिल सका' : 'Could not get analysis',
        variant: 'destructive'
      });
    } finally {
      setAiLoading(false);
    }
  };

  const cropKeys = ["all", ...new Set(prices.map(p => p.crop_name))];

  const filteredPrices = prices.filter(p => {
    const cropMatch = selectedCrop === "all" || p.crop_name === selectedCrop;
    const districtMatch = selectedDistrict === "all" || p.district === selectedDistrict;
    return cropMatch && districtMatch;
  });

  const TrendIcon = ({ trend }: { trend?: string }) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <AppLayout title={t('market.title')} showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t('market.title')} showBack>
      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Filters */}
        <Card variant="elevated">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('market.crop')}</label>
                <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                  <SelectTrigger>
                    <SelectValue>{getCropLabel(selectedCrop)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cropKeys.map((c) => (
                      <SelectItem key={c} value={c}>{getCropLabel(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('market.district')}</label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger>
                    <SelectValue>{getDistrictLabel(selectedDistrict)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {districtOptions.map((d) => (
                      <SelectItem key={d} value={d}>{getDistrictLabel(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* AI Analysis Button */}
            <Button 
              className="w-full" 
              onClick={getAIAnalysis}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {labels.loading}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {labels.getAiInsights}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Analysis Results */}
        {aiAnalysis && (
          <div className="space-y-4 animate-slide-up">
            {/* Summary */}
            {aiAnalysis.summary && (
              <Card variant="outlined" className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">{labels.summary}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Price Analysis */}
            {aiAnalysis.priceAnalysis && (
              <Card variant="elevated">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <span className="font-semibold">{labels.recommendation}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      aiAnalysis.priceAnalysis.recommendation === 'sell' ? 'bg-success/20 text-success' :
                      aiAnalysis.priceAnalysis.recommendation === 'hold' ? 'bg-warning/20 text-warning' :
                      'bg-info/20 text-info'
                    }`}>
                      {aiAnalysis.priceAnalysis.recommendation.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Trend: <span className="capitalize font-medium">{aiAnalysis.priceAnalysis.trend}</span>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Best Markets */}
            {aiAnalysis.bestMarkets && aiAnalysis.bestMarkets.length > 0 && (
              <Card variant="elevated">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-success" />
                    {labels.bestMarkets}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {aiAnalysis.bestMarkets.map((market, i) => (
                    <div key={i} className="p-3 rounded-xl bg-success/5 border border-success/20">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{market.market}</span>
                        <span className="text-success font-bold">₹{market.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{market.reason}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Price Prediction */}
            {aiAnalysis.pricePrediction && (
              <Card variant="elevated">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-info" />
                    {labels.prediction}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-muted">
                      <p className="text-xs text-muted-foreground">{labels.nextWeek}</p>
                      <p className="font-semibold">{aiAnalysis.pricePrediction.nextWeek}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted">
                      <p className="text-xs text-muted-foreground">{labels.nextMonth}</p>
                      <p className="font-semibold">{aiAnalysis.pricePrediction.nextMonth}</p>
                    </div>
                  </div>
                  {aiAnalysis.pricePrediction.factors && (
                    <ul className="space-y-1">
                      {aiAnalysis.pricePrediction.factors.map((factor, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {factor}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Selling Tips */}
            {aiAnalysis.sellingTips && aiAnalysis.sellingTips.length > 0 && (
              <Card variant="outlined" className="border-warning/30 bg-warning/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-warning" />
                    {labels.sellingTips}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiAnalysis.sellingTips.map((tip, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Alerts */}
            {aiAnalysis.alerts && aiAnalysis.alerts.length > 0 && (
              <Card variant="outlined" className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 space-y-2">
                  {aiAnalysis.alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Chart */}
        {selectedPrice && selectedPrice.weekData && (
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{selectedPrice.crop_name} - {t('market.trend')}</span>
                <span 
                  className="text-sm cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedPrice(null)}
                >
                  ✕
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedPrice.weekData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      domain={['dataMin - 100', 'dataMax + 100']}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`₹${value}`, 'Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price List */}
        <div>
          <h2 className="text-lg font-bold mb-3">{t('market.today')}</h2>
          <div className="space-y-3">
            {filteredPrices.length === 0 ? (
              <Card variant="outlined">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">{language === 'marathi' ? 'किंमती उपलब्ध नाहीत' : language === 'hindi' ? 'कीमतें उपलब्ध नहीं' : 'No prices available'}</p>
                </CardContent>
              </Card>
            ) : (
              filteredPrices.map((crop) => (
                <Card 
                  key={crop.id}
                  variant="elevated" 
                  className="cursor-pointer hover:scale-[1.01] transition-transform"
                  onClick={() => setSelectedPrice(crop)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{crop.crop_name}</h3>
                        <p className="text-sm text-muted-foreground">{crop.market_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          <span className="text-xl font-bold">
                            {(crop.modal_price || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${
                          crop.trend === 'up' ? 'text-success' : 
                          crop.trend === 'down' ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {crop.trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5" />}
                          {crop.trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5" />}
                          <span>{(crop.change || 0) > 0 ? '+' : ''}{crop.change}%</span>
                          <TrendIcon trend={crop.trend} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Market Info */}
        <Card variant="outlined" className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">{t('market.info')}</h3>
            <p className="text-sm text-muted-foreground">{t('market.updated')}</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MarketRates;
