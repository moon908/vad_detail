import { getCurrentUser } from '../actions/auth';
import { redirect } from 'next/navigation';
import UploadClient from './UploadClient';

export default async function UploadPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <UploadClient user={user} />;
}
