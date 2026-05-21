import { settingsGet, settingsPost } from '@/lib/handlers/settings-handler';

export async function GET() {
  return settingsGet();
}

export async function POST(request: Request) {
  return settingsPost(request);
}
