document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const progressBar = document.querySelector("#progress-bar");
const currentYear = document.querySelector("#current-year");

if (currentYear) currentYear.textContent = String(new Date().getFullYear());

if (menuToggle && primaryNav) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    primaryNav.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    primaryNav.classList.toggle("is-open", !isOpen);
  });

  primaryNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (menuToggle.getAttribute("aria-expanded") === "true" && !primaryNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
}

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && revealItems.length) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const navLinks = [...document.querySelectorAll(".primary-nav a[href^='#']")];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
if ("IntersectionObserver" in window && sections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        if (link.getAttribute("href") === "#" + entry.target.id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });
  sections.forEach((section) => sectionObserver.observe(section));
}

let scrollQueued = false;
function updatePageProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const progress = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
  if (progressBar) progressBar.style.width = (progress * 100).toFixed(2) + "%";
  scrollQueued = false;
}
window.addEventListener("scroll", () => {
  if (!scrollQueued) {
    scrollQueued = true;
    window.requestAnimationFrame(updatePageProgress);
  }
}, { passive: true });
window.addEventListener("resize", updatePageProgress, { passive: true });
updatePageProgress();

const canvas = document.querySelector("#signal-canvas");
const heroArt = document.querySelector(".hero-art");
if (canvas && heroArt) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (gl) {
    const vertexSource = [
      "attribute vec2 a_position;",
      "void main() { gl_Position = vec4(a_position, 0.0, 1.0); }"
    ].join("\n");

    const fragmentSource = [
      "precision highp float;",
      "uniform vec2 u_resolution;",
      "uniform vec2 u_mouse;",
      "uniform float u_time;",
      "uniform float u_scroll;",
      "mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }",
      "float scene(vec3 p) {",
      "  float t = u_time;",
      "  p.xy *= rot(0.28 + u_mouse.x * 0.27 + u_scroll * 0.18 + sin(t * 0.22) * 0.08);",
      "  p.yz *= rot(-0.18 + u_mouse.y * 0.22 + cos(t * 0.17) * 0.08);",
      "  p.xz *= rot(0.22 * sin(p.y * 2.4 + t * 0.24));",
      "  p += 0.025 * vec3(sin(p.y * 5.0 + t * 0.42), sin(p.z * 4.5 - t * 0.31), sin(p.x * 4.0 + t * 0.28));",
      "  float angle = atan(p.y, p.x);",
      "  float band = 0.205 + 0.028 * sin(angle * 2.0 + t * 0.24) + 0.012 * cos(angle * 5.0 - t * 0.17);",
      "  float ring = length(vec2(length(p.xy) - 0.73, p.z)) - band;",
      "  float ripple = 0.012 * sin(p.x * 5.0 + t * 0.35) * sin(p.y * 4.0 - t * 0.22);",
      "  return ring + ripple;",
      "}",
      "vec3 normalAt(vec3 p) {",
      "  vec2 e = vec2(0.0018, 0.0);",
      "  return normalize(vec3(scene(p + e.xyy) - scene(p - e.xyy), scene(p + e.yxy) - scene(p - e.yxy), scene(p + e.yyx) - scene(p - e.yyx)));",
      "}",
      "void main() {",
      "  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;",
      "  vec3 ro = vec3(u_mouse.x * 0.11, u_mouse.y * 0.08 + u_scroll * 0.08, 3.15);",
      "  vec3 rd = normalize(vec3(uv, -1.72));",
      "  float travel = 0.0;",
      "  bool hit = false;",
      "  vec3 p = vec3(0.0);",
      "  for (int i = 0; i < 84; i++) {",
      "    p = ro + rd * travel;",
      "    float d = scene(p);",
      "    if (d < 0.0015) { hit = true; break; }",
      "    travel += d * 0.82;",
      "    if (travel > 6.0) break;",
      "  }",
      "  vec3 color = vec3(0.027, 0.035, 0.050);",
      "  float glow = exp(-2.5 * abs(length(uv) - 0.35));",
      "  color += glow * vec3(0.025, 0.09, 0.105);",
      "  if (hit) {",
      "    vec3 n = normalAt(p);",
      "    vec3 view = normalize(-rd);",
      "    vec3 lightA = normalize(vec3(-0.65, 0.8, 0.7));",
      "    vec3 lightB = normalize(vec3(0.85, -0.4, 0.15));",
      "    float diffuse = max(dot(n, lightA), 0.0) * 0.64 + max(dot(n, lightB), 0.0) * 0.20;",
      "    float fresnel = pow(1.0 - max(dot(n, view), 0.0), 2.6);",
      "    float specular = pow(max(dot(reflect(-lightA, n), view), 0.0), 34.0);",
      "    float band = smoothstep(-0.3, 0.85, n.x * 0.45 + n.y * 0.68 + sin(atan(p.y, p.x)) * 0.18);",
      "    vec3 base = mix(vec3(0.16, 0.23, 0.36), vec3(0.31, 0.59, 0.62), band);",
      "    base = mix(base, vec3(0.47, 0.35, 0.76), smoothstep(0.25, 0.95, n.z * 0.7 + n.y * 0.2));",
      "    color = base * (0.17 + diffuse) + fresnel * vec3(0.18, 0.72, 0.64) + specular * vec3(0.86, 0.96, 0.89);",
      "    color += pow(fresnel, 3.0) * vec3(0.24, 0.27, 0.52) * 0.45;",
      "  }",
      "  float vignette = 1.0 - smoothstep(0.28, 0.9, length(uv));",
      "  color *= 0.72 + vignette * 0.32;",
      "  gl_FragColor = vec4(color, 1.0);",
      "}"
    ].join("\n");

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (vertexShader && fragmentShader && program) {
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
    }

    if (program && gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.useProgram(program);
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const uniforms = {
        resolution: gl.getUniformLocation(program, "u_resolution"),
        mouse: gl.getUniformLocation(program, "u_mouse"),
        time: gl.getUniformLocation(program, "u_time"),
        scroll: gl.getUniformLocation(program, "u_scroll")
      };
      const target = { x: 0, y: 0, scroll: 0 };
      const current = { x: 0, y: 0, scroll: 0 };
      let frame = 0;
      let dirty = true;
      let width = 0;
      let height = 0;

      function resizeCanvas() {
        const bounds = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
        const nextWidth = Math.max(1, Math.round(bounds.width * ratio));
        const nextHeight = Math.max(1, Math.round(bounds.height * ratio));
        if (nextWidth === width && nextHeight === height) return;
        width = canvas.width = nextWidth;
        height = canvas.height = nextHeight;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(uniforms.resolution, width, height);
        dirty = true;
      }

      function onPointer(event) {
        const bounds = canvas.getBoundingClientRect();
        target.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        target.y = 1 - ((event.clientY - bounds.top) / bounds.height) * 2;
        dirty = true;
        requestRender();
      }

      function onPointerLeave() {
        target.x = 0;
        target.y = 0;
        dirty = true;
        requestRender();
      }

      function onScroll() {
        const heightOfView = Math.max(1, window.innerHeight);
        target.scroll = Math.min(1, Math.max(0, window.scrollY / heightOfView));
        dirty = true;
        requestRender();
      }

      function render(now) {
        frame = 0;
        if (document.visibilityState === "hidden") return;
        resizeCanvas();
        current.x += (target.x - current.x) * 0.055;
        current.y += (target.y - current.y) * 0.055;
        current.scroll += (target.scroll - current.scroll) * 0.055;
        gl.uniform2f(uniforms.mouse, current.x, current.y);
        gl.uniform1f(uniforms.time, reducedMotion.matches ? 0 : now * 0.00026);
        gl.uniform1f(uniforms.scroll, current.scroll);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        const moving = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) + Math.abs(target.scroll - current.scroll) > 0.001;
        dirty = false;
        if (!reducedMotion.matches || moving || dirty) frame = window.requestAnimationFrame(render);
      }

      function requestRender() {
        dirty = true;
        if (!frame && (reducedMotion.matches || document.visibilityState !== "hidden")) frame = window.requestAnimationFrame(render);
      }

      heroArt.addEventListener("pointermove", onPointer, { passive: true });
      heroArt.addEventListener("pointerleave", onPointerLeave, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", requestRender, { passive: true });
      document.addEventListener("visibilitychange", requestRender);
      reducedMotion.addEventListener?.("change", requestRender);
      heroArt.classList.add("webgl-ready");
      requestRender();
    } else {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      if (program) gl.deleteProgram(program);
    }
  }
}
