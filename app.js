document.documentElement.classList.add("js");

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionToggle = document.querySelector("#motion-toggle");
const motionLabel = document.querySelector("#motion-label");
const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const progressBar = document.querySelector("#progress-bar");
const currentYear = document.querySelector("#current-year");

if (currentYear) currentYear.textContent = String(new Date().getFullYear());

function getSavedMotionPreference() {
  try { return window.localStorage.getItem("umesh-portfolio-motion"); }
  catch { return null; }
}

function saveMotionPreference(value) {
  try { window.localStorage.setItem("umesh-portfolio-motion", value); }
  catch { /* Storage can be unavailable in private browsing. */ }
}

function setMotion(enabled) {
  const motionOn = Boolean(enabled) && !reducedMotion.matches;
  root.dataset.motion = motionOn ? "on" : "off";
  if (motionToggle) {
    motionToggle.setAttribute("aria-pressed", String(motionOn));
    motionToggle.disabled = reducedMotion.matches;
    motionToggle.setAttribute("aria-label", reducedMotion.matches
      ? "Motion is off because reduced motion is enabled in your system settings"
      : `Motion ${motionOn ? "on" : "off"}. ${motionOn ? "Pause" : "Enable"} animations`);
  }
  if (motionLabel) motionLabel.textContent = reducedMotion.matches
    ? "Motion off · system setting"
    : `Motion ${motionOn ? "on · pause" : "off · enable"}`;
  return motionOn;
}

const savedMotion = getSavedMotionPreference();
let motionOn = setMotion(!reducedMotion.matches && savedMotion !== "off");

motionToggle?.addEventListener("click", () => {
  motionOn = setMotion(!motionOn);
  saveMotionPreference(motionOn ? "on" : "off");
});

reducedMotion.addEventListener?.("change", () => {
  motionOn = setMotion(!reducedMotion.matches && getSavedMotionPreference() !== "off");
});

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
    if (!isOpen) primaryNav.querySelector("a")?.focus({ preventScroll: true });
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

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && revealItems.length && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
  }, { threshold: 0.035, rootMargin: "0px 0px -8% 0px" });
  revealItems.forEach((item) => revealObserver.observe(item));
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

const capabilityTabs = [...document.querySelectorAll("[role='tab']")];
const capabilityPanel = document.querySelector("#capability-panel");
const capabilityTitle = document.querySelector("#capability-title");
const capabilityDescription = document.querySelector("#capability-description");
const capabilitySkills = document.querySelector("#capability-skills");
const capabilityNumber = document.querySelector("#capability-number");
const capabilityProof = document.querySelector("#capability-proof");
const capabilityProofName = document.querySelector("#capability-proof-name");

function selectCapability(tab, moveFocus = false) {
  const index = capabilityTabs.indexOf(tab);
  if (index < 0) return;
  capabilityTabs.forEach((item, itemIndex) => {
    const active = itemIndex === index;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  if (capabilityPanel && capabilityTitle && capabilityDescription && capabilitySkills && capabilityNumber && capabilityProof && capabilityProofName) {
    capabilityPanel.setAttribute("aria-labelledby", tab.id);
    capabilityTitle.textContent = tab.dataset.title || "";
    capabilityDescription.textContent = tab.dataset.description || "";
    capabilitySkills.textContent = tab.dataset.skills || "";
    capabilityNumber.textContent = String(index + 1).padStart(2, "0");
    capabilityProof.href = tab.dataset.proofHref || "#work";
    capabilityProofName.textContent = tab.dataset.proof || "Selected work";
    capabilityPanel.classList.remove("is-changing");
    void capabilityPanel.offsetWidth;
    if (motionOn) capabilityPanel.classList.add("is-changing");
  }
  if (moveFocus) tab.focus();
}

capabilityTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectCapability(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % capabilityTabs.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + capabilityTabs.length) % capabilityTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = capabilityTabs.length - 1;
    else return;
    event.preventDefault();
    selectCapability(capabilityTabs[nextIndex], true);
  });
});
