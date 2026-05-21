import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { SettingsUpdateRequest } from '@/lib/schemas';
import { badRequest, forbidden, fromZod, serverError, unauthorized } from '@/lib/api-error';

export async function settingsGet(): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const options = await prisma.option.findMany();
    const settings = Object.fromEntries(options.map(o => [o.name, o.value]));
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[settingsGet]', error);
    return serverError();
  }
}

export async function settingsPost(request: Request): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== 'ADMIN') return forbidden();

    const rawBody = await request.text();
    let json: unknown;
    try {
      json = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parsed = SettingsUpdateRequest.safeParse(json);
    if (!parsed.success) return fromZod(parsed.error);

    await Promise.all(
      Object.entries(parsed.data).map(([name, value]) =>
        prisma.option.upsert({
          where: { name },
          update: { value: String(value) },
          create: { name, value: String(value) },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[settingsPost]', error);
    return serverError();
  }
}
