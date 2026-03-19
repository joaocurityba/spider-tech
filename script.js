// Initialize Lucide Icons
lucide.createIcons();

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
const updateNavbarState = () => {
  navbar.classList.add('bg-[#020202]/80', 'backdrop-blur-md', 'border-b', 'border-white/5', 'py-4');
  navbar.classList.remove('bg-transparent', 'py-6');
};

updateNavbarState();
window.addEventListener('scroll', updateNavbarState);
window.addEventListener('resize', updateNavbarState);
window.addEventListener('load', updateNavbarState);
window.addEventListener('pageshow', updateNavbarState);
window.addEventListener('DOMContentLoaded', updateNavbarState);

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
let isMobileMenuOpen = false;

const renderMobileMenuIcon = (name) => {
  mobileMenuBtn.innerHTML = `<i data-lucide="${name}"></i>`;
  lucide.createIcons();
};

const closeMobileMenu = () => {
  isMobileMenuOpen = false;
  mobileMenu.style.height = '0px';
  mobileMenu.style.opacity = '0';
  renderMobileMenuIcon('menu');
};

const openMobileMenu = () => {
  isMobileMenuOpen = true;
  mobileMenu.style.height = `${mobileMenu.scrollHeight}px`;
  mobileMenu.style.opacity = '1';
  renderMobileMenuIcon('x');
};

mobileMenuBtn.addEventListener('click', () => {
  if (isMobileMenuOpen) {
    closeMobileMenu();
    return;
  }
  openMobileMenu();
});

// Mobile Menu Links
document.querySelectorAll('#mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    closeMobileMenu();
  });
});

window.addEventListener('resize', () => {
  closeMobileMenu();
});

renderMobileMenuIcon('menu');

// Intersection Observer for Animations (replaces Framer Motion whileInView)
const observerOptions = {
  root: null,
  rootMargin: '-50px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      // For elements matching .delay-*, wait their delay time
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in, .fade-in-up').forEach((el) => {
  observer.observe(el);
});

// Hero animations manually via classes
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => document.getElementById('hero-title').classList.add('is-visible'), 200);
    setTimeout(() => document.getElementById('hero-desc').classList.add('is-visible'), 800);
    setTimeout(() => document.getElementById('hero-chevron').classList.add('is-visible'), 1500);
});

// Canvas SpiderWeb Logic
class Node {
  constructor(x, y, pinned = false) {
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
    this.pinned = pinned;
  }
}

class Stick {
  constructor(p0, p1) {
    this.p0 = p0;
    this.p1 = p1;
    this.length = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    this.active = true;
  }
}

