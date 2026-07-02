import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import LandingPageClient from './components/LandingPageClient';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-vad-analysis-platform-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export default async function LandingPage() {
  // Check if user is already authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  let authenticated = false;

  if (token) {
    try {
      await jwtVerify(token, secretKey);
      authenticated = true;
    } catch (err) {}
  }

  // If already logged in, redirect straight to dashboard
  if (authenticated) {
    redirect('/dashboard');
  }

  return <LandingPageClient />;
}
