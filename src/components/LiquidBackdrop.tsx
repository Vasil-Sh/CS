import { useEffect, useRef } from "react";

/*
 * Animated "liquid ribbon" backdrop.
 *
 * All instances on a page share ONE WebGL context: a hidden canvas renders
 * each visible backdrop in turn and the result is copied into that
 * backdrop's own 2D canvas. Browsers cap the number of live WebGL contexts
 * and every context costs GPU memory, so this keeps five backdrops as cheap
 * as one. Off-screen backdrops are skipped, the loop stops when nothing is
 * visible or the tab is hidden, and touch devices get a single still frame.
 */
const liquidVertex = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;
// Flowing "liquid ribbon" field: domain-warped waves with bright cores
// and dark gaps, tinted in the MatchIQ orange.
const liquidFragment = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_seed;
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_res.x / u_res.y;
  float t = (u_time + u_seed) * 0.16;
  vec2 q = p;
  q += 0.62 * vec2(sin(p.y * 1.2 + t * 1.2), cos(p.x * 1.0 - t * 0.9));
  q += 0.28 * vec2(sin(q.y * 2.2 - t * 1.6), cos(q.x * 1.8 + t * 1.1));
  float a = sin(q.x * 1.0 + q.y * 1.6 + t * 1.8);
  float b = sin(q.x * 1.6 - q.y * 0.9 - t * 1.3 + 1.9);
  float ribbon = smoothstep(0.05, 0.97, a);
  float ribbon2 = smoothstep(0.45, 0.99, b) * 0.7;
  float shade = clamp(ribbon + ribbon2, 0.0, 1.0);
  float core = pow(smoothstep(0.8, 1.0, max(a, b * 0.97)), 2.0);
  vec3 dark = vec3(0.045, 0.04, 0.04);
  vec3 deep = vec3(0.45, 0.1, 0.03);
  vec3 orange = vec3(1.0, 0.41, 0.23);
  vec3 pale = vec3(1.0, 0.87, 0.76);
  vec3 col = mix(dark, deep, smoothstep(0.0, 0.45, shade));
  col = mix(col, orange, smoothstep(0.35, 0.95, shade));
  col = mix(col, pale, core * 0.85);
  col *= 0.75 + 0.25 * smoothstep(1.4, 0.2, length(p - vec2(-0.9, 0.2)));
  gl_FragColor = vec4(col, 1.0);
}
`;

type Instance = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  visible: boolean;
  animate: boolean;
  seed: number;
};

const RENDER_SCALE = 0.6;
const STILL_TIME = 12;

class LiquidRenderer {
  private gl: WebGLRenderingContext | null = null;
  private glCanvas: HTMLCanvasElement | null = null;
  private uRes: WebGLUniformLocation | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private uSeed: WebGLUniformLocation | null = null;
  private instances = new Set<Instance>();
  private frame = 0;
  private time = STILL_TIME;
  private last = 0;
  private failed = false;

  private init() {
    if (this.gl || this.failed) return Boolean(this.gl);
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    const compile = (type: number, source: string) => {
      const shader = gl?.createShader(type);
      if (!gl || !shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl?.VERTEX_SHADER ?? 0, liquidVertex);
    const fs = compile(gl?.FRAGMENT_SHADER ?? 0, liquidFragment);
    const program = gl?.createProgram();
    if (!gl || !vs || !fs || !program) {
      this.failed = true;
      return false;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.failed = true;
      return false;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    this.uRes = gl.getUniformLocation(program, "u_res");
    this.uTime = gl.getUniformLocation(program, "u_time");
    this.uSeed = gl.getUniformLocation(program, "u_seed");
    this.gl = gl;
    this.glCanvas = canvas;
    document.addEventListener("visibilitychange", () => this.schedule());
    return true;
  }

  /** Size the 2D canvas to its box; returns false if it has no size yet. */
  private fit(instance: Instance) {
    const scale = Math.min(window.devicePixelRatio || 1, 2) * RENDER_SCALE;
    const w = Math.max(1, Math.round(instance.canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(instance.canvas.clientHeight * scale));
    if (instance.canvas.width !== w || instance.canvas.height !== h) {
      instance.canvas.width = w;
      instance.canvas.height = h;
    }
    return instance.canvas.clientWidth > 0;
  }

  private draw(instance: Instance) {
    const gl = this.gl;
    const glCanvas = this.glCanvas;
    if (!gl || !glCanvas || !this.fit(instance)) return;
    const { width: w, height: h } = instance.canvas;
    // Grow the shared canvas only when needed; render into its corner.
    if (glCanvas.width < w || glCanvas.height < h) {
      glCanvas.width = Math.max(glCanvas.width, w);
      glCanvas.height = Math.max(glCanvas.height, h);
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(this.uRes, w, h);
    gl.uniform1f(this.uTime, instance.animate ? this.time : STILL_TIME);
    gl.uniform1f(this.uSeed, instance.seed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // WebGL's origin is bottom-left, so the frame sits at the bottom.
    instance.ctx.drawImage(glCanvas, 0, glCanvas.height - h, w, h, 0, 0, w, h);
  }

  private loop = (now: number) => {
    this.frame = 0;
    this.time += Math.min(now - this.last, 50) / 1000;
    this.last = now;
    let animating = false;
    for (const instance of this.instances) {
      if (!instance.visible || !instance.animate) continue;
      this.draw(instance);
      animating = true;
    }
    if (animating && !document.hidden) {
      this.frame = requestAnimationFrame(this.loop);
    }
  };

  schedule() {
    if (this.frame || document.hidden) return;
    const needed = [...this.instances].some((i) => i.visible && i.animate);
    if (!needed) return;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  add(instance: Instance) {
    if (!this.init()) return false;
    this.instances.add(instance);
    this.draw(instance);
    this.schedule();
    return true;
  }

  remove(instance: Instance) {
    this.instances.delete(instance);
  }

  update(instance: Instance) {
    this.draw(instance);
    this.schedule();
  }
}

let renderer: LiquidRenderer | null = null;
let nextSeed = 0;

export function LiquidBackdrop({
  paused = false,
  className,
}: {
  paused?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seed = useRef(nextSeed++ * 7.3);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    renderer ??= new LiquidRenderer();
    const shared = renderer;
    // Phones and tablets get a still frame: smooth on screen, no battery cost.
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const instance: Instance = {
      canvas,
      ctx,
      visible: true,
      animate: !paused && !coarse,
      seed: seed.current,
    };
    if (!shared.add(instance)) return;
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            instance.visible = entry.isIntersecting;
            if (instance.visible) shared.update(instance);
          });
    io?.observe(canvas);
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => shared.update(instance));
    ro?.observe(canvas);
    return () => {
      io?.disconnect();
      ro?.disconnect();
      shared.remove(instance);
    };
  }, [paused]);
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
