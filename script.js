const videos = [...document.querySelectorAll('video')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const saveData = navigator.connection?.saveData;
const visibleAnimations = new Set();
const userPaused = new WeakSet();
let internalPause = new WeakSet();
const manualPlaying = () => videos.some(v => !v.classList.contains('animation') && !v.paused);
function pause(video) {
  if (!video.paused) { internalPause.add(video); video.pause(); }
}
function prepare(video) {
  if (video.dataset.poster) { video.poster = video.dataset.poster; delete video.dataset.poster; }
  const source = video.querySelector('source[data-src]');
  if (source) { video.src = source.dataset.src; delete source.dataset.src; }
}
function resumeAnimations() {
  if (document.hidden || reducedMotion.matches || saveData || manualPlaying()) return;
  visibleAnimations.forEach(v => { if (!userPaused.has(v)) v.play().catch(() => {}); });
}
videos.forEach(video => {
  video.addEventListener('play', () => {
    userPaused.delete(video);
    if (!video.classList.contains('animation')) videos.forEach(other => { if (other !== video) pause(other); });
  });
  video.addEventListener('pause', () => {
    if (internalPause.has(video)) internalPause.delete(video);
    else if (video.classList.contains('animation')) userPaused.add(video);
    if (!video.classList.contains('animation')) resumeAnimations();
  });
  video.addEventListener('ended', resumeAnimations);
});
if ('IntersectionObserver' in window) {
  const prepareObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { prepare(entry.target); prepareObserver.unobserve(entry.target); }
  }), {rootMargin: '800px 0px'});
  const playObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.3) { prepare(video); visibleAnimations.add(video); }
      else { visibleAnimations.delete(video); pause(video); }
    });
    resumeAnimations();
  }, {threshold: [0, 0.3]});
  videos.forEach(v => { prepareObserver.observe(v); if (v.classList.contains('animation')) playObserver.observe(v); });
} else videos.forEach(prepare);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) videos.forEach(pause); else resumeAnimations();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) videos.filter(v => v.classList.contains('animation')).forEach(pause);
  else resumeAnimations();
});
