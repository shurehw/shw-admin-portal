import { redirect } from 'next/navigation';

export default function OrdersPage() {
  // Redirect to quotes for now
  redirect('/admin/quotes');
}