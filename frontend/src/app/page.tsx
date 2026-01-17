import { redirect } from 'next/navigation';

export default function Home() {
  // Always redirect root to login (or today if we had auth check here)
  redirect('/login');
}