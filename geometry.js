// Geometry is expressed in world coordinates; view.x/y are screen translations.
export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

function boxOf(box = {}) {
  const x = finite(box.x), y = finite(box.y);
  const width = finite(box.width), height = finite(box.height);
  return {
    x: Math.min(x, x + width), y: Math.min(y, y + height),
    width: Math.abs(width), height: Math.abs(height),
  };
}

export function boundsOf(boxes) {
  if (!boxes.length) return { x: 0, y: 0, width: 0, height: 0 };
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const input of boxes) {
    const b = boxOf(input);
    left = Math.min(left, b.x); top = Math.min(top, b.y);
    right = Math.max(right, b.x + b.width);
    bottom = Math.max(bottom, b.y + b.height);
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function fitView(bounds, width, height, padding = 70) {
  const b = boxOf(bounds);
  width = Math.max(0, finite(width)); height = Math.max(0, finite(height));
  padding = Math.max(0, finite(padding));
  const sx = b.width ? Math.max(0, width - 2 * padding) / b.width : Infinity;
  const sy = b.height ? Math.max(0, height - 2 * padding) / b.height : Infinity;
  const scale = clamp(Math.min(sx, sy), 0.16, 2);
  // At the minimum scale, extremely large graphs may exceed the viewport.
  return {
    x: width / 2 - (b.x + b.width / 2) * scale,
    y: height / 2 - (b.y + b.height / 2) * scale,
    scale,
  };
}

export function zoomAt(view, factor, px, py) {
  const oldScale = view.scale > 0 && Number.isFinite(view.scale) ? view.scale : 1;
  const scale = clamp(oldScale * finite(factor, 1), 0.16, 2.5);
  const x = finite(view.x), y = finite(view.y);
  return {
    x: px - (px - x) * scale / oldScale,
    y: py - (py - y) * scale / oldScale,
    scale,
  };
}

const point = (x, y) => `${x},${y}`;
const cubic = (x1, y1, x2, y2, x, y) =>
  ` C ${point(x1, y1)} ${point(x2, y2)} ${point(x, y)}`;

// A rounded detour stays outside both boxes when they are separated along
// the chosen axis. No route can avoid both interiors if one contains the other.
function feedbackPath(a, b, horizontal) {
  if (horizontal) {
    const sx = a.x + a.width / 2, tx = b.x + b.width / 2;
    const sy = a.y, ty = b.y, direction = tx >= sx ? 1 : -1;
    const lift = Math.max(55, Math.min(150, Math.abs(tx - sx) * 0.18));
    const y = Math.min(sy, ty) - lift;
    const r = Math.min(22, Math.abs(tx - sx) / 4, lift / 2);
    const path = `M ${point(sx, sy)}`
      + cubic(sx, sy, sx, y + r, sx, y + r)
      + cubic(sx, y, sx, y, sx + direction * r, y)
      + cubic(sx + direction * r, y, tx - direction * r, y, tx - direction * r, y)
      + cubic(tx, y, tx, y, tx, y + r)
      + cubic(tx, y + r, tx, ty, tx, ty);
    return { path, x: (sx + tx) / 2, y };
  }
  const sx = a.x + a.width, tx = b.x + b.width;
  const sy = a.y + a.height / 2, ty = b.y + b.height / 2;
  const direction = ty >= sy ? 1 : -1;
  const lift = Math.max(55, Math.min(150, Math.abs(ty - sy) * 0.18));
  const x = Math.max(sx, tx) + lift;
  const r = Math.min(22, Math.abs(ty - sy) / 4, lift / 2);
  const path = `M ${point(sx, sy)}`
    + cubic(sx, sy, x - r, sy, x - r, sy)
    + cubic(x, sy, x, sy, x, sy + direction * r)
    + cubic(x, sy + direction * r, x, ty - direction * r, x, ty - direction * r)
    + cubic(x, ty, x, ty, x - r, ty)
    + cubic(x - r, ty, tx, ty, tx, ty);
  return { path, x, y: (sy + ty) / 2 };
}

export function edgeGeometry(a, b, { feedback = false, self = false } = {}) {
  a = boxOf(a); b = boxOf(b);
  if (self) {
    const right = a.x + a.width, top = a.y;
    const sy = top + Math.min(22, a.height * 0.3);
    const ex = right - Math.min(25, a.width * 0.25);
    const outside = right + 42, above = top - 42;
    return {
      path: `M ${point(right, sy)}`
        + cubic(outside, sy, outside, above, outside, above)
        + cubic(outside, above, ex, above, ex, above)
        + cubic(ex, above, ex, top, ex, top),
      x: right + 24, y: above,
    };
  }
  const acx = a.x + a.width / 2, acy = a.y + a.height / 2;
  const bcx = b.x + b.width / 2, bcy = b.y + b.height / 2;
  const dx = bcx - acx, dy = bcy - acy;
  const separatedX = a.x + a.width <= b.x || b.x + b.width <= a.x;
  const separatedY = a.y + a.height <= b.y || b.y + b.height <= a.y;
  const horizontal = separatedX && (!separatedY || Math.abs(dx) >= Math.abs(dy))
    || (!separatedX && !separatedY && Math.abs(dx) >= Math.abs(dy));
  if (feedback) return feedbackPath(a, b, horizontal);

  let sx, sy, tx, ty, c1x, c1y, c2x, c2y;
  if (horizontal) {
    const sign = dx >= 0 ? 1 : -1;
    sx = sign > 0 ? a.x + a.width : a.x; sy = acy;
    tx = sign > 0 ? b.x : b.x + b.width; ty = bcy;
    const distance = Math.max(0, (tx - sx) * sign) / 2;
    c1x = sx + sign * distance; c1y = sy;
    c2x = tx - sign * distance; c2y = ty;
  } else {
    const sign = dy >= 0 ? 1 : -1;
    sx = acx; sy = sign > 0 ? a.y + a.height : a.y;
    tx = bcx; ty = sign > 0 ? b.y : b.y + b.height;
    const distance = Math.max(0, (ty - sy) * sign) / 2;
    c1x = sx; c1y = sy + sign * distance;
    c2x = tx; c2y = ty - sign * distance;
  }
  return {
    path: `M ${point(sx, sy)}` + cubic(c1x, c1y, c2x, c2y, tx, ty),
    x: (sx + 3 * c1x + 3 * c2x + tx) / 8,
    y: (sy + 3 * c1y + 3 * c2y + ty) / 8,
  };
}
