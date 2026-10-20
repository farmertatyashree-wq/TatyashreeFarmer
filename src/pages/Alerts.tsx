import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  FileCheck,
  CheckCircle2,
  Clock,
  ChevronRight
} from "lucide-react";

interface Alert {
  id: string;
  type: "new-scheme" | "deadline" | "kyc" | "subsidy" | "weather";
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  urgent?: boolean;
  actionLabel?: string;
  actionLink?: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "deadline",
    title: "PM-KISAN KYC Deadline",
    description: "Complete your KYC before Dec 31 to receive ₹2,000 installment",
    time: "2 hours ago",
    isRead: false,
    urgent: true,
    actionLabel: "Complete KYC",
    actionLink: "/schemes/pm-kisan"
  },
  {
    id: "2",
    type: "new-scheme",
    title: "New Scheme Available",
    description: "Solar Pump Subsidy scheme launched for farmers in your district",
    time: "5 hours ago",
    isRead: false,
    actionLabel: "View Details",
    actionLink: "/schemes"
  },
  {
    id: "3",
    type: "subsidy",
    title: "Subsidy Credited",
    description: "₹5,400 micro irrigation subsidy credited to your bank account",
    time: "1 day ago",
    isRead: true
  },
  {
    id: "4",
    type: "weather",
    title: "Heavy Rain Alert",
    description: "Heavy rainfall expected in next 48 hours. Secure your harvested crops.",
    time: "1 day ago",
    isRead: false,
    urgent: true
  },
  {
    id: "5",
    type: "kyc",
    title: "Bank Account Update",
    description: "Update your bank account details for PMFBY claim settlement",
    time: "2 days ago",
    isRead: true,
    actionLabel: "Update Now"
  },
  {
    id: "6",
    type: "deadline",
    title: "Crop Insurance Deadline",
    description: "Last date to enroll for Rabi crop insurance is Dec 15",
    time: "3 days ago",
    isRead: true,
    actionLabel: "Apply Now",
    actionLink: "/schemes/pmfby"
  },
  {
    id: "7",
    type: "new-scheme",
    title: "Organic Farming Subsidy",
    description: "₹10,000 per hectare available for organic certification",
    time: "1 week ago",
    isRead: true
  },
];

const alertIcons = {
  "new-scheme": Bell,
  deadline: Calendar,
  kyc: FileCheck,
  subsidy: CreditCard,
  weather: AlertTriangle,
};

const alertColors = {
  "new-scheme": "bg-primary/10 text-primary",
  deadline: "bg-warning/10 text-warning",
  kyc: "bg-info/10 text-info",
  subsidy: "bg-success/10 text-success",
  weather: "bg-destructive/10 text-destructive",
};

const Alerts = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, isRead: true } : a
    ));
  };

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const filteredAlerts = activeTab === "all" 
    ? alerts 
    : activeTab === "unread"
    ? alerts.filter(a => !a.isRead)
    : alerts.filter(a => a.type === activeTab);

  return (
    <AppLayout title="Alerts" showBack>
      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Header Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Notifications</h2>
            <p className="text-sm text-muted-foreground">{unreadCount} unread alerts</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="deadline">Deadlines</TabsTrigger>
            <TabsTrigger value="new-scheme">Schemes</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filteredAlerts.length === 0 ? (
              <Card variant="outlined" className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No alerts in this category</p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => {
                const Icon = alertIcons[alert.type];
                return (
                  <Card 
                    key={alert.id}
                    variant={alert.isRead ? "outlined" : "elevated"}
                    className={`${!alert.isRead ? 'border-l-4 border-l-primary' : ''} ${
                      alert.urgent ? 'bg-destructive/5' : ''
                    }`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          alertColors[alert.type]
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold text-sm ${!alert.isRead ? '' : 'text-muted-foreground'}`}>
                              {alert.title}
                            </h3>
                            {alert.urgent && (
                              <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive text-[10px] font-bold rounded">
                                URGENT
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {alert.time}
                            </span>
                            {alert.actionLabel && (
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                {alert.actionLabel}
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {!alert.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Alerts;
