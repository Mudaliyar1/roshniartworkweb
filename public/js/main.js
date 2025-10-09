// Enhanced UI Interactions for Roshni's Art Website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initScrollToTop();
    initCursorEffects();
    initImageLazyLoading();
    initFloatingParticles();
    initFormEnhancements();
    initScrollAnimations();
});

// Scroll to top button functionality
function initScrollToTop() {
    // Create scroll to top button
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '<i class="bi bi-heart-fill"></i>';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(scrollBtn);

    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });

    // Smooth scroll to top
    scrollBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Cute cursor effects
function initCursorEffects() {
    if (window.innerWidth > 768) { // Only on desktop
        document.addEventListener('click', function(e) {
            const hearts = ['💖', '💕', '💗', '💓', '💝', '🌸', '✨', '🎀'];
            const heart = document.createElement('div');
            heart.className = 'cursor-heart';
            heart.innerHTML = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.left = e.pageX + 'px';
            heart.style.top = e.pageY + 'px';
            document.body.appendChild(heart);

            setTimeout(() => {
                heart.remove();
            }, 2000);
        });
    }
}

// Lazy loading for images
function initImageLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('img-loading');
                
                const actualImg = new Image();
                actualImg.onload = function() {
                    img.src = actualImg.src;
                    img.classList.remove('img-loading');
                    img.classList.add('fade-in');
                };
                actualImg.src = img.dataset.src;
                
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Floating particles background
function initFloatingParticles() {
    if (window.innerWidth > 768) { // Only on desktop
        const particleContainer = document.createElement('div');
        particleContainer.className = 'floating-particles';
        document.body.appendChild(particleContainer);

        const particles = ['🌸', '✨', '💫', '🌺', '🦋', '💖', '🌙', '⭐'];
        
        setInterval(() => {
            if (document.querySelectorAll('.particle').length < 5) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.innerHTML = particles[Math.floor(Math.random() * particles.length)];
                particle.style.left = Math.random() * 100 + 'vw';
                particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
                particleContainer.appendChild(particle);

                setTimeout(() => {
                    particle.remove();
                }, 25000);
            }
        }, 3000);
    }
}

// Form enhancements
function initFormEnhancements() {
    // Add floating labels effect
    const formControls = document.querySelectorAll('.form-control, .form-select');
    
    formControls.forEach(control => {
        control.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        control.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if field has value on load
        if (control.value) {
            control.parentElement.classList.add('focused');
        }
    });

    // Contact form submission enhancement
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = '<i class="bi bi-heart-fill me-2"></i>Sending with love... 💕';
            submitBtn.disabled = true;
            
            // Allow the form to submit normally - the server will handle it
            // No e.preventDefault() so the form actually submits to the server
        });
    }
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.card, .philosophy-icon, .contact-item, .about-content > div');
    animateElements.forEach(el => observer.observe(el));
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 8px 32px rgba(217, 70, 239, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 8px 32px rgba(217, 70, 239, 0.1)';
    }
});

// Gallery filter animations
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn-outline-primary') && e.target.textContent.includes('Filter')) {
        const filterSection = document.querySelector('#filterCollapse');
        if (filterSection) {
            setTimeout(() => {
                filterSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }
});

// Image modal for gallery (if needed)
function initImageModal() {
    const galleryImages = document.querySelectorAll('.card img');
    
    galleryImages.forEach(img => {
        img.addEventListener('click', function() {
            const modal = document.createElement('div');
            modal.className = 'image-modal';
            modal.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <button class="modal-close">&times;</button>
                        <img src="${this.src}" alt="${this.alt}">
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal || e.target.className === 'modal-close') {
                    document.body.removeChild(modal);
                    document.body.style.overflow = '';
                }
            });
        });
    });
}

// Add CSS for image modal
const modalCSS = `
.image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.modal-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
}

.modal-content img {
    width: 100%;
    height: auto;
    border-radius: 12px;
}

.modal-close {
    position: absolute;
    top: -40px;
    right: 0;
    background: none;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}
`;

// Add modal CSS to head
if (!document.querySelector('#modal-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = modalCSS;
    document.head.appendChild(style);
}

// Initialize image modal
initImageModal();