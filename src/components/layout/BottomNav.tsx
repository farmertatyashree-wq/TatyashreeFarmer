import { Home, Sprout, Bug, Cloud, TrendingUp } from "lucide-react";
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
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5", isActive && "animate-pulse-slow")} />
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;