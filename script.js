// ============================================
// TRAFFIC AI - JAVASCRIPT
// Dynamic UI with 3D Visualizations
// ============================================

// ============================================
// GLOBAL VARIABLES
// ============================================
let currentTrafficLevel = 'low';
let isLoggedIn = false;
let currentUser = null;

// ============================================
// DOM CONTENT LOADED
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeCanvas();
    initializeTrafficMonitor();
    initializeProfileMenu();
    initializeModals();
    initializeScrollEffects();
    initializeFeatureIcons();
    initializeTeamAvatars();
    initializeMethodologyCanvas();
});

// ============================================
// NAVIGATION
// ============================================
function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');
    
    // Hamburger menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Smooth scroll
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Update active link based on scroll position
        updateActiveNavLink();
    });
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// ============================================
// LOGO CANVAS (Animated Traffic Light)
// ============================================
function initializeCanvas() {
    drawLogoCanvas();
    drawProfileCanvas();
}

function drawLogoCanvas() {
    const canvas = document.getElementById('logoCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Animate traffic light
    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw traffic light base
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(centerX - 8, 5, 16, 30);
        
        // Draw lights
        const lights = [
            { y: 10, color: '#ef4444', active: frame % 180 < 60 },
            { y: 20, color: '#f59e0b', active: frame % 180 >= 60 && frame % 180 < 120 },
            { y: 30, color: '#10b981', active: frame % 180 >= 120 }
        ];
        
        lights.forEach(light => {
            ctx.beginPath();
            ctx.arc(centerX, light.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = light.active ? light.color : '#334155';
            ctx.fill();
            
            if (light.active) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = light.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
        
        frame++;
        requestAnimationFrame(animate);
    }
    animate();
}

function drawProfileCanvas() {
    const canvas = document.getElementById('profileCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw user icon
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - 3, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
    
    // Body
    ctx.beginPath();
    ctx.arc(centerX, centerY + 12, 12, Math.PI, 0, true);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
}

// ============================================
// HERO BACKGROUND ANIMATION (3D Particles)
// ============================================
const heroCanvas = document.getElementById('heroCanvas');
if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    heroCanvas.width = window.innerWidth;
    heroCanvas.height = window.innerHeight;
    
    class Particle {
        constructor() {
            this.x = Math.random() * heroCanvas.width;
            this.y = Math.random() * heroCanvas.height;
            this.z = Math.random() * 1000;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.vz = Math.random() * 2 + 1;
        }
        
        update() {
            this.z -= this.vz;
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.z < 1) {
                this.z = 1000;
                this.x = Math.random() * heroCanvas.width;
                this.y = Math.random() * heroCanvas.height;
            }
            
            if (this.x < 0 || this.x > heroCanvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > heroCanvas.height) this.vy *= -1;
        }
        
        draw() {
            const scale = 1000 / (1000 + this.z);
            const x2d = (this.x - heroCanvas.width / 2) * scale + heroCanvas.width / 2;
            const y2d = (this.y - heroCanvas.height / 2) * scale + heroCanvas.height / 2;
            const radius = scale * 2;
            
            ctx.beginPath();
            ctx.arc(x2d, y2d, radius, 0, Math.PI * 2);
            const alpha = 1 - this.z / 1000;
            ctx.fillStyle = `rgba(37, 99, 235, ${alpha})`;
            ctx.fill();
        }
    }
    
    const particles = Array.from({ length: 100 }, () => new Particle());
    
    function animateHero() {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        ctx.fillRect(0, 0, heroCanvas.width, heroCanvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animateHero);
    }
    animateHero();
    
    window.addEventListener('resize', () => {
        heroCanvas.width = window.innerWidth;
        heroCanvas.height = window.innerHeight;
    });
}

// ============================================
// TRAFFIC MONITOR (Dynamic UI with 3D Road)
// ============================================
function initializeTrafficMonitor() {
    const canvas = document.getElementById('trafficCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Traffic simulation variables
    let vehicles = [];
    let roadOffset = 0;
    
    class Vehicle {
        constructor() {
            this.lane = Math.floor(Math.random() * 3);
            this.x = Math.random() * canvas.width;
            this.y = -50;
            this.speed = Math.random() * 2 + 1;
            this.width = 40;
            this.height = 70;
            this.color = this.getRandomColor();
            this.id = Math.floor(Math.random() * 1000);
        }
        
        getRandomColor() {
            const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        update() {
            this.y += this.speed;
            if (this.y > canvas.height + 50) {
                this.y = -50;
                this.x = Math.random() * canvas.width;
            }
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Vehicle body
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            // Vehicle windows
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 5, this.width - 10, 20);
            
            // Bounding box (YOLO style)
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width / 2 - 5, -this.height / 2 - 5, this.width + 10, this.height + 10);
            
            // ID label
            ctx.fillStyle = '#10b981';
            ctx.fillRect(-this.width / 2 - 5, -this.height / 2 - 20, 40, 15);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`ID:${this.id}`, -this.width / 2, -this.height / 2 - 8);
            
            ctx.restore();
        }
    }
    
    // Initialize vehicles based on traffic level
    function updateVehicleCount() {
        const counts = {
            low: 5,
            medium: 15,
            high: 30
        };
        
        const targetCount = counts[currentTrafficLevel];
        
        while (vehicles.length < targetCount) {
            vehicles.push(new Vehicle());
        }
        
        while (vehicles.length > targetCount) {
            vehicles.pop();
        }
    }
    
    // Draw 3D road
    function drawRoad() {
        // Road background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#374151');
        gradient.addColorStop(1, '#1f2937');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Road lanes with perspective
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 15]);
        
        for (let i = 0; i < 4; i++) {
            roadOffset = (roadOffset + 2) % 35;
            ctx.beginPath();
            ctx.lineDashOffset = -roadOffset;
            const x = canvas.width / 4 * i;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawRoad();
        
        vehicles.forEach(vehicle => {
            vehicle.update();
            vehicle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    updateVehicleCount();
    animate();
    
    // Traffic level buttons
    const trafficButtons = document.querySelectorAll('.traffic-btn');
    trafficButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const level = btn.dataset.level;
            setTrafficLevel(level);
            
            // Update active button
            trafficButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    function setTrafficLevel(level) {
        currentTrafficLevel = level;
        updateVehicleCount();
        updateTrafficUI(level);
    }
    
    // Window resize
    window.addEventListener('resize', () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    });
}

function updateTrafficUI(level) {
    const statusText = document.getElementById('statusText');
    const vehicleCount = document.getElementById('vehicleCount');
    const fpsCount = document.getElementById('fpsCount');
    const precisionValue = document.getElementById('precisionValue');
    const densityBar = document.getElementById('densityBar');
    const densityValue = document.getElementById('densityValue');
    const congestionBar = document.getElementById('congestionBar');
    const congestionValue = document.getElementById('congestionValue');
    
    const data = {
        low: {
            text: 'LOW TRAFFIC',
            vehicles: Math.floor(Math.random() * 5) + 8,
            fps: 60,
            precision: '98.5%',
            density: 25,
            congestion: 'Low',
            congestionPercent: 25
        },
        medium: {
            text: 'MEDIUM TRAFFIC',
            vehicles: Math.floor(Math.random() * 10) + 20,
            fps: 55,
            precision: '96.2%',
            density: 60,
            congestion: 'Medium',
            congestionPercent: 60
        },
        high: {
            text: 'HIGH TRAFFIC',
            vehicles: Math.floor(Math.random() * 15) + 40,
            fps: 45,
            precision: '94.8%',
            density: 95,
            congestion: 'High',
            congestionPercent: 95
        }
    };
    
    const config = data[level];
    
    // Update text and values
    statusText.textContent = config.text;
    vehicleCount.textContent = config.vehicles;
    fpsCount.textContent = config.fps;
    precisionValue.textContent = config.precision;
    densityValue.textContent = `${config.density}%`;
    congestionValue.textContent = config.congestion;
    
    // Animate progress bars
    densityBar.style.width = `${config.density}%`;
    congestionBar.style.width = `${config.congestionPercent}%`;
    
    // Update body class for theme
    document.body.className = `${level}-traffic`;
}

// ============================================
// FEATURE ICONS (Canvas Animations)
// ============================================
function initializeFeatureIcons() {
    const canvases = document.querySelectorAll('.feature-canvas');
    
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const type = canvas.dataset.type;
        
        switch(type) {
            case 'detection':
                drawDetectionIcon(ctx, canvas);
                break;
            case 'tracking':
                drawTrackingIcon(ctx, canvas);
                break;
            case 'analytics':
                drawAnalyticsIcon(ctx, canvas);
                break;
            case 'congestion':
                drawCongestionIcon(ctx, canvas);
                break;
        }
    });
}

