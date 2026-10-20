import { Link } from "@/lib/router-compat";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppDownloadSection from "@/components/AppDownload";
import ChatBot from "@/components/ChatBot";
import { 
  Sprout, 
  Bug,
  Cloud, 
  TrendingUp, 
  Building2, 
  Bell,
  FolderOpen,
  Droplets,
  Sun,
  Wind,
  FlaskConical,
  IndianRupee,
  ShieldCheck,
  Calculator
} from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Farmer";
  
  const getAIPoweredText = () => {
    return language === 'marathi' ? 'AI सहाय्यित' : language === 'hindi' ? 'AI संचालित' : 'AI-powered';
  };

  const quickActions = [
    { to: "/crop-planner", icon: Sprout, label: t('nav.crop_planner'), color: "bg-primary", description: t('crop.planner_title') },
    { to: "/disease-scanner", icon: Bug, label: t('nav.disease_scanner'), color: "bg-accent", description: getAIPoweredText() },
    { to: "/weather", icon: Cloud, label: t('nav.weather'), color: "bg-info", description: t('weather.forecast') },
    { to: "/market", icon: TrendingUp, label: t('nav.market'), color: "bg-success", description: t('dashboard.mandi_prices') },
    { to: "/schemes", icon: Building2, label: t('nav.schemes'), color: "bg-warning", description: t('dashboard.govt_schemes') },
    { to: "/my-schemes", icon: FolderOpen, label: t('nav.my_schemes'), color: "bg-secondary", description: t('scheme.save_scheme') },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    const greetings = {
      english: { morning: "Good Morning", afternoon: "Good Afternoon", evening: "Good Evening" },
      hindi: { morning: "सुप्रभात", afternoon: "नमस्ते", evening: "शुभ संध्या" },
      marathi: { morning: "सुप्रभात", afternoon: "नमस्कार", evening: "शुभ संध्याकाळ" }
    };
    const lang = language as keyof typeof greetings;
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return greetings[lang]?.[timeOfDay] || greetings.english[timeOfDay];
  };

  return (
    <AppLayout>
      <div className="px-4 py-5 space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <Card variant="elevated" className="bg-gradient-hero text-primary-foreground overflow-hidden relative">
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">{getGreeting()},</p>
                <h1 className="text-2xl font-bold mt-1">{t('dashboard.welcome')} {userName}! 👋</h1>
                <p className="text-primary-foreground/90 text-sm mt-2 max-w-[200px]">
                  {t('app.tagline')}
                </p>
              </div>
              <div className="text-5xl animate-float">🌾</div>
            </div>
          </CardContent>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary-foreground/10 rounded-full" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary-foreground/10 rounded-full" />
        </Card>

        {/* Weather Quick View */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-sky flex items-center justify-center">
                  <Sun className="h-7 w-7 text-info-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.today_weather')}</p>
                  <p className="text-2xl font-bold">28°C</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Droplets className="h-4 w-4 text-info" />
                  <span>65%</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Wind className="h-4 w-4" />
                  <span>12 km/h</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {language === 'hindi' ? 'छिड़काव के लिए सुरक्षित' : language === 'marathi' ? 'फवारणीसाठी सुरक्षित' : 'Safe for spraying'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-lg font-bold mb-4">{t('dashboard.quick_actions')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link key={action.to} to={action.to}>
                <Card 
                  variant="elevated" 
                  className="h-full hover:scale-[1.02] transition-transform duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-4 flex flex-col items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center`}>
                      <action.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{action.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Fertilizer Calculator */}
        <Link to="/fertilizer-calculator">
          <Card variant="elevated" className="border-purple-500/20 hover:scale-[1.01] transition-transform">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {language === 'marathi' ? 'खत कॅल्क्युलेटर' : language === 'hindi' ? 'खाद कैल्कुलेटर' : 'Fertilizer Calculator'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'marathi' ? 'तुमच्या पिकासाठी NPK गरज मोजा' : language === 'hindi' ? 'अपनी फसल के लिए NPK आवश्यकता जानें' : 'Calculate NPK requirements for your crop'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Satbara Download Link */}
        <Card variant="elevated" className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {language === 'marathi' ? 'सातबारा / ७/१२ उतारा' : language === 'hindi' ? 'सातबारा / 7/12 उतारा' : 'Satbara / 7/12 Extract'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'marathi' ? 'तुमच्या जमिनीचा ऑनलाइन उतारा पहा आणि डाउनलोड करा' : language === 'hindi' ? 'अपनी जमीन का ऑनलाइन रिकॉर्ड देखें और डाउनलोड करें' : 'View and download your land records online'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-3"
              onClick={() => window.open('https://bhulekh.mahabhumi.gov.in/', '_blank')}
            >
              {language === 'marathi' ? 'सातबारा पहा / डाउनलोड करा' : language === 'hindi' ? 'सातबारा देखें / डाउनलोड करें' : 'View / Download Satbara'}
            </Button>
          </CardContent>
        </Card>

        {/* Soil Health Card */}
        <Card variant="elevated" className="border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FlaskConical className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {language === 'marathi' ? 'मृदा आरोग्य कार्ड' : language === 'hindi' ? 'मृदा स्वास्थ्य कार्ड' : 'Soil Health Card'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'marathi' ? 'तुमच्या जमिनीचे आरोग्य तपासा आणि कार्ड डाउनलोड करा' : language === 'hindi' ? 'अपनी मिट्टी का स्वास्थ्य जांचें और कार्ड डाउनलोड करें' : 'Check your soil health and download card'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-3 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              onClick={() => window.open('https://soilhealth.dac.gov.in/', '_blank')}
            >
              {language === 'marathi' ? 'मृदा कार्ड पहा' : language === 'hindi' ? 'मृदा कार्ड देखें' : 'View Soil Card'}
            </Button>
          </CardContent>
        </Card>

        {/* PM Kisan Status Check */}
        <Card variant="elevated" className="border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {language === 'marathi' ? 'पीएम किसान स्थिती' : language === 'hindi' ? 'पीएम किसान स्थिति' : 'PM Kisan Status'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'marathi' ? 'तुमच्या पीएम किसान हप्त्याची स्थिती तपासा' : language === 'hindi' ? 'अपनी पीएम किसान किस्त की स्थिति जांचें' : 'Check your PM Kisan installment status'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-3 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => window.open('https://pmkisan.gov.in/BeneficiaryStatus.aspx', '_blank')}
            >
              {language === 'marathi' ? 'स्थिती तपासा' : language === 'hindi' ? 'स्थिति जांचें' : 'Check Status'}
            </Button>
          </CardContent>
        </Card>

        {/* PMFBY Crop Insurance Status */}
        <Card variant="elevated" className="border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {language === 'marathi' ? 'पीक विमा (PMFBY)' : language === 'hindi' ? 'फसल बीमा (PMFBY)' : 'Crop Insurance (PMFBY)'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'marathi' ? 'तुमच्या पीक विम्याची स्थिती तपासा' : language === 'hindi' ? 'अपनी फसल बीमा स्थिति जांचें' : 'Check your crop insurance status'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-3 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
              onClick={() => window.open('https://pmfby.gov.in/farmerRegistrationForm/farmerStatus', '_blank')}
            >
              {language === 'marathi' ? 'विमा स्थिती तपासा' : language === 'hindi' ? 'बीमा स्थिति जांचें' : 'Check Insurance Status'}
            </Button>
          </CardContent>
        </Card>

        {/* App Download Section */}
        <AppDownloadSection />

        {/* Alerts Preview */}
        <Card variant="outlined" className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">
                  {language === 'hindi' ? 'नई योजना अलर्ट!' : language === 'marathi' ? 'नवीन योजना सूचना!' : 'New Scheme Alert!'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'hindi' 
                    ? 'पीएम-किसान किस्त की अंतिम तिथि 5 दिनों में है। ₹2,000 प्राप्त करने के लिए अपना केवाईसी पूरा करें।'
                    : language === 'marathi'
                    ? 'पीएम-किसान हप्त्याची शेवटची तारीख 5 दिवसात आहे. ₹2,000 मिळविण्यासाठी तुमचे केवायसी पूर्ण करा.'
                    : 'PM-KISAN installment deadline is in 5 days. Complete your KYC to receive ₹2,000.'}
                </p>
                <Link to="/alerts">
                  <Button variant="link" size="sm" className="px-0 mt-1 h-auto text-xs">
                    {t('common.view_all')} →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-4 pb-20 text-xs text-muted-foreground">
          {t('app.footer')}
        </div>
      </div>

      {/* Floating Chatbot */}
      <ChatBot />
    </AppLayout>
  );
};

export default Index;