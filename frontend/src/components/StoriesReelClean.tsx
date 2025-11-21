import React, { useEffect, useRef, useState } from "react";

type Story = {
  image: string;
  title: string;
  label: string;
  rating: number;
  story: string;
  author: string;
  meta: string;
  alt: string;
  objectPosition?: string;
};

const STORIES: Story[] = [
  {
    image: "/dog.jpeg",
    title: "Buddy's Second Chance",
    label: "Success Story",
    rating: 5,
    story:
      "Buddy was found near the highway with a limp and a frightened heart. Volunteers cleaned and treated his wounds, placed him in foster care, and after two weeks he found a loving home.",
    author: "Raj Patel - Pet Owner (Mumbai, India)",
    meta: "Male - 3 years - Reunited in 14 days",
    alt: "Buddy, a tan mixed-breed dog, sitting on grass, looking healthy",
    objectPosition: "center 30%",
  },
  {
    image: "/dog2.jpeg",
    title: "Roxy's Reunion",
    label: "Community Success",
    rating: 5,
    story:
      "Roxy went missing during monsoon storms. A neighbourhood volunteer snapped a photo and posted it on PetReunite. Within hours the owner and rescuer were connected and Roxy was safely brought home.",
    author: "Priya Sharma - Pet Owner (Bengaluru, India)",
    meta: "Female - 2 years - Reunited in 8 hours",
    alt: "Roxy, a happy small dog, running on green grass",
    objectPosition: "center 35%",
  },
  {
    image: "/cat.jpeg",
    title: "Luna's Rescue Story",
    label: "Rescue Story",
    rating: 5,
    story:
      "Luna was injured and underweight when a passerby reported her. Volunteers nursed her back to health and posted her profile. A local family adopted her after meeting her foster.",
    author: "Aisha Khan - Pet Owner (Hyderabad, India)",
    meta: "Female - 1 year - Rehabilitated and adopted",
    alt: "Luna, a small cream-coloured kitten with blue eyes",
    objectPosition: "center 40%",
  },
  {
    image: "/horse.jpeg",
    title: "Shadow's Safe Return",
    label: "Community Rescue",
    rating: 5,
    story:
      "Shadow, a retired working horse, slipped out of a stable. Neighbourhood search teams coordinated through PetReunite and helped return him to his owner the same day.",
    author: "Vikram Singh - Horse Owner (Jaipur, India)",
    meta: "Male - 7 years - Reunited same day",
    alt: "Shadow, a brown horse standing in a field",
    objectPosition: "center 35%",
  },
];

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

export default function StoriesReel() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const activeIndexRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();

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
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || isPaused || prefersReducedMotion || STORIES.length === 0) {
      return;
    }
    const id = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1 >= STORIES.length ? 0 : prev + 1;
        activeIndexRef.current = next;
        return next;
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, [inView, isPaused, prefersReducedMotion]);

  const goTo = (index: number) => {
    if (!STORIES.length) return;
    const count = STORIES.length;
    const nextIndex = ((index % count) + count) % count;
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    setIsPaused(true);
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

  const current = STORIES[activeIndex] || STORIES[0];
  if (!current) return null;

  return (
    <section
      className="stories-reel-section"
      aria-labelledby="stories-reel-heading"
      role="region"
      ref={sectionRef}
    >
      <div className="stories-reel-shell">
        <header className="stories-reel-header">
          <h2 id="stories-reel-heading">Stories from the PetReunite community</h2>
          <p>
            Scroll through real-world moments where missing pets were spotted,
            reported, and brought safely home.
          </p>
        </header>
        <div
          className="stories-reel-viewport"
          role="group"
          aria-roledescription="carousel"
          aria-label="Stories from the PetReunite community"
          aria-live="off"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="stories-reel-track">
            {STORIES.map((story, index) => (
              <article
                key={story.title}
                className={
                  index === activeIndex
                    ? "stories-reel-card is-active"
                    : "stories-reel-card"
                }
                aria-hidden={index !== activeIndex}
              >
                <div className="stories-reel-card-inner">
                  <div className="stories-reel-media">
                    <img
                      src={story.image}
                      alt={story.alt}
                      loading={index === 0 ? "eager" : "lazy"}
                      style={{ objectPosition: story.objectPosition || "center" }}
                    />
                  </div>
                  <div className="stories-reel-content">
                    <div className="stories-reel-label-row">
                      <span className="stories-reel-label">{story.label}</span>
                      <span
                        className="stories-reel-rating"
                        aria-label={`${story.rating} out of 5 stars`}
                      >
                        {"★".repeat(story.rating)}
                        <span
                          aria-hidden="true"
                          className="stories-reel-rating-dim"
                        >
                          {"★".repeat(5 - story.rating)}
                        </span>
                      </span>
                    </div>
                    <h3 className="stories-reel-title">{story.title}</h3>
                    <p className="stories-reel-story">{story.story}</p>
                    <p className="stories-reel-author">{story.author}</p>
                    <p className="stories-reel-meta">{story.meta}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="stories-reel-controls">
            <button
              type="button"
              className="stories-reel-arrow"
              onClick={goPrev}
              aria-label="Previous story"
            >
              {"<"}
            </button>
            <button
              type="button"
              className="stories-reel-arrow"
              onClick={goNext}
              aria-label="Next story"
            >
              {">"}
            </button>
            <div className="stories-reel-dots">
              {STORIES.map((story, index) => (
                <button
                  key={story.title}
                  type="button"
                  className={
                    index === activeIndex
                      ? "stories-reel-dot is-active"
                      : "stories-reel-dot"
                  }
                  onClick={() => goTo(index)}
                  aria-label={`Go to story ${index + 1}: ${story.title}`}
                  aria-pressed={index === activeIndex}
                />
              ))}
            </div>
          </div>
          <div className="stories-reel-sr-only" aria-live="polite">
            {current.title}. {current.label}. {current.story} By {current.author}. {" "}
            {current.meta}.
          </div>
        </div>
      </div>
    </section>
  );
}
