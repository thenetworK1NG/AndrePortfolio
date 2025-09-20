// Handle button clicks
function handleButtonClick(sectionName) {
    // Create a nice visual feedback
    console.log(`${sectionName} button clicked!`);
    
    // Add a ripple effect
    const button = event.target;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
    
    // You can add specific actions for each button here
    switch(sectionName) {
        case 'thenerworKING':
            showNotification('Welcome to the Network!', '#667eea');
            break;
        case 'Blend Optimum':
            showNotification('Optimizing your experience...', '#f5576c');
            break;
        case 'Mr $cr!bbl3$':
            showNotification('Let\'s get creative!', '#4facfe');
            break;
    }
}

// Show notification
function showNotification(message, color) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.background = color;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Current section tracker
let currentSectionIndex = 0;

// Transform-based section navigation (no scrolling)
function scrollToSection(index) {
    console.log(`Navigating to section ${index}`); // Debug log
    
    if (index < 0 || index > 2) return;
    
    // Prevent multiple simultaneous transitions
    isScrolling = true;
    currentSectionIndex = index;
    
    const sections = document.querySelectorAll('.section');
    
    sections.forEach((section, i) => {
        const offset = (i - index) * 100; // Calculate offset percentage
        section.style.transform = `translateY(${offset}%)`;
        
        // Update z-index for proper layering
        if (i === index) {
            section.style.zIndex = '3';
        } else if (Math.abs(i - index) === 1) {
            section.style.zIndex = '2';
        } else {
            section.style.zIndex = '1';
        }
    });
    
    // Optimize 3D scene performance
    if (window.threeJSScenes) {
        const sceneNames = ['network', 'blend', 'artistic'];
        window.threeJSScenes.pauseAllExcept(sceneNames[index]);
        
        // Trigger animations when navigating to Mr $cr!bbl3$ section
        console.log('scrollToSection called with index:', index);
        if (index === 2) {
            console.log('Navigating to Mr $cr!bbl3$ section - starting animations in 500ms');
            setTimeout(() => {
                if (window.threeJSScenes) {
                    console.log('Calling playArtisticAnimations...');
                    window.threeJSScenes.playArtisticAnimations();
                    console.log('Started artistic scene animations!');
                } else {
                    console.log('ERROR: window.threeJSScenes not found!');
                }
            }, 500); // Small delay to let the section transition complete
        } else {
            // Stop artistic animations when leaving the section
            console.log('Leaving artistic section - stopping animations');
            if (window.threeJSScenes) {
                window.threeJSScenes.stopArtisticAnimations();
            }
        }
    }
    
    updateActiveDot(index);
    
    // Reset scrolling flag after animation
    setTimeout(() => {
        isScrolling = false;
        updateArrowStates();
        
        // Resume all animations after transition
        if (window.threeJSScenes) {
            window.threeJSScenes.resumeAll();
        }
    }, 800);
}

// Remove wheel scrolling - now only arrows work
// (Wheel event listener removed for arrow-only navigation)

// Touch support disabled for arrow-only navigation
// (Touch events removed to prevent scrolling)

