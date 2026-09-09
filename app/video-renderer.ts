export type ScriptVideoBeat = {
  time: string;
  label: string;
  copy: string;
  direction: string;
};

export type ScriptVideoAsset = {
  name: string;
  type: string;
  url: string;
};

export type ScriptVideoRequest = {
  canvas: HTMLCanvasElement;
  product: {
    code: string;
    name: string;
    palette: string;
  };
  script: {
    hook: string;
    beats: ScriptVideoBeat[];
  };
  ratio: string;
  subtitle: string;
  soundtrack: string;
  assets: ScriptVideoAsset[];
  signal: AbortSignal;
  onProgress: (progress: number) => void;
};

export type RenderedScriptVideo = {
  blob: Blob;
  duration: number;
  width: number;
  height: number;
  mimeType: string;
  sceneCount: number;
};

type TimelineScene = ScriptVideoBeat & {
  start: number;
  end: number;
};

type PreparedAsset = {
  source: CanvasImageSource;
  video?: HTMLVideoElement;
};

const ratioSizes: Record<string, [number, number]> = {
  "9:16": [540, 960],
  "1:1": [720, 720],
  "16:9": [960, 540],
};

const paletteColors: Record<string, [string, string, string]> = {
  mint: ["#17312b", "#315f52", "#c7e36a"],
  sand: ["#302b27", "#7b6553", "#f0c88d"],
  peach: ["#462c2d", "#9c5e58", "#ffb59d"],
};

function parseRange(value: string, fallbackStart: number): [number, number] {
  const numbers = value.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (numbers.length >= 2 && numbers[1] > numbers[0]) return [numbers[0], numbers[1]];
  if (numbers.length === 1) return [fallbackStart, Math.max(fallbackStart + 3, numbers[0])];
  return [fallbackStart, fallbackStart + 5];
}

function buildTimeline(script: ScriptVideoRequest["script"]): TimelineScene[] {
  const scenes: TimelineScene[] = [{
    time: "00–03s",
    label: "HOOK",
    copy: script.hook,
    direction: "真人开场",
    start: 0,
    end: 3,
  }];
  let cursor = 3;
  for (const beat of script.beats) {
    const [start, end] = parseRange(beat.time, cursor);
    scenes.push({ ...beat, start, end });
    cursor = end;
  }
  return scenes;
}

function supportedMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    image.src = url;
  });
}

function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.playsInline = true;
    video.muted = true;
    video.loop = true;
    video.preload = "auto";
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error("VIDEO_LOAD_FAILED"));
    video.src = url;
    video.load();
  });
}

async function prepareAssets(assets: ScriptVideoAsset[]): Promise<PreparedAsset[]> {
  const prepared = await Promise.all(assets.map(async (asset) => {
    try {
      if (asset.type.startsWith("video/")) {
        const video = await loadVideo(asset.url);
        return { source: video, video } satisfies PreparedAsset;
      }
      return { source: await loadImage(asset.url) } satisfies PreparedAsset;
    } catch {
      return null;
    }
  }));
  return prepared.filter((asset): asset is PreparedAsset => asset !== null);
}

