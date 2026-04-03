/* =============================================
   BIP 360 — Modern UI Engine
   Particles, cursor glow, scroll reveals,
   counters, Merkle canvas, nav tracking
   ============================================= */
(function () {
    'use strict';

    // ── Cursor glow ──────────────────────────
    const glow = document.getElementById('cursor-glow');
    let mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    (function trackGlow() {
        gx += (mx - gx) * 0.06;
        gy += (my - gy) * 0.06;
        glow.style.left = gx + 'px';
        glow.style.top = gy + 'px';
        requestAnimationFrame(trackGlow);
    })();

    // ── Particles ────────────────────────────
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let dots = [];

    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }

    class Dot {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.r = Math.random() * 1.2 + 0.2;
            this.vx = (Math.random() - 0.5) * 0.12;
            this.vy = (Math.random() - 0.5) * 0.12;
            this.a = Math.random() * 0.25 + 0.03;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            const dx = mx - this.x, dy = my - this.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 150) { this.x -= dx * 0.003; this.y -= dy * 0.003; }
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(247,147,26,${this.a})`;
            ctx.fill();
        }
    }

    function makeDots() {
        dots = [];
        const n = Math.min(60, Math.floor(canvas.width * canvas.height / 25000));
        for (let i = 0; i < n; i++) dots.push(new Dot());
    }

    function drawLines() {
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(247,147,26,${(1 - d / 120) * 0.04})`;
                    ctx.lineWidth = 0.4;
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    (function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dots.forEach(d => { d.update(); d.draw(); });
        drawLines();
        requestAnimationFrame(loop);
    })();

    resize(); makeDots();
    addEventListener('resize', () => { resize(); makeDots(); });

    // ── Quantum Clock ────────────────────────
    const qCanvas = document.getElementById('quantum-clock-canvas');
    const qCtx = qCanvas ? qCanvas.getContext('2d') : null;
    let clockScrollProgress = 0; // Updated in onScroll

    function resizeClock() { 
        if (qCanvas) {
            qCanvas.width = innerWidth; 
            qCanvas.height = innerHeight; 
        }
    }

    if (qCtx) {
        (function clockLoop() {
            qCtx.clearRect(0, 0, qCanvas.width, qCanvas.height);
            
            // Move clock to the right side
            const cx = qCanvas.width * 0.75;
            const cy = qCanvas.height / 2;
            const t = performance.now() * 0.001;
            
            // Heartbeat mathematical function
            const beatPhase = (t * 1.5) % Math.PI;
            const beat = Math.pow(Math.sin(beatPhase), 16); 
            
            // Influence of scroll (0 to 1)
            const stress = Math.min(1, clockScrollProgress);
            
            // Color shift from Gold/Cyan to Red/Dark Red as stress increases
            const rColor = Math.floor(247 + (239 - 247) * stress);
            const gColor = Math.floor(147 + (68 - 147) * stress);
            const bColor = Math.floor(26 + (68 - 26) * stress);

            const px = cx + (mx - cx) * 0.02;
            const py = cy + (my - cy) * 0.02;

            // Draw concentric rings - MADE LARGER (Multiplier of 1.5 on radius)
            const rings = 5;
            for(let i=0; i<rings; i++) {
                const baseRad = 180 + i * 65; // increased base scaling
                
                // Add distortion if stressed
                const distortion = stress * 35 * Math.sin(t * 12 + i);
                const r = baseRad + beat * 18 + distortion;
                
                qCtx.beginPath();
                const rx = cx + (mx - cx) * 0.015 * (i+1);
                const ry = cy + (my - cy) * 0.015 * (i+1);
                
                qCtx.arc(rx, ry, Math.max(0, r), 0, Math.PI * 2);
                
                qCtx.strokeStyle = `rgba(${rColor},${gColor},${bColor},${0.15 + beat * 0.1 - (i * 0.02)})`;
                qCtx.lineWidth = 1.5 + beat * 3 + stress * 4;
                
                // Ticking dashes
                if (i % 2 === 0) {
                    qCtx.setLineDash([12 + stress * 25, 25 + stress * 12]);
                    qCtx.lineDashOffset = t * (30 + stress * 200) * (i % 4 === 0 ? 1 : -1);
                } else {
                    qCtx.setLineDash([]);
                }
                
                qCtx.stroke();
            }

            // Central glowing node
            qCtx.beginPath();
            qCtx.arc(px, py, 140 + beat * 12, 0, Math.PI * 2);
            qCtx.fillStyle = `rgba(${rColor},${gColor},${bColor},${0.03 + beat * 0.04})`;
            qCtx.fill();

            // Geometric clock hands - MADE LARGER
            const angles = [t * 0.5, -t * 0.8 + stress * 5, t * 1.5 + stress * 12];
            angles.forEach((ang, idx) => {
                qCtx.beginPath();
                qCtx.moveTo(px, py);
                const handLength = 160 - idx * 35 + stress * (Math.random() * 35);
                qCtx.lineTo(px + Math.cos(ang) * handLength, py + Math.sin(ang) * handLength);
                qCtx.strokeStyle = `rgba(${rColor},${gColor},${bColor},${0.3 + beat * 0.4})`;
                qCtx.lineWidth = 2;
                qCtx.setLineDash([]);
                qCtx.stroke();
            });
            
            requestAnimationFrame(clockLoop);
        })();
    }
    resizeClock();
    addEventListener('resize', resizeClock);


    // ── Scroll reveals ───────────────────────
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        el.style.setProperty('--d', (el.dataset.delay || 0) + 's');
    });

    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => revealObs.observe(el));

    // ── Nav ──────────────────────────────────
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = ['hero', 'threat', 'solution', 'roadmap'];

    // ── Scroll progress ──────────────────────
    const prog = document.getElementById('scroll-progress');

    function onScroll() {
        const y = scrollY;
        const max = document.documentElement.scrollHeight - innerHeight;
        prog.style.width = ((y / max) * 100) + '%';
        nav.classList.toggle('visible', y > 200);

        // Update clock stress level
        clockScrollProgress = Math.min(1, y / 1200);

        let active = 'hero';
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top < innerHeight * 0.4) active = id;
        });
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === active));
    }
    addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
    onScroll();

    // ── Counter animation ────────────────────
    const counters = document.querySelectorAll('[data-count]');
    const counted = new Set();

    const counterObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting && !counted.has(e.target)) {
                counted.add(e.target);
                const t = parseInt(e.target.dataset.count);
                const dur = 2200, start = performance.now();
                (function tick(now) {
                    const p = Math.min((now - start) / dur, 1);
                    const val = Math.floor((1 - Math.pow(1 - p, 3)) * t);
                    e.target.textContent = val.toLocaleString();
                    if (p < 1) requestAnimationFrame(tick);
                })(start);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(el => counterObs.observe(el));

    // ── Merkle tree canvas ───────────────────
    const mc = document.getElementById('merkle-canvas');
    let merkled = false;

    if (mc) {
        const mObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting && !merkled) { merkled = true; drawMerkle(); }
            });
        }, { threshold: 0.25 });
        mObs.observe(mc);
    }

    function drawMerkle() {
        const c = mc.getContext('2d');
        const w = mc.width, h = mc.height;
        const gold = '#f7931a', faint = 'rgba(247,147,26,0.12)';

        const nodes = {
            root: { x: w / 2, y: 45, r: 22, label: 'Root' },
            h12:  { x: w * 0.28, y: 140, r: 18, label: 'H₁₂' },
            h34:  { x: w * 0.72, y: 140, r: 18, label: 'H₃₄' },
            tx1:  { x: w * 0.12, y: 240, r: 15, label: 'Tx₁' },
            tx2:  { x: w * 0.38, y: 240, r: 15, label: 'Tx₂' },
            tx3:  { x: w * 0.62, y: 240, r: 15, label: 'Tx₃' },
            tx4:  { x: w * 0.88, y: 240, r: 15, label: 'Tx₄' },
        };
        const edges = [['root','h12'],['root','h34'],['h12','tx1'],['h12','tx2'],['h34','tx3'],['h34','tx4']];

        let f = 0; const total = 65;

        (function draw() {
            c.clearRect(0, 0, w, h);
            const p = Math.min(f / total, 1);

            edges.forEach((e, i) => {
                const ep = Math.max(0, Math.min(1, (p - i * 0.07) / 0.3));
                if (ep <= 0) return;
                const from = nodes[e[0]], to = nodes[e[1]];
                c.beginPath();
                c.moveTo(from.x, from.y);
                c.lineTo(from.x + (to.x - from.x) * ep, from.y + (to.y - from.y) * ep);
                c.strokeStyle = faint;
                c.lineWidth = 1.5;
                c.stroke();
            });

            Object.values(nodes).forEach((n, i) => {
                const np = Math.max(0, Math.min(1, (p - i * 0.05) / 0.22));
                if (np <= 0) return;
                c.beginPath();
                c.arc(n.x, n.y, n.r * np, 0, Math.PI * 2);
                c.fillStyle = 'rgba(247,147,26,0.05)';
                c.fill();
                c.strokeStyle = gold;
                c.lineWidth = 1.5;
                c.stroke();

                if (np > 0.5) {
                    c.fillStyle = gold;
                    c.font = `${11 * np}px "JetBrains Mono"`;
                    c.textAlign = 'center';
                    c.textBaseline = 'middle';
                    c.globalAlpha = (np - 0.5) * 2;
                    c.fillText(n.label, n.x, n.y);
                    c.globalAlpha = 1;
                }
            });

            if (p > 0.75) {
                const sp = (p - 0.75) / 0.25;
                c.beginPath();
                c.moveTo(w / 2, h - 10);
                c.bezierCurveTo(w / 2 + 90 * sp, h - 50, w / 2 + 75 * sp, h - 120, w / 2, h - 150 * sp);
                c.bezierCurveTo(w / 2 - 75 * sp, h - 120, w / 2 - 90 * sp, h - 50, w / 2, h - 10);
                c.strokeStyle = `rgba(247,147,26,${sp * 0.35})`;
                c.lineWidth = 1.5;
                c.setLineDash([5, 3]);
                c.stroke();
                c.setLineDash([]);
            }

            f++;
            if (f <= total + 8) requestAnimationFrame(draw);
        })();
    }

    // ── Smooth anchor clicks ─────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const t = document.querySelector(a.getAttribute('href'));
            if (t) t.scrollIntoView({ behavior: 'smooth' });
        });
    });

})();
