'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import * as db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-vad-analysis-platform-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface ActionState {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

// Helper to sign JWT token
async function createToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

// Helper to get current user from cookies
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.userId as string;
    const user = db.getUserById(userId);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
  } catch (err) {
    return null;
  }
}

/**
 * Handle user registration.
 */
export async function registerAction(prevState: any, formData: FormData): Promise<ActionState> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const errors: Record<string, string> = {};

  if (!name || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'Please provide a valid email address.';
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Validation failed.', errors };
  }

  try {
    // Check if user already exists
    const existing = db.getUserByEmail(email);
    if (existing) {
      return { 
        success: false, 
        message: 'Registration failed.', 
        errors: { email: 'An account with this email already exists.' } 
      };
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Create user
    const user = db.createUser({
      name,
      email,
      passwordHash
    });

    // Sign token & set cookie
    const token = await createToken(user.id, user.email);
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.' };
  }

  // Next.js redirection outside try/catch block is best since it throws a RedirectError
  // which Next.js uses internally to perform the redirect.
  // Wait, let's import it from next/navigation!
  return redirect('/dashboard');
}

/**
 * Handle user login.
 */
export async function loginAction(prevState: any, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const errors: Record<string, string> = {};

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!password || password.length < 1) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Validation failed.', errors };
  }

  try {
    const user = db.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const matches = bcrypt.compareSync(password, user.passwordHash);
    if (!matches) {
      return { success: false, message: 'Invalid email or password.' };
    }

    // Sign token & set cookie
    const token = await createToken(user.id, user.email);
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/'
    });

  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }

  return redirect('/dashboard');
}

/**
 * Handle forgot password.
 */
export async function forgotPasswordAction(prevState: any, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  // Simulate password reset
  const user = db.getUserByEmail(email);
  if (!user) {
    // Return success anyway for security reasons to prevent user enumeration
    return { success: true, message: 'If an account exists, a password reset link has been sent.' };
  }

  console.log(`[PASSWORD RESET] Simulated sending reset email to: ${email}`);
  return { success: true, message: 'Password reset instructions have been sent to your email.' };
}

/**
 * Log user out.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  return redirect('/login');
}

/**
 * Update profile details (Name/Email)
 */
export async function updateProfileAction(formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Not authenticated.' };

  const name = formData.get('name') as string;
  
  if (!name || name.trim().length < 2) {
    return { success: false, message: 'Name must be at least 2 characters.' };
  }

  try {
    db.updateUser(user.id, { name });
    return { success: true, message: 'Profile updated successfully.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to update profile.' };
  }
}

/**
 * Change user password
 */
export async function changePasswordAction(formData: FormData): Promise<ActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'Not authenticated.' };

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmNewPassword = formData.get('confirmNewPassword') as string;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return { success: false, message: 'All password fields are required.' };
  }

  if (newPassword.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters.' };
  }

  if (newPassword !== confirmNewPassword) {
    return { success: false, message: 'New passwords do not match.' };
  }

  try {
    const fullUser = db.getUserById(currentUser.id);
    if (!fullUser) return { success: false, message: 'User not found.' };

    const matches = bcrypt.compareSync(currentPassword, fullUser.passwordHash);
    if (!matches) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    
    db.updateUser(currentUser.id, { passwordHash: newHash });
    return { success: true, message: 'Password updated successfully.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to change password.' };
  }
}

/**
 * Delete account
 */
export async function deleteAccountAction(): Promise<ActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'Not authenticated.' };

  try {
    // Delete user analyses and data (cascaded inside deleteUser)
    db.deleteUser(currentUser.id);
    
    // Clear cookies
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to delete account.' };
  }

  return redirect('/login');
}
