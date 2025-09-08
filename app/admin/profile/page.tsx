import { redirect } from 'next/navigation';

export default function ProfilePage() {
  // Redirect to settings for now
  redirect('/admin/settings');
}