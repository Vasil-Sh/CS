import { useEffect, useRef } from "react";

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
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_res.x / u_res.y;
  float t = u_time * 0.16;
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
export function LiquidBackdrop({
  paused = false,
  className,
}: {
  paused?: boolean;
  className?: string;
}) {
  const reduced = paused;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!canvas || !gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, liquidVertex);
    const fs = compile(gl.FRAGMENT_SHADER, liquidFragment);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");

    // Rendered below full resolution: the field is smooth, so this is
    // invisible and keeps the GPU cost low.
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.6;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    let time = 12;
    const draw = () => {
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    resize();
    draw();
    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(canvas);

    let frame = 0;
    let visible = true;
    let last = performance.now();
    const loop = (now: number) => {
      time += Math.min(now - last, 50) / 1000;
      last = now;
      draw();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduced || frame || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      stop();
      io.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [reduced]);
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
