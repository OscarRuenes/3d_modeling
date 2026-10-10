const bundles = Array.from(document.querySelectorAll("[data-bundle]"));
const lightbox = document.querySelector(".gallery-lightbox");
const lightboxImage = lightbox.querySelector(".lightbox-image");
const lightboxTitle = lightbox.querySelector("#lightbox-title");
const lightboxDescription = lightbox.querySelector(".lightbox-description");
const lightboxTryon = lightbox.querySelector(".lightbox-tryon");
const lightboxCounter = lightbox.querySelector(".lightbox-counter");
const lightboxDetails = lightbox.querySelector(".lightbox-details");
let activeBundleArtworks = [];
let activeArtworkIndex = 0;
let lightboxDetailsObserver;

function showArtwork(index) {
	activeArtworkIndex = (index + activeBundleArtworks.length) % activeBundleArtworks.length;
	const artwork = activeBundleArtworks[activeArtworkIndex];
	const image = artwork.querySelector("img");

	lightboxImage.src = image.currentSrc || image.src;
	lightboxImage.alt = image.alt;
	lightboxTitle.textContent = artwork.dataset.artworkTitle;
	lightboxDescription.textContent = artwork.dataset.artworkDescription;
	lightboxTryon.href = artwork.dataset.artworkUrl;
	lightboxCounter.textContent = `${activeArtworkIndex + 1} of ${activeBundleArtworks.length}`;
}

bundles.forEach((bundle) => {
	const track = bundle.querySelector(".gallery-bundle-track");
	const slides = Array.from(track.querySelectorAll(".gallery-bundle-slide:not(.gallery-bundle-slide--placeholder)"));
	const count = bundle.querySelector(".gallery-bundle-count");
	const controls = Array.from(bundle.querySelectorAll(".gallery-carousel-button"));
	let activeIndex = 0;
	let scrollUpdateTimer;

	function updateCarousel(index) {
		if (index === undefined) {
			const trackRect = track.getBoundingClientRect();
			const trackCenter = trackRect.left + track.clientLeft + track.clientWidth / 2;
			activeIndex = slides.reduce((closestIndex, slide, slideIndex) => {
				const slideRect = slide.getBoundingClientRect();
				const slideCenter = slideRect.left + slideRect.width / 2;
				const closestRect = slides[closestIndex].getBoundingClientRect();
				const closestCenter = closestRect.left + closestRect.width / 2;
				const slideDistance = Math.abs(slideCenter - trackCenter);
				const closestDistance = Math.abs(closestCenter - trackCenter);
				return slideDistance < closestDistance ? slideIndex : closestIndex;
			}, 0);
		} else {
			activeIndex = index;
		}

		count.textContent = `${activeIndex + 1} / ${slides.length}`;
		controls.forEach((control) => {
			const direction = Number(control.dataset.carouselStep);
			control.disabled = direction < 0 ? activeIndex === 0 : activeIndex === slides.length - 1;
		});
	}

	function getCenteredScrollLeft(slide) {
		const trackRect = track.getBoundingClientRect();
		const slideRect = slide.getBoundingClientRect();
		const trackCenter = trackRect.left + track.clientLeft + track.clientWidth / 2;
		const slideCenter = slideRect.left + slideRect.width / 2;
		return track.scrollLeft + slideCenter - trackCenter;
	}

	controls.forEach((control) => {
		control.addEventListener("click", () => {
			const direction = Number(control.dataset.carouselStep);
			const nextIndex = Math.max(0, Math.min(slides.length - 1, activeIndex + direction));
			const target = slides[nextIndex];
			track.scrollTo({
				left: getCenteredScrollLeft(target),
				behavior: "smooth"
			});
			updateCarousel(nextIndex);
		});
	});

	track.addEventListener("scroll", () => {
		const minScrollLeft = getCenteredScrollLeft(slides[0]);
		const maxScrollLeft = getCenteredScrollLeft(slides[slides.length - 1]);
		const boundedScrollLeft = Math.max(minScrollLeft, Math.min(maxScrollLeft, track.scrollLeft));
		if (Math.abs(track.scrollLeft - boundedScrollLeft) > 1) {
			track.scrollLeft = boundedScrollLeft;
		}
		window.clearTimeout(scrollUpdateTimer);
		scrollUpdateTimer = window.setTimeout(() => updateCarousel(), 120);
	}, { passive: true });
	window.addEventListener("resize", () => updateCarousel());
	bundle.classList.add("is-enhanced");
	track.scrollLeft = getCenteredScrollLeft(slides[0]);
	updateCarousel();
});

document.querySelectorAll(".gallery-artwork-button").forEach((button) => {
	button.addEventListener("click", () => {
		activeBundleArtworks = Array.from(button.closest("[data-bundle]").querySelectorAll(".gallery-artwork-button"));
		showArtwork(activeBundleArtworks.indexOf(button));
		lightbox.showModal();
		lightboxDetails.classList.remove("is-visible");
		lightbox.classList.add("has-scroll-reveal");

		if ("IntersectionObserver" in window) {
			lightboxDetailsObserver = new IntersectionObserver(([entry]) => {
				if (entry.isIntersecting) {
					lightboxDetails.classList.add("is-visible");
					lightboxDetailsObserver.disconnect();
				}
			}, {
				root: lightbox,
				threshold: 0.15
			});
			lightboxDetailsObserver.observe(lightboxDetails);
		} else {
			lightboxDetails.classList.add("is-visible");
		}
	});
});

lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.querySelector(".lightbox-previous").addEventListener("click", () => showArtwork(activeArtworkIndex - 1));
lightbox.querySelector(".lightbox-next").addEventListener("click", () => showArtwork(activeArtworkIndex + 1));
lightbox.addEventListener("close", () => {
	lightboxDetails.classList.remove("is-visible");
	lightbox.classList.remove("has-scroll-reveal");
	lightboxDetailsObserver?.disconnect();
});

lightbox.addEventListener("click", (event) => {
	if (event.target === lightbox) {
		lightbox.close();
	}
});

document.addEventListener("keydown", (event) => {
	if (!lightbox.open) {
		return;
	}

	if (event.key === "Escape") {
		event.preventDefault();
		lightbox.close();
	} else if (event.key === "ArrowLeft") {
		event.preventDefault();
		showArtwork(activeArtworkIndex - 1);
	} else if (event.key === "ArrowRight") {
		event.preventDefault();
		showArtwork(activeArtworkIndex + 1);
	}
});

lightbox.addEventListener("cancel", (event) => {
	event.preventDefault();
	lightbox.close();
});
