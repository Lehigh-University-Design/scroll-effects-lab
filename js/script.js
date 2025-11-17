document.addEventListener('DOMContentLoaded', function () {
    // ----------------------------------------------------
    // SCROLL TRIGGER MODULE (SETUP & CALCULATIONS)
    // ----------------------------------------------------

    const elementsToAnimate = [];

    const parseRange = (dataAttrValue, defaultValue = 0) => {
        const values = dataAttrValue ? dataAttrValue.split(',').map(v => parseFloat(v.trim())) : [];
        const start = values[0] !== undefined && !isNaN(values[0]) ? values[0] : defaultValue;
        const center = defaultValue;
        const end = values[1] !== undefined && !isNaN(values[1]) ? values[1] : defaultValue;
        
        return { start, center, end };
    };

    const setupTriggers = () => {
        const targets = document.querySelectorAll('.intersection-element');
        if (targets.length === 0) return;

        targets.forEach(target => {
            const x = parseRange(target.dataset.x);
            const y = parseRange(target.dataset.y);
            const scale = parseRange(target.dataset.scale, 1);
            const opacity = parseRange(target.dataset.opacity, 1);
            const animationDistance = parseFloat(target.dataset.speed) || 200;
            const holdDistance = parseFloat(target.dataset.hold) || 0;
            const offset = parseFloat(target.dataset.offset) || 100;

            elementsToAnimate.push({
                domElement: target,
                startScrollPosition: target.offsetTop, 
                
                x, y, scale, opacity,
                animationDistance, holdDistance, offset,
                
                totalAnimationDistance: (animationDistance * 2) + holdDistance,
            });
        });
    };

    /**
     * Calculates the current transformation and applies styles based on scroll position.
     * @param {number} currentScroll - The current native scroll position (window.scrollY).
     */
    const handleTriggerAnimations = (currentScroll) => {

        elementsToAnimate.forEach(item => { // item is the single element config
            
            // Calculate how far we've scrolled past the element's top position, and clamp it.
            const distanceScrolledPast = currentScroll - item.startScrollPosition - item.offset;
            const clampedScroll = Math.min(item.totalAnimationDistance, Math.max(0, distanceScrolledPast));

            // Calculate the animation progress (from begin 0-1, middle 1, and end 1-2)
            // using the element's distances
            let progress = 0;
            if (clampedScroll <= item.animationDistance) {
                // PHASE 1: ANIMATION IN (0% to 100%)
                progress = clampedScroll / item.animationDistance;
            } 
            else if (clampedScroll <= item.animationDistance + item.holdDistance) {
                // PHASE 2: HOLD (100% Locked)
                progress = 1;
            } 
            else {
                // PHASE 3: ANIMATION OUT (100% to 200%)
                const outScroll = clampedScroll - (item.animationDistance + item.holdDistance);
                progress = 1 + (outScroll / item.animationDistance);
            }

            const interpolateValue = (range) => {
                if (progress <= 1) {
                    return range.start + (range.center - range.start) * progress;
                } else {
                    return range.center + (range.end - range.center) * (progress - 1);
                }
            };

            // Calculate the styles based on progress
            const translateX = interpolateValue(item.x);
            const translateY = interpolateValue(item.y);
            const scale = interpolateValue(item.scale);
            const opacity = interpolateValue(item.opacity);

            // Apply the styles
            item.domElement.style.transform = 
                `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
            
            item.domElement.style.opacity = opacity;
        });
    };

    /**
     * Main initialization function
     */
    const init = () => {
        // 1. Setup the element positions and ranges for parallax
        setupTriggers();
        
        // 2. Set up native scroll listener to execute the animation
        let rafId = null;
        const scrollHandler = () => {
            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    handleTriggerAnimations(window.scrollY);
                    rafId = null;
                });
            }
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
        
        // Execute immediately on load to set the correct state for current scroll position
        handleTriggerAnimations(window.scrollY);
    }
    
    init(); 
});