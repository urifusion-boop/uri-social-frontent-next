import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect to workspace with admin tab
  redirect('/workspace?tab=admin');
}
