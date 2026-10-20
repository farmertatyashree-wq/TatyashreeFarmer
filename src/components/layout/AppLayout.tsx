import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import Header from "./Header";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  hideNav?: boolean;
}

const AppLayout = ({ children, title, showBack, hideNav }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header title={title} showBack={showBack} />
      <main className="pb-24">{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;