function drawDetectionIcon(ctx, canvas) {
    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Scanning effect
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Target circles
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, 15 + i * 8, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(16, 185, 129, ${1 - i * 0.3})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Scanning line
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((frame * 0.05) % (Math.PI * 2));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(25, 0);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
        
        frame++;
        requestAnimationFrame(animate);
    }
    animate();
}

function drawTrackingIcon(ctx, canvas) {
    let particles = [];
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: 4
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6';
            ctx.fill();
            
            // Draw connections
            particles.forEach((p2, j) => {
                if (i !== j) {
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 40) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(139, 92, 246, ${1 - dist / 40})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });
        });
        
        requestAnimationFrame(animate);
    }
    animate();
}

function drawAnalyticsIcon(ctx, canvas) {
    let barHeights = [0, 0, 0, 0, 0];
    const targetHeights = [20, 35, 25, 40, 30];
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = canvas.width / 6;
        const spacing = barWidth / 5;
        
        barHeights = barHeights.map((h, i) => {
            if (h < targetHeights[i]) return h + 0.5;
            return h;
        });
        
        barHeights.forEach((height, i) => {
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(
                spacing + i * (barWidth + spacing),
                canvas.height - height,
                barWidth,
                height
            );
        });
        
        requestAnimationFrame(animate);
    }
    animate();
}

