import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Droplets, 
  Wind, 
  Umbrella,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Loader2,
  RefreshCw,
  Sparkles,
  Bug,
  Leaf,
  Calendar
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WeatherDay {
  dayName: string;
  date: string;
  high: number;
  low: number;
  condition: "sunny" | "cloudy" | "rainy" | "partly-cloudy";
  rainChance: number;
  humidity: number;
}

interface CurrentWeather {
  temperature: number;
  humidity: number;
  rainChance: number;
  condition: string;
  windSpeed: number;
}

interface AIAdvice {
  farmingAdvice?: {
    sprayingRecommended: boolean;
    sprayingReason: string;
    wateringRecommended: boolean;
    wateringReason: string;
    fieldWorkAdvice: string;
    harvestingAdvice: string;
  };
  alerts?: { type: string; severity: string; message: string }[];
  weeklyPlan?: { day: string; activities: string[] }[];
  cropProtection?: {
    pestRisk: string;
    diseaseRisk: string;
    recommendations: string[];
  };
}

interface WeatherData {
  location: string;
  current: CurrentWeather;
  forecast: WeatherDay[];
  alerts: { type: string; severity: string; message: string }[];
  sprayRecommendation: boolean;
  wateringRecommendation: boolean;
  aiAdvice?: AIAdvice;
}

const weatherIcons: Record<string, any> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  "partly-cloudy": Cloud,
};

