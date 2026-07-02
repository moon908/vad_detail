'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import * as db from '@/lib/db';

export interface ActionState {
  success: boolean;
  message: string;
}

/**
 * Delete a VAD analysis task.
 */
export async function deleteAnalysisAction(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: 'Not authenticated.' };
  }

  try {
    const deleted = db.deleteAnalysis(id, user.id);
    if (!deleted) {
      return { success: false, message: 'Analysis not found or permission denied.' };
    }

    // Revalidate paths to update pages in Next.js App Router cache
    revalidatePath('/dashboard');
    revalidatePath('/history');

    return { success: true, message: 'Analysis deleted successfully.' };
  } catch (error: any) {
    console.error('Delete analysis error:', error);
    return { success: false, message: error.message || 'Failed to delete analysis.' };
  }
}
