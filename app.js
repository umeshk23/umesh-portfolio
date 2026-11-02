document.documentElement.classList.add("js");

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionToggle = document.querySelector("#motion-toggle");
const motionLabel = document.querySelector("#motion-label");
const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const progressBar = document.querySelector("#progress-bar");
const year = document.querySelector("#current-year");

if (year) year.textContent = String(new Date().getFullYear());

function readMotionPreference() {
  try { return window.localStorage.getItem("umesh-portfolio-motion"); }
  catch { return null; }
}

function saveMotionPreference(value) {
  try { window.localStorage.setItem("umesh-portfolio-motion", value); }
  catch { /* Storage may be unavailable. */ }
}

function setMotion(enabled) {
  const on = Boolean(enabled) && !reducedMotion.matches;
  root.dataset.motion = on ? "on" : "off";
  if (motionToggle) {
    motionToggle.setAttribute("aria-pressed", String(on));
    motionToggle.disabled = reducedMotion.matches;
    motionToggle.setAttribute("aria-label", reducedMotion.matches
      ? "Motion is off because reduced motion is enabled in your system settings"
      : `Motion ${on ? "on" : "off"}. ${on ? "Pause" : "Enable"} animations`);
  }
  if (motionLabel) motionLabel.textContent = reducedMotion.matches
    ? "Motion off · system setting"
    : `Motion ${on ? "on · pause" : "off · enable"}`;
  return on;
}

let motionOn = setMotion(!reducedMotion.matches && readMotionPreference() !== "off");
motionToggle?.addEventListener("click", () => {
  motionOn = setMotion(!motionOn);
  saveMotionPreference(motionOn ? "on" : "off");
});

const handleReducedMotionChange = () => {
  motionOn = setMotion(!reducedMotion.matches && readMotionPreference() !== "off");
};
if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", handleReducedMotionChange);
else reducedMotion.addListener?.(handleReducedMotionChange);

if (menuToggle && primaryNav) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    primaryNav.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!open));
    menuToggle.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
    primaryNav.classList.toggle("is-open", !open);
    if (!open) primaryNav.querySelector("a")?.focus({ preventScroll: true });
  });

  primaryNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuToggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (menuToggle.getAttribute("aria-expanded") === "true" && !primaryNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  }, { passive: true });
}

const revealItems = [...document.querySelectorAll("[data-reveal]")];
if ("IntersectionObserver" in window && revealItems.length && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = item.dataset.reveal === "line" ? `${Math.min(index % 4, 3) * 70}ms` : "";
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const navLinks = [...document.querySelectorAll(".primary-nav a[href^='#']")];
const navSections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
if ("IntersectionObserver" in window && navSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });
  navSections.forEach((section) => sectionObserver.observe(section));
}

let scrollQueued = false;
function updatePageProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const progress = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
  if (progressBar) progressBar.style.width = `${(progress * 100).toFixed(2)}%`;
  scrollQueued = false;
}
window.addEventListener("scroll", () => {
  if (scrollQueued) return;
  scrollQueued = true;
  window.requestAnimationFrame(updatePageProgress);
}, { passive: true });
window.addEventListener("resize", updatePageProgress, { passive: true });
updatePageProgress();

const tabs = [...document.querySelectorAll(".discipline-tab[role='tab']")];
const panel = document.querySelector("#discipline-panel");
const panelKicker = document.querySelector("#discipline-kicker");
const panelTitle = document.querySelector("#discipline-title");
const panelDescription = document.querySelector("#discipline-description");
const panelSkills = document.querySelector("#discipline-skills");
const panelProof = document.querySelector("#discipline-proof");
const panelProofName = document.querySelector("#discipline-proof-name");

function selectDiscipline(tab, moveFocus = false) {
  const index = tabs.indexOf(tab);
  if (index < 0) return;
  tabs.forEach((item, itemIndex) => {
    const active = index === itemIndex;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  if (panel && panelKicker && panelTitle && panelDescription && panelSkills && panelProof && panelProofName) {
    panel.setAttribute("aria-labelledby", tab.id);
    panelKicker.textContent = tab.dataset.kicker || "";
    panelTitle.textContent = tab.dataset.title || "";
    panelDescription.textContent = tab.dataset.description || "";
    panelSkills.textContent = tab.dataset.skills || "";
    panelProof.href = tab.dataset.proofHref || "#work";
    panelProofName.textContent = tab.dataset.proof || "Selected work";
    panel.classList.remove("is-changing");
    void panel.offsetWidth;
    if (motionOn) panel.classList.add("is-changing");
  }
  if (moveFocus) tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectDiscipline(tab));
  tab.addEventListener("keydown", (event) => {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectDiscipline(tabs[next], true);
  });
});
