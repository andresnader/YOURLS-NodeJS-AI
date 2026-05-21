import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * RFC 7807 Problem Details for HTTP APIs.
 * https://datatracker.ietf.org/doc/html/rfc7807
 */
export type Problem = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: Array<{ path: string; message: string }>;
};

const TYPE_BASE = '/errors/';

export function problem(
  status: number,
  code: string,
  detail?: string,
  extra?: Partial<Problem>,
): NextResponse<Problem> {
  const body: Problem = {
    type: `${TYPE_BASE}${code}`,
    title: titleForCode(code),
    status,
    code,
    ...(detail ? { detail } : {}),
    ...extra,
  };
  return NextResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

export function unauthorized(detail = 'Authentication required') {
  return problem(401, 'unauthenticated', detail);
}

export function forbidden(detail = 'Insufficient permissions') {
  return problem(403, 'forbidden', detail);
}

export function notFound(detail = 'Resource not found') {
  return problem(404, 'not_found', detail);
}

export function badRequest(detail: string, errors?: Problem['errors']) {
  return problem(400, 'bad_request', detail, errors ? { errors } : undefined);
}

export function rateLimited(detail = 'Too many requests') {
  return problem(429, 'rate_limited', detail);
}

export function serverError(detail = 'Internal server error') {
  return problem(500, 'internal_error', detail);
}

export function fromZod(err: ZodError) {
  const errors = err.issues.map(i => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
  }));
  return badRequest('Validation failed', errors);
}

function titleForCode(code: string): string {
  switch (code) {
    case 'unauthenticated': return 'Unauthorized';
    case 'forbidden': return 'Forbidden';
    case 'not_found': return 'Not Found';
    case 'bad_request': return 'Bad Request';
    case 'rate_limited': return 'Too Many Requests';
    case 'internal_error': return 'Internal Server Error';
    case 'conflict': return 'Conflict';
    default: return code.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
