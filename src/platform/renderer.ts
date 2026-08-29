/**
 * Каким рендерером рисовать. Phaser.AUTO всегда предпочитает WebGL, но
 * WebGL бывает и программным: часть телефонов и вебвью отдаёт SwiftShader
 * или llvmpipe, и тогда каждый прямоугольник считает процессор, причём
 * заметно хуже, чем это делает обычный Canvas2D. Замер на такой сборке:
 * 28 мс на кадр против 17 у Canvas2D.
 *
 * Поэтому имя рендерера спрашивается у самого браузера, и на программном
 * WebGL игра честно уходит на Canvas2D.
 */
const SOFTWARE = /swiftshader|llvmpipe|software|basic render/i;

/** Похоже ли имя рендерера на программный растеризатор. */
export function isSoftwareRenderer(name: string): boolean {
  return SOFTWARE.test(name);
}

/** Phaser.AUTO = 0, Phaser.CANVAS = 1, Phaser.WEBGL = 2. */
export const RENDERER = { auto: 0, canvas: 1 } as const;

export function pickRenderer(): number {
  try {
    const probe = document.createElement('canvas');
    const gl = (probe.getContext('webgl2') ??
      probe.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return RENDERER.canvas;

    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    // Контекст нужен был только чтобы спросить имя: отпускаем сразу,
    // иначе телефон держит два контекста разом.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return isSoftwareRenderer(name) ? RENDERER.canvas : RENDERER.auto;
  } catch {
    return RENDERER.auto;
  }
}
