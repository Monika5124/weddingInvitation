const loader = document.getElementById("loader");
const openInvitation = document.getElementById("openInvitation");
const siteHeader = document.getElementById("siteHeader");
const musicToggle = document.getElementById("musicToggle");
const musicIcon = document.getElementById("musicIcon");
const backgroundMusic = document.getElementById("backgroundMusic");
const rsvpForm = document.getElementById("rsvpForm");
const formStatus = document.getElementById("formStatus");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const closeLightbox = document.getElementById("closeLightbox");
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

const weddingDate = new Date("2026-08-31T09:15:00+05:30").getTime();
let particles = [];
let audioContext = null;
let musicNodes = [];
let musicTimers = [];
let fallbackMusicPlaying = false;

window.addEventListener("load", () => {
  setTimeout(() => {
    loader.classList.add("is-hidden");
    document.body.classList.add("invitation-open");
  }, 1600);
});

openInvitation.addEventListener("click", () => {
  document.body.classList.add("invitation-open");
  loader.classList.add("is-hidden");
  startMusic();
  document.getElementById("couple").scrollIntoView({ behavior: "smooth" });
});

window.addEventListener("scroll", () => {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 32);
  document.documentElement.style.setProperty("--scroll", `${window.scrollY}px`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

function updateCountdown() {
  const now = Date.now();
  const distance = Math.max(weddingDate - now, 0);
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

rsvpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(rsvpForm);
  const response = {
    name: formData.get("name").trim(),
    phone: formData.get("phone").trim(),
    guests: formData.get("guests"),
    attendance: formData.get("attendance"),
    submittedAt: new Date().toISOString()
  };

  const savedResponses = JSON.parse(localStorage.getItem("monikaMadhavRsvps") || "[]");
  savedResponses.push(response);
  localStorage.setItem("monikaMadhavRsvps", JSON.stringify(savedResponses));

  formStatus.textContent = "Thank you. Your RSVP has been saved.";
  rsvpForm.reset();
  document.getElementById("guestCount").value = 1;
});

// galleryGrid.addEventListener("click", (event) => {
//   const image = event.target.closest("img");
//   if (!image) return;

//   lightboxImage.src = image.src;
//   lightboxImage.alt = image.alt;
//   lightbox.classList.add("is-open");
//   document.body.style.overflow = "hidden";
// });

function closePreview() {
  lightbox.classList.remove("is-open");
  document.body.style.overflow = "";
}

closeLightbox.addEventListener("click", closePreview);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closePreview();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
    closePreview();
  }
});

musicToggle.addEventListener("click", () => {
  if (backgroundMusic.paused && !fallbackMusicPlaying) {
    startMusic();
  } else {
    pauseMusic();
  }
});

async function startMusic() {
  try {
    await backgroundMusic.play();
    musicIcon.textContent = "❚❚";
  } catch {
    startFallbackMusic();
  }
}

function pauseMusic() {
  backgroundMusic.pause();
  stopFallbackMusic();
  musicIcon.textContent = "▶";
}

function startFallbackMusic() {
  if (fallbackMusicPlaying) return;

  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  fallbackMusicPlaying = true;
  musicIcon.textContent = "❚❚";
  scheduleWeddingMelody();
}

function stopFallbackMusic() {
  if (!fallbackMusicPlaying) return;

  musicTimers.forEach((timer) => clearTimeout(timer));
  musicTimers = [];
  musicNodes.forEach(({ oscillator, gain }) => {
    gain.gain.cancelScheduledValues(audioContext.currentTime);
    gain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
    setTimeout(() => {
      oscillator.stop();
      oscillator.disconnect();
      gain.disconnect();
    }, 260);
  });
  musicNodes = [];
  fallbackMusicPlaying = false;
}

function scheduleWeddingMelody() {
  const melody = [
    261.63, 329.63, 392.0, 523.25,
    493.88, 392.0, 349.23, 329.63,
    293.66, 349.23, 440.0, 587.33,
    523.25, 440.0, 392.0, 329.63
  ];
  const harmony = [
    130.81, 164.81, 196.0, 261.63,
    246.94, 196.0, 174.61, 164.81
  ];
  const startTime = audioContext.currentTime + 0.08;
  const beat = 0.72;

  melody.forEach((frequency, index) => {
    playTone(frequency, startTime + index * beat, beat * 0.82, 0.045, "sine");
    if (index % 2 === 0) {
      playTone(harmony[(index / 2) % harmony.length], startTime + index * beat, beat * 1.55, 0.024, "triangle");
    }
  });

  const loopTimer = setTimeout(() => {
    if (fallbackMusicPlaying) scheduleWeddingMelody();
  }, melody.length * beat * 1000);
  musicTimers.push(loopTimer);
}

function playTone(frequency, startTime, duration, volume, type) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.08);
  gain.gain.setTargetAtTime(0.0001, startTime + duration, 0.18);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.45);
  musicNodes.push({ oscillator, gain });
}

function resizeCanvas() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  createParticles();
}

function createParticles() {
  const count = Math.min(Math.floor(window.innerWidth / 16), 120);
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 2.4 + 0.6,
    speed: Math.random() * 0.45 + 0.14,
    drift: Math.random() * 0.5 - 0.25,
    opacity: Math.random() * 0.62 + 0.18
  }));
}

function drawParticles() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles.forEach((particle) => {
    particle.y -= particle.speed;
    particle.x += particle.drift;

    if (particle.y < -10) {
      particle.y = window.innerHeight + 10;
      particle.x = Math.random() * window.innerWidth;
    }

    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 220, 132, ${particle.opacity})`;
    ctx.shadowColor = "rgba(255, 220, 132, 0.85)";
    ctx.shadowBlur = 10;
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(drawParticles);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawParticles();
