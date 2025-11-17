document.addEventListener('DOMContentLoaded', function () {
    // ----------------------------------------------------
    // PARALLAX LOGIC MODULE (SETUP & CALCULATIONS)
    // ----------------------------------------------------

    const elementsToAnimate = [];

    const setupParallax = () => {
        const targets = document.querySelectorAll('.intersection-element');
        if (targets.length === 0) return;

        targets.forEach(target => {
            const xRange = parseFloat(target.dataset.xRange) || 0;
            const yRange = parseFloat(target.dataset.yRange) || 0;
            const scaleRange = parseFloat(target.dataset.scaleRange) || 0;
            const opacityRange = parseFloat(target.dataset.opacityRange) || 0;
            const animationDistance = parseFloat(target.dataset.animationDistance) || 200;
            const offset = parseFloat(target.dataset.offset) || 0;

            elementsToAnimate.push({
                domElement: target,
                startScrollPosition: target.offsetTop, 
                
                xRange, yRange, scaleRange, opacityRange,
                animationDistance, offset,
                
                // Calculate Initial (P=0) State values (the opposite of the range)
                startX: -xRange,
                startY: -yRange,
                startScale: 1 - scaleRange,
                startOpacity: 1 - opacityRange,
            });
        });
    };

    /**
     * Calculates the current transformation and applies styles based on scroll position.
     * @param {number} currentScroll - The current native scroll position (window.scrollY).
     */
    const handleParallaxAnimation = (currentScroll) => {

        elementsToAnimate.forEach(item => { // item is the single element config
            
            // Calculate how far we've scrolled past the element's top position
            const distanceScrolledPast = currentScroll - item.startScrollPosition - item.offset;

            // Calculate the animation progress (from 0 to 1) using the element's custom distance
            let progress = distanceScrolledPast / item.animationDistance;
            progress = Math.min(1, Math.max(0, progress));

            // Calculate the styles based on progress
            const translateX = item.startX + (item.xRange * progress);
            const translateY = item.startY + (item.yRange * progress);
            const scale = item.startScale + (item.scaleRange * progress); 
            const opacity = item.startOpacity + (item.opacityRange * progress);

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
        setupParallax();
        
        // 2. Set up native scroll listener to execute the animation
        let rafId = null;
        const scrollHandler = () => {
            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    handleParallaxAnimation(window.scrollY);
                    rafId = null;
                });
            }
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
        
        // Execute immediately on load to set the correct state for current scroll position
        handleParallaxAnimation(window.scrollY);
    }
    
    init(); 
});