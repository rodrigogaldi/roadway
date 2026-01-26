const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const introModal = document.getElementById('intro-modal');
const introStart = document.getElementById('intro-start');
const lapTimeEl = document.getElementById('lap-time');
const countdownEl = document.getElementById('countdown');
const countdownBeep = document.getElementById('countdown-beep');
const countdownGo = document.getElementById('countdown-go');
const startSound = document.getElementById('start-sound');
const engineSound = document.getElementById('engine-sound');
const resultsOverlay = document.getElementById('results-overlay');
const resultsTotal = document.getElementById('results-total-time');
const resultsPartials = document.getElementById('results-partials');
const resultsRestart = document.getElementById('results-restart');
const resultsExit = document.getElementById('results-exit');
const endScreen = document.getElementById('end-screen');

const keyState = new Set();

const stopData = [
  {
    id: 'p1',
    name: 'Parada 1 - Integridade',
    text: 'Reflita sobre as boas praticas ao dirigir neste trecho.',
    distance: 520
  },
  {
    id: 'p2',
    name: 'Parada 2 - Comunicacao',
    text: 'Descreva como voce comunica um incidente na via.',
    distance: 1180
  },
  {
    id: 'p3',
    name: 'Parada 3 - Procedimentos',
    text: 'Revise o video com as etapas do treinamento.',
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    distance: 1760
  },
  {
    id: 'p4',
    name: 'Parada 4 - Decisao',
    text: 'Quais escolhas reduzem riscos para a equipe?',
    distance: 2360
  }
];

const state = {
  track: [],
  trackLengths: [],
  totalLength: 0,
  stopDistances: new Map(),
  finishDistance: 0,
  view: {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },
  recording: {
    enabled: false,
    points: [],
    isDrawing: false,
    lastWorld: null
  },
  progress: 0,
  speed: 0,
  lateral: 0,
  lateralSpeed: 0,
  throttle: 0,
  paused: false,
  modalOpen: false,
  countdownActive: false,
  visited: new Set(),
  lapStartTime: null,
  lapTime: 0,
  lapIndex: 0,
  stopTimes: new Map(),
  lastTime: performance.now()
};

const config = {
  roadWidth: 220,
  edgeWidth: 10,
  trackMargin: 80,
  trackJitter: 0.015,
  samplesPerSegment: 16,
  recordSpacing: 28,
  startAlignment: 'as-drawn',
  maxSpeed: 260,
  accel: 220,
  throttleRise: 1.4,
  throttleFall: 2.2,
  lateralAccel: 260,
  friction: 0.85,
  stopRadius: 45,
 trackControlPoints: [
  {
    "x": 0.04296296296296296,
    "y": 0.07213578500707214
  },
  {
    "x": 0.8666666666666667,
    "y": 0.06930693069306931
  },
  {
    "x": 0.9511111111111111,
    "y": 0.15841584158415842
  },
  {
    "x": 0.9644444444444444,
    "y": 0.30975954738330974
  },
  {
    "x": 0.9622222222222222,
    "y": 0.5318246110325319
  },
  {
    "x": 0.9207407407407407,
    "y": 0.6987270155586988
  },
  {
    "x": 0.8651851851851852,
    "y": 0.8118811881188119
  },
  {
    "x": 0.7348148148148148,
    "y": 0.8246110325318247
  },
  {
    "x": 0.6837037037037037,
    "y": 0.695898161244696
  },
  {
    "x": 0.7051851851851851,
    "y": 0.5388967468175389
  },
  {
    "x": 0.7103703703703703,
    "y": 0.4314002828854314
  },
  {
    "x": 0.6644444444444444,
    "y": 0.38189533239038187
  },
  {
    "x": 0.6,
    "y": 0.4073550212164074
  },
  {
    "x": 0.5888888888888889,
    "y": 0.45403111739745405
  },
  {
    "x": 0.5777777777777777,
    "y": 0.5898161244695899
  },
  {
    "x": 0.5333333333333333,
    "y": 0.6237623762376238
  },
  {
    "x": 0.5074074074074074,
    "y": 0.611032531824611
  },
  {
    "x": 0.4666666666666667,
    "y": 0.5091937765205092
  },
  {
    "x": 0.4533333333333333,
    "y": 0.4073550212164074
  },
  {
    "x": 0.48962962962962964,
    "y": 0.29985855728429983
  },
  {
    "x": 0.45481481481481484,
    "y": 0.2079207920792079
  },
  {
    "x": 0.37333333333333335,
    "y": 0.2050919377652051
  },
  {
    "x": 0.2851851851851852,
    "y": 0.25884016973125884
  },
  {
    "x": 0.23407407407407407,
    "y": 0.32531824611032534
  },
  {
    "x": 0.1925925925925926,
    "y": 0.4002828854314003
  },
  {
    "x": 0.19037037037037038,
    "y": 0.5162659123055162
  },
  {
    "x": 0.21481481481481482,
    "y": 0.6096181046676096
  },
  {
    "x": 0.2414814814814815,
    "y": 0.7722772277227723
  },
  {
    "x": 0.1948148148148148,
    "y": 0.8571428571428571
  },
  {
    "x": 0.0674074074074074,
    "y": 0.8373408769448374
  },
  {
    "x": 0.02962962962962963,
    "y": 0.6124469589816125
  },
  {
    "x": 0.02962962962962963,
    "y": 0.2913719943422914
  }
]
};

