import { cookies } from 'next/headers';

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('yourls_session');
  
  if (!session) return null;

  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}
