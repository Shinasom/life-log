import TopBar from '@/components/layout/TopBar'; // 👈 Import
import BottomNav from '@/components/layout/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header */}
      <TopBar /> 
      
      {/* 2. Main Content (Added pt-16 to account for fixed header) */}
      <main className="max-w-md mx-auto pt-16 pb-24 min-h-screen">
        {children}
      </main>
      
      {/* 3. Footer Navigation */}
      <BottomNav />
    </div>
  );
}