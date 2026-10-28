import { Bell, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

const Header = ({ title, showBack = false }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const displayTitle = title || t('app.name');

  const handleSignOut = async () => {
    await signOut();
    toast({ title: t('nav.logout') });
    navigate("/");
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "U";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getLoginText = () => {
    return language === 'marathi' ? 'लॉगिन' : language === 'hindi' ? 'लॉगिन' : 'Login';
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {showBack ? (
            <Link to="/" className="text-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="TatyaShree Farmer" className="w-10 h-10 rounded-xl object-contain bg-background" />
               <span className="text-sm sm:text-lg font-bold text-foreground break-words">{displayTitle}</span>
            </div>
          )}
          {showBack && (
             <span className="text-sm sm:text-lg font-semibold text-foreground break-words">{displayTitle}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-auto">
          <LanguageSwitcher />
          
          <Link to="/alerts">
             <Button variant="ghost" size="icon" aria-label={t('nav.alerts')}>
              <Bell className="h-5 w-5" />
            </Button>
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('nav.profile')}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                   <p className="text-sm font-medium">{user?.user_metadata?.full_name || t('dashboard.farmer')}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-1.5">
                <LogIn className="h-4 w-4" />
                {getLoginText()}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;