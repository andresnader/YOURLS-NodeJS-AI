import crypto from 'node:crypto';

/**
 * Firma el cuerpo EXACTO que se va a enviar, junto al timestamp.
 * Incluir el timestamp en el material firmado es lo que impide reenviar
 * una petición interceptada con un timestamp nuevo.
 */
export function firmar(cuerpoCrudo: string, secreto: string, timestamp: number): string {
  const material = `${timestamp}.${cuerpoCrudo}`;
  const hmac = crypto.createHmac('sha256', secreto).update(material, 'utf8').digest('hex');
  return `sha256=${hmac}`;
}

export function verificar(
  cuerpoCrudo: string,
  secreto: string,
  timestamp: number,
  firmaRecibida: string,
  toleranciaSegundos = 300,
  ahoraSegundos = Math.floor(Date.now() / 1000),
): boolean {
  if (Math.abs(ahoraSegundos - timestamp) > toleranciaSegundos) return false;

  const esperada = firmar(cuerpoCrudo, secreto, timestamp);
  const a = Buffer.from(esperada, 'utf8');
  const b = Buffer.from(firmaRecibida, 'utf8');

  // timingSafeEqual exige longitudes iguales, y comparar longitudes antes no
  // filtra nada útil: la longitud de la firma es fija y pública.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
