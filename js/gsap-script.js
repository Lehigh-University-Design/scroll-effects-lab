gsap.registerPlugin(ScrollTrigger);

// ------------------------------------------------------------------
// UTILITY FUNCTIONS TO TRANSLATE CUSTOM DATA ATTRIBUTES TO GSAP
// ------------------------------------------------------------------

/**
 * Parses a comma-separated range of values (start, center, end)
 * Corrected to more closely match the 3-point logic of your original script.
 */
const parseRange = (dataAttrValue, defaultValue = 0) => {
    // GSAP can handle unit strings, so we keep them as strings until the final object construction.
    let start = defaultValue;
    let center = defaultValue;
    let end = defaultValue;

    if (dataAttrValue) {
        const rawValues = dataAttrValue.split(',').map(v => v.trim());

        // Case 1: Only 1 value (start=center=end)
        if (rawValues.length === 1) {
            start = center = end = rawValues[0];
        }
        // Case 2: 2 values (start, end/center)
        else if (rawValues.length === 2) {
            start = rawValues[0];
            center = rawValues[1];
            end = rawValues[1]; // Assume end = center
        }
        // Case 3: 3 or more values (start, center, end)
        else if (rawValues.length >= 3) {
            start = rawValues[0];
            center = rawValues[1];
            end = rawValues[2];
        }
    }
    
    return { start, center, end };
};

const setupLenis = () => {
    // 1. Initialize Lenis with smooth options
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical', 
        gestureDirection: 'vertical',
        smoothTouch: false,
        wheelMultiplier: 1,
    });

    // 2. Tie Lenis to the RequestAnimationFrame (RAF) loop
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 3. Connect ScrollTrigger to Lenis
    lenis.on('scroll', ScrollTrigger.update);

    // Tell ScrollTrigger to use Lenis's scrollbar for calculation
    ScrollTrigger.defaults({
        scroller: window,
    });
};

// --- SMART HEADER EFFECT ---
const setupSmartHeader = () => {
    const header = document.querySelector('.header');
    if (!header) return;

    const headerHeight = header.offsetHeight;
    
    // --- 1. Header Visibility Timeline (Unchanged) ---
    const headerTimeline = gsap.timeline({ paused: true })
        .to(header, { y: -headerHeight/2, opacity: 0, duration: 0.3, ease: "none" });

    // --- 2. Direction-Based ScrollTrigger (Unchanged) ---
    ScrollTrigger.create({
        start: 1, 
        onUpdate: (self) => {
            if (self.direction === 1) {
                headerTimeline.play();
            } else if (self.direction === -1) {
                headerTimeline.reverse();
            }
        }
    });

    // --- 3. NEW: Background Color Change Trigger ---
    // Set the initial state (transparent)
    gsap.set(header, { backgroundColor: 'rgba(0, 0, 0, 0.0)' });

    ScrollTrigger.create({
        trigger: ".hero-section",
        start: "bottom 20%", 
        end: "bottom 10%", 
        scrub: true,

        animation: gsap.to(header, { 
            backgroundColor: 'rgba(0, 0, 0, 0.6)', 
            ease: "none" 
        }),
    });
};

// ------------------------------------------------------------------
// MAIN INITIALIZATION FUNCTION
// ------------------------------------------------------------------

const initGSAPTriggers = () => {
    // Set up Lenis first
    setupLenis();

    // Clear any existing ScrollTriggers to prevent duplicates on soft reload/resize (good practice)
    ScrollTrigger.getAll().forEach(t => t.kill());
    
    const targets = document.querySelectorAll('.js-scroll-target');

    if (targets.length === 0) return;

    targets.forEach(target => {
        // --- PARSE DATA ---
        const xRange = parseRange(target.dataset.x);
        const yRange = parseRange(target.dataset.y);
        const rotateRange = parseRange(target.dataset.rotate);
        const scaleRange = parseRange(target.dataset.scale, 1);
        const opacityRange = parseRange(target.dataset.opacity, 1);
        
        const speedRange = parseRange(target.dataset.speed, 200);
        const holdDistance = parseFloat(target.dataset.hold) || 0;
        const offset = parseFloat(target.dataset.offset) || 100;
        
        const trigger = target.dataset.trigger || '';
        const triggerRange = (target.dataset.triggerRange || '').split(',').map(v => v.trim());
        const marker = target.dataset.marker || '';

        // Use the initial state provided by the 'start' values
        gsap.set(target, {
            x: xRange.start,
            y: yRange.start,
            rotation: rotateRange.start,
            scale: scaleRange.start,
            opacity: opacityRange.start,
            force3D: true 
        });

        // --- CALCULATE SCROLLTRIGGER POINTS ---
        
        const distanceStart = parseFloat(speedRange.start);
        const distanceEnd = parseFloat(speedRange.end);
        const totalDistance = distanceStart + holdDistance + distanceEnd;
        
        const tl = gsap.timeline({
            defaults: { ease: "none" }, 
            scrollTrigger: {
                trigger: trigger || target,
                start: triggerRange[0] || `top bottom-=${offset}`,
                end: triggerRange[1] || `+=${totalDistance}`,
                markers: marker ? true : false,
                scrub: true,
            }
        });
        
        // 1. PHASE 1: Animate In (Start -> Center) over distanceStart
        tl.to(target, {
            x: xRange.center,
            y: yRange.center,
            rotation: rotateRange.center,
            scale: scaleRange.center,
            opacity: opacityRange.center,
            duration: distanceStart
        }, 0);
        
        // 2. PHASE 2: Hold (Keep Center position for holdDistance)
        // If there is a hold, insert a placeholder duration in the timeline
        if (holdDistance > 0) {
            tl.to(target, { 
                x: xRange.center, 
                y: yRange.center, 
                rotation: rotateRange.center,
                scale: scaleRange.center,
                opacity: opacityRange.center,
                duration: holdDistance,
            }); 
        }

        // 3. PHASE 3: Animate Out (Center -> End) over distanceEnd
        if (distanceEnd > 0) {
            tl.to(target, {
                x: xRange.end,
                y: yRange.end,
                rotation: rotateRange.end,
                scale: scaleRange.end,
                opacity: opacityRange.end,
                duration: distanceEnd
            });
        }
    });

    setupSmartHeader();
};

// --- RUN SCRIPT ---
window.addEventListener('load', initGSAPTriggers);

// Use a debounced resize listener for robustness
// (GSAP automatically handles most, but this is safer)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initGSAPTriggers, 150);
});