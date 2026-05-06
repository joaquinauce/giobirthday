const EVENT_DATE = new Date("2026-07-18T00:00:00");
const WHATSAPP_NUMBER = "5493512159559";
const PHOTO_STACK_INTERVAL_MS = 1220;
const HERO_IMAGE_DIRECTORY = "./images/portada/";
const PHOTO_STACK_DIRECTORY = "./images/carrusel/";
const HERO_IMAGE_FALLBACKS = buildImagePaths(
  HERO_IMAGE_DIRECTORY,
  Array.from({ length: 7 }, (_, index) => `portada${index + 1}.jpg`),
);
const PHOTO_STACK_FALLBACKS = buildImagePaths(PHOTO_STACK_DIRECTORY, [
  "carrusel.jpeg",
  ...Array.from({ length: 94 }, (_, index) => `carrusel (${index + 1}).jpeg`),
  ...Array.from({ length: 5 }, (_, index) => `carrusel (${index + 1}).jpg`),
]);
const HERO_IMAGE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;

const countdownIds = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

const form = document.getElementById("rsvp-form");
const feedback = document.getElementById("form-feedback");
const photoStackStage = document.getElementById("photo-carousel");

let photoStackPhotos = [];
let photoStackCards = [];
let photoStackTimer = null;
let photoStackIndex = 0;
let photoStackSequence = 0;
let isPhotoStackInView = false;
let hasPhotoStackStarted = false;

function buildImagePaths(directoryPath, fileNames) {
  return fileNames.map((fileName) => encodeURI(`${directoryPath}${fileName}`));
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function pickRandomItem(items) {
  if (!items.length) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

function shuffleItems(items) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
  }

  return shuffledItems;
}

