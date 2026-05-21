import { keysGet, keysPost, keysDelete } from '@/lib/handlers/keys-handler';

export async function GET() {
  return keysGet();
}

export async function POST(request: Request) {
  return keysPost(request);
}

export async function DELETE(request: Request) {
  return keysDelete(request);
}
