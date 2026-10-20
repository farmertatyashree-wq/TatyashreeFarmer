import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Sprout, Mail, Phone, MapPin, User, Lock, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const states = [
  "Maharashtra", "Gujarat", "Madhya Pradesh", "Rajasthan", "Uttar Pradesh",
  "Karnataka", "Tamil Nadu", "Punjab", "Haryana", "Bihar", "Andhra Pradesh",
  "Telangana", "Kerala", "West Bengal", "Odisha"
];

const signUpSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit phone number"),
  village: z.string().min(2, "Village name is required").max(100),
  state: z.string().min(1, "Please select a state"),
  email: z.string().email("Enter valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Enter valid email address"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn, user, loading } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    full_name: "",
    phone: "",
    village: "",
    state: "",
    email: "",
    password: "",
  });
  
  const getEmailVerificationMessage = () => {
    if (language === 'marathi') {
      return {
        title: 'ईमेल पाठवला!',
        description: `आम्ही ${registeredEmail} वर verification link पाठवला आहे. कृपया तुमचा ईमेल तपासा आणि लिंक वर क्लिक करा.`,
        checkEmail: 'ईमेल तपासा',
        resend: 'पुन्हा पाठवा',
        backToLogin: 'लॉगिन वर जा'
      };
    } else if (language === 'hindi') {
      return {
        title: 'ईमेल भेजा गया!',
        description: `हमने ${registeredEmail} पर verification link भेजा है। कृपया अपना ईमेल देखें और लिंक पर क्लिक करें।`,
        checkEmail: 'ईमेल देखें',
        resend: 'फिर से भेजें',
        backToLogin: 'लॉगिन पर जाएं'
      };
    }
    return {
      title: 'Email Sent!',
      description: `We've sent a verification link to ${registeredEmail}. Please check your email and click the link to verify.`,
      checkEmail: 'Check Email',
      resend: 'Resend',
      backToLogin: 'Back to Login'
    };
  };

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signInSchema.safeParse(signInData);
    if (!result.success) {
      toast({
        title: t('common.error'),
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const { error } = await signIn(signInData.email, signInData.password);
    setIsLoading(false);
    
    if (error) {
      toast({
        title: t('common.error'),
        description: "Invalid email or password",
        variant: "destructive",
      });
    } else {
      toast({ title: t('common.success') });
      navigate("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signUpSchema.safeParse(signUpData);
    if (!result.success) {
      toast({
        title: t('common.error'),
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const { error } = await signUp(signUpData.email, signUpData.password, {
      full_name: signUpData.full_name,
      phone: signUpData.phone,
      village: signUpData.village,
      state: signUpData.state,
    });
    setIsLoading(false);
    
    if (error) {
      toast({
        title: t('common.error'),
        description: error.message.includes("already registered") 
          ? (language === 'marathi' ? 'हा ईमेल आधीच नोंदणीकृत आहे' : language === 'hindi' ? 'यह ईमेल पहले से पंजीकृत है' : 'Email already registered')
          : (language === 'marathi' ? 'नोंदणी अयशस्वी' : language === 'hindi' ? 'पंजीकरण विफल' : 'Registration failed'),
        variant: "destructive",
      });
    } else {
      setRegisteredEmail(signUpData.email);
      setShowEmailSent(true);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: registeredEmail,
    });
    setIsLoading(false);
    
    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: language === 'marathi' ? 'ईमेल पुन्हा पाठवला' : language === 'hindi' ? 'ईमेल फिर से भेजा' : 'Email Resent',
        description: language === 'marathi' ? 'कृपया तुमचा ईमेल तपासा' : language === 'hindi' ? 'कृपया अपना ईमेल देखें' : 'Please check your email',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-hero flex items-center justify-center mb-4 shadow-lg">
          <Sprout className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t('app.name')}</h1>
        <p className="text-muted-foreground mt-2">{t('app.tagline')}</p>
      </div>

      {/* Auth Card */}
      <div className="flex-1 px-4 pb-8">
        {showEmailSent ? (
          /* Email Sent Confirmation */
          <Card variant="elevated" className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-bold mb-2">{getEmailVerificationMessage().title}</h2>
              <p className="text-muted-foreground mb-6">{getEmailVerificationMessage().description}</p>
              
              <div className="space-y-3">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={() => window.open('https://mail.google.com', '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {getEmailVerificationMessage().checkEmail}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleResendEmail}
                  disabled={isLoading}
                >
                  {isLoading ? t('common.loading') : getEmailVerificationMessage().resend}
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    setShowEmailSent(false);
                    setActiveTab('signin');
                  }}
                >
                  {getEmailVerificationMessage().backToLogin}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
        <Card variant="elevated" className="max-w-md mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="signin">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="pt-6">
              {/* Sign In Tab */}
              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={signInData.email}
                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? t('common.loading') : t('auth.login')}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    {t('auth.no_account')}{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className="text-primary hover:underline"
                    >
                      {t('auth.signup')}
                    </button>
                  </p>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('auth.full_name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        placeholder={t('auth.full_name')}
                        className="pl-10"
                        value={signUpData.full_name}
                        onChange={(e) => setSignUpData({ ...signUpData, full_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('auth.phone')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="10-digit mobile"
                        className="pl-10"
                        value={signUpData.phone}
                        onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="village">{t('auth.village')}</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="village"
                          placeholder={t('auth.village')}
                          className="pl-10"
                          value={signUpData.village}
                          onChange={(e) => setSignUpData({ ...signUpData, village: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">{t('auth.state')}</Label>
                      <Select
                        value={signUpData.state}
                        onValueChange={(value) => setSignUpData({ ...signUpData, state: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('auth.state')} />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        className="pl-10 pr-10"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? t('common.loading') : t('auth.signup')}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    {t('auth.have_account')}{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="text-primary hover:underline"
                    >
                      {t('auth.login')}
                    </button>
                  </p>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
        )}
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-sm text-muted-foreground">
        {t('app.footer')}
      </div>
    </div>
  );
};

export default Auth;