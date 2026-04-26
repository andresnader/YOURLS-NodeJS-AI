import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function getSession() {
  try {
    // 1. Check for API Key in headers (for programmatic access)
    const headerList = await headers();
    const apiKey = headerList.get('x-api-key');

    if (apiKey) {
      console.log('[getSession] Checking API key:', apiKey.substring(0, 10) + '...');

      // 1. Check if the key exists in the database
      const keyData = await prisma.apiKey.findFirst({
        where: { key: apiKey, isActive: true },
        include: { user: true }
      });

      console.log('[getSession] keyData:', keyData ? 'found' : 'not found');

      if (keyData) {
        // Update last used timestamp (non-blocking)
        prisma.apiKey.update({
          where: { id: keyData.id },
          data: { lastUsed: new Date() }
        }).catch(err => console.error('Error updating lastUsed:', err));

        return {
          id: keyData.user.id,
          username: keyData.user.username,
          role: keyData.user.role,
          isApiKey: true // Flag to identify API Key access
        };
      }

      // 2. Legacy/Master Key check (Optional fallback)
      const masterKey = process.env.API_KEY;
      console.log('[getSession] masterKey exists:', !!masterKey);
      if (masterKey && apiKey === masterKey) {
        return { id: 'system', username: 'api_user', role: 'ADMIN', isApiKey: true };
      }
    }

    // 2. Fallback to Cookie session
    const cookieStore = await cookies();
    const session = cookieStore.get('yourls_session');

    if (!session) return null;

    try {
      return JSON.parse(session.value);
    } catch (e) {
      console.error('[getSession] Cookie parse error:', e);
      return null;
    }
  } catch (e) {
    console.error('[getSession] Unexpected error:', e);
    return null;
  }
}
