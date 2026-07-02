import { getCurrentUser } from '../../actions/auth';
import { redirect } from 'next/navigation';
import * as db from '@/lib/db';
import AnalysisClient from './AnalysisClient';

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const user = await getCurrentUser();

  // Redirect if guest
  if (!user) {
    redirect('/login');
  }

  // Await params as required in Next.js 15+
  const resolvedParams = await params;
  const analysisId = resolvedParams.id;

  // Retrieve analysis details
  const analysis = db.getAnalysisById(analysisId);

  // If not found or doesn't belong to the user, redirect to dashboard
  if (!analysis || analysis.userId !== user.id) {
    redirect('/dashboard');
  }

  return <AnalysisClient user={user} analysis={analysis} />;
}
