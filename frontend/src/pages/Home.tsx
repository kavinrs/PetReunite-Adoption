import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import StoriesReel from "../components/StoriesReelClean";
import { useViewportStandardization } from "../hooks/useViewportStandardization";

const HERO_BG = "/hero.jpeg"; // place uploaded asset at frontend/public/hero-bg.png
const ABOUT_IMAGE = "/about pet.jpg"; // place uploaded asset at frontend/public/about pet.jpg
// To change images or captions in the reels section, edit the items in REEL_SLIDES.
const REEL_SLIDES = [
  {
    src: "/bg1.png",
    alt: "Two golden retriever puppies sitting together on a beach at sunset",
    title: "Found with the help of neighbors",
    description:
      "Local alerts and real-time updates help nearby families spot and report missing pets quickly.",
  },
  {
    src: "/bg2.jpeg",
    alt: "Cat and dog sitting together in a sunlit field with a butterfly above",
    title: "Every sighting matters",
    description:
      "Verified reports and photos make it easier to confirm when a pet has really been seen.",
  },
  {
    src: "/dashboard.png",
    alt: "Dashboard interface showing pet reports and search tools",
    title: "Track cases in one place",
    description:
      "Owners, rescuers, and volunteers can follow each case from first report to safe reunion.",
  },
  {
    src: "/hero-willow.png",
    alt: "Abstract pet-themed background illustration",
    title: "Built for real-world emergencies",
    description:
      "Tools designed around real rescue workflows help everyone respond faster when every minute counts.",
  },
];

export default function Home() {
  // Apply viewport standardization to ensure consistent 100% scaling
  useViewportStandardization();

  return (
    <>
      <HeroSection />
      <AboutSection />
      <HowWeHelpSection />
      <StoriesReel />
      <SiteFooter />
    </>
  );
}

function HeroSection() {
  const navigate = useNavigate();

  return (
    <>
      <a className="skip-link" href="#about-rescue">
        Skip to About section
      </a>
      <section
        className="hero-banner"
        role="banner"
        aria-label="PetReunite hero section"
        style={{ backgroundImage: `url('${HERO_BG}')` }}
      >
        <div className="hero-brand-badge" aria-label="PetReunite">
          PetReunite
        </div>
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-content">
          <span className="hero-label">PetReunite</span>
          <h1 className="hero-title">
            Lost a Pet?{" "}
            <span className="hero-gradient" aria-hidden="false">
              Let’s Bring Them Home.
            </span>
          </h1>
          <h2 className="hero-subtitle">Let's Reunite Them Together</h2>
          <p className="hero-text">
            Helping lost pets find their way home through our caring community
            network
          </p>
          <div
            className="hero-actions"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: "100%",
              gap: "8px",
              marginTop: "12px",
              padding: "0",
            }}
          >
            <button
              type="button"
              className="hero-btn hero-btn--primary"
              aria-label="Start searching for pets"
              onClick={() => navigate("/login")}
              style={{
                background:
                  "linear-gradient(90deg, #ff9d44 0%, #ff7755 33%, #ff4ba8 100%)",
                backgroundColor: "#ff6666",
                width: "auto",
                maxWidth: "220px",
                minWidth: "160px",
                height: "36px",
                padding: "0 18px",
                border: "none",
                borderRadius: "999px",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.75rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                boxSizing: "border-box",
                textDecoration: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 3px 12px rgba(255, 157, 68, 0.25)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span className="hero-btn__icon" aria-hidden="true">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.65" y1="16.65" x2="21" y2="21" />
                </svg>
              </span>
              Start Your Search
              <span className="hero-btn__chevron" aria-hidden="true">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>
          </div>
        </div>
        <div
          className="hero-scroll-indicator"
          aria-hidden="true"
          role="presentation"
        >
          <span />
        </div>
      </section>
    </>
  );
}

function AboutSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const textRevealRef = useRef<NodeListOf<Element> | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const [ctaOpen, setCtaOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const features = useMemo(
    () => [
      {
        title: "Our Mission",
        desc: "To create a world where no pet stays lost, and every family is reunited with their furry friends.",
        color: "#93c5fd",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19l-7 4 1.5-8.5L1 9l8-.5L12 1l3 7.5 8 .5-5.5 5.5L19 23z" />
          </svg>
        ),
      },
      {
        title: "Our Community",
        desc: "Thousands of volunteers, rescuers, and pet owners working together across the country.",
        color: "#6ee7b7",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        title: "Our Promise",
        desc: "24/7 support, verified rescuers, and a safe platform for all pet-related emergencies.",
        color: "#c4b5fd",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        ),
      },
    ],
    [],
  );

  useEffect(() => {
    textRevealRef.current = document.querySelectorAll(".about-reveal");
    if (!textRevealRef.current) return;
    if (prefersReducedMotion) {
      textRevealRef.current.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 },
    );
    textRevealRef.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const node = mediaRef.current;
    if (!node) return;
    const handleMove = (event: MouseEvent) => {
      const bounds = node.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      node.style.setProperty(
        "--tilt",
        `perspective(1200px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`,
      );
      node.style.setProperty(
        "--parallax",
        `translate(${x * 16}px, ${y * 16}px)`,
      );
    };
    const reset = () => {
      node.style.setProperty(
        "--tilt",
        "perspective(1200px) rotateX(0deg) rotateY(0deg)",
      );
      node.style.setProperty("--parallax", "translate(0,0)");
    };

    if (window.innerWidth < 768) return;
    node.addEventListener("mousemove", handleMove);
    node.addEventListener("mouseleave", reset);
    return () => {
      node.removeEventListener("mousemove", handleMove);
      node.removeEventListener("mouseleave", reset);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!ctaOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCtaOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ctaOpen]);

  const focusTrap = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      "button, [href], input, [tabindex]:not([tabindex='-1'])",
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <section
      id="about-rescue"
      className="about-section"
      role="region"
      aria-labelledby="about-heading"
    >
      <div className="about-shell">
        <div className="about-heading">
          <span className="about-kicker">About PetReunite</span>
          <div id="about-heading" className="about-title">
            About PetReunite
          </div>
          <span className="about-underline" aria-hidden="true" />
        </div>
        <div className="about-layout">
          <div className="about-text">
            <p
              className="about-intro about-reveal"
              style={{ transitionDelay: "0ms" }}
            >
              PetReunite is more than just a platform—it&apos;s a community of
              pet lovers dedicated to reuniting lost pets with their families.
              Every day, we help bridge the gap between heartbroken owners and
              their beloved companions, creating countless happy endings.
            </p>
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="about-feature about-reveal"
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <button
                  type="button"
                  className="about-icon"
                  style={{
                    background: `linear-gradient(145deg, ${feature.color}, rgba(255,255,255,0.25))`,
                  }}
                  aria-label={`${feature.title} - learn more`}
                >
                  {feature.icon}
                  <span className="about-icon-tooltip">Learn more</span>
                </button>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              </article>
            ))}
          </div>
          <div
            className="about-media about-reveal"
            style={{ transitionDelay: "150ms" }}
            ref={mediaRef}
          >
            <div className="about-image-card">
              <div className="about-image-inner">
                <img
                  src={ABOUT_IMAGE}
                  alt="Cat and dog playing together on the grass"
                  loading="lazy"
                  className="about-image"
                />
              </div>
              <button
                type="button"
                className="about-floating-cta"
                aria-haspopup="dialog"
                aria-expanded={ctaOpen}
                aria-controls="about-modal"
                onClick={() => setCtaOpen(true)}
              >
                <span role="img" aria-hidden="true">
                  🐾
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {ctaOpen && (
        <div className="about-modal-backdrop" role="presentation">
          <div
            id="about-modal"
            className="about-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-modal-title"
            ref={modalRef}
            onKeyDown={focusTrap}
          >
            <div className="about-modal__header">
              <h3 id="about-modal-title">Ready to help?</h3>
              <button
                className="about-modal__close"
                onClick={() => setCtaOpen(false)}
                aria-label="Close quick action panel"
              >
                ✕
              </button>
            </div>
            <p>
              Join thousands of rescue volunteers or report a pet in need.
              Together we respond faster and smarter.
            </p>
            <div className="about-modal__actions">
              <button
                className="about-modal__btn primary"
                onClick={() => {
                  setCtaOpen(false);
                  document
                    .getElementById("about-rescue")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Join the community
              </button>
              <button
                className="about-modal__btn secondary"
                onClick={() => setCtaOpen(false)}
              >
                Report found pet
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function HowWeHelpSection() {
  const navigate = useNavigate();
  const cards = [
    {
      title: "Search Missing Pets",
      body: "Quickly browse verified reports of missing pets with filters for name, breed, color, and last-seen location.",
      link: "Start a search →",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
          <line
            x1="16.5"
            y1="16.5"
            x2="21"
            y2="21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      title: "Report a Found Pet",
      body: "Seen or rescued a lost pet? Submit a fast report with photos and details so we can match them with their family.",
      link: "Report a found pet →",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 21s-6-4.35-6-9.5S9.477 3 12 6.25C14.523 3 18 5.5 18 11.5S12 21 12 21z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 9v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      title: "Rescue & Emergency Support",
      body: "Connect with trusted rescue volunteers for urgent pet assistance, medical guidance, or safe pickup.",
      link: "Request help →",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 12h6M12 9v6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      title: "Community Reunite Network",
      body: "Join thousands of caring volunteers who share alerts, spread information, and help bring pets safely home.",
      link: "Join the network →",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="17" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
          <path
            d="M3 21a5 5 0 0 1 6-5h2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M14 14h1a5 5 0 0 1 5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="help-section" aria-labelledby="help-heading">
      <div className="help-shell">
        <div className="help-heading">
          <h2 id="help-heading" className="help-title">
            How We Help
          </h2>
          <p className="help-subtitle">
            Our platform provides everything you need to report, search, and
            reunite pets with their families.
          </p>
        </div>
        <div className="help-grid">
          {cards.map((card) => (
            <article key={card.title} className="help-card">
              <div className="help-card-icon" aria-hidden="true">
                {card.icon}
              </div>
              <h3 className="help-card-title">{card.title}</h3>
              <p className="help-card-text">{card.body}</p>
              <button
                type="button"
                className="help-card-link"
                onClick={() => navigate("/login")}
                style={{ cursor: "pointer" }}
              >
                {card.link}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VisualReelsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const activeIndexRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const [failedSlides, setFailedSlides] = useState<Record<number, boolean>>({});

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(entry.isIntersecting);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsSmallScreen(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const scrollLinked = inView && !prefersReducedMotion && !isSmallScreen;

  useEffect(() => {
    if (!scrollLinked || !REEL_SLIDES.length) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 1;
      const total = rect.height + viewportHeight;
      if (total <= 0) return;
      const rawProgress = (viewportHeight - rect.top) / total;
      const progress = Math.min(1, Math.max(0, rawProgress));
      const slideCount = REEL_SLIDES.length;
      const targetIndex = Math.min(
        slideCount - 1,
        Math.floor(progress * slideCount),
      );
      if (targetIndex !== activeIndexRef.current) {
        activeIndexRef.current = targetIndex;
        setActiveIndex(targetIndex);
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        handleScroll();
      });
    };

    handleScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollLinked]);

  useEffect(() => {
    if (!inView || prefersReducedMotion || isPaused || !REEL_SLIDES.length) {
      return;
    }
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1 >= REEL_SLIDES.length ? 0 : prev + 1));
    }, 5000);
    return () => window.clearInterval(id);
  }, [inView, prefersReducedMotion, isPaused]);

  const goTo = (index: number) => {
    if (!REEL_SLIDES.length) return;
    const slideCount = REEL_SLIDES.length;
    const nextIndex = ((index % slideCount) + slideCount) % slideCount;
    setIsPaused(true);
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
  };

  const goNext = () => {
    goTo(activeIndexRef.current + 1);
  };

  const goPrev = () => {
    goTo(activeIndexRef.current - 1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartXRef.current = touch ? touch.clientX : null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current == null) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        goPrev();
      } else {
        goNext();
      }
    }
    touchStartXRef.current = null;
  };

  const currentSlide =
    REEL_SLIDES[Math.min(activeIndex, REEL_SLIDES.length - 1)] ??
    REEL_SLIDES[0];

  if (!currentSlide) return null;

  return (
    <section
      className="reels-section"
      role="region"
      aria-labelledby="visual-reels-heading"
      ref={sectionRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="reels-shell">
        <header className="reels-header">
          <h2 id="visual-reels-heading">
            Stories from the PetReunite community
          </h2>
          <p>
            Scroll through real-world moments where missing pets were spotted,
            reported, and brought safely home.
          </p>
        </header>
        <div
          className="reels-panel"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="reels-slides">
            {REEL_SLIDES.map((slide, index) => (
              <div
                key={slide.src}
                className="reel-slide"
                aria-hidden={index !== activeIndex}
              >
                {failedSlides[index] ? (
                  <div className="reel-placeholder">Image missing</div>
                ) : (
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className={
                      index === activeIndex
                        ? "reel-image is-active"
                        : "reel-image"
                    }
                    loading={index === 0 ? "eager" : "lazy"}
                    onError={() => {
                      console.error(
                        "[VisualReels] failed to load image",
                        slide.src,
                      );
                      setFailedSlides((prev) => ({ ...prev, [index]: true }));
                    }}
                  />
                )}
              </div>
            ))}
            <div className="reel-gradient" aria-hidden="true" />
            <div className="reel-caption" aria-live="polite">
              <h3>{currentSlide.title}</h3>
              <p>{currentSlide.description}</p>
            </div>
            <button
              type="button"
              className="reel-cta"
              onClick={goNext}
              aria-label="Start your search on PetReunite"
            >
              Start Your Search
            </button>
          </div>
          <div className="reel-controls">
            <button
              type="button"
              className="reel-arrow"
              onClick={goPrev}
              aria-label="Previous story"
            >
              ‹
            </button>
            <button
              type="button"
              className="reel-arrow"
              onClick={goNext}
              aria-label="Next story"
            >
              ›
            </button>
            <div className="reel-dots">
              {REEL_SLIDES.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  className={
                    index === activeIndex ? "reel-dot is-active" : "reel-dot"
                  }
                  onClick={() => goTo(index)}
                  aria-label={`Go to story ${index + 1}: ${slide.title}`}
                  aria-pressed={index === activeIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer
      className="site-footer"
      role="contentinfo"
      aria-labelledby="footer-heading"
    >
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <section className="site-footer__brand">
            <div className="footer-logo-row">
              <img
                src="/pawreunite-logo.svg"
                alt="PetReunite logo"
                loading="lazy"
                className="footer-logo-image"
                style={{ width: 40, height: 40 }}
              />
              <span id="footer-heading" className="footer-brand-name">
                PetReunite
              </span>
            </div>
            <p className="footer-blurb">
              Connecting lost pets with their families through technology and
              community care across India. Every pet deserves to find their way
              home.
            </p>
            <div className="footer-social">
              <a
                href="#"
                className="footer-social-link"
                aria-label="PetRescue on Facebook"
              >
                <span aria-hidden="true">f</span>
              </a>
              <a
                href="#"
                className="footer-social-link"
                aria-label="PetRescue on X"
              >
                <span aria-hidden="true">x</span>
              </a>
              <a
                href="#"
                className="footer-social-link"
                aria-label="PetRescue on Instagram"
              >
                <span aria-hidden="true">ig</span>
              </a>
            </div>
          </section>

          <nav
            className="site-footer__links"
            aria-label="PetRescue quick links"
          >
            <h3 className="footer-column-heading">Quick Links</h3>
            <ul className="footer-links-list">
              <li>
                <a href="#" className="footer-link">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Report Found Pet
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Login
                </a>
              </li>
            </ul>
          </nav>

          <section className="site-footer__contact">
            <h3 className="footer-column-heading">Contact</h3>
            {/* Update phone, email, and social URLs here when details change. */}
            <ul className="footer-contact-list">
              <li>
                <a
                  href="tel:+919876543210"
                  className="footer-link footer-contact-link"
                  aria-label="Call PetRescue"
                >
                  Phone: +91 98765 43210
                </a>
              </li>
              <li>
                <a
                  href="mailto:help@petrescue.in"
                  className="footer-link footer-contact-link"
                  aria-label="Email PetRescue support"
                >
                  Email: help@petrescue.in
                </a>
              </li>
              <li>
                <p className="footer-contact-text">
                  Coverage: Available across India
                </p>
              </li>
              <li>
                <p className="footer-contact-text">
                  Support: 24/7 Emergency Support
                </p>
              </li>
            </ul>
          </section>
        </div>

        <div className="footer-divider" aria-hidden="true" />

        <div className="footer-bottom">
          <p className="footer-bottom-text">
             a9 2025 PetRescue. Made with  a0 a0 a0for pets and their families in
            India. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a
              href="#"
              className="footer-link footer-bottom-link"
              aria-label="PetRescue privacy policy"
            >
              Privacy Policy
            </a>
            <span className="footer-bottom-separator" aria-hidden="true">
               b7
            </span>
            <a
              href="#"
              className="footer-link footer-bottom-link"
              aria-label="PetRescue terms and conditions"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const handler = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);
  return prefersReducedMotion;
}