// Update active navigation dot
function updateActiveDot(index) {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        if (i === index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Global scroll control variables
let isScrolling = false;
let scrollTimeout;

// Navigation only through arrows and dots - no scroll events needed

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const currentSection = getCurrentSection();
    
    switch(e.key) {
        case 'ArrowDown':
        case ' ':
            e.preventDefault();
            if (currentSection < 2) {
                scrollToSection(currentSection + 1);
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (currentSection > 0) {
                scrollToSection(currentSection - 1);
            }
            break;
        case 'Home':
            e.preventDefault();
            scrollToSection(0);
            break;
        case 'End':
            e.preventDefault();
            scrollToSection(2);
            break;
    }
});

// Get current section index (no scroll position needed)
function getCurrentSection() {
    return currentSectionIndex;
}

// Arrow navigation functions
function navigateUp() {
    const currentSection = getCurrentSection();
    console.log(`Navigate Up - Current section: ${currentSection}`); // Debug log
    
    if (currentSection > 0) {
        const targetSection = currentSection - 1;
        console.log(`Navigating up to section: ${targetSection}`); // Debug log
        scrollToSection(targetSection);
        addArrowPulse('arrowUp');
    }
}

function navigateDown() {
    const currentSection = getCurrentSection();
    console.log(`Navigate Down - Current section: ${currentSection}`); // Debug log
    
    if (currentSection < 2) {
        const targetSection = currentSection + 1;
        console.log(`Navigating down to section: ${targetSection}`); // Debug log
        scrollToSection(targetSection);
        addArrowPulse('arrowDown');
    }
}

// Add pulse effect to arrows
function addArrowPulse(arrowId) {
    const arrow = document.getElementById(arrowId);
    arrow.classList.add('pulse');
    setTimeout(() => {
        arrow.classList.remove('pulse');
    }, 1000);
}

// Update arrow states based on current section
function updateArrowStates() {
    const currentSection = getCurrentSection();
    const arrowUp = document.getElementById('arrowUp');
    const arrowDown = document.getElementById('arrowDown');
    
    console.log(`Updating arrow states for section: ${currentSection}`); // Debug log
    
    if (arrowUp && arrowDown) {
        // Update up arrow
        if (currentSection === 0) {
            arrowUp.classList.add('disabled');
            console.log('Up arrow disabled'); // Debug log
        } else {
            arrowUp.classList.remove('disabled');
            console.log('Up arrow enabled'); // Debug log
        }
        
        // Update down arrow
        if (currentSection === 2) {
            arrowDown.classList.add('disabled');
            console.log('Down arrow disabled'); // Debug log
        } else {
            arrowDown.classList.remove('disabled');
            console.log('Down arrow enabled'); // Debug log
        }
    } else {
        console.log('Arrow elements not found!'); // Debug log
    }
}

// Add CSS for ripple effect and notifications
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        pointer-events: none;
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .notification {
        position: fixed;
        top: 30px;
        right: 30px;
        background: #333;
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        font-weight: bold;
        z-index: 10000;
        transform: translateX(400px);
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.hide {
        transform: translateX(400px);
        opacity: 0;
    }
    
    @media (max-width: 768px) {
        .notification {
            right: 20px;
            left: 20px;
            transform: translateY(-100px);
        }
        
        .notification.show {
            transform: translateY(0);
        }
        
        .notification.hide {
            transform: translateY(-100px);
        }
    }
`;
document.head.appendChild(style);

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    // Wrap each letter in the Mr Scribbles title
    const scribblesTitle = document.getElementById('scribbles-title');
    if (scribblesTitle) {
        const text = scribblesTitle.textContent;
        scribblesTitle.innerHTML = '';
        
        for (let i = 0; i < text.length; i++) {
            const letter = document.createElement('span');
            letter.className = 'letter';
            letter.textContent = text[i];
            
            // Add special effects for special characters
            if (text[i] === '$') {
                letter.style.color = '#ffff00';
                letter.style.textShadow = '0 0 15px rgba(255,255,0,0.8)';
            }
            
            scribblesTitle.appendChild(letter);
        }
    }
    
    // Initialize arrow states
    updateArrowStates();
    
    // Add click listeners to arrows for debugging
    const arrowUp = document.getElementById('arrowUp');
    const arrowDown = document.getElementById('arrowDown');
    
    if (arrowUp) {
        arrowUp.addEventListener('click', function() {
            console.log('Up arrow clicked!'); // Debug log
        });
    }
    
    if (arrowDown) {
        arrowDown.addEventListener('click', function() {
            console.log('Down arrow clicked!'); // Debug log
        });
    }
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Add parallax effect on scroll
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const sections = document.querySelectorAll('.section');
    
    sections.forEach((section, index) => {
        const rate = scrolled * -0.5;
        const yPos = -(scrolled - section.offsetTop) * 0.1;
        
        if (section.getBoundingClientRect().bottom >= 0 && 
            section.getBoundingClientRect().top <= window.innerHeight) {
            section.style.transform = `translateY(${yPos}px)`;
        }
    });
});

console.log('🎉 Website loaded successfully! Use arrow keys or navigation dots to navigate between sections.');