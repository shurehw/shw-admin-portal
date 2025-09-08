import CRMSidebar from '@/components/crm/CRMSidebar';

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <CRMSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}