import CRMLayout from '@/components/CRMLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CRMLayout>{children}</CRMLayout>;
}