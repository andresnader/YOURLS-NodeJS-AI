import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const params = await context.params;
  try {
    await prisma.url.delete({
      where: { keyword: params.keyword }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting URL' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ keyword: string }> }) {
    const params = await context.params;
    try {
      const body = await request.json();
      const updated = await prisma.url.update({
        where: { keyword: params.keyword },
        data: {
          url: body.url
          // se podría extender para el keyword
        }
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Error updating URL' }, { status: 500 });
    }
  }
