import { exportGet } from '@/lib/handlers/export-handler';

export async function GET() {
  return exportGet();
}