function drawCover(context: CanvasRenderingContext2D, source: CanvasImageSource, width: number, height: number) {
  const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source instanceof HTMLImageElement ? source.naturalWidth : width;
  const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source instanceof HTMLImageElement ? source.naturalHeight : height;
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function splitLines(context: CanvasRenderingContext2D, copy: string, maxWidth: number, maxLines: number): string[] {
  const characters = [...copy.trim()];
  const lines: string[] = [];
  let current = "";
  for (const character of characters) {
    const candidate = current + character;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = character;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) {
    const used = lines.join("").length + current.length;
    lines.push(used < characters.length ? `${current.replace(/[，。！？,.!?]?$/, "")}…` : current);
  }
  return lines;
}

function drawGeneratedBackdrop(context: CanvasRenderingContext2D, width: number, height: number, sceneIndex: number, colors: [string, string, string], phase: number) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.2;
  context.fillStyle = colors[2];
  const travel = Math.sin(phase * Math.PI * 2 + sceneIndex) * width * 0.04;
  context.beginPath();
  context.arc(width * 0.76 + travel, height * 0.2, width * 0.26, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 0.12;
  context.beginPath();
  context.arc(width * 0.14 - travel, height * 0.72, width * 0.34, 0, Math.PI * 2);
  context.fill();
  context.restore();

  const cardWidth = width * 0.48;
  const cardHeight = height * 0.29;
  const lift = Math.sin(phase * Math.PI) * height * 0.018;
  roundedRect(context, (width - cardWidth) / 2, height * 0.22 - lift, cardWidth, cardHeight, width * 0.07);
  context.fillStyle = "rgba(255,255,255,.1)";
  context.fill();
  context.strokeStyle = "rgba(255,255,255,.18)";
  context.lineWidth = Math.max(2, width / 270);
  context.stroke();
}

function drawScene(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: TimelineScene,
  sceneIndex: number,
  scenePhase: number,
  overallProgress: number,
  request: ScriptVideoRequest,
  asset?: PreparedAsset,
) {
  const colors = paletteColors[request.product.palette] ?? paletteColors.mint;
  context.clearRect(0, 0, width, height);
  if (asset) {
    drawCover(context, asset.source, width, height);
    const shade = context.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, "rgba(10,24,21,.18)");
    shade.addColorStop(0.5, "rgba(10,24,21,.08)");
    shade.addColorStop(1, "rgba(10,24,21,.82)");
    context.fillStyle = shade;
    context.fillRect(0, 0, width, height);
  } else {
    drawGeneratedBackdrop(context, width, height, sceneIndex, colors, scenePhase);
    context.fillStyle = "rgba(6,18,15,.24)";
    context.fillRect(0, 0, width, height);
  }

  const margin = width * 0.075;
  const small = Math.max(15, width * 0.029);
  const body = Math.max(27, width * (request.ratio === "16:9" ? 0.039 : 0.06));

  roundedRect(context, margin, margin, width * 0.24, small * 2.3, small);
  context.fillStyle = colors[2];
  context.fill();
  context.fillStyle = colors[0];
  context.font = `700 ${small}px system-ui, -apple-system, "PingFang SC", sans-serif`;
  context.textBaseline = "middle";
  context.fillText(`${request.product.code} · ${scene.label}`, margin + small, margin + small * 1.15);

  context.textBaseline = "alphabetic";
  context.font = `700 ${body}px system-ui, -apple-system, "PingFang SC", sans-serif`;
  const lines = splitLines(context, scene.copy, width - margin * 2, request.ratio === "16:9" ? 3 : 4);
  const lineHeight = body * 1.32;
  const textTop = height - margin - lineHeight * lines.length - small * 4.2;
  for (const [index, line] of lines.entries()) {
    const emphasis = request.subtitle === "重点词高亮" && index === lines.length - 1;
    context.fillStyle = emphasis ? colors[2] : "#ffffff";
    context.fillText(line, margin, textTop + lineHeight * (index + 1));
  }

  context.fillStyle = "rgba(255,255,255,.7)";
  context.font = `500 ${small}px system-ui, -apple-system, "PingFang SC", sans-serif`;
  context.fillText(scene.direction, margin, height - margin - small * 1.7);
  context.textAlign = "right";
  context.fillText(request.product.name, width - margin, height - margin - small * 1.7);
  context.textAlign = "left";

  const barY = height - margin;
  roundedRect(context, margin, barY, width - margin * 2, Math.max(4, height * 0.006), height * 0.01);
  context.fillStyle = "rgba(255,255,255,.24)";
  context.fill();
  roundedRect(context, margin, barY, (width - margin * 2) * overallProgress, Math.max(4, height * 0.006), height * 0.01);
  context.fillStyle = colors[2];
  context.fill();
}