async function loadImagesFromDirectory(directoryPath) {
  try {
    const response = await fetch(directoryPath, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Directory fetch failed with status ${response.status}`);
    }

    const markup = await response.text();
    const documentFragment = new DOMParser().parseFromString(markup, "text/html");
    const normalizedDirectoryPath = directoryPath.replace(/^\./, "");
    const imageUrls = Array.from(documentFragment.querySelectorAll("a[href]"))
      .map((link) => link.getAttribute("href")?.trim() ?? "")
      .filter(Boolean)
      .map((href) => new URL(href, response.url).href)
      .filter((href) => {
        const url = new URL(href);
        return url.pathname.includes(normalizedDirectoryPath) && HERO_IMAGE_PATTERN.test(url.pathname);
      });

    return [...new Set(imageUrls)];
  } catch (error) {
    return [];
  }
}

async function initRandomHeroImage() {
  const heroImage = document.getElementById("main-photo-image");

  if (!heroImage) {
    return;
  }

  const discoveredImages = await loadImagesFromDirectory(HERO_IMAGE_DIRECTORY);
  const availableImages = discoveredImages.length ? discoveredImages : HERO_IMAGE_FALLBACKS;
  const selectedImage = pickRandomItem(availableImages);

  if (!selectedImage) {
    return;
  }

  heroImage.src = selectedImage;
}

function updateCountdown() {
  const now = new Date();
  const difference = EVENT_DATE.getTime() - now.getTime();

  if (difference <= 0) {
    countdownIds.days.textContent = "00";
    countdownIds.hours.textContent = "00";
    countdownIds.minutes.textContent = "00";
    countdownIds.seconds.textContent = "00";
    return;
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  countdownIds.days.textContent = padNumber(days);
  countdownIds.hours.textContent = padNumber(hours);
  countdownIds.minutes.textContent = padNumber(minutes);
  countdownIds.seconds.textContent = padNumber(seconds);
}

function initPhotoCards() {
  const photoCards = document.querySelectorAll("[data-photo-card], #main-photo");

  photoCards.forEach((card) => {
    const image = card.querySelector("img");

    if (!image) {
      return;
    }

    const syncPhotoState = () => {
      if (image.complete && image.naturalWidth > 0) {
        card.classList.add("photo-ready");
        return;
      }

      card.classList.remove("photo-ready");
    };

    image.addEventListener("load", syncPhotoState);
    image.addEventListener("error", syncPhotoState);
    syncPhotoState();
  });
}

function preloadStackPhoto(photo) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(photo);
    image.onerror = () => resolve(null);
    image.src = photo.src;
  });
}

function buildPhotoStackEntries(imagePaths) {
  return imagePaths.map((src, index) => ({
    src,
    alt: `Foto ${index + 1} de Giovanni`,
    position: "center 38%",
  }));
}

async function resolveStackPhotos() {
  const discoveredImages = await loadImagesFromDirectory(PHOTO_STACK_DIRECTORY);
  const availableImages = discoveredImages.length ? discoveredImages : PHOTO_STACK_FALLBACKS;
  const stackPhotos = buildPhotoStackEntries(availableImages);
  const loadedPhotos = await Promise.all(stackPhotos.map(preloadStackPhoto));
  return loadedPhotos.filter(Boolean);
}

function getPhotoStackPlacement(depth) {
  const compactLayout = window.matchMedia("(max-width: 720px)").matches;
  const horizontalSpread = compactLayout ? 124 : 290;
  const verticalSpread = compactLayout ? 64 : 118;
  const minWidth = compactLayout ? 220 : 320;
  const maxWidth = compactLayout ? 300 : 430;

  return {
    x: `${Math.round((Math.random() - 0.5) * horizontalSpread * 2)}px`,
    y: `${Math.round((Math.random() - 0.5) * verticalSpread * 2 + Math.min(depth * 2, 20) + 4)}px`,
    rotation: `${((Math.random() - 0.5) * 16).toFixed(2)}deg`,
    scale: (0.95 + Math.random() * 0.06).toFixed(3),
    width: `${Math.round(minWidth + Math.random() * (maxWidth - minWidth))}px`,
  };
}

function getCssNumber(card, variableName) {
  const value = Number.parseFloat(getComputedStyle(card).getPropertyValue(variableName));
  return Number.isFinite(value) ? value : 0;
}

function updatePhotoStackCardTilt(card, clientX, clientY) {
  const bounds = card.getBoundingClientRect();
  const relativeX = (clientX - bounds.left) / bounds.width - 0.5;
  const relativeY = (clientY - bounds.top) / bounds.height - 0.5;
  const tiltX = relativeY * -12;
  const tiltY = relativeX * 14;

  card.style.setProperty("--stack-tilt-x", `${tiltX.toFixed(2)}deg`);
  card.style.setProperty("--stack-tilt-y", `${tiltY.toFixed(2)}deg`);
  card.style.setProperty("--stack-lift", "18px");
  card.style.setProperty("--stack-hover-scale", "1.018");
}

function resetPhotoStackCardTilt(card) {
  card.style.setProperty("--stack-tilt-x", "0deg");
  card.style.setProperty("--stack-tilt-y", "0deg");
  card.style.setProperty("--stack-lift", "0px");
  card.style.setProperty("--stack-hover-scale", "1");
}

function attachPhotoStackCardInteraction(card) {
  const dragState = {
    isDragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  };

  const handlePointerMove = (event) => {
    if (!hasPhotoStackStarted) {
      return;
    }

    if (!dragState.isDragging) {
      updatePhotoStackCardTilt(card, event.clientX, event.clientY);
      return;
    }

    const nextOffsetX = dragState.offsetX + (event.clientX - dragState.startX);
    const nextOffsetY = dragState.offsetY + (event.clientY - dragState.startY);
    const dragRotation = Math.max(-10, Math.min(10, nextOffsetX * 0.045));

    card.style.setProperty("--stack-drag-x", `${nextOffsetX.toFixed(1)}px`);
    card.style.setProperty("--stack-drag-y", `${nextOffsetY.toFixed(1)}px`);
    card.style.setProperty("--stack-drag-rotation", `${dragRotation.toFixed(2)}deg`);
    updatePhotoStackCardTilt(card, event.clientX, event.clientY);
  };

  const finishDragging = () => {
    dragState.isDragging = false;
    dragState.pointerId = null;
    card.classList.remove("is-dragging");
    resetPhotoStackCardTilt(card);
    beginPhotoStackIfNeeded();
  };

  card.addEventListener("pointerenter", (event) => {
    if (dragState.isDragging || !hasPhotoStackStarted) {
      return;
    }

    updatePhotoStackCardTilt(card, event.clientX, event.clientY);
  });

  card.addEventListener("pointermove", handlePointerMove);

  card.addEventListener("pointerleave", () => {
    if (dragState.isDragging) {
      return;
    }

    resetPhotoStackCardTilt(card);
  });

  card.addEventListener("pointerdown", (event) => {
    if (!hasPhotoStackStarted) {
      return;
    }

    dragState.isDragging = true;
    dragState.pointerId = event.pointerId;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.offsetX = getCssNumber(card, "--stack-drag-x");
    dragState.offsetY = getCssNumber(card, "--stack-drag-y");

    photoStackSequence += 1;
    card.style.zIndex = String(photoStackSequence);
    card.classList.add("is-dragging");
    card.setPointerCapture(event.pointerId);
    stopPhotoStack();
    updatePhotoStackCardTilt(card, event.clientX, event.clientY);
  });

  card.addEventListener("pointerup", (event) => {
    if (!dragState.isDragging || dragState.pointerId !== event.pointerId) {
      return;
    }

    card.releasePointerCapture(event.pointerId);
    finishDragging();
  });

  card.addEventListener("pointercancel", (event) => {
    if (dragState.pointerId === event.pointerId && card.hasPointerCapture(event.pointerId)) {
      card.releasePointerCapture(event.pointerId);
    }

    finishDragging();
  });
}

function createPhotoStackCard(photo, depth) {
  const card = document.createElement("article");
  const plane = document.createElement("div");
  const frame = document.createElement("div");
  const image = document.createElement("img");
  const placement = getPhotoStackPlacement(depth);

  card.className = "photo-stack-card";
  card.style.setProperty("--stack-x", placement.x);
  card.style.setProperty("--stack-y", placement.y);
  card.style.setProperty("--stack-rotation", placement.rotation);
  card.style.setProperty("--stack-scale", placement.scale);
  card.style.setProperty("--stack-width", placement.width);
  card.style.setProperty("--stack-drag-x", "0px");
  card.style.setProperty("--stack-drag-y", "0px");
  card.style.setProperty("--stack-drag-rotation", "0deg");
  card.style.setProperty("--stack-tilt-x", "0deg");
  card.style.setProperty("--stack-tilt-y", "0deg");
  card.style.setProperty("--stack-hover-scale", "1");
  card.style.setProperty("--stack-lift", "0px");
  card.style.zIndex = String(photoStackSequence);

  plane.className = "photo-stack-plane";
  frame.className = "photo-stack-frame";
  image.className = "photo-stack-image";
  image.src = photo.src;
  image.alt = photo.alt;
  image.loading = photoStackSequence === 1 ? "eager" : "lazy";

  if (photo.position) {
    image.style.objectPosition = photo.position;
  }

  frame.appendChild(image);
  plane.appendChild(frame);
  card.appendChild(plane);
  attachPhotoStackCardInteraction(card);

  return card;
}

function addNextPhotoToStack() {
  if (!photoStackStage || !photoStackPhotos.length) {
    return;
  }

  if (photoStackIndex >= photoStackPhotos.length) {
    stopPhotoStack();
    return;
  }

  const photo = photoStackPhotos[photoStackIndex];
  photoStackIndex += 1;
  photoStackSequence += 1;

  const card = createPhotoStackCard(photo, photoStackCards.length);
  photoStackStage.appendChild(card);
  photoStackStage.classList.add("has-photos");
  photoStackCards.push(card);

  window.requestAnimationFrame(() => {
    card.classList.add("is-visible");
  });
}

function startPhotoStack() {
  if (!photoStackStage || photoStackTimer || !photoStackPhotos.length || !isPhotoStackInView) {
    return;
  }

  if (photoStackIndex >= photoStackPhotos.length) {
    return;
  }

  photoStackTimer = window.setInterval(addNextPhotoToStack, PHOTO_STACK_INTERVAL_MS);
}

function stopPhotoStack() {
  if (!photoStackTimer) {
    return;
  }

  window.clearInterval(photoStackTimer);
  photoStackTimer = null;
}

function beginPhotoStackIfNeeded() {
  if (!photoStackStage || !photoStackPhotos.length || !isPhotoStackInView) {
    return;
  }

  if (!hasPhotoStackStarted) {
    hasPhotoStackStarted = true;
    addNextPhotoToStack();
  }

  startPhotoStack();
}

async function initPhotoStack() {
  if (!photoStackStage) {
    return;
  }

  photoStackPhotos = shuffleItems(await resolveStackPhotos());

  if (!photoStackPhotos.length) {
    photoStackStage.hidden = true;
    return;
  }

  if (!("IntersectionObserver" in window)) {
    isPhotoStackInView = true;
    beginPhotoStackIfNeeded();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.target !== photoStackStage) {
          return;
        }

        isPhotoStackInView = entry.isIntersecting;

        if (isPhotoStackInView) {
          beginPhotoStackIfNeeded();
          return;
        }

        stopPhotoStack();
      });
    },
    {
      threshold: 0.35,
    },
  );

  observer.observe(photoStackStage);
}

function buildWhatsappMessage(name, count, message) {
  const lines = [
    "Hola! Confirmo asistencia al BautiCumple de Gio.",
    `Nombre: ${name}`,
    `Asistentes: ${count}`,
    "Evento: Bautismo + primer cumpleaños de Giovanni",
    "Fecha: 18/07/2026",
  ];

  if (message) {
    lines.push(`Mensaje: ${message}`);
  }

  return lines.join("\n");
}

function handleFormSubmit(event) {
  event.preventDefault();

  const guestName = document.getElementById("guest-name").value.trim();
  const guestCount = document.getElementById("guest-count").value.trim();
  const guestMessage = document.getElementById("guest-message").value.trim();

  if (!guestName || !guestCount) {
    feedback.textContent = "Completa nombre y cantidad de asistentes.";
    return;
  }

  const message = buildWhatsappMessage(guestName, guestCount, guestMessage);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  feedback.textContent = "Abriendo WhatsApp con la confirmación lista.";
  window.open(whatsappUrl, "_blank", "noopener");
}

function initRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    },
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${index * 70}ms`;
    observer.observe(item);
  });
}

async function initApp() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
  form?.addEventListener("submit", handleFormSubmit);
  await initRandomHeroImage();
  initPhotoCards();
  await initPhotoStack();
  initRevealAnimations();
}

initApp();
