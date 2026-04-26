import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function getSession() {
  // 1. Check for API Key in headers (for programmatic access)
  const headerList = await headers();
  const apiKey = headerList.get('x-api-key');
  
  if (apiKey) {
    // 1. Check if the key exists in the database
    const keyData = await prisma.apiKey.findUnique({
      where: { key: apiKey, isActive: true },
      include: { user: true }
    });

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
  } catch {
    return null;
  }
}
