export const Easings = {
  // Linear
  linear: t => t,

  // Quadratic
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quart
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - (--t) * t * t * t,
  easeInOutQuart: t =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Quint
  easeInQuint: t => t * t * t * t * t,
  easeOutQuint: t => 1 + (--t) * t * t * t * t,
  easeInOutQuint: t =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

  // Bounce
  easeOutBounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      t -= 1.5 / d1;
      return n1 * t * t + 0.75;
    } else if (t < 2.5 / d1) {
      t -= 2.25 / d1;
      return n1 * t * t + 0.9375;
    } else {
      t -= 2.625 / d1;
      return n1 * t * t + 0.984375;
    }
  },
  easeInBounce: t => 1 - Easings.easeOutBounce(1 - t),
  easeInOutBounce: t =>
    t < 0.5
      ? (1 - Easings.easeOutBounce(1 - 2 * t)) / 2
      : (1 + Easings.easeOutBounce(2 * t - 1)) / 2,

  // Elastic
  easeOutElastic: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInElastic: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeInOutElastic: t => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Back
  easeInBack: t => {
    const c1 = 1.70158;
    return c1 * t * t * ((c1 + 1) * t - c1);
  },
  easeOutBack: t => {
    const c1 = 1.70158;
    return 1 + c1 * (--t) * t * ((c1 + 1) * t + c1);
  },
  easeInOutBack: t => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easePulse: t => (1 - Math.cos(2 * Math.PI * t)) / 2,
  easePulseStrong: t => Math.pow((1 - Math.cos(2 * Math.PI * t)) / 2, 2),
  pulse: (t, frequency = 1) =>
  (1 - Math.cos(2 * Math.PI * frequency * t)) / 2,
  pulseScale: (t, frequency = 1, amplitude = 0.5) =>
    1 + amplitude * (0.5 - 0.5 * Math.cos(2 * Math.PI * frequency * t)),
};
