import { useState } from 'react';
import { Link } from '@/lib/router-compat';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AppDownloadSection from '@/components/AppDownload';
import ChatBot from '@/components/ChatBot';
import farmPhoto from '@/assets/farm-dashboard.jpg';
import { Sprout, Bug, Cloud, TrendingUp, Building2, Bell, FolderOpen, FlaskConical, IndianRupee, ShieldCheck, Calculator, PawPrint, Wallet, Search, ArrowUpRight, ChevronDown, X } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [showServices, setShowServices] = useState(false);
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || t('dashboard.farmer');
  const tools = [
    { to: '/crop-planner', icon: Sprout, label: t('nav.crop_planner'), description: t('planner.plan'), tone: 'bg-primary/10 text-primary' },
    { to: '/disease-scanner', icon: Bug, label: t('nav.scan'), description: t('dashboard.doctor_desc'), tone: 'bg-accent text-accent-foreground' },
    { to: '/weather', icon: Cloud, label: t('nav.weather'), description: t('weather.forecast'), tone: 'bg-info/10 text-info' },
    { to: '/market', icon: TrendingUp, label: t('nav.market'), description: t('dashboard.mandi_prices'), tone: 'bg-success/10 text-primary' },
    { to: '/finance', icon: Wallet, label: t('nav.finance'), description: t('dashboard.finance_desc'), tone: 'bg-primary/10 text-primary' },
    { to: '/livestock', icon: PawPrint, label: t('dashboard.livestock'), description: t('dashboard.livestock_desc'), tone: 'bg-accent text-accent-foreground' },
    { to: '/schemes', icon: Building2, label: t('nav.schemes'), description: t('dashboard.govt_schemes'), tone: 'bg-info/10 text-info' },
    { to: '/fertilizer-calculator', icon: Calculator, label: t('dashboard.fertilizer'), description: t('dashboard.fertilizer_desc'), tone: 'bg-secondary text-secondary-foreground' },
  ];
  const services = [
    { href: 'https://bhulekh.mahabhumi.gov.in/', icon: FolderOpen, label: t('dashboard.satbara') },
    { href: 'https://soilhealth.dac.gov.in/', icon: FlaskConical, label: t('dashboard.soil') },
    { href: 'https://pmkisan.gov.in/', icon: IndianRupee, label: t('dashboard.pmkisan') },
    { href: 'https://pmfby.gov.in/', icon: ShieldCheck, label: t('dashboard.insurance') },
  ];
  const query = search.trim().toLocaleLowerCase();
  const filtered = tools.filter(tool => `${tool.label} ${tool.description}`.toLocaleLowerCase().includes(query));

  return (
    <AppLayout>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <img src={farmPhoto} alt="" width={1536} height={512} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-farm-overlay" />
        <div className="relative mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
          <p className="text-sm font-medium text-primary-foreground/90">{t('dashboard.welcome')}, {userName}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold leading-tight">{t('app.name')}</h1>
          <p className="mt-3 text-sm sm:text-base text-primary-foreground/90">{t('app.tagline')}</p>
          <Button asChild variant="secondary" className="mt-6 min-h-11 gap-2">
            <Link to="/finance"><Wallet className="h-4 w-4" />{t('nav.finance')}<ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 space-y-7">
        <section aria-labelledby="tools-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 id="tools-heading" className="text-xl font-bold">{t('dashboard.tools')}</h2>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input aria-label={t('dashboard.search')} placeholder={t('dashboard.search')} value={search} onChange={event => setSearch(event.target.value)} className="h-11 pl-10 pr-11 bg-card" />
              {search && <Button variant="ghost" size="icon" onClick={() => setSearch('')} aria-label={t('dashboard.clear_search')} className="absolute right-0 top-0 h-11 w-11"><X className="h-4 w-4" /></Button>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filtered.map(tool => (
              <Link key={tool.to} to={tool.to} className="group flex min-w-0 items-start gap-3 rounded-lg border border-border bg-card p-4 sm:p-5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tool.tone}`}><tool.icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1"><h3 className="text-sm sm:text-base font-semibold leading-snug break-words">{tool.label}</h3><p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{tool.description}</p></div>
                <ArrowUpRight className="hidden sm:block h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
          {filtered.length === 0 && <div className="py-10 text-center"><Search className="mx-auto mb-3 h-6 w-6 text-muted-foreground" /><p className="text-muted-foreground">{t('dashboard.no_results')}</p><Button variant="link" onClick={() => setSearch('')}>{t('dashboard.clear_search')}</Button></div>}
        </section>

        <section className="border-t border-border pt-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Button asChild variant="outline" className="min-h-12 h-auto whitespace-normal gap-2"><Link to="/my-schemes"><FolderOpen className="h-4 w-4 shrink-0" />{t('nav.my_schemes')}</Link></Button>
            <Button asChild variant="outline" className="min-h-12 h-auto whitespace-normal gap-2"><Link to="/alerts"><Bell className="h-4 w-4 shrink-0" />{t('nav.alerts')}</Link></Button>
          </div>
          <Button variant="ghost" onClick={() => setShowServices(value => !value)} aria-expanded={showServices} aria-controls="official-services" className="w-full min-h-12 justify-between px-0 text-base font-semibold">{t('dashboard.services')}<ChevronDown className={`h-5 w-5 transition-transform ${showServices ? 'rotate-180' : ''}`} /></Button>
          {showServices && <div id="official-services" className="grid grid-cols-2 gap-3 pt-3">{services.map(service => (
            <Button asChild key={service.href} variant="outline" className="h-auto min-h-20 justify-start whitespace-normal p-3 sm:p-4"><a href={service.href} target="_blank" rel="noopener noreferrer"><service.icon className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 text-left"><span className="block text-sm font-semibold">{service.label}</span><span className="block text-xs text-muted-foreground mt-1">{t('dashboard.official')}</span></span><ArrowUpRight className="ml-auto h-4 w-4 shrink-0" /></a></Button>
          ))}</div>}
        </section>
        <AppDownloadSection />
        <footer className="text-center pb-8 text-xs text-muted-foreground">{t('app.footer')}</footer>
      </div>
      <ChatBot />
    </AppLayout>
  );
};
export default Index;
