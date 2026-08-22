const BASE_URL = "http://127.0.0.1:5000";

let currentTrafficLevel = 'low';
let isLoggedIn = false;
let currentUser = null;
let statsInterval = null;

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

    document.getElementById("videoFileInput").addEventListener("change", function () {
        document.getElementById("selectedFileName").textContent =
            this.files.length ? this.files[0].name : "No file selected";
    });
});

async function startLiveAnalysis() {
    const fileInput = document.getElementById("videoFileInput");
    const errorEl = document.getElementById("liveError");
    const badge = document.getElementById("liveBadge");
    const videoFeed = document.getElementById("liveVideoFeed");

    errorEl.textContent = "";

    if (!fileInput.files.length) {
        errorEl.textContent = "Please select a video file";
        return;
    }

    const formData = new FormData();
    formData.append("video", fileInput.files[0]);

    try {
        const response = await fetch(`${BASE_URL}/api/start`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Server error");

        videoFeed.style.display = "block";
        videoFeed.src = `${BASE_URL}/video_feed?${Date.now()}`;

        badge.textContent = "● Running";
        badge.style.color = "green";

        document.getElementById("liveStartBtn").disabled = true;
        document.getElementById("liveStopBtn").disabled = false;

        startStatsPolling();

    } catch (err) {
        errorEl.textContent = "Cannot connect to Flask server.";
    }
}

async function stopLiveAnalysis() {
    const badge = document.getElementById("liveBadge");

    try {
        await fetch(`${BASE_URL}/api/stop`, { method: "POST" });
    } catch (e) {}

    badge.textContent = "● Stopped";
    badge.style.color = "red";

    document.getElementById("liveStartBtn").disabled = false;
    document.getElementById("liveStopBtn").disabled = true;

    stopStatsPolling();
}

function startStatsPolling() {
    statsInterval = setInterval(async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/stats`);
            const data = await res.json();

            document.getElementById("liveCurrentVehicles").textContent = data.current_vehicles ?? "-";
            document.getElementById("liveTotalVehicles").textContent = data.total_vehicles ?? "-";
            document.getElementById("liveFps").textContent = data.fps ?? "-";
            document.getElementById("livePeak").textContent = data.peak ?? "-";

        } catch (e) {
            console.log("Stats fetch error");
        }
    }, 1000);
}

function stopStatsPolling() {
    if (statsInterval) clearInterval(statsInterval);
}

function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function initializeCanvas() {
    const canvas = document.getElementById('logoCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colors = ['#ef4444', '#f59e0b', '#10b981'];
        const active = Math.floor(frame / 60) % 3;

        colors.forEach((color, i) => {
            ctx.beginPath();
            ctx.arc(20, 10 + i * 10, 4, 0, Math.PI * 2);
            ctx.fillStyle = i === active ? color : '#333';
            ctx.fill();
        });

        frame++;
        requestAnimationFrame(animate);
    }
    animate();
}

function initializeTrafficMonitor() {}
function initializeProfileMenu() {}
function initializeModals() {}
function initializeScrollEffects() {}
function initializeFeatureIcons() {}
function initializeTeamAvatars() {}
function initializeMethodologyCanvas() {}