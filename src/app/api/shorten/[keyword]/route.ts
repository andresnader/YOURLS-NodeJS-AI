import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { UpdateLinkRequest } from '@/lib/schemas';
import {
  updateLink,
  deleteLink,
  getOwnedLink,
  type LinkMutationError,
} from '@/lib/link-edit';

/** Maps a shared mutation error to the matching HTTP response. */
function errorResponse(error: LinkMutationError) {
  switch (error) {
    case 'not_found':
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    case 'no_fields':
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    case 'blacklisted':
      return NextResponse.json({ error: 'This domain is blacklisted' }, { status: 403 });
    case 'invalid_keyword':
      return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 });
    case 'reserved':
      return NextResponse.json({ error: 'Keyword is reserved for system use' }, { status: 400 });
    case 'conflict':
      return NextResponse.json({ error: 'Keyword already in use' }, { status: 409 });
  }
}

// GET — Get single URL details (never leak the password hash)
export async function GET(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await context.params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const owned = await getOwnedLink(keyword, session);
    if (!owned) return NextResponse.json({ error: 'URL not found' }, { status: 404 });

    const urlEntry = await prisma.url.findUnique({
      where: { keyword },
      include: { logs: { orderBy: { clickedAt: 'desc' }, take: 10 } },
    });
    if (!urlEntry) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    const { password, ...rest } = urlEntry;
    return NextResponse.json({ data: { ...rest, hasPassword: Boolean(password) } });
  } catch (error) {
    console.error('[GET link]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH — Update destination, title, redirect type, password and/or keyword
export async function PATCH(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await context.params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = UpdateLinkRequest.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 },
      );
    }

    const result = await updateLink(keyword, parsed.data, session);
    if (!result.ok) return errorResponse(result.error);

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[PATCH link]', error);
    return NextResponse.json({ error: 'Error updating URL' }, { status: 500 });
  }
}

// DELETE — Delete a single URL
export async function DELETE(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await context.params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await deleteLink(keyword, session);
    if (!result.ok) return errorResponse(result.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE link]', error);
    return NextResponse.json({ error: 'Error deleting URL' }, { status: 500 });
  }
}