function resize() {
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * scale);
  canvas.height = Math.floor(window.innerHeight * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function updateHudHint() {
  return;
}

function formatLapTime(ms) {
  const totalSeconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function updateLapTimeDisplay() {
  if (!lapTimeEl) return;
  lapTimeEl.textContent = `Tempo de volta ${formatLapTime(state.lapTime)}`;
}

function playSound(audio) {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function ensureEngineSound() {
  if (!engineSound) return;
  engineSound.volume = 0;
  if (engineSound.paused) {
    engineSound.play().catch(() => {});
  }
}

function updateEngineSound() {
  if (!engineSound) return;
  if (state.recording.enabled || state.countdownActive) {
    engineSound.volume = 0;
    return;
  }
  const target = state.paused || state.modalOpen ? 0 : Math.min(1, Math.max(0, state.throttle));
  engineSound.volume = target;
}

function showResultsOverlay() {
  if (!resultsOverlay || !resultsPartials || !resultsTotal) return;

  const lastStopId = stopData[stopData.length - 1]?.id;
  const totalTime = state.stopTimes.get(lastStopId) ?? state.lapTime;
  resultsTotal.textContent = formatLapTime(totalTime);

  resultsPartials.innerHTML = '';
  let previousTime = 0;

  stopData.forEach((stop, index) => {
    const stopTime = state.stopTimes.get(stop.id);
    if (!Number.isFinite(stopTime)) return;

    const partial = stopTime - previousTime;
    previousTime = stopTime;

    const row = document.createElement('div');
    row.className = 'partial';

    const label = document.createElement('span');
    label.textContent = `Parcial ${index + 1} - ${stop.name || stop.id}`;

    const value = document.createElement('strong');
    value.textContent = formatLapTime(partial);

    row.appendChild(label);
    row.appendChild(value);
    resultsPartials.appendChild(row);
  });

  resultsOverlay.classList.remove('hidden');
  state.paused = true;
}

function hideResultsOverlay() {
  if (!resultsOverlay) return;
  resultsOverlay.classList.add('hidden');
}

function startCountdown() {
  if (!countdownEl) return;
  const steps = ['3', '2', '1', 'JÁ'];
  let index = 0;

  state.countdownActive = true;
  state.paused = true;
  countdownEl.classList.remove('hidden');
  ensureEngineSound();

  const showStep = () => {
    if (index >= steps.length) {
      countdownEl.classList.add('hidden');
      countdownEl.classList.remove('show');
      countdownEl.textContent = '';
      state.countdownActive = false;
      state.paused = false;
      state.lapStartTime = performance.now();
      state.lapTime = 0;
      state.lapIndex = Math.floor(state.progress / Math.max(1, state.totalLength));
      updateLapTimeDisplay();
      return;
    }

    countdownEl.textContent = steps[index];
    countdownEl.classList.remove('show');
    void countdownEl.offsetWidth;
    countdownEl.classList.add('show');
    if (index < steps.length - 1) {
      if (countdownBeep) {
        countdownBeep.currentTime = 0;
        countdownBeep.play().catch(() => {});
      }
    } else if (countdownGo) {
      countdownGo.currentTime = 0;
      countdownGo.play().catch(() => {});
    }
    index += 1;
    setTimeout(showStep, 1000);
  };

  showStep();
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function rotatePoint(point, center, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
  };
}

function buildCircuitPoints() {
  const margin = config.trackMargin;
  const width = Math.max(1, window.innerWidth - margin * 2);
  const height = Math.max(1, window.innerHeight - margin * 2);
  const jitterX = width * config.trackJitter;
  const jitterY = height * config.trackJitter;
  const control = config.trackControlPoints.map((point) => ({
    x: margin + point.x * width + randRange(-jitterX, jitterX),
    y: margin + point.y * height + randRange(-jitterY, jitterY)
  }));

  const samples = [];
  const count = control.length;

  for (let i = 0; i < count; i += 1) {
    const p0 = control[(i - 1 + count) % count];
    const p1 = control[i];
    const p2 = control[(i + 1) % count];
    const p3 = control[(i + 2) % count];

    for (let tIndex = 0; tIndex < config.samplesPerSegment; tIndex += 1) {
      const t = tIndex / config.samplesPerSegment;
      samples.push(catmullRom(p0, p1, p2, p3, t));
    }
  }

  return samples;
}

function screenToWorld(screenX, screenY) {
  if (state.recording.enabled) {
    return { x: screenX, y: screenY };
  }

  return {
    x: (screenX - state.view.offsetX) / state.view.scale,
    y: (screenY - state.view.offsetY) / state.view.scale
  };
}

function worldToNormalized(point) {
  const margin = config.trackMargin;
  const width = Math.max(1, window.innerWidth - margin * 2);
  const height = Math.max(1, window.innerHeight - margin * 2);
  return {
    x: Math.min(1, Math.max(0, (point.x - margin) / width)),
    y: Math.min(1, Math.max(0, (point.y - margin) / height))
  };
}

function normalizedToWorld(point) {
  const margin = config.trackMargin;
  const width = Math.max(1, window.innerWidth - margin * 2);
  const height = Math.max(1, window.innerHeight - margin * 2);
  return {
    x: margin + point.x * width,
    y: margin + point.y * height
  };
}

function addRecordPoint(screenX, screenY) {
  const world = screenToWorld(screenX, screenY);
  const lastWorld = state.recording.lastWorld;

  if (lastWorld) {
    const dx = world.x - lastWorld.x;
    const dy = world.y - lastWorld.y;
    if (Math.hypot(dx, dy) < config.recordSpacing) {
      return;
    }
  }

  state.recording.lastWorld = world;
  state.recording.points.push(worldToNormalized(world));
}

function buildTrack() {
  let points = buildCircuitPoints();
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  if (points.length > 1 && config.startAlignment !== 'as-drawn') {
    const start = points[0];
    const next = points[1];
    const angle = Math.atan2(next.y - start.y, next.x - start.x);
    const targetAngle = config.startAlignment === 'horizontal' ? 0 : Math.PI / 2;
    const rotateBy = targetAngle - angle;
    points = points.map((point) => rotatePoint(point, center, rotateBy));
  }

  state.track = points;
  state.trackLengths = [];
  state.totalLength = 0;

  for (let i = 0; i < points.length; i += 1) {
    const nextIndex = (i + 1) % points.length;
    const dx = points[nextIndex].x - points[i].x;
    const dy = points[nextIndex].y - points[i].y;
    const len = Math.hypot(dx, dy);
    state.trackLengths.push(len);
    state.totalLength += len;
  }

  state.finishDistance = state.totalLength;
  computeStopDistances();
  computeView();
}

function getPointAt(distance) {
  if (!state.totalLength) {
    return { x: 0, y: 0, tx: 0, ty: 1, nx: -1, ny: 0 };
  }

  let remaining = distance % state.totalLength;
  if (remaining < 0) remaining += state.totalLength;

  for (let i = 0; i < state.trackLengths.length; i += 1) {
    const segLen = state.trackLengths[i];
    if (remaining <= segLen) {
      const p0 = state.track[i];
      const p1 = state.track[(i + 1) % state.track.length];
      const t = segLen === 0 ? 0 : remaining / segLen;
      const x = p0.x + (p1.x - p0.x) * t;
      const y = p0.y + (p1.y - p0.y) * t;
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const tx = dx / len;
      const ty = dy / len;
      const nx = -ty;
      const ny = tx;
      return { x, y, tx, ty, nx, ny };
    }
    remaining -= segLen;
  }

  const last = state.track[state.track.length - 1];
  return { x: last.x, y: last.y, tx: 0, ty: 1, nx: -1, ny: 0 };
}

function computeStopDistances() {
  const definedStops = stopData.filter((stop) => Number.isFinite(stop.distance));
  const maxStop = definedStops.length
    ? Math.max(...definedStops.map((stop) => stop.distance))
    : stopData.length;
  const lastIndex = stopData.length - 1;

  state.stopDistances = new Map();

  stopData.forEach((stop, index) => {
    let ratio;
    if (Number.isFinite(stop.distance) && maxStop > 0) {
      ratio = stop.distance / maxStop;
    } else {
      ratio = (index + 1) / (stopData.length + 1);
    }

    let dist = Math.max(40, Math.min(state.totalLength - 40, ratio * state.totalLength));
    if (index === lastIndex) {
      dist = state.finishDistance;
    }
    state.stopDistances.set(stop.id, dist);
  });
}

function computeView() {
  if (!state.track.length) return;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  state.track.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  const extra = config.roadWidth * 0.6 + config.edgeWidth * 2;
  minX -= extra;
  maxX += extra;
  minY -= extra;
  maxY += extra;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const padding = 40;
  const availableW = Math.max(1, window.innerWidth - padding * 2);
  const availableH = Math.max(1, window.innerHeight - padding * 2);
  const scale = Math.min(availableW / width, availableH / height);

  state.view.scale = scale;
  state.view.offsetX = (window.innerWidth - width * scale) / 2 - minX * scale;
  state.view.offsetY = (window.innerHeight - height * scale) / 2 - minY * scale;
}

function toScreen(world) {
  if (state.recording.enabled) {
    return { x: world.x, y: world.y };
  }

  return {
    x: world.x * state.view.scale + state.view.offsetX,
    y: world.y * state.view.scale + state.view.offsetY
  };
}

function drawRoad() {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.strokeStyle = '#d8a638';
  ctx.lineWidth = (config.roadWidth + config.edgeWidth * 2) * state.view.scale;
  ctx.beginPath();
  state.track.forEach((point, index) => {
    const screen = toScreen(point);
    if (index === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
  });
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = '#2a2f3a';
  ctx.lineWidth = config.roadWidth * state.view.scale;
  ctx.beginPath();
  state.track.forEach((point, index) => {
    const screen = toScreen(point);
    if (index === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
  });
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.setLineDash([24 * state.view.scale, 18 * state.view.scale]);
  ctx.lineWidth = 4 * state.view.scale;
  ctx.beginPath();
  state.track.forEach((point, index) => {
    const screen = toScreen(point);
    if (index === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
  });
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function drawStops() {
  stopData.forEach((stop) => {
    const distance = state.stopDistances.get(stop.id);
    if (!Number.isFinite(distance)) return;
    const marker = getPointAt(distance);
    const screen = toScreen(marker);
    const visited = state.visited.has(stop.id);
    const radius = (visited ? 10 : 14) * state.view.scale;

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = visited ? 'rgba(242,95,92,0.35)' : 'rgba(242,95,92,0.9)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2 * state.view.scale;
    ctx.stroke();
  });
}

function drawFinishLine() {
  const finishPoint = getPointAt(state.finishDistance);
  const screen = toScreen(finishPoint);
  const angle = Math.atan2(finishPoint.ty, finishPoint.tx) + Math.PI / 2;
  const stripeWidth = (config.roadWidth + config.edgeWidth * 2) * state.view.scale;
  const stripeHeight = 28 * state.view.scale;
  const squares = 10;
  const squareWidth = stripeWidth / squares;
  const squareHeight = stripeHeight / 2;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(angle);

  ctx.fillStyle = '#f3f5f8';
  ctx.fillRect(-stripeWidth / 2, -stripeHeight / 2, stripeWidth, stripeHeight);

  ctx.fillStyle = '#10131b';
  for (let row = 0; row < 2; row += 1) {
    for (let i = 0; i < squares; i += 1) {
      if ((i + row) % 2 === 0) {
        ctx.fillRect(
          -stripeWidth / 2 + i * squareWidth,
          -stripeHeight / 2 + row * squareHeight,
          squareWidth,
          squareHeight
        );
      }
    }
  }

  ctx.restore();
}

function drawCar() {
  const base = getPointAt(state.progress);
  const carX = base.x + base.nx * state.lateral;
  const carY = base.y + base.ny * state.lateral;
  const screen = toScreen({ x: carX, y: carY });

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(Math.atan2(base.ty, base.tx));

  ctx.fillStyle = '#f25f5c';
  ctx.strokeStyle = '#0f1116';
  ctx.lineWidth = 2 * state.view.scale;
  ctx.fillRect(-18 * state.view.scale, -10 * state.view.scale, 36 * state.view.scale, 20 * state.view.scale);
  ctx.strokeRect(-18 * state.view.scale, -10 * state.view.scale, 36 * state.view.scale, 20 * state.view.scale);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-6 * state.view.scale, -8 * state.view.scale, 12 * state.view.scale, 16 * state.view.scale);

  ctx.restore();
}

function drawRecorderOverlay() {
  if (!state.recording.enabled) return;

  const margin = config.trackMargin;
  const width = Math.max(1, window.innerWidth - margin * 2);
  const height = Math.max(1, window.innerHeight - margin * 2);

  ctx.save();
  ctx.strokeStyle = 'rgba(104, 214, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(margin, margin, width, height);
  ctx.setLineDash([]);
  ctx.restore();

  if (state.recording.points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(104, 214, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();

  state.recording.points.forEach((point, index) => {
    const world = normalizedToWorld(point);
    const screen = toScreen(world);
    if (index === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
  });

  ctx.stroke();
  ctx.fillStyle = 'rgba(104, 214, 255, 0.9)';
  state.recording.points.forEach((point) => {
    const world = normalizedToWorld(point);
    const screen = toScreen(world);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function showEndScreen() {
  if (!endScreen) return;
  endScreen.classList.remove('hidden');
}

function openStopModal(stop) {
  state.modalOpen = true;
  modalTitle.textContent = stop.name || 'Parada';
  modalBody.innerHTML = '';
  modalClose.style.display = '';

  if (stop.text) {
    const label = document.createElement('div');
    label.textContent = 'Notas:';
    modalBody.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.value = stop.text;
    modalBody.appendChild(textarea);
  }

  if (stop.video) {
    const label = document.createElement('div');
    label.textContent = 'Video:';
    modalBody.appendChild(label);

    if (stop.video.endsWith('.mp4') || stop.video.endsWith('.webm')) {
      const video = document.createElement('video');
      video.src = stop.video;
      video.controls = true;
      modalBody.appendChild(video);
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = stop.video;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      modalBody.appendChild(iframe);
    }
  }

  const lastStopId = stopData[stopData.length - 1]?.id;
  if (stop.id === lastStopId) {
    modalClose.style.display = 'none';

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const resultsButton = document.createElement('button');
    resultsButton.className = 'primary';
    resultsButton.textContent = 'Ver resultados';
    resultsButton.addEventListener('click', () => {
      closeStopModal();
      showResultsOverlay();
    });

    actions.appendChild(resultsButton);
    footer.appendChild(actions);
    modalBody.appendChild(footer);
  }

  modal.classList.remove('hidden');
}

function closeStopModal() {
  modal.classList.add('hidden');
  state.modalOpen = false;
}

function resetGame() {
  state.progress = 0;
  state.speed = 0;
  state.lateral = 0;
  state.lateralSpeed = 0;
  state.throttle = 0;
  state.visited = new Set();
  state.stopTimes = new Map();
  state.modalOpen = false;
  state.paused = false;
  state.lapStartTime = null;
  state.lapTime = 0;
  state.lapIndex = 0;
  state.countdownActive = false;
  modal.classList.add('hidden');
  if (endScreen) {
    endScreen.classList.add('hidden');
  }
  hideResultsOverlay();
  if (countdownEl) {
    countdownEl.classList.add('hidden');
    countdownEl.classList.remove('show');
    countdownEl.textContent = '';
  }
  if (engineSound) {
    engineSound.pause();
    engineSound.currentTime = 0;
  }
  updateLapTimeDisplay();
  buildTrack();
}

function update(dt) {
  if (state.paused || state.modalOpen) return;

  const up = keyState.has('ArrowUp');
  const down = keyState.has('ArrowDown');
  const left = keyState.has('ArrowLeft');
  const right = keyState.has('ArrowRight');

  if (up) {
    state.throttle = Math.min(1, state.throttle + config.throttleRise * dt);
  } else {
    state.throttle = Math.max(0, state.throttle - config.throttleFall * dt);
  }

  if (down) {
    state.speed -= config.accel * dt;
  }

  state.speed += config.accel * state.throttle * dt;
  state.speed = Math.max(0, Math.min(config.maxSpeed, state.speed));

  if (left) state.lateralSpeed -= config.lateralAccel * dt;
  if (right) state.lateralSpeed += config.lateralAccel * dt;
  state.lateralSpeed *= 1 - Math.min(0.9, dt * 6);

  state.lateral += state.lateralSpeed * dt;
  const maxLateral = config.roadWidth * 0.4;
  state.lateral = Math.max(-maxLateral, Math.min(maxLateral, state.lateral));

  state.progress += state.speed * dt;
  if (!up) {
    state.speed *= config.friction;
  }

  if (!state.lapStartTime && state.speed > 0) {
    state.lapStartTime = performance.now();
  }

  if (state.totalLength > 0) {
    const currentLap = Math.floor(state.progress / state.totalLength);
    if (currentLap > state.lapIndex) {
      state.lapIndex = currentLap;
      state.lapStartTime = performance.now();
      state.lapTime = 0;
    }
  }

  if (state.lapStartTime) {
    state.lapTime = performance.now() - state.lapStartTime;
    updateLapTimeDisplay();
  }

  for (const stop of stopData) {
    const distance = state.stopDistances.get(stop.id);
    if (state.visited.has(stop.id) || !Number.isFinite(distance)) continue;
    if (Math.abs(state.progress - distance) <= config.stopRadius) {
      state.visited.add(stop.id);
      if (state.lapStartTime) {
        state.stopTimes.set(stop.id, performance.now() - state.lapStartTime);
      }
      openStopModal(stop);
      break;
    }
  }

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0e1116';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.recording.enabled) {
    drawRecorderOverlay();
    return;
  }

  drawRoad();
  drawStops();
  drawFinishLine();
  drawCar();
}

function loop(time) {
  const dt = Math.min(0.033, (time - state.lastTime) / 1000);
  state.lastTime = time;
  update(dt);
  updateEngineSound();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  resize();
  buildTrack();
});

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key.toLowerCase() === 'p') {
    state.paused = !state.paused;
  }

  if (event.key.toLowerCase() === 'r') {
    state.recording.enabled = !state.recording.enabled;
    state.recording.isDrawing = false;
    state.recording.lastWorld = null;
    if (state.recording.enabled) {
      state.recording.points = [];
    }
    state.paused = state.recording.enabled ? true : false;
    updateHudHint();
  }

  if (event.key.toLowerCase() === 'c' && state.recording.enabled) {
    state.recording.points = [];
    state.recording.lastWorld = null;
  }

  if (event.key.toLowerCase() === 'l' && state.recording.enabled) {
    console.log('trackControlPoints:', JSON.stringify(state.recording.points, null, 2));
  }

  keyState.add(event.key);
});

window.addEventListener('keyup', (event) => {
  keyState.delete(event.key);
});

canvas.addEventListener('mousedown', (event) => {
  if (!state.recording.enabled) return;
  state.recording.isDrawing = true;
  addRecordPoint(event.clientX, event.clientY);
});

canvas.addEventListener('mousemove', (event) => {
  if (!state.recording.enabled || !state.recording.isDrawing) return;
  addRecordPoint(event.clientX, event.clientY);
});

window.addEventListener('mouseup', () => {
  if (!state.recording.enabled) return;
  state.recording.isDrawing = false;
});

modalClose.addEventListener('click', closeStopModal);
if (resultsRestart) {
  resultsRestart.addEventListener('click', () => {
    hideResultsOverlay();
    resetGame();
  });
}
if (resultsExit) {
  resultsExit.addEventListener('click', () => {
    hideResultsOverlay();
    showEndScreen();
    state.paused = true;
  });
}
if (introStart && introModal) {
  introStart.addEventListener('click', () => {
    introModal.classList.add('hidden');
    playSound(startSound);
    startCountdown();
  });
}

resize();
resetGame();
updateHudHint();
if (introModal && !introModal.classList.contains('hidden')) {
  state.paused = true;
}
requestAnimationFrame(loop);
