import { redirect } from 'next/navigation';

export default function HelpPage() {
  // Redirect to dashboard for now
  redirect('/admin/dashboard');
}