const Weather = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getLocale = () => {
    switch (language) {
      case 'marathi': return 'mr';
      case 'hindi': return 'hi';
      default: return 'en';
    }
  };

  const fetchWeather = async (latitude: number, longitude: number, locationName?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('ai-weather', {
        body: { latitude, longitude, location: locationName, language }
      });

      if (error) throw error;
      setWeatherData(data);
      setLocationError(null);
    } catch (err) {
      console.error('Weather fetch error:', err);
      toast({
        title: t('common.error'),
        description: t('weather.fetch_error') || "Failed to fetch weather data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError(t('weather.geo_not_supported') || "Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locale = getLocale();
        
        try {
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${locale}`
          );
          const geoData = await geoResponse.json();
          const locationName = geoData.address?.village || 
                              geoData.address?.town || 
                              geoData.address?.city || 
                              geoData.address?.district ||
                              geoData.address?.state ||
                              t('weather.your_location');
          
          await fetchWeather(latitude, longitude, locationName);
        } catch {
          await fetchWeather(latitude, longitude);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = t('weather.location_error') || "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = t('weather.permission_denied') || "Location permission denied. Please enable location access.";
        }
        setLocationError(errorMessage);
        setLoading(false);
        
        const fallbackName = language === 'marathi' ? 'महाराष्ट्र' : language === 'hindi' ? 'महाराष्ट्र' : 'Maharashtra';
        fetchWeather(19.7515, 75.7139, fallbackName);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  const getLabels = () => {
    if (language === 'marathi') {
      return {
        aiPowered: 'AI हवामान सल्लागार',
        fieldWork: 'शेतीकाम सल्ला',
        pestRisk: 'कीटक धोका',
        diseaseRisk: 'रोग धोका',
        weeklyPlan: 'साप्ताहिक शेती योजना',
        cropProtection: 'पीक संरक्षण',
      };
    } else if (language === 'hindi') {
      return {
        aiPowered: 'AI मौसम सलाहकार',
        fieldWork: 'खेती कार्य सलाह',
        pestRisk: 'कीट जोखिम',
        diseaseRisk: 'रोग जोखिम',
        weeklyPlan: 'साप्ताहिक खेती योजना',
        cropProtection: 'फसल संरक्षण',
      };
    }
    return {
      aiPowered: 'AI Weather Advisor',
      fieldWork: 'Field Work Advice',
      pestRisk: 'Pest Risk',
      diseaseRisk: 'Disease Risk',
      weeklyPlan: 'Weekly Farming Plan',
      cropProtection: 'Crop Protection',
    };
  };

  const labels = getLabels();

  if (loading) {
    return (
      <AppLayout title={t('weather.title')} showBack>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('weather.loading') || 'Getting AI weather analysis...'}</p>
        </div>
      </AppLayout>
    );
  }

  if (!weatherData) {
    return (
      <AppLayout title={t('weather.title')} showBack>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <MapPin className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">{locationError || 'Unable to load weather'}</p>
          <Button onClick={getLocation} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const { current, forecast, aiAdvice } = weatherData;
  const isSafeForSpray = weatherData.sprayRecommendation;
  const shouldWater = weatherData.wateringRecommendation;
  const WeatherIcon = weatherIcons[current.condition] || Cloud;

  return (
    <AppLayout title={t('weather.title')} showBack>
      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Location Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{labels.aiPowered}</p>
                  <p className="text-lg font-bold text-foreground">{weatherData.location}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={getLocation}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Weather */}
        <Card variant="elevated" className="overflow-hidden">
          <div className="bg-gradient-sky p-5 text-info-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-info-foreground/80 text-sm">{t('weather.current')}</p>
                <p className="text-5xl font-bold mt-1">{current.temperature}°C</p>
                <p className="text-info-foreground/90 mt-1 capitalize">
                  {current.condition.replace("-", " ")}
                </p>
              </div>
              <div className="w-20 h-20 bg-info-foreground/20 rounded-3xl flex items-center justify-center">
                <WeatherIcon className="h-12 w-12 text-info-foreground animate-float" />
              </div>
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-info-foreground/20">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                <span className="text-sm">{current.humidity}% {t('weather.humidity')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4" />
                <span className="text-sm">{current.windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-2">
                <Umbrella className="h-4 w-4" />
                <span className="text-sm">{current.rainChance}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Smart Alerts */}
        <div className="grid grid-cols-2 gap-3">
          <Card variant={isSafeForSpray ? "outlined" : "elevated"} className={
            isSafeForSpray 
              ? "border-success/30 bg-success/5" 
              : "border-destructive/30 bg-destructive/5"
          }>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {isSafeForSpray ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-semibold text-sm">{t('weather.spray.status')}</span>
              </div>
              <p className={`text-lg font-bold ${isSafeForSpray ? 'text-success' : 'text-destructive'}`}>
                {isSafeForSpray ? t('weather.spray.safe') : t('weather.spray.notsafe')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {aiAdvice?.farmingAdvice?.sprayingReason || (isSafeForSpray ? t('weather.spray.good') : t('weather.spray.bad'))}
              </p>
            </CardContent>
          </Card>

          <Card variant={shouldWater ? "outlined" : "elevated"} className={
            shouldWater 
              ? "border-info/30 bg-info/5" 
              : "border-warning/30 bg-warning/5"
          }>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className={`h-5 w-5 ${shouldWater ? 'text-info' : 'text-warning'}`} />
                <span className="font-semibold text-sm">{t('weather.watering')}</span>
              </div>
              <p className={`text-lg font-bold ${shouldWater ? 'text-info' : 'text-warning'}`}>
                {shouldWater ? t('weather.water.yes') : t('weather.water.skip')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {aiAdvice?.farmingAdvice?.wateringReason || (shouldWater ? t('weather.water.today') : t('weather.water.save'))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Field Work Advice */}
        {aiAdvice?.farmingAdvice?.fieldWorkAdvice && (
          <Card variant="outlined" className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">{labels.fieldWork}</span>
              </div>
              <p className="text-sm text-muted-foreground">{aiAdvice.farmingAdvice.fieldWorkAdvice}</p>
            </CardContent>
          </Card>
        )}

        {/* Crop Protection */}
        {aiAdvice?.cropProtection && (
          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bug className="h-5 w-5 text-warning" />
                {labels.cropProtection}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className={`p-3 rounded-xl text-center ${
                  aiAdvice.cropProtection.pestRisk === 'high' ? 'bg-destructive/10' :
                  aiAdvice.cropProtection.pestRisk === 'medium' ? 'bg-warning/10' : 'bg-success/10'
                }`}>
                  <p className="text-xs text-muted-foreground">{labels.pestRisk}</p>
                  <p className={`font-bold capitalize ${
                    aiAdvice.cropProtection.pestRisk === 'high' ? 'text-destructive' :
                    aiAdvice.cropProtection.pestRisk === 'medium' ? 'text-warning' : 'text-success'
                  }`}>{aiAdvice.cropProtection.pestRisk}</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${
                  aiAdvice.cropProtection.diseaseRisk === 'high' ? 'bg-destructive/10' :
                  aiAdvice.cropProtection.diseaseRisk === 'medium' ? 'bg-warning/10' : 'bg-success/10'
                }`}>
                  <p className="text-xs text-muted-foreground">{labels.diseaseRisk}</p>
                  <p className={`font-bold capitalize ${
                    aiAdvice.cropProtection.diseaseRisk === 'high' ? 'text-destructive' :
                    aiAdvice.cropProtection.diseaseRisk === 'medium' ? 'text-warning' : 'text-success'
                  }`}>{aiAdvice.cropProtection.diseaseRisk}</p>
                </div>
              </div>
              {aiAdvice.cropProtection.recommendations && aiAdvice.cropProtection.recommendations.length > 0 && (
                <ul className="space-y-1">
                  {aiAdvice.cropProtection.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Weekly Farming Plan */}
        {aiAdvice?.weeklyPlan && aiAdvice.weeklyPlan.length > 0 && (
          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-info" />
                {labels.weeklyPlan}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {aiAdvice.weeklyPlan.map((day, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted">
                  <p className="font-semibold text-sm">{day.day}</p>
                  <ul className="mt-1 space-y-1">
                    {day.activities.map((activity, j) => (
                      <li key={j} className="text-xs text-muted-foreground">• {activity}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 7-Day Forecast */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('weather.forecast')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecast.map((day, index) => {
                const Icon = weatherIcons[day.condition] || Cloud;
                return (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      index === 0 ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[80px]">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        day.condition === 'rainy' ? 'bg-info/20' : 
                        day.condition === 'sunny' ? 'bg-warning/20' : 'bg-muted'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          day.condition === 'rainy' ? 'text-info' : 
                          day.condition === 'sunny' ? 'text-warning' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{day.dayName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(day.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Droplets className="h-3.5 w-3.5 text-info" />
                        <span className="text-muted-foreground">{day.rainChance}%</span>
                      </div>
                      <div className="text-right min-w-[70px]">
                        <span className="font-semibold">{day.high}°</span>
                        <span className="text-muted-foreground text-sm"> / {day.low}°</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Weather Alerts */}
        {weatherData.alerts.length > 0 && (
          <Card variant="outlined" className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              {weatherData.alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">{t('weather.advisory')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Weather;