class Spider {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = Math.PI / 2;
    this.target = null;
    this.speed = 4;
    this.time = 0;
    this.settleFrames = 28;
    this.maxTurnPerFrame = 0.16;
  }

  update(sticks, cx, cy, bounds) {
    this.time += 0.1;
    if (this.settleFrames > 0) {
      this.settleFrames -= 1;
    }
    const isSettling = this.settleFrames > 0;
    const brokenSticks = sticks.filter(s => !s.active);

    if (brokenSticks.length > 0) {
      if (!this.target || this.target.active) {
        let minDist = Infinity;
        let closest = null;
        for (const s of brokenSticks) {
          const midX = (s.p0.x + s.p1.x) / 2;
          const midY = (s.p0.y + s.p1.y) / 2;
          if (midX < bounds.minX || midX > bounds.maxX || midY < bounds.minY || midY > bounds.maxY) {
            continue;
          }
          const dist = Math.hypot(this.x - midX, this.y - midY);
          if (dist < minDist) {
            minDist = dist;
            closest = s;
          }
        }
        this.target = closest;
      }
    } else {
      this.target = null;
    }

    let tx = cx;
    let ty = cy;

    if (this.target) {
      tx = (this.target.p0.x + this.target.p1.x) / 2;
      ty = (this.target.p0.y + this.target.p1.y) / 2;
      if (tx < bounds.minX || tx > bounds.maxX || ty < bounds.minY || ty > bounds.maxY) {
        this.target = null;
        tx = cx;
        ty = cy;
      }
    }

    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > this.speed) {
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      this.x = clamp(this.x + vx, bounds.minX, bounds.maxX);
      this.y = clamp(this.y + vy, bounds.minY, bounds.maxY);
      
      const targetAngle = Math.atan2(vy, vx);
      let diff = targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const clampedDiff = clamp(diff, -this.maxTurnPerFrame, this.maxTurnPerFrame);
      this.angle += isSettling ? clampedDiff * 0.5 : clampedDiff;
    } else {
      this.x = clamp(tx, bounds.minX, bounds.maxX);
      this.y = clamp(ty, bounds.minY, bounds.maxY);
      if (this.target) {
        this.target.active = true;
        this.target = null;
      } else {
        let diff = (Math.PI / 2) - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        const clampedDiff = clamp(diff, -this.maxTurnPerFrame, this.maxTurnPerFrame);
        this.angle += isSettling ? clampedDiff * 0.6 : clampedDiff * 0.35;
      }
    }
  }

  draw(ctx, cx, cy) {
    const isMoving = this.target !== null || Math.hypot(this.x - cx, this.y - cy) > 5;
    const walkCycle = isMoving ? this.time * 2 : 0;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle - Math.PI / 2);

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const isLeft = i < 4;
      const legIndex = i % 4;
      
      const sideMult = isLeft ? -1 : 1;
      const baseAngle = (Math.PI / 2) * sideMult + (legIndex - 1.5) * 0.4;
      
      const legOffset = Math.sin(walkCycle + i * Math.PI / 4) * 0.4;
      const finalAngle = baseAngle + legOffset;
      
      const legLength = 16 + Math.cos(walkCycle + i) * 4;
      
      const midX = Math.cos(finalAngle) * (legLength * 0.6);
      const midY = Math.sin(finalAngle) * (legLength * 0.6) - 10; 
      
      const endX = Math.cos(finalAngle) * legLength;
      const endY = Math.sin(finalAngle) * legLength;
      
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(midX, midY, endX, endY);
    }
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 4, 5, 7, 0, 0, Math.PI * 2); 
    ctx.arc(0, -3, 4, 0, Math.PI * 2); 
    
    ctx.fillStyle = '#050505';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#00f0ff';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(-1.5, -5, 1, 0, Math.PI * 2);
    ctx.arc(1.5, -5, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

function getLineIntersection(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
  const s1_x = p1_x - p0_x;
  const s1_y = p1_y - p0_y;
  const s2_x = p3_x - p2_x;
  const s2_y = p3_y - p2_y;

  const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
  const t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const canvas = document.getElementById('spider-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const heroSection = canvas.closest('.hero-section') || canvas.parentElement;

  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const readCanvasSize = () => {
    const rect = heroSection.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rect.width || window.innerWidth)),
      height: Math.max(1, Math.round(rect.height || window.innerHeight))
    };
  };

  let { width, height } = readCanvasSize();
  let currentDpr = 1;
  let resizeRaf = 0;

  const resizeCanvasForDpr = () => {
    const dprCap = isIOSDevice ? 3.5 : 3;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, dprCap));
    const nextBufferWidth = Math.max(1, Math.ceil(width * dpr));
    const nextBufferHeight = Math.max(1, Math.ceil(height * dpr));
    const hasBufferChanged = canvas.width !== nextBufferWidth || canvas.height !== nextBufferHeight;
    const hasDprChanged = Math.abs(dpr - currentDpr) > 0.001;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = nextBufferWidth;
    canvas.height = nextBufferHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    currentDpr = dpr;

    return hasBufferChanged || hasDprChanged;
  };

  resizeCanvasForDpr();

  let nodes = [];
  let sticks = [];
  let spider;
  let spiderHomeX = width / 2;
  let spiderHomeY = height / 2;
  const BOUNDS_PADDING = 4;
  const SPIDER_MARGIN = 14;
  let bounds = {
    minX: BOUNDS_PADDING,
    maxX: width - BOUNDS_PADDING,
    minY: BOUNDS_PADDING,
    maxY: height - BOUNDS_PADDING
  };

  const updateBounds = () => {
    bounds = {
      minX: BOUNDS_PADDING,
      maxX: Math.max(BOUNDS_PADDING, width - BOUNDS_PADDING),
      minY: BOUNDS_PADDING,
      maxY: Math.max(BOUNDS_PADDING, height - BOUNDS_PADDING)
    };
  };

  const initWeb = () => {
    nodes = [];
    sticks = [];
    
    const cx = width / 2;
    const cy = height / 2;

    spiderHomeX = clamp(width * 0.5, bounds.minX + SPIDER_MARGIN, bounds.maxX - SPIDER_MARGIN);
    spiderHomeY = clamp(height * 0.58, bounds.minY + SPIDER_MARGIN, bounds.maxY - SPIDER_MARGIN);
    spider = new Spider(spiderHomeX, spiderHomeY);
    
    const numRadials = 21;
    const numRings = 13;
    const edgeInset = 6;
    const halfW = Math.max(40, width / 2 - edgeInset);
    const halfH = Math.max(40, height / 2 - edgeInset);

    const distanceToHeroEdge = (angle) => {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const dx = Math.abs(cosA) < 1e-4 ? Infinity : halfW / Math.abs(cosA);
      const dy = Math.abs(sinA) < 1e-4 ? Infinity : halfH / Math.abs(sinA);
      return Math.min(dx, dy);
    };
    
    const centerNode = new Node(cx, cy, false);
    nodes.push(centerNode);

    const rings = [];

    for (let r = 1; r <= numRings; r++) {
      const ringNodes = [];
      const normalizedR = Math.pow(r / numRings, 1.05);

      for (let i = 0; i < numRadials; i++) {
        const angle = (i / numRadials) * Math.PI * 2;
        
        const spiralAngle = angle + (r * 0.05);
        const radiusOffset = (Math.random() * 8 - 4);
        const radiusToEdge = distanceToHeroEdge(spiralAngle);
        const minCoreRadius = Math.max(24, Math.min(width, height) * 0.055);
        const radius = minCoreRadius + normalizedR * (radiusToEdge - minCoreRadius);
        const isPinned = r === numRings;
        const jitter = isPinned ? 0 : radiusOffset;

        const x = clamp(cx + Math.cos(spiralAngle) * (radius + jitter), bounds.minX, bounds.maxX);
        const y = clamp(cy + Math.sin(spiralAngle) * (radius + jitter), bounds.minY, bounds.maxY);

        const node = new Node(x, y, isPinned);
        nodes.push(node);
        ringNodes.push(node);
      }
      rings.push(ringNodes);
    }

    for (let r = 0; r < numRings; r++) {
      for (let i = 0; i < numRadials; i++) {
        if (r === 0) {
          sticks.push(new Stick(centerNode, rings[r][i]));
        } else {
          sticks.push(new Stick(rings[r - 1][i], rings[r][i]));
        }
        const nextI = (i + 1) % numRadials;
        sticks.push(new Stick(rings[r][i], rings[r][nextI]));
      }
    }
  };

  initWeb();

  let mouseX = -1000;
  let mouseY = -1000;
  let prevMouseX = -1000;
  let prevMouseY = -1000;
  let isMouseMoving = false;
  let mouseTimeout;

  const updatePointerPosition = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = clientX - rect.left;
    mouseY = clientY - rect.top;

    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
      isMouseMoving = false;
      return;
    }

    if (prevMouseX === -1000) {
      prevMouseX = mouseX;
      prevMouseY = mouseY;
    }

    isMouseMoving = true;
    clearTimeout(mouseTimeout);
    mouseTimeout = window.setTimeout(() => {
      isMouseMoving = false;
      prevMouseX = mouseX;
      prevMouseY = mouseY;
    }, 50);
  };

  const handleMouseMove = (e) => {
    updatePointerPosition(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    updatePointerPosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    updatePointerPosition(touch.clientX, touch.clientY);
  };

  const handleMouseLeave = () => {
    isMouseMoving = false;
    mouseX = -1000;
    mouseY = -1000;
    prevMouseX = -1000;
    prevMouseY = -1000;
  };

  const handleTouchEnd = () => {
    handleMouseLeave();
  };

  const handleResize = (forceRebuild = false) => {
    const prevWidth = width;
    const prevHeight = height;
    const size = readCanvasSize();
    width = size.width;
    height = size.height;
    const hasSizeChanged = Math.abs(width - prevWidth) > 1 || Math.abs(height - prevHeight) > 1;
    const hasCanvasChanged = resizeCanvasForDpr();

    if (!forceRebuild && !hasSizeChanged && !hasCanvasChanged) {
      return;
    }

    updateBounds();
    initWeb();
  };

  const scheduleResize = (forceRebuild = false) => {
    if (resizeRaf) {
      cancelAnimationFrame(resizeRaf);
    }
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      handleResize(forceRebuild);
    });
  };

  const settleCanvasSize = () => {
    scheduleResize(true);
    window.setTimeout(() => scheduleResize(false), 120);
    window.setTimeout(() => scheduleResize(false), 360);
  };

  canvas.style.touchAction = 'none';
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseleave', handleMouseLeave);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd);
  canvas.addEventListener('touchcancel', handleTouchEnd);
  window.addEventListener('resize', () => scheduleResize(false));
  window.addEventListener('orientationchange', settleCanvasSize);
  window.addEventListener('load', settleCanvasSize);
  window.addEventListener('pageshow', settleCanvasSize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => scheduleResize(false));
  }
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => scheduleResize(false));
    observer.observe(heroSection);
  }

  const gravity = 0.45; 
  const friction = 0.92; 

  const update = () => {
    for (const node of nodes) {
      if (!node.pinned) {
        let vx = (node.x - node.oldX) * friction;
        let vy = (node.y - node.oldY) * friction;
        
        node.oldX = node.x;
        node.oldY = node.y;
        
        node.x += vx;
        node.y += vy + gravity;

        const clampedX = clamp(node.x, bounds.minX, bounds.maxX);
        const clampedY = clamp(node.y, bounds.minY, bounds.maxY);
        if (clampedX !== node.x || clampedY !== node.y) {
          node.x = clampedX;
          node.y = clampedY;
          node.oldX = clampedX;
          node.oldY = clampedY;
        }
        
        if (mouseX !== -1000) {
          const dx = node.x - mouseX;
          const dy = node.y - mouseY;
          const dist = Math.hypot(dx, dy);
          if (dist < 60) {
            const force = (60 - dist) / 60;
            node.x += dx * force * 0.1;
            node.y += dy * force * 0.1;
          }
        }
      }
    }

    if (isMouseMoving && prevMouseX !== -1000) {
      const mouseVelocity = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
      const tearRadius = Math.min(mouseVelocity * 0.5, 20) + 5;

      for (const stick of sticks) {
        if (!stick.active) continue;
        
        const intersects = getLineIntersection(
          prevMouseX, prevMouseY, mouseX, mouseY,
          stick.p0.x, stick.p0.y, stick.p1.x, stick.p1.y
        );

        const cx = (stick.p0.x + stick.p1.x) / 2;
        const cy = (stick.p0.y + stick.p1.y) / 2;
        const dist = Math.hypot(cx - mouseX, cy - mouseY);

        if (intersects || (mouseVelocity > 10 && dist < tearRadius)) {
          stick.active = false;
          if (!stick.p0.pinned) {
            stick.p0.x += (Math.random() - 0.5) * 15;
            stick.p0.y += (Math.random() - 0.5) * 15;
          }
          if (!stick.p1.pinned) {
            stick.p1.x += (Math.random() - 0.5) * 15;
            stick.p1.y += (Math.random() - 0.5) * 15;
          }
        }
      }
    }
    
    if(isMouseMoving) {
        prevMouseX = mouseX;
        prevMouseY = mouseY;
    }

    for (let i = 0; i < 4; i++) {
      for (const stick of sticks) {
        if (!stick.active) continue;
        
        const dx = stick.p1.x - stick.p0.x;
        const dy = stick.p1.y - stick.p0.y;
        const distance = Math.hypot(dx, dy);
        const difference = stick.length - distance;
        const percent = difference / distance / 2;
        const offsetX = dx * percent;
        const offsetY = dy * percent;

        if (!stick.p0.pinned) {
          stick.p0.x -= offsetX;
          stick.p0.y -= offsetY;
        }
        if (!stick.p1.pinned) {
          stick.p1.x += offsetX;
          stick.p1.y += offsetY;
        }
      }
    }

    if (spider) {
      spider.update(sticks, spiderHomeX, spiderHomeY, {
        minX: bounds.minX + SPIDER_MARGIN,
        maxX: bounds.maxX - SPIDER_MARGIN,
        minY: bounds.minY + SPIDER_MARGIN,
        maxY: bounds.maxY - SPIDER_MARGIN
      });
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    for (const stick of sticks) {
      if (stick.active) {
        ctx.moveTo(stick.p0.x, stick.p0.y);
        ctx.lineTo(stick.p1.x, stick.p1.y);
      }
    }
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    if (spider) {
      spider.draw(ctx, spiderHomeX, spiderHomeY);
    }
  };

  const loop = () => {
    update();
    draw();
    requestAnimationFrame(loop);
  };

  loop();
}