import { z } from 'zod';

export const ShortenRequest = z.object({
  url: z.string().url('Must be a valid absolute URL'),
  customKeyword: z
    .string()
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, digits, underscores and dashes are allowed')
    .optional(),
  /** Legacy alias for customKeyword (WordPress plugin compatibility). */
  keyword: z.string().max(64).optional(),
  title: z.string().max(255).optional(),
  redirectType: z.union([z.literal(301), z.literal(302), z.literal(307)]).optional(),
});
export type ShortenRequest = z.infer<typeof ShortenRequest>;

export const ShortenResponse = z.object({
  success: z.literal(true),
  data: z.object({
    keyword: z.string(),
    url: z.string(),
    title: z.string().nullable(),
    favicon: z.string().nullable(),
    redirectType: z.number(),
    createdAt: z.string().or(z.date()),
    clicks: z.number(),
  }),
});
export type ShortenResponse = z.infer<typeof ShortenResponse>;

/**
 * Partial update of an existing link. Every field is optional, but at least one
 * must be present (enforced in the handler). `keyword` renames the short code,
 * which migrates all associated click logs. `password` sets protection; an empty
 * string clears it.
 */
export const UpdateLinkRequest = z
  .object({
    url: z.string().url('Must be a valid absolute URL').optional(),
    title: z.string().max(255).nullable().optional(),
    keyword: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, digits, underscores and dashes are allowed')
      .optional(),
    redirectType: z.union([z.literal(301), z.literal(302), z.literal(307)]).optional(),
    password: z.string().max(255).nullable().optional(),
  })
  .strict();
export type UpdateLinkRequest = z.infer<typeof UpdateLinkRequest>;

export const ListLinksQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['createdAt', 'clicks', 'keyword', 'url']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListLinksQuery = z.infer<typeof ListLinksQuery>;

export const BulkDeleteRequest = z.object({
  keywords: z.array(z.string().min(1)).min(1).max(500),
});
export type BulkDeleteRequest = z.infer<typeof BulkDeleteRequest>;

export const CreateApiKeyRequest = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().int().positive().max(3650).optional(),
});
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequest>;

export const SettingsUpdateRequest = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));
export type SettingsUpdateRequest = z.infer<typeof SettingsUpdateRequest>;
