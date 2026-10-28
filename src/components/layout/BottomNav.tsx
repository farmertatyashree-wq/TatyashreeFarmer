import { Home, Sprout, Bug, Cloud, TrendingUp, Wallet } from "lucide-react";
import { NavLink } from "@/lib/router-compat";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const { t } = useLanguage();

  const navItems = [
    { to: "/", icon: Home, label: t('nav.home') },
    { to: "/crop-planner", icon: Sprout, label: t('nav.planner') },
    { to: "/disease-scanner", icon: Bug, label: t('nav.scan') },
    { to: "/weather", icon: Cloud, label: t('nav.weather') },
    { to: "/market", icon: TrendingUp, label: t('nav.market') },
    { to: "/finance", icon: Wallet, label: t('nav.finance_short') },
  ];

  return (
    <nav aria-label={t('dashboard.tools')} className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-3xl grid-cols-6 gap-0.5 px-1 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                 "flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 rounded-lg transition-colors duration-200 min-h-12",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-center leading-tight break-words">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;