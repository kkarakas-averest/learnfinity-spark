
import Navbar from "@/components/Navbar";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DashboardTabs from "@/components/dashboard/DashboardTabs";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <WelcomeHeader userName="Alex" />
          <DashboardTabs />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
