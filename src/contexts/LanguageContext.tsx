import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type Language = 'english' | 'hindi' | 'marathi';

interface Translation {
  key: string;
  english: string;
  hindi: string | null;
  marathi: string | null;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isLoading: boolean;
}

// Fallback translations for offline/quick loading
const fallbackTranslations: Record<string, Record<Language, string>> = {
  'nav.home': { english: 'Home', hindi: 'होम', marathi: 'मुख्यपृष्ठ' },
  'nav.crop_planner': { english: 'Crop Planner', hindi: 'फसल योजनाकार', marathi: 'पीक नियोजक' },
  'nav.disease_scanner': { english: 'Disease Scanner', hindi: 'रोग स्कैनर', marathi: 'रोग स्कॅनर' },
  'nav.weather': { english: 'Weather', hindi: 'मौसम', marathi: 'हवामान' },
  'nav.market': { english: 'Market Rates', hindi: 'मंडी भाव', marathi: 'बाजार भाव' },
  'nav.schemes': { english: 'Schemes', hindi: 'योजनाएं', marathi: 'योजना' },
  'nav.my_schemes': { english: 'My Schemes', hindi: 'मेरी योजनाएं', marathi: 'माझ्या योजना' },
  'nav.alerts': { english: 'Alerts', hindi: 'अलर्ट', marathi: 'सूचना' },
  'nav.profile': { english: 'Profile', hindi: 'प्रोफाइल', marathi: 'प्रोफाइल' },
  'nav.logout': { english: 'Logout', hindi: 'लॉगआउट', marathi: 'लॉगआउट' },
  'auth.login': { english: 'Login', hindi: 'लॉगिन', marathi: 'लॉगिन' },
  'auth.signup': { english: 'Sign Up', hindi: 'साइन अप', marathi: 'साइन अप' },
  'auth.email': { english: 'Email', hindi: 'ईमेल', marathi: 'ईमेल' },
  'auth.password': { english: 'Password', hindi: 'पासवर्ड', marathi: 'पासवर्ड' },
  'auth.phone': { english: 'Phone Number', hindi: 'फोन नंबर', marathi: 'फोन नंबर' },
  'auth.full_name': { english: 'Full Name', hindi: 'पूरा नाम', marathi: 'पूर्ण नाव' },
  'auth.village': { english: 'Village', hindi: 'गांव', marathi: 'गाव' },
  'auth.state': { english: 'State', hindi: 'राज्य', marathi: 'राज्य' },
  'auth.forgot_password': { english: 'Forgot Password?', hindi: 'पासवर्ड भूल गए?', marathi: 'पासवर्ड विसरलात?' },
  'auth.no_account': { english: "Don't have an account?", hindi: 'खाता नहीं है?', marathi: 'खाते नाही?' },
  'auth.have_account': { english: 'Already have an account?', hindi: 'पहले से खाता है?', marathi: 'आधीच खाते आहे?' },
  'dashboard.welcome': { english: 'Welcome', hindi: 'स्वागत है', marathi: 'स्वागत आहे' },
  'dashboard.today_weather': { english: "Today's Weather", hindi: 'आज का मौसम', marathi: 'आजचे हवामान' },
  'dashboard.mandi_prices': { english: 'Mandi Prices', hindi: 'मंडी भाव', marathi: 'बाजार भाव' },
  'dashboard.govt_schemes': { english: 'Government Schemes', hindi: 'सरकारी योजनाएं', marathi: 'सरकारी योजना' },
  'dashboard.farming_tips': { english: 'Farming Tips', hindi: 'कृषि टिप्स', marathi: 'शेती टिप्स' },
  'dashboard.quick_actions': { english: 'Quick Actions', hindi: 'त्वरित कार्य', marathi: 'जलद क्रिया' },
  'common.save': { english: 'Save', hindi: 'सहेजें', marathi: 'जतन करा' },
  'common.cancel': { english: 'Cancel', hindi: 'रद्द करें', marathi: 'रद्द करा' },
  'common.delete': { english: 'Delete', hindi: 'हटाएं', marathi: 'हटवा' },
  'common.edit': { english: 'Edit', hindi: 'संपादित करें', marathi: 'संपादन' },
  'common.search': { english: 'Search', hindi: 'खोजें', marathi: 'शोधा' },
  'common.loading': { english: 'Loading...', hindi: 'लोड हो रहा है...', marathi: 'लोड होत आहे...' },
  'common.error': { english: 'Error', hindi: 'त्रुटि', marathi: 'त्रुटी' },
  'common.success': { english: 'Success', hindi: 'सफल', marathi: 'यशस्वी' },
  'common.submit': { english: 'Submit', hindi: 'जमा करें', marathi: 'सबमिट करा' },
  'common.view_all': { english: 'View All', hindi: 'सभी देखें', marathi: 'सर्व पहा' },
  'common.download': { english: 'Download', hindi: 'डाउनलोड', marathi: 'डाउनलोड' },
  'common.retry': { english: 'Retry', hindi: 'पुनः प्रयास करें', marathi: 'पुन्हा प्रयत्न करा' },
  'chatbot.title': { english: 'Farm Assistant', hindi: 'कृषि सहायक', marathi: 'शेती सहाय्यक' },
  'chatbot.placeholder': { english: 'Ask me about farming...', hindi: 'खेती के बारे में पूछें...', marathi: 'शेतीबद्दल विचारा...' },
  'chatbot.send': { english: 'Send', hindi: 'भेजें', marathi: 'पाठवा' },
  'download.title': { english: 'Download Our App', hindi: 'हमारा ऐप डाउनलोड करें', marathi: 'आमचे ॲप डाउनलोड करा' },
  'download.android': { english: 'Download for Android', hindi: 'एंड्रॉइड के लिए डाउनलोड करें', marathi: 'Android साठी डाउनलोड करा' },
  'download.ios': { english: 'Download for iOS', hindi: 'iOS के लिए डाउनलोड करें', marathi: 'iOS साठी डाउनलोड करा' },
  'download.description': { 
    english: 'Get the TatyaShree Farmer app on your phone for easier access to farming tools and updates.',
    hindi: 'खेती के उपकरणों और अपडेट तक आसान पहुंच के लिए TatyaShree Farmer ऐप अपने फोन पर प्राप्त करें।',
    marathi: 'शेती साधने आणि अपडेट्ससाठी TatyaShree Farmer ॲप तुमच्या फोनवर मिळवा.'
  },
  'weather.temperature': { english: 'Temperature', hindi: 'तापमान', marathi: 'तापमान' },
  'weather.humidity': { english: 'Humidity', hindi: 'नमी', marathi: 'आर्द्रता' },
  'weather.rain_chance': { english: 'Rain Chance', hindi: 'बारिश की संभावना', marathi: 'पाऊस शक्यता' },
  'weather.forecast': { english: 'Weather Forecast', hindi: 'मौसम का पूर्वानुमान', marathi: 'हवामान अंदाज' },
  'weather.title': { english: 'Weather', hindi: 'मौसम', marathi: 'हवामान' },
  'weather.current': { english: 'Current Weather', hindi: 'वर्तमान मौसम', marathi: 'सध्याचे हवामान' },
  'weather.loading': { english: 'Getting your location...', hindi: 'आपका स्थान प्राप्त हो रहा है...', marathi: 'तुमचे स्थान मिळवत आहे...' },
  'weather.your_location': { english: 'Your Location', hindi: 'आपका स्थान', marathi: 'तुमचे स्थान' },
  'weather.location_error': { english: 'Unable to get your location', hindi: 'आपका स्थान प्राप्त नहीं हो सका', marathi: 'तुमचे स्थान मिळवता आले नाही' },
  'weather.permission_denied': { english: 'Location permission denied', hindi: 'स्थान अनुमति अस्वीकृत', marathi: 'स्थान परवानगी नाकारली' },
  'weather.geo_not_supported': { english: 'Geolocation is not supported', hindi: 'जियोलोकेशन समर्थित नहीं है', marathi: 'जिओलोकेशन समर्थित नाही' },
  'weather.spray.status': { english: 'Spray Status', hindi: 'छिड़काव स्थिति', marathi: 'फवारणी स्थिती' },
  'weather.spray.safe': { english: 'Safe to Spray', hindi: 'छिड़काव के लिए सुरक्षित', marathi: 'फवारणीसाठी सुरक्षित' },
  'weather.spray.notsafe': { english: 'Avoid Spraying', hindi: 'छिड़काव से बचें', marathi: 'फवारणी टाळा' },
  'weather.spray.good': { english: 'Weather conditions are good', hindi: 'मौसम की स्थिति अच्छी है', marathi: 'हवामान चांगले आहे' },
  'weather.spray.bad': { english: 'Rain or wind expected', hindi: 'बारिश या हवा की संभावना', marathi: 'पाऊस किंवा वारा अपेक्षित' },
  'weather.watering': { english: 'Watering', hindi: 'सिंचाई', marathi: 'पाणी देणे' },
  'weather.water.yes': { english: 'Water Today', hindi: 'आज पानी दें', marathi: 'आज पाणी द्या' },
  'weather.water.skip': { english: 'Skip Watering', hindi: 'पानी न दें', marathi: 'पाणी देणे टाळा' },
  'weather.water.today': { english: 'Plants need water today', hindi: 'आज पौधों को पानी चाहिए', marathi: 'आज झाडांना पाणी हवे' },
  'weather.water.save': { english: 'Rain expected, save water', hindi: 'बारिश अपेक्षित, पानी बचाएं', marathi: 'पाऊस अपेक्षित, पाणी वाचवा' },
  'weather.advisory': { english: 'Weather Advisory', hindi: 'मौसम सलाह', marathi: 'हवामान सल्ला' },
  'app.name': { english: 'TatyaShree Farmer', hindi: 'तात्याश्री किसान', marathi: 'तात्याश्री शेतकरी' },
  'app.tagline': { english: 'Smart Farming Assistant', hindi: 'स्मार्ट कृषि सहायक', marathi: 'स्मार्ट शेती सहाय्यक' },
  'app.footer': { english: 'Developed by Tejas Samadhan Aher', hindi: 'टेजस समाधान अहेर द्वारा विकसित', marathi: 'तेजस समाधान अहेर यांनी विकसित' },
  'crop.planner_title': { english: 'Crop Planner', hindi: 'फसल योजनाकार', marathi: 'पीक नियोजक' },
  'crop.select_crop': { english: 'Select Crop', hindi: 'फसल चुनें', marathi: 'पीक निवडा' },
  'crop.land_area': { english: 'Land Area', hindi: 'भूमि क्षेत्र', marathi: 'जमीन क्षेत्र' },
  'crop.soil_type': { english: 'Soil Type', hindi: 'मिट्टी का प्रकार', marathi: 'माती प्रकार' },
  'crop.water_availability': { english: 'Water Availability', hindi: 'पानी की उपलब्धता', marathi: 'पाण्याची उपलब्धता' },
  'crop.estimated_cost': { english: 'Estimated Cost', hindi: 'अनुमानित लागत', marathi: 'अंदाजे खर्च' },
  'crop.expected_profit': { english: 'Expected Profit', hindi: 'अपेक्षित लाभ', marathi: 'अपेक्षित नफा' },
  'scheme.eligibility': { english: 'Eligibility', hindi: 'पात्रता', marathi: 'पात्रता' },
  'scheme.benefits': { english: 'Benefits', hindi: 'लाभ', marathi: 'फायदे' },
  'scheme.how_to_apply': { english: 'How to Apply', hindi: 'कैसे आवेदन करें', marathi: 'अर्ज कसा करावा' },
  'scheme.deadline': { english: 'Deadline', hindi: 'अंतिम तिथि', marathi: 'शेवटची तारीख' },
  'scheme.save_scheme': { english: 'Save Scheme', hindi: 'योजना सहेजें', marathi: 'योजना जतन करा' },
  'scanner.title': { english: 'Disease Scanner', hindi: 'रोग स्कैनर', marathi: 'रोग स्कॅनर' },
  'scanner.aiTitle': { english: 'AI Disease Detection', hindi: 'AI रोग पहचान', marathi: 'AI रोग ओळख' },
  'scanner.upload': { english: 'Upload a photo of your crop', hindi: 'अपनी फसल की फोटो अपलोड करें', marathi: 'तुमच्या पिकाचा फोटो अपलोड करा' },
  'scanner.tap': { english: 'Tap to upload photo', hindi: 'फोटो अपलोड करने के लिए टैप करें', marathi: 'फोटो अपलोड करण्यासाठी टॅप करा' },
  'scanner.takePhoto': { english: 'Take Photo', hindi: 'फोटो लें', marathi: 'फोटो काढा' },
  'scanner.gallery': { english: 'Gallery', hindi: 'गैलरी', marathi: 'गॅलरी' },
  'scanner.analyzing': { english: 'Analyzing...', hindi: 'विश्लेषण हो रहा है...', marathi: 'विश्लेषण होत आहे...' },
  'scanner.healthy': { english: 'Healthy Crop', hindi: 'स्वस्थ फसल', marathi: 'निरोगी पीक' },
  'scanner.noDisease': { english: 'No disease detected', hindi: 'कोई रोग नहीं पाया गया', marathi: 'कोणताही रोग आढळला नाही' },
  'scanner.scanAgain': { english: 'Scan Again', hindi: 'फिर से स्कैन करें', marathi: 'पुन्हा स्कॅन करा' },
  'scanner.results': { english: 'Analysis Results', hindi: 'विश्लेषण परिणाम', marathi: 'विश्लेषण निकाल' },
  'scanner.symptoms': { english: 'Symptoms', hindi: 'लक्षण', marathi: 'लक्षणे' },
  'scanner.organic': { english: 'Organic Treatment', hindi: 'जैविक उपचार', marathi: 'सेंद्रिय उपचार' },
  'scanner.chemical': { english: 'Chemical Treatment', hindi: 'रासायनिक उपचार', marathi: 'रासायनिक उपचार' },
  'scanner.prevention': { english: 'Prevention', hindi: 'रोकथाम', marathi: 'प्रतिबंध' },
  'scanner.tips': { english: 'Photography Tips', hindi: 'फोटोग्राफी टिप्स', marathi: 'फोटोग्राफी टिप्स' },
  'planner.title': { english: 'Crop Planner', hindi: 'फसल योजनाकार', marathi: 'पीक नियोजक' },
  'planner.plan': { english: 'Plan Your Crop', hindi: 'अपनी फसल की योजना बनाएं', marathi: 'तुमच्या पिकाचे नियोजन करा' },
  'planner.description': { english: 'Enter details to get cost estimates', hindi: 'लागत अनुमान प्राप्त करने के लिए विवरण दर्ज करें', marathi: 'खर्च अंदाज मिळविण्यासाठी तपशील प्रविष्ट करा' },
  'planner.selectCrop': { english: 'Select Crop', hindi: 'फसल चुनें', marathi: 'पीक निवडा' },
  'planner.landArea': { english: 'Land Area (Acres)', hindi: 'भूमि क्षेत्र (एकड़)', marathi: 'जमीन क्षेत्र (एकर)' },
  'planner.waterSource': { english: 'Water Source', hindi: 'पानी का स्रोत', marathi: 'पाण्याचा स्त्रोत' },
  'planner.soilType': { english: 'Soil Type', hindi: 'मिट्टी का प्रकार', marathi: 'माती प्रकार' },
  'planner.generate': { english: 'Generate Plan', hindi: 'योजना बनाएं', marathi: 'योजना तयार करा' },
  'planner.cost': { english: 'Cost & Profit Summary', hindi: 'लागत और लाभ सारांश', marathi: 'खर्च आणि नफा सारांश' },
  'planner.seedCost': { english: 'Seed Cost', hindi: 'बीज लागत', marathi: 'बियाणे खर्च' },
  'planner.fertilizer': { english: 'Fertilizer', hindi: 'खाद', marathi: 'खत' },
  'planner.pesticide': { english: 'Pesticide', hindi: 'कीटनाशक', marathi: 'कीटकनाशक' },
  'planner.totalCost': { english: 'Total Cost', hindi: 'कुल लागत', marathi: 'एकूण खर्च' },
  'planner.profit': { english: 'Expected Profit', hindi: 'अपेक्षित लाभ', marathi: 'अपेक्षित नफा' },
  'planner.timeline': { english: 'Crop Timeline', hindi: 'फसल समयरेखा', marathi: 'पीक वेळापत्रक' },
  'planner.fertSchedule': { english: 'Fertilizer Schedule', hindi: 'खाद अनुसूची', marathi: 'खत वेळापत्रक' },
  'planner.waterSchedule': { english: 'Water Schedule', hindi: 'सिंचाई अनुसूची', marathi: 'पाणी वेळापत्रक' },
  'market.title': { english: 'Market Rates', hindi: 'मंडी भाव', marathi: 'बाजार भाव' },
  'market.crop': { english: 'Crop', hindi: 'फसल', marathi: 'पीक' },
  'market.district': { english: 'District', hindi: 'जिला', marathi: 'जिल्हा' },
  'market.trend': { english: 'Price Trend', hindi: 'मूल्य प्रवृत्ति', marathi: 'किंमत कल' },
  'market.today': { english: "Today's Prices", hindi: 'आज के भाव', marathi: 'आजचे भाव' },
  'market.info': { english: 'Market Information', hindi: 'बाजार जानकारी', marathi: 'बाजार माहिती' },
  'market.updated': { english: 'Prices updated daily from government sources', hindi: 'सरकारी स्रोतों से दैनिक अपडेट', marathi: 'सरकारी स्त्रोतांमधून दररोज अपडेट' },
  'schemes.title': { english: 'Government Schemes', hindi: 'सरकारी योजनाएं', marathi: 'सरकारी योजना' },
  'schemes.search': { english: 'Search schemes...', hindi: 'योजनाएं खोजें...', marathi: 'योजना शोधा...' },
  'schemes.all': { english: 'All', hindi: 'सभी', marathi: 'सर्व' },
  'schemes.apply': { english: 'Apply Now', hindi: 'अभी आवेदन करें', marathi: 'आता अर्ज करा' },
  'schemes.details': { english: 'View Details', hindi: 'विवरण देखें', marathi: 'तपशील पहा' },
  'alerts.title': { english: 'Alerts', hindi: 'अलर्ट', marathi: 'सूचना' },
  'alerts.no_alerts': { english: 'No alerts', hindi: 'कोई अलर्ट नहीं', marathi: 'कोणतीही सूचना नाही' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('preferredLanguage');
    return (saved as Language) || 'english';
  });
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch translations from Supabase
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const { data, error } = await supabase
          .from('translations')
          .select('*');
        
        if (error) throw error;
        
        const translationMap: Record<string, Translation> = {};
        data?.forEach((t) => {
          translationMap[t.key] = t as Translation;
        });
        setTranslations(translationMap);
      } catch (error) {
        console.error('Error fetching translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, []);

  // Sync language preference with user profile
  useEffect(() => {
    const syncLanguageWithProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();
        
        if (profile?.preferred_language) {
          setLanguageState(profile.preferred_language as Language);
          localStorage.setItem('preferredLanguage', profile.preferred_language);
        }
      }
    };

    syncLanguageWithProfile();
  }, [user]);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
    
    // Update user profile if logged in
    if (user) {
      await supabase
        .from('profiles')
        .update({ preferred_language: lang })
        .eq('id', user.id);
    }
  }, [user]);

  const t = useCallback((key: string, fallback?: string): string => {
    // First check Supabase translations
    const translation = translations[key];
    if (translation) {
      const value = translation[language];
      if (value) return value;
    }
    
    // Fallback to local translations
    const localTranslation = fallbackTranslations[key];
    if (localTranslation) {
      return localTranslation[language] || localTranslation.english;
    }
    
    // Final fallback
    return fallback || key;
  }, [translations, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
