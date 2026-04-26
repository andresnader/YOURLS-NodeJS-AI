# API Design Review - YOURLS Node.js

**Fecha**: 2026-04-26  
**Reviewer**: API Design Reviewer Skill  
**Proyecto**: YOURLS Node.js (Next.js + Prisma)

---

## Endpoints Encontrados (13)

| Endpoint | Métodos | Status |
|----------|---------|--------|
| `/api/shorten` | GET, POST, DELETE | ✅ |
| `/api/shorten/[keyword]` | GET, PATCH, DELETE | ✅ |
| `/api/links/health` | POST | ✅ |
| `/api/stats` | GET | ✅ |
| `/api/stats/[keyword]` | GET | ✅ |
| `/api/auth` | POST, DELETE | ✅ |
| `/api/users` | GET, POST, DELETE | ✅ |
| `/api/settings` | GET, POST | ⚠️ |
| `/api/export` | GET | ⚠️ |
| `/[keyword]` | GET | Redirection |

---

## ✅ Lo Bueno

- **Naming Conventions**: Recursos en kebab-case (`/api/shorten`, `/api/links/health`)
- **HTTP Methods**: Uso correcto de GET, POST, DELETE
- **Pagination**: Implementada en `/api/shorten` con `page`, `limit`, `total`, `totalPages`
- **Authentication**: Cookies HTTP-only con `secure` flag en producción
- **Error Handling**: Uso correcto de códigos 400, 401, 403, 409, 500

---

## ⚠️ Problemas Encontrados

### 1. Sin Versionado de API (CRÍTICO)
```
/api/shorten → debería ser → /api/v1/shorten
```
Sin versionado, cambios futuros romperán clientes existentes.

### 2. Error Format Inconsistente
```typescript
// Algunos endpoints usan:
{ error: 'message' }

// Otros podrían usar estructura más completa
{ error: { code, message, details, requestId, timestamp } }
```

### 3. Security Issues (VULNERABILIDAD)
- **`/api/export` sin auth** - exponga todos los links públicamente
- **`/api/settings` GET sin auth** - cualquier usuario puede ver settings
- Faltan headers de seguridad (CORS, rate limiting)

### 4. Falta Documentación
- No existe OpenAPI/Swagger spec
- No hay response schemas definidos
- No hay ejemplos de request/response

---

## Scoring API Design

| Categoría | Puntuación | Notas |
|-----------|------------|-------|
| **Consistency** | 75% | NamingOK, pero sin versionado |
| **Documentation** | 30% | No OpenAPI spec |
| **Security** | 60% | Auth parcial, falta CORS/headers |
| **Usability** | 80% | Pagination OK, filtros bien |
| **Performance** | 70% | Usa Promise.all, pero sin cache |

**Grade**: C+

---

## Recomendaciones Prioritarias

### 🔴 Alta Prioridad

1. **Agregar auth a `/api/export`** - Vulnerabilidad de seguridad
2. **Agregar auth a `/api/settings` GET** - Expone configuración
3. **Implementar versionado `/api/v1/`**

### 🟡 Media Prioridad

4. Estandarizar formato de errores
5. Agregar CORS y security headers
6. Agregar rate limiting

### 🟢 Baja Prioridad

7. Generar OpenAPI spec con Swagger
8. Agregar Field Selection (`?fields=id,name`)
9. Implementar ETag caching

---

## Archivos Revisados

- `src/app/api/shorten/route.ts`
- `src/app/api/shorten/[keyword]/route.ts`
- `src/app/api/links/health/route.ts`
- `src/app/api/stats/route.ts`
- `src/app/api/stats/[keyword]/route.ts`
- `src/app/api/auth/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/settings/route.ts`
- `src/app/api/export/route.ts`

---

## Conclusión

El API tiene una base sólida con buenas prácticas de REST, pero tiene **2 vulnerabilidades de seguridad críticas** que deben abordarse inmediatamente y carece de versionado lo cual dificultará evolución futura.