function drawCongestionIcon(ctx, canvas) {
    let frame = 0;
    const cars = Array.from({ length: 8 }, (_, i) => ({
        x: (i % 4) * 12 + 8,
        y: Math.floor(i / 4) * 20 + 15,
        baseY: Math.floor(i / 4) * 20 + 15
    }));
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        cars.forEach((car, i) => {
            car.y = car.baseY + Math.sin(frame * 0.05 + i) * 2;
            
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(car.x, car.y, 10, 16);
            
            // Headlights
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(car.x + 1, car.y + 13, 3, 2);
            ctx.fillRect(car.x + 6, car.y + 13, 3, 2);
        });
        
        frame++;
        requestAnimationFrame(animate);
    }
    animate();
}

// ============================================
// TEAM AVATARS (3D Rendered Initials)
// ============================================
function initializeTeamAvatars() {
    const avatarCanvases = document.querySelectorAll('.avatar-canvas');
    
    avatarCanvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const name = canvas.dataset.name;
        const initials = getInitials(name);
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#2563eb');
        gradient.addColorStop(1, '#8b5cf6');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Initials
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, canvas.width / 2, canvas.height / 2);
    });
}

function getInitials(name) {
    return name
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// ============================================
// METHODOLOGY CANVAS (Flowchart)
// ============================================
function initializeMethodologyCanvas() {
    const canvas = document.getElementById('methodologyCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const steps = [
        { text: 'Upload Video', y: 50 },
        { text: 'Extract Frames', y: 100 },
        { text: 'YOLO-V4 Detection', y: 150 },
        { text: 'Deep SORT Tracking', y: 200 },
        { text: 'Display Results', y: 250 }
    ];
    
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    steps.forEach((step, index) => {
        // Box
        ctx.fillStyle = '#334155';
        ctx.fillRect(50, step.y - 15, 300, 30);
        
        // Border
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, step.y - 15, 300, 30);
        
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(step.text, 200, step.y + 5);
        
        // Arrow
        if (index < steps.length - 1) {
            ctx.strokeStyle = '#06b6d4';
            ctx.beginPath();
            ctx.moveTo(200, step.y + 15);
            ctx.lineTo(200, steps[index + 1].y - 15);
            ctx.stroke();
            
            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(200, steps[index + 1].y - 15);
            ctx.lineTo(195, steps[index + 1].y - 22);
            ctx.lineTo(205, steps[index + 1].y - 22);
            ctx.closePath();
            ctx.fillStyle = '#06b6d4';
            ctx.fill();
        }
    });
}

