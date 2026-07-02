import { getCurrentUser } from '../actions/auth';
import { redirect } from 'next/navigation';
import * as db from '@/lib/db';
import HistoryClient from './HistoryClient';

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const analyses = db.getAnalysesByUserId(user.id);

  return <HistoryClient user={user} initialAnalyses={analyses} />;
}
