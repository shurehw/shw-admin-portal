import { redirect } from 'next/navigation';

export default function InventoryPage() {
  // Redirect to the consolidated Products & Inventory page
  redirect('/admin/products');
}