// ============================================
// PROFILE MENU
// ============================================
function initializeProfileMenu() {
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const signoutBtn = document.getElementById('signoutBtn');
    
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
    });
    
    dropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    loginBtn.addEventListener('click', () => {
        document.getElementById('loginModal').classList.add('show');
        dropdownMenu.classList.remove('show');
    });
    
    signupBtn.addEventListener('click', () => {
        document.getElementById('signupModal').classList.add('show');
        dropdownMenu.classList.remove('show');
    });
    
    signoutBtn.addEventListener('click', () => {
        logout();
        dropdownMenu.classList.remove('show');
    });
}

// ============================================
// MODALS
// ============================================
function initializeModals() {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const loginClose = document.getElementById('loginClose');
    const signupClose = document.getElementById('signupClose');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    loginClose.addEventListener('click', () => {
        loginModal.classList.remove('show');
    });
    
    signupClose.addEventListener('click', () => {
        signupModal.classList.remove('show');
    });
    
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('show');
        }
    });
    
    signupModal.addEventListener('click', (e) => {
        if (e.target === signupModal) {
            signupModal.classList.remove('show');
        }
    });
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        login(email);
        loginModal.classList.remove('show');
        loginForm.reset();
    });
    
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        signup(name, email);
        signupModal.classList.remove('show');
        signupForm.reset();
    });
}

function login(email) {
    isLoggedIn = true;
    currentUser = { name: email.split('@')[0], email: email };
    updateAuthUI();
}

function signup(name, email) {
    isLoggedIn = true;
    currentUser = { name: name, email: email };
    updateAuthUI();
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    updateAuthUI();
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const signoutBtn = document.getElementById('signoutBtn');
    const profileInfo = document.getElementById('profileInfo');
    const userName = document.getElementById('userName');
    const divider1 = document.getElementById('divider1');
    const divider2 = document.getElementById('divider2');
    
    if (isLoggedIn) {
        loginBtn.classList.add('hidden');
        signupBtn.classList.add('hidden');
        signoutBtn.classList.remove('hidden');
        profileInfo.classList.remove('hidden');
        divider1.classList.remove('hidden');
        divider2.classList.remove('hidden');
        userName.textContent = currentUser.name;
    } else {
        loginBtn.classList.remove('hidden');
        signupBtn.classList.remove('hidden');
        signoutBtn.classList.add('hidden');
        profileInfo.classList.add('hidden');
        divider1.classList.add('hidden');
        divider2.classList.add('hidden');
        userName.textContent = 'Guest User';
    }
}

// ============================================
// SCROLL EFFECTS
// ============================================
function initializeScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.feature-card, .team-card, .about-block').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ============================================
// BUTTON ACTIONS
// ============================================
const getDemoBtn = document.getElementById('getDemoBtn');
const learnMoreBtn = document.getElementById('learnMoreBtn');

if (getDemoBtn) {
    getDemoBtn.addEventListener('click', () => {
        document.getElementById('trafficMonitor').scrollIntoView({ behavior: 'smooth' });
    });
}

if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
        document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
    });
}

// ============================================
// INITIALIZE TRAFFIC UI ON LOAD
// ============================================
setTimeout(() => {
    updateTrafficUI('low');
}, 500);
