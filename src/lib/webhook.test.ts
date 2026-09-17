import { describe, it, expect } from 'vitest';
import { firmar, verificar } from '@/lib/webhook';

const SECRETO = 'whsec_prueba_123';
const CUERPO = '{"event":"link.clicked","keyword":"x7k2"}';
const AHORA = 1_789_000_000;

describe('firmar', () => {
  it('produce una firma con el prefijo del algoritmo', () => {
    expect(firmar(CUERPO, SECRETO, AHORA)).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('es determinista', () => {
    expect(firmar(CUERPO, SECRETO, AHORA)).toBe(firmar(CUERPO, SECRETO, AHORA));
  });

  it('cambia si cambia el timestamp', () => {
    expect(firmar(CUERPO, SECRETO, AHORA)).not.toBe(firmar(CUERPO, SECRETO, AHORA + 1));
  });

  it('cambia si cambia el secreto', () => {
    expect(firmar(CUERPO, SECRETO, AHORA)).not.toBe(firmar(CUERPO, 'otro', AHORA));
  });
});

describe('verificar', () => {
  it('acepta una firma válida y reciente', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA);
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA)).toBe(true);
  });

  it('rechaza un cuerpo alterado', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA);
    const alterado = '{"event":"link.clicked","keyword":"otro"}';
    expect(verificar(alterado, SECRETO, AHORA, firma, 300, AHORA)).toBe(false);
  });

  it('rechaza una firma alterada', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA).replace(/.$/, '0');
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA)).toBe(false);
  });

  it('rechaza un secreto distinto', () => {
    const firma = firmar(CUERPO, 'otro', AHORA);
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA)).toBe(false);
  });

  it('rechaza un timestamp vencido', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA);
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA + 301)).toBe(false);
  });

  it('rechaza un timestamp del futuro fuera de tolerancia', () => {
    const firma = firmar(CUERPO, SECRETO, AHORA);
    expect(verificar(CUERPO, SECRETO, AHORA, firma, 300, AHORA - 301)).toBe(false);
  });

  it('rechaza una firma con formato inválido sin lanzar', () => {
    expect(verificar(CUERPO, SECRETO, AHORA, 'basura', 300, AHORA)).toBe(false);
    expect(verificar(CUERPO, SECRETO, AHORA, '', 300, AHORA)).toBe(false);
    expect(verificar(CUERPO, SECRETO, AHORA, 'sha256=corta', 300, AHORA)).toBe(false);
  });
});
