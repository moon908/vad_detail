import { getCurrentUser } from '../actions/auth';
import { redirect } from 'next/navigation';
import * as db from '@/lib/db';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // If session is missing, redirect to login
  if (!user) {
    redirect('/login');
  }

  // Fetch analyses for current user
  const analyses = db.getAnalysesByUserId(user.id);

  return <DashboardClient user={user} initialAnalyses={analyses} />;
}