async function createSoundtrack(kind: string, duration: number) {
  if (kind === "静音字幕版") return null;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = new AudioContextClass();
  await context.resume();
  const destination = context.createMediaStreamDestination();
  const master = context.createGain();
  master.gain.value = kind === "轻快节奏" ? 0.035 : 0.024;
  master.connect(destination);

  const frequencies = kind === "轻快节奏" ? [196, 246.94, 293.66] : [130.81, 164.81, 196];
  const oscillators = frequencies.map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.value = 1 / (index + 2.2);
    oscillator.connect(gain).connect(master);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration + 1);
    return oscillator;
  });
  return {
    track: destination.stream.getAudioTracks()[0],
    close: async () => {
      oscillators.forEach((oscillator) => {
        try { oscillator.stop(); } catch { /* already stopped */ }
      });
      await context.close();
    },
  };
}

export async function renderScriptVideo(request: ScriptVideoRequest): Promise<RenderedScriptVideo> {
  if (typeof MediaRecorder === "undefined" || typeof request.canvas.captureStream !== "function") {
    throw new Error("VIDEO_RENDER_UNSUPPORTED");
  }
  const context = request.canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");
  const [width, height] = ratioSizes[request.ratio] ?? ratioSizes["9:16"];
  request.canvas.width = width;
  request.canvas.height = height;

  const timeline = buildTimeline(request.script);
  const duration = Math.max(3, timeline.at(-1)?.end ?? 3);
  const preparedAssets = await prepareAssets(request.assets);
  const mimeType = supportedMimeType();
  const videoStream = request.canvas.captureStream(24);
  const soundtrack = await createSoundtrack(request.soundtrack, duration).catch(() => null);
  if (soundtrack?.track) videoStream.addTrack(soundtrack.track);

  const recorder = new MediaRecorder(videoStream, {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: 4_500_000,
    audioBitsPerSecond: 128_000,
  });
  const chunks: BlobPart[] = [];
  let recorderError: Error | null = null;
  const stopped = new Promise<void>((resolve) => {
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => { recorderError = new Error("VIDEO_RECORDER_FAILED"); };
    recorder.onstop = () => resolve();
  });
  const startedAt = performance.now();
  let previousAsset = -1;
  let lastProgress = -1;
  let aborted = false;

  recorder.start(500);
  try {
    while (true) {
      if (request.signal.aborted) {
        aborted = true;
        break;
      }
      const elapsed = Math.min(duration, (performance.now() - startedAt) / 1000);
      const matchedSceneIndex = timeline.findIndex((scene) => elapsed >= scene.start && elapsed < scene.end);
      const sceneIndex = matchedSceneIndex < 0 ? timeline.length - 1 : matchedSceneIndex;
      const scene = timeline[sceneIndex] ?? timeline.at(-1)!;
      const scenePhase = Math.min(1, Math.max(0, (elapsed - scene.start) / Math.max(0.1, scene.end - scene.start)));
      const assetIndex = preparedAssets.length ? sceneIndex % preparedAssets.length : -1;
      if (assetIndex !== previousAsset) {
        preparedAssets.forEach((asset, index) => {
          if (!asset.video) return;
          if (index === assetIndex) void asset.video.play().catch(() => undefined);
          else asset.video.pause();
        });
        previousAsset = assetIndex;
      }
      drawScene(context, width, height, scene, sceneIndex, scenePhase, elapsed / duration, request, assetIndex >= 0 ? preparedAssets[assetIndex] : undefined);
      const progress = Math.min(99, Math.floor((elapsed / duration) * 100));
      if (progress !== lastProgress) {
        request.onProgress(progress);
        lastProgress = progress;
      }
      if (elapsed >= duration) break;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  } finally {
    preparedAssets.forEach((asset) => asset.video?.pause());
    if (recorder.state !== "inactive") recorder.stop();
    await stopped;
    videoStream.getTracks().forEach((track) => track.stop());
    await soundtrack?.close();
  }

  if (aborted) throw new DOMException("Video generation cancelled", "AbortError");
  if (recorderError) throw recorderError;
  if (!chunks.length) throw new Error("VIDEO_OUTPUT_EMPTY");
  request.onProgress(100);
  const resolvedMimeType = recorder.mimeType || mimeType || "video/webm";
  return {
    blob: new Blob(chunks, { type: resolvedMimeType }),
    duration,
    width,
    height,
    mimeType: resolvedMimeType,
    sceneCount: timeline.length,
  };
}
