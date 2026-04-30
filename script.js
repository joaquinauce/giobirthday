const EVENT_DATE = new Date("2026-07-18T00:00:00");
const WHATSAPP_NUMBER = "5493516877930";
const CAROUSEL_INTERVAL_MS = 4000;

const GALLERY_PHOTOS = [
  {
    src: "./images/carrusel0.jpg",
    alt: "Luciano, Gabriela y Giovanni en una foto familiar",
    title: "Un comienzo lleno de amor",
    description: "Una primera foto familiar para abrir el recorrido del carrusel.",
    position: "center 48%",
  },
  {
    src: "./images/carrusel4.jpg",
    alt: "Giovanni sonriendo con un sombrerito",
    title: "Una sonrisa que derrite",
    description: "Una de esas expresiones de Gio que merecen tener su propio slide.",
    position: "center 26%",
  },
  {
    src: "./images/carrusel2.jpg",
    alt: "Familia y seres queridos junto a Giovanni",
    title: "Rodeado de su gente",
    description: "Una postal con parte de la familia acompañando este momento.",
    position: "center 38%",
  },
  {
    src: "./images/familiar.jpg",
    alt: "Luciano, Gabriela y Giovanni en una selfie familiar",
    title: "Los tres juntos",
    description: "Una foto íntima y cercana para sumar ternura entre las demás.",
    position: "center 42%",
  },
  {
    src: "./images/carrusel1.jpg",
    alt: "Una reunión familiar celebrando a Giovanni",
    title: "Camino compartido",
    description: "Otra escena linda para ir probando cómo se siente el álbum completo.",
    position: "center 34%",
  },
  {
    src: "./images/gio.jpg",
    alt: "Giovanni descansando con su conjunto tejido",
    title: "Nuestro pequeño osito",
    description: "Una foto suave de Gio que queda muy bien como pausa en el carrusel.",
    position: "center 64%",
  },
  ...Array.from({ length: 9 }, (_, index) => {
    const photoNumber = index + 7;
    const label = String(photoNumber).padStart(2, "0");

    return {
      src: `./gio-galeria-${label}.jpg`,
      alt: `Foto ${photoNumber} de Giovanni`,
      title: `Espacio para la foto ${label}`,
      description:
        "Cuando sumes más imágenes al proyecto, este slide queda listo para mostrarlas.",
    };
  }),
];

const countdownIds = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

const form = document.getElementById("rsvp-form");
const feedback = document.getElementById("form-feedback");
const carouselViewport = document.getElementById("photo-carousel");
const carouselDots = document.getElementById("carousel-dots");
const carouselPrev = document.getElementById("carousel-prev");
const carouselNext = document.getElementById("carousel-next");

let carouselIndex = 0;
let carouselTimer = null;

function padNumber(value) {
  return String(value).padStart(2, "0");
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
    const image = card.querySelector("[data-photo-target]") || card.querySelector("img");

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

function createCarouselSlide(photo, index) {
  const slide = document.createElement("article");
  slide.className = "carousel-slide";
  slide.setAttribute("aria-label", `Foto ${index + 1} de ${GALLERY_PHOTOS.length}`);

  const image = document.createElement("img");
  image.className = "carousel-image";
  image.src = photo.src;
  image.alt = photo.alt;
  image.loading = index === 0 ? "eager" : "lazy";
  if (photo.position) {
    image.style.objectPosition = photo.position;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "carousel-placeholder";
  placeholder.innerHTML = `
    <div class="carousel-placeholder-content">
      <strong>${photo.title}</strong>
      <p>${photo.description}</p>
    </div>
  `;

  const caption = document.createElement("div");
  caption.className = "carousel-caption";
  caption.innerHTML = `
    <strong>${photo.title}</strong>
    <p>${photo.description}</p>
  `;

  image.addEventListener("load", () => {
    placeholder.hidden = true;
    slide.append(image, caption);
  });

  image.addEventListener("error", () => {
    placeholder.hidden = false;
  });

  slide.append(placeholder);

  if (image.complete && image.naturalWidth > 0) {
    placeholder.hidden = true;
    slide.append(image, caption);
  }

  return slide;
}

function renderCarousel() {
  if (!carouselViewport || !carouselDots) {
    return;
  }

  const slides = GALLERY_PHOTOS.map(createCarouselSlide);

  slides.forEach((slide) => carouselViewport.appendChild(slide));

  GALLERY_PHOTOS.forEach((photo, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Ir a la foto ${index + 1}`);
    dot.title = photo.title;
    dot.addEventListener("click", () => {
      setActiveSlide(index);
      restartCarousel();
    });
    carouselDots.appendChild(dot);
  });

  setActiveSlide(0);
}

function setActiveSlide(index) {
  if (!carouselViewport || !carouselDots) {
    return;
  }

  const slides = carouselViewport.querySelectorAll(".carousel-slide");
  const dots = carouselDots.querySelectorAll(".carousel-dot");

  carouselIndex = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === carouselIndex);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === carouselIndex);
  });
}

function goToNextSlide() {
  setActiveSlide(carouselIndex + 1);
}

function goToPrevSlide() {
  setActiveSlide(carouselIndex - 1);
}

function startCarousel() {
  if (!carouselViewport) {
    return;
  }

  stopCarousel();
  carouselTimer = window.setInterval(goToNextSlide, CAROUSEL_INTERVAL_MS);
}

function stopCarousel() {
  if (carouselTimer) {
    window.clearInterval(carouselTimer);
    carouselTimer = null;
  }
}

function restartCarousel() {
  stopCarousel();
  startCarousel();
}

function initCarouselControls() {
  if (!carouselViewport) {
    return;
  }

  carouselPrev?.addEventListener("click", () => {
    goToPrevSlide();
    restartCarousel();
  });

  carouselNext?.addEventListener("click", () => {
    goToNextSlide();
    restartCarousel();
  });

  carouselViewport.addEventListener("mouseenter", stopCarousel);
  carouselViewport.addEventListener("mouseleave", startCarousel);
  startCarousel();
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

updateCountdown();
setInterval(updateCountdown, 1000);
form?.addEventListener("submit", handleFormSubmit);
initPhotoCards();
renderCarousel();
initCarouselControls();
initRevealAnimations();
