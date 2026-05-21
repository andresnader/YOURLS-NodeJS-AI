import { shortenPost, shortenGetList, shortenDelete } from '@/lib/handlers/shorten-handler';

export async function POST(request: Request) {
  return shortenPost(request);
}

export async function GET(request: Request) {
  return shortenGetList(request);
}

export async function DELETE(request: Request) {
  return shortenDelete(request);
}
