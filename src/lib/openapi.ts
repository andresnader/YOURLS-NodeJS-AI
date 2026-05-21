/**
 * Hand-rolled OpenAPI 3.1 spec for the YOURLS Node API.
 * Kept in code so it ships with each deploy without extra build steps.
 */

const errorSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', example: '/errors/bad_request' },
    title: { type: 'string', example: 'Bad Request' },
    status: { type: 'integer', example: 400 },
    detail: { type: 'string' },
    code: { type: 'string' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  required: ['type', 'title', 'status'],
};

const linkSchema = {
  type: 'object',
  properties: {
    keyword: { type: 'string' },
    url: { type: 'string' },
    title: { type: 'string', nullable: true },
    favicon: { type: 'string', nullable: true },
    redirectType: { type: 'integer', enum: [301, 302, 307] },
    createdAt: { type: 'string', format: 'date-time' },
    clicks: { type: 'integer' },
  },
};

const apiKeySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    keyPrefix: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    lastUsed: { type: 'string', format: 'date-time', nullable: true },
    isActive: { type: 'boolean' },
  },
};

const statsSchema = {
  type: 'object',
  properties: {
    keyword: { type: 'string' },
    longUrl: { type: 'string' },
    totalClicks: { type: 'integer' },
    timeSeries: { type: 'object', additionalProperties: { type: 'integer' } },
    browsers: { type: 'object', additionalProperties: { type: 'integer' } },
    os: { type: 'object', additionalProperties: { type: 'integer' } },
    devices: { type: 'object', additionalProperties: { type: 'integer' } },
    countries: { type: 'object', additionalProperties: { type: 'integer' } },
  },
};

const problemContent = {
  'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } },
};

export function buildOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'YOURLS Node API',
      version: '1.0.0',
      description:
        'URL shortener with analytics. v1 is the canonical version; legacy /api/* paths are deprecated aliases (see Deprecation and Sunset headers).',
    },
    servers: [{ url: 'https://ameiz.in', description: 'production' }],
    security: [{ ApiKeyAuth: [] }, { CookieAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
        CookieAuth: { type: 'apiKey', in: 'cookie', name: 'yourls_session' },
      },
      schemas: {
        Problem: errorSchema,
        Link: linkSchema,
        ApiKey: apiKeySchema,
        Stats: statsSchema,
      },
      responses: {
        Unauthorized: { description: 'Unauthorized', content: problemContent },
        Forbidden: { description: 'Forbidden', content: problemContent },
        NotFound: { description: 'Not Found', content: problemContent },
        BadRequest: { description: 'Bad Request', content: problemContent },
        Conflict: { description: 'Conflict', content: problemContent },
        RateLimited: { description: 'Too Many Requests', content: problemContent },
      },
    },
    paths: {
      '/api/v1/shorten': {
        post: {
          summary: 'Shorten a URL',
          description:
            'Public endpoint. Supports `Idempotency-Key` header — repeated calls within 24h with the same key + principal return the cached result.',
          security: [{}, { ApiKeyAuth: [] }],
          parameters: [
            {
              in: 'header',
              name: 'Idempotency-Key',
              required: false,
              schema: { type: 'string', maxLength: 200 },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['url'],
                  properties: {
                    url: { type: 'string', format: 'uri' },
                    customKeyword: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$', maxLength: 64 },
                    title: { type: 'string', maxLength: 255 },
                    redirectType: { type: 'integer', enum: [301, 302, 307] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', const: true },
                      data: { $ref: '#/components/schemas/Link' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '409': { $ref: '#/components/responses/Conflict' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        get: {
          summary: 'List shortened URLs (paginated)',
          security: [{ ApiKeyAuth: [] }, { CookieAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['createdAt', 'clicks', 'keyword', 'url'] } },
            { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: {
            '200': {
              description: 'Paginated list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Link' } },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          totalPages: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
        delete: {
          summary: 'Bulk delete URLs',
          security: [{ CookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['keywords'],
                  properties: {
                    keywords: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 500 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      deleted: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/v1/stats/{keyword}': {
        get: {
          summary: 'Get detailed click stats for a keyword',
          security: [{ ApiKeyAuth: [] }, { CookieAuth: [] }],
          parameters: [{ in: 'path', name: 'keyword', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Stats', content: { 'application/json': { schema: { $ref: '#/components/schemas/Stats' } } } },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/v1/keys': {
        get: {
          summary: 'List API keys for the current user',
          security: [{ CookieAuth: [] }],
          responses: {
            '200': {
              description: 'Keys',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/ApiKey' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create an API key',
          description: 'The raw key is returned exactly once in the response (`data.key`). Store it securely; it cannot be recovered.',
          security: [{ CookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    expiresInDays: { type: 'integer', minimum: 1, maximum: 3650 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        allOf: [
                          { $ref: '#/components/schemas/ApiKey' },
                          { type: 'object', properties: { key: { type: 'string', description: 'Raw key — shown once.' } } },
                        ],
                      },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
        delete: {
          summary: 'Revoke an API key',
          security: [{ CookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id'],
                  properties: { id: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Revoked' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/v1/settings': {
        get: {
          summary: 'Get all site settings',
          security: [{ CookieAuth: [] }],
          responses: {
            '200': { description: 'Settings map', content: { 'application/json': { schema: { type: 'object', additionalProperties: { type: 'string' } } } } },
          },
        },
        post: {
          summary: 'Update settings (ADMIN)',
          security: [{ CookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: { type: ['string', 'number', 'boolean'] } },
              },
            },
          },
          responses: {
            '200': { description: 'Updated' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/api/v1/export': {
        get: {
          summary: 'Export all links as CSV (ADMIN)',
          security: [{ CookieAuth: [] }],
          responses: {
            '200': { description: 'CSV file', content: { 'text/csv': { schema: { type: 'string' } } } },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
    },
  };
}
