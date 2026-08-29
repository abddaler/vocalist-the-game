import { describe, expect, it } from 'vitest';
import { isSoftwareRenderer } from './renderer';

/**
 * Имя рендерера — единственное, по чему видно, что WebGL программный.
 * Названия взяты из настоящих строк UNMASKED_RENDERER_WEBGL.
 */
describe('выбор рендерера', () => {
  it('узнаёт программный WebGL', () => {
    for (const name of [
      'Google SwiftShader',
      'llvmpipe (LLVM 15.0.7, 256 bits)',
      'Software Rasterizer',
      'Microsoft Basic Render Driver',
    ]) {
      expect(isSoftwareRenderer(name), name).toBe(true);
    }
  });

  it('не трогает настоящую видеокарту', () => {
    for (const name of [
      'ANGLE (Apple, Apple M2, OpenGL 4.1)',
      'Adreno (TM) 640',
      'Mali-G78 MP14',
      'Apple GPU',
    ]) {
      expect(isSoftwareRenderer(name), name).toBe(false);
    }
  });
});
