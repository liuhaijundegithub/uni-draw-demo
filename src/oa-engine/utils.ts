/* eslint-disable @typescript-eslint/camelcase */
import { throttle } from 'lodash';
import { shapes, lines, selectedShapes } from './data';
import Line from './items/Line';
import type { ShapeLine } from './types.ts';

type HelpLine = { start: number[]; end: number[]; type: string };

export const checkConIsInsideCanvas = (x: number, y: number, rect: DOMRect) => {
  const minX = rect.x;
  const minY = rect.y;
  const maxX = rect.x + rect.width;
  const maxY = rect.y + rect.height;
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
};

export const getShape = (x: number, y: number) => {
  for (let index = shapes.length - 1; index >= 0; index--) {
    const shape = shapes[index];
    const { maxX, maxY, minX, minY } = shape;
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) return shape;
  }
};

export const getItemWrapper = function (id: string, width: number, height: number) {
  const node = document.createElement('div');
  node.id = id;
  node.classList.add('shape-control');
  node.classList.add('flex-center');
  const canvas = document.createElement('canvas');
  canvas.height = (height + 20) * devicePixelRatio;
  canvas.width = (width + 20) * devicePixelRatio;

  Object.assign(canvas.style, {
    position: 'absolute',
    left: '-10px',
    top: '-10px'
  });
  node.appendChild(canvas);
  Object.assign(node.style, {
    position: 'absolute',
    zIndex: '2'
  });

  return node;
};

export const appendItem = (el: HTMLElement) => {
  const w = document.querySelector('#canvas-engine');
  w && w.appendChild(el);
};

const getTargetPoints = (shape: any, startX: number, startY: number) => {
  const endX = startX + shape.width;
  const endY = startY + shape.height;
  return {
    targetTopPoints: [(startX + endX) / 2, startY],
    targetLeftPoints: [startX, (startY + endY) / 2],
    targetRightPoints: [endX, (startY + endY) / 2],
    targetBottomPoints: [(startX + endX) / 2, endY],
    targetStartX: startX,
    targetEndX: endX,
    targetStartY: startY,
    targetEndY: endY
  };
};

const drawTorlenLine = throttle((dashLines: HelpLine[]) => {
  const el = document.querySelector('#canvas-engine canvas') as HTMLCanvasElement;
  const ctx = el?.getContext('2d')!;
  clearCanvas();
  dashLines.forEach(i => {
    const dis = Math.abs(i.start[0] - i.end[0] + i.start[1] - i.end[1]).toFixed(0) + 'px';
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(i.start[0], i.start[1]);
    ctx.lineTo(i.end[0], i.end[1]);
    ctx.strokeStyle = '#067bef';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.restore();

    // 绘制距离文本

    const textPoints = [(i.start[0] + i.end[0]) / 2, (i.start[1] + i.end[1]) / 2];
    // 托板
    ctx.save();
    ctx.beginPath();
    ctx.rect(textPoints[0] - 20, textPoints[1] - 8, 40, 16);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#067bef';
    ctx.fillText(dis, textPoints[0] - 20, textPoints[1] + 4);
    ctx.restore();
  });
}, 20);

const clearCanvas = () => {
  const el = document.querySelector('#canvas-engine canvas') as HTMLCanvasElement;
  const ctx = el?.getContext('2d')!;
  ctx.clearRect(0, 0, el.width, el.height);
};

// 处理shape移动
export const handleMove = (
  originClientX: number,
  originClientY: number,
  _this: any,
  el: HTMLElement
) => {
  const x = originClientX;
  const y = originClientY;
  const { startX, startY } = _this;
  _this.disableAcitve();
  window.onmousemove = (e: MouseEvent) => {
    _this.disableAcitve();
    e.preventDefault();
    const moveX = e.clientX - x;
    const moveY = e.clientY - y;

    const dashLines = [] as HelpLine[];
    const targetLeftDis = startX + moveX;
    const targetTopDis = startY + moveY;

    // 其实是鼠标的位置
    const {
      targetTopPoints,
      targetBottomPoints,
      targetLeftPoints,
      targetRightPoints,
      targetStartX,
      targetStartY,
      targetEndX,
      targetEndY
    } = getTargetPoints(_this, targetLeftDis, targetTopDis);

    function normalMove () {
      el.style.left = targetLeftDis + 'px';
      el.style.top = targetTopDis + 'px';
      _this.startX = targetLeftDis;
      _this.startY = targetTopDis;
    }

    function forceMove (x: number, y: number) {
      if (x) el.style.left = x + 'px';
      if (y) el.style.top = y + 'px';
      if (x) _this.startX = x;
      if (y) _this.startY = y;
    }
    const s = shapes.filter(i => i !== _this);
    // ? 为什么要比较两遍
    // ! 第一遍旨在收集到全部的线
    // ! 为的是第二遍比较的时候 一开始让其判断出当前状态的所有线
    // ! 解决的问题是 每根线之间相互影响，如果只比较一遍，那么按循环顺序比对出第一条线的时候永远不知道此时有几条线了。
    [...s, ...s].forEach(i => {
      const l = [] as HelpLine[];
      const { startX, startY, endX, endY, topPoints, bottomPoints, leftPoints, rightPoints } = i;
      // 先比较中点
      // 中点的优先级比较高
      // 且 如果【中点】命中，相同的图形不再比较【边点】
      // 比较中点
      const verticalMiddleX = targetTopPoints[0];
      const horizontalMiddleY = targetLeftPoints[1];

      // 竖直方向
      {
        const torlen = Math.abs(verticalMiddleX - topPoints[0]);
        if (torlen < 8 && torlen >= 0) {
          const hasH = dashLines.find(i => i.type === 'h');
          forceMove(topPoints[0] - _this.width / 2, hasH ? null : targetTopDis);
          const arr = hasH ? [_this.topPoints[1], _this.bottomPoints[1]] : [targetTopPoints[1], targetBottomPoints[1]];
          const ys = [
            ...arr,
            topPoints[1],
            bottomPoints[1]
          ].sort((a, b) => a - b);
          const points = {
            start: [topPoints[0], ys[1]],
            end: [topPoints[0], ys[2]],
            type: 'v'
          };
          l.push(points);
        }

        // 水平方向
        {
          const torlen = Math.abs(horizontalMiddleY - leftPoints[1]);
          if (torlen < 8 && torlen >= 0) {
            const hasV = dashLines.some(i => i.type === 'v') || l.some(i => i.type === 'v');
            forceMove(hasV ? null : targetLeftDis, leftPoints[1] - _this.height / 2);
            const arr = hasV ? [_this.leftPoints[0], _this.rightPoints[0]] : [targetLeftPoints[0], targetRightPoints[0]];
            const xs = [...arr, leftPoints[0], rightPoints[0]].sort((a, b) => a - b);
            const points = {
              start: [xs[1], leftPoints[1]],
              end: [xs[2], leftPoints[1]],
              type: 'h'
            };
            l.push(points);
          }
        }

        // 在没有【中点】命中的情况下 比较【边点】
        if (l.length === 0) {
          // 比较 X 竖着的
          [targetStartX, targetEndX].forEach((target, index) => {
            [startX, endX].forEach(x => {
              const torlen = Math.abs(target - x);
              if (torlen < 8 && torlen >= 0) {
                const hasH = dashLines.some(i => i.type === 'h') || l.some(i => i.type === 'h');
                forceMove(index === 0 ? x : x - _this.width, hasH ? null : targetTopDis);
                const arr = hasH ? [_this.startY, _this.endY] : [targetStartY, targetEndY];
                const ys = [...arr, startY, endY].sort((a, b) => a - b);
                const points = {
                  start: [x, ys[1]],
                  end: [x, ys[2]],
                  type: 'v'
                };
                l.push(points);
              }
            });
          });

          // 比较 Y 横着的
          [targetStartY, targetEndY].forEach((target, index) => {
            [startY, endY].forEach(y => {
              const torlen = Math.abs(target - y);
              if (torlen < 8 && torlen >= 0) {
                const hasV = dashLines.some(i => i.type === 'v') || l.some(i => i.type === 'v');
                forceMove(hasV ? null : targetLeftDis, index === 0 ? y : y - _this.height);
                const arr = hasV ? [_this.startX, _this.endX] : [targetStartX, targetEndX];
                const xs = [...arr, startX, endX].sort((a, b) => a - b);
                const points = {
                  start: [xs[1], y],
                  end: [xs[2], y],
                  type: 'h'
                };
                l.push(points);
              }
            });
          });
        }
      }
      dashLines.push(...l);
    });
    if (dashLines.length > 0) {
      // ! 同理 这里取第二遍比较出来的线
      drawTorlenLine(dashLines.slice(dashLines.length / 2));
    } else {
      normalMove();
      clearCanvas();
    }
    // 跟着处理线移动
    _this.lines.forEach((i: ShapeLine) => {
      const line = lines.find(l => l.id === i.id);
      if (!line) return false;
      if (i.type === 'start') {
        line.startX = _this[`${line.startDirection}Points`][0];
        line.startY = _this[`${line.startDirection}Points`][1];
      } else {
        line.endX = _this[`${line.endDirection}Points`][0];
        line.endY = _this[`${line.endDirection}Points`][1];
      }
      line && line.draw(line.startDirection, line.endDirection);
    });
  };
  window.onmouseup = () => {
    window.onmousemove = null;
    window.onmouseup = null;
    el.style.zIndex = '2';
    clearCanvas();
    _this.enableAcitve();
  };
};

// 影响的是 startX 和 宽度
const handleStretchLeft = (x: number, width: number, shape: any) => {
  shape.startX = x;
  shape.width = width;
  shape.resize();
};

// 影响的是 宽度
const handleStretchRight = (width: number, shape: any) => {
  shape.width = width;
  shape.resize();
};

// 影响的是starty 和 高度
const handleStretchTop = (y: number, height: number, shape: any) => {
  shape.startY = y;
  shape.height = height;
  shape.resize();
};

// 影响的是高度
const handleStretchBottom = (height: number, shape: any) => {
  shape.height = height;
  shape.resize();
};

// 处理拉伸
export const handleStretch = (
  originClientX: number,
  originClientY: number,
  _this: any,
  className: string,
  el: HTMLElement
) => {
  const x = originClientX;
  const y = originClientY;
  const { startX, startY, width, height } = _this;
  window.onmousemove = function (e: MouseEvent) {
    // 计算出偏移量
    const moveX = e.clientX - x;
    const moveY = e.clientY - y;

    // 控制拉伸后最小宽高为 20 * 20
    const maxX = startX + width - 20;
    const maxY = startY + height - 20;
    // 计算出新的startX starty width height;

    if (className.includes('left')) {
      // 计算出新的startX  width;
      const x = startX + moveX;
      const w = width - moveX;
      handleStretchLeft(x >= maxX ? maxX : x, w <= 20 ? 20 : w, _this);
    }
    if (className.includes('top')) {
      const y = startY + moveY;
      const h = height - moveY;
      handleStretchTop(y > maxY ? maxY : y, h <= 20 ? 20 : h, _this);
    };
    if (className.includes('bottom')) {
      const h = height + moveY;
      handleStretchBottom(h <= 20 ? 20 : h, _this);
    }
    if (className.includes('right')) {
      const w = width + moveX;
      handleStretchRight(w <= 20 ? 20 : w, _this);
    };

    // 处理shape上的线
    // 跟着处理线移动
    _this.lines.forEach((i: ShapeLine) => {
      const line = lines.find(l => l.id === i.id)!;
      if (i.type === 'start') {
        line.startX = _this[`${line.startDirection}Points`][0];
        line.startY = _this[`${line.startDirection}Points`][1];
      } else {
        line.endX = _this[`${line.endDirection}Points`][0];
        line.endY = _this[`${line.endDirection}Points`][1];
      }
      line && line.draw(line.startDirection, line.endDirection);
    });
  };
  window.onmouseup = function () {
    window.onmousemove = null;
    window.onmouseup = null;
    el.style.zIndex = '2';
  };
};

// 画编辑时候的线

export const drawEditLine = (cvs: HTMLCanvasElement, width: number, height: number) => {
  const ctx = cvs.getContext('2d')!;
  let dashOffset = 0;
  function draw () {
    ctx.clearRect(0, 0, width + 20, height + 20);
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#0080ff';
    ctx.lineWidth = 1;
    ctx.lineDashOffset = -dashOffset;
    // ctx.rect(10, 10, width, height);
    // ctx.fillStyle = 'transparent';
    // ctx.fill();
    ctx.moveTo(10, 10);
    ctx.lineTo(width + 10, 10);
    ctx.lineTo(width + 10, height + 10);
    ctx.lineTo(10, height + 10);
    ctx.lineTo(10, 10);
    ctx.stroke();
    dashOffset = (dashOffset + 0.5) % 10;
    requestAnimationFrame(draw);
  }
  draw();
};

function forceCursorDefault () {
  const el = document.querySelectorAll('.shape-control') as NodeListOf<HTMLElement>;
  el.forEach(i => {
    i.style.cursor = 'default';
  });
}

function resetCursor () {
  const el = document.querySelectorAll('.shape-control');
  el.forEach((i: any) => {
    i.style.cursor = 'move';
  });
}

function generateEndDirectionWhenDrawingLine (
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  const disX = Math.abs(endX - startX);
  const disY = Math.abs(endY - startY);
  if (disX > disY) {
    // 左右
    return endX - startX > 0 ? 'left' : 'right';
  } else {
    // 上下
    return endY - startY > 0 ? 'top' : 'bottom';
  }
}

// 开始画线
export const handleDrawLine = (
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
  el: HTMLElement,
  startDirection: string,
  wrapper: HTMLElement,
  startShapeId: string
) => {
  const line = new Line(startX, startY, startX, startY);
  line.startDirection = startDirection;

  let hit = false;
  let shapeId = '';
  window.onmousemove = function (e: MouseEvent) {
    e.preventDefault();
    const moveX = e.clientX - clientX;
    const moveY = e.clientY - clientY;
    forceCursorDefault();

    // 终点
    const endX = moveX + startX;
    const endY = moveY + startY;
    let endDirection = '';

    const tops = shapes.map(i => ({ point: i.topPoints, id: i.id }));
    const lefts = shapes.map(i => ({ point: i.leftPoints, id: i.id }));
    const rights = shapes.map(i => ({ point: i.rightPoints, id: i.id }));
    const bottoms = shapes.map(i => ({ point: i.bottomPoints, id: i.id }));

    const allPoints = [tops, lefts, rights, bottoms];
    hit = false;
    for (let index = 0; index < allPoints.length; index++) {
      if (hit) break;
      for (let i = 0; i < allPoints[index].length; i++) {
        const [x, y] = allPoints[index][i].point;
        const id = allPoints[index][i].id;
        const disX = Math.abs(x - endX);
        const disY = Math.abs(y - endY);
        if (disX < 7 && disY < 7) {
          // TODO 吸附进去
          line.endX = x;
          line.endY = y;
          if (index === 0) endDirection = 'top';
          if (index === 1) endDirection = 'left';
          if (index === 2) endDirection = 'right';
          if (index === 3) endDirection = 'bottom';
          hit = true;
          line.endDirection = endDirection;
          shapeId = id;
          activeHitPoint(shapeId, endDirection);
          break;
        } else {
          // TODO 正常画线
          clearHitPoint();
          line.endX = endX;
          line.endY = endY;
          endDirection = generateEndDirectionWhenDrawingLine(startX, startY, endX, endY);
        }
      }
    }
    line.draw(startDirection, endDirection);
  };
  window.onmouseup = function (e: MouseEvent) {
    window.onmousemove = null;
    window.onmouseup = null;
    resetCursor();
    wrapper.style.zIndex = '2';
    el.classList.remove('active');
    clearHitPoint();
    if (!hit) {
      line.remove();
    } else {
      // 线结束的shape
      const endShape = shapes.find(i => i.id === shapeId);
      endShape && endShape.lines.push({
        type: 'end',
        id: line.id
      });
      const startShape = shapes.find(i => i.id === startShapeId);
      startShape && startShape.lines.push({
        type: 'start',
        id: line.id
      });
      lines.push(line);
    }
  };
};

function isPointOnLineSegment(point1: number[], point2: number[], testPoint: number[]): boolean {
  function onSegment(p: number[], q: number[], r: number[]): boolean {
    return (
      q[0] <= Math.max(p[0], r[0]) &&
      q[0] >= Math.min(p[0], r[0]) &&
      q[1] <= Math.max(p[1], r[1]) &&
      q[1] >= Math.min(p[1], r[1])
    );
  }

  const [x1, y1] = point1;
  const [x2, y2] = point2;
  const [xt, yt] = testPoint;

  const orientation = (x1 - xt) * (y2 - yt) - (x2 - xt) * (y1 - yt);

  if (orientation !== 0) {
    return false;
  }

  return onSegment(point1, testPoint, point2);
}

// 去掉导致线重合的点
export const removeOverLapPoints = (points: number[][]) => {
  const newPoints = [] as number[][];
  const index = new Set<number>(); // 不要的点的下标
  for (let i = 2; i < points.length; i++) {
    const p1 = points[i - 2];
    const p2 = points[i - 1];
    const p3 = points[i];
    if (isPointOnLineSegment(p1, p2, p3)) {
      // 点在线段内，造成线段重复
      index.add(i - 1);
      index.add(i);
    } else if (
      (p3[0] === p2[0] && p3[0] === p1[0]) || (p3[1] === p2[1] && p3[1] === p1[1])
    ) {
      // 其实就是一根线
      index.add(i - 1);
    }
  }
  const indexArr = Array.from(index).filter(i => i < points.length - 1);
  points.forEach((i, index) => {
    if (!indexArr.includes(index)) {
      newPoints.push(i);
    }
  });
  return newPoints;
};

// ! 不要改
// ! 看不懂问 刘海军
// ! 看不懂问 刘海军
// ! 看不懂问 刘海军

export const generateLinePoints = (
  s1: number[],
  s2: number[],
  e2: number[],
  e1: number[],
  startDirection: string,
  endDirection: string
) => {
  const points = [] as number[][];
  points.push(s1);
  points.push(s2);
  const [sx, sy] = s2;
  const [ex, ey] = e2;
  const [mx, my] = [(sx + ex) / 2, (sy + ey) / 2];

  const pointsCombine = [
    [[sx, ey]],
    [[ex, sy]],
    [[sx, my], [ex, my]],
    [[mx, sy], [mx, ey]]
  ];

  const ps: number[][] = [];
  let directionsCombine = [] as { start: string[]; end: string[] }[];
  if (ex > sx && ey < sy) {
    // 第二象限
    directionsCombine = [
      { start: ['top', 'left'], end: ['top', 'left'] },
      { start: ['right', 'bottom'], end: ['right', 'bottom'] },
      { start: ['top', 'left'], end: ['bottom', 'right'] },
      { start: ['bottom', 'right'], end: ['top', 'left'] }
    ];
  } else if (ex > sx && ey > sy) {
    // 第四象限
    directionsCombine = [
      { start: ['bottom', 'left'], end: ['bottom', 'left'] },
      { start: ['right', 'top'], end: ['right', 'top'] },
      { start: ['bottom', 'left'], end: ['top', 'right'] },
      { start: ['top', 'right'], end: ['bottom', 'left'] }
    ];
  } else if (ex < sx && ey > sy) {
    // 第三象限
    directionsCombine = [
      { start: ['bottom', 'right'], end: ['bottom', 'right'] },
      { start: ['left', 'top'], end: ['left', 'top'] },
      { start: ['bottom', 'right'], end: ['top', 'left'] },
      { start: ['top', 'left'], end: ['bottom', 'right'] }
    ];
  } else if (ex < sx && ey < sy) {
    // 第一象限
    directionsCombine = [
      { start: ['top', 'right'], end: ['top', 'right'] },
      { start: ['left', 'bottom'], end: ['left', 'bottom'] },
      { start: ['top', 'right'], end: ['bottom', 'left'] },
      { start: ['bottom', 'left'], end: ['top', 'right'] }
    ];
  }

  directionsCombine.forEach((i, index) => {
    if (i.start.includes(startDirection) && i.end.includes(endDirection)) {
      points.push(...pointsCombine[index]);
    }
  });

  points.push(...ps);
  points.push(e2);
  points.push(e1);
  return points;
};

export function clickFindLine (e: any) {
  if (e.target.id === 'range-canvas') return false;
  clearAllRangeCanvas();
  const el = document.querySelector('#canvas-engine canvas') as HTMLCanvasElement;
  const bouding = el.getBoundingClientRect();
  // 遍历所有的线
  const pointerX = e.clientX - bouding.left;
  const pointerY = e.clientY - bouding.top;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const points = line.points;

    let hit = false;
    for (let index = 1; index < points.length; index++) {
      const p1 = points[index];
      const p2 = points[index - 1];
      const x1 = p1[0];
      const y1 = p1[1];
      const x2 = p2[0];
      const y2 = p2[1];
      const dis = shortestDistanceToLineSegment(pointerX, pointerY, x1, y1, x2, y2);
      if (dis <= 3) {
        line.enableActive();
        hit = true;
        break;
      }
    };

    if (!hit) {
      line.disableActive();
    }
  }
};
// 生成线的画布
export const drawLineCanvas = (points: number[][], _this: any) => {
  const ps = points.filter(i => i.length > 0);
  const xs = ps.map(i => i[0]);
  const ys = ps.map(i => i[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const height = maxY - minY;
  const width = maxX - minX;
  _this.minX = minX;
  _this.minY = minY;
  _this.el.style.left = minX - 10 + 'px';
  _this.el.style.top = minY - 10 + 'px';
  _this.el.style.width = width + 20 + 'px';
  _this.el.style.height = height + 20 + 'px';
  _this.cvs.width = width + 20;
  _this.cvs.height = height + 20;
  _this.el.onclick = (e: MouseEvent) => {
    clickFindLine(e);
  };
};

// 求点到线段最短的距离
export function shortestDistanceToLineSegment(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): number {
  const dotProduct = (ax: number, ay: number, bx: number, by: number): number => ax * bx + ay * by;
  const lengthSquared = (x: number, y: number): number => x * x + y * y;

  const dx = x2 - x1;
  const dy = y2 - y1;

  const t = Math.max(0, Math.min(1, dotProduct(x0 - x1, y0 - y1, dx, dy) / lengthSquared(dx, dy)));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  const distance = Math.sqrt(lengthSquared(x0 - closestX, y0 - closestY));

  return distance;
};

// 线段中离点最近的点
export function closestPointOnLineSegment(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): { x: number; y: number } {
  const dotProduct = (ax: number, ay: number, bx: number, by: number): number => ax * bx + ay * by;
  const lengthSquared = (x: number, y: number): number => x * x + y * y;

  const dx = x2 - x1;
  const dy = y2 - y1;

  const t = Math.max(0, Math.min(1, dotProduct(x0 - x1, y0 - y1, dx, dy) / lengthSquared(dx, dy)));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return { x: closestX, y: closestY };
};

export const getLineLong = (points: number[][]) => {
  let lineDis = 0;
  for (let index = 1; index < points.length; index++) {
    const start = points[index - 1];
    const end = points[index];
    const [startX, startY] = start;
    const [endX, endY] = end;
    const dis = Math.abs(endX - startX) + Math.abs(endY - startY);
    lineDis += dis;
  };
  return lineDis;
};

// 获取 点 到线起点的距离比例
export function getpointsDistanceRatio(
  pointerX: number,
  pointerY: number,
  points: number[][],
  lineLong: number
) {
  let pointDis = 0;
  for (let index = 1; index < points.length; index++) {
    const start = points[index - 1];
    const end = points[index];
    const [startX, startY] = start;
    const [endX, endY] = end;
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    if (
      (pointerX >= minX && pointerX <= maxX && pointerY === minY && pointerY === maxY) ||
      (pointerY >= minY && pointerY <= maxY && pointerX === maxX && pointerX === minX)
    ) {
      // 说明点在这个线上w
      const dis = Math.abs(pointerX - startX) + Math.abs(pointerY - startY);
      pointDis += dis;
      break;
    } else {
      const dis = Math.abs(endX - startX) + Math.abs(endY - startY);
      pointDis += dis;
    }
  }
  return pointDis / lineLong;
};

// 找到线上最短距离的点
export function findClosestPoint(lines: number[][], targetPoint: number[]): number[] {
  if (lines.length === 0) {
    // 如果线段数组为空，返回 NaN, NaN
    return [NaN, NaN];
  }

  let closestPoint: number[] = lines[0];
  let minDistance = calculateDistance(targetPoint[0], targetPoint[1], lines[0][0], lines[0][1]);

  for (const line of lines) {
    const [x1, y1] = line;
    const [x2, y2] = line;

    // 计算线段上距离点最近的点
    const closest = closestPointOnLine(x1, y1, x2, y2, targetPoint[0], targetPoint[1]);

    // 计算距离
    const distance = calculateDistance(targetPoint[0], targetPoint[1], closest[0], closest[1]);

    // 更新最小距离和最近点
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = closest;
    }
  }
  return closestPoint;
}

// 计算两点之间的距离
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// 计算线段上距离指定点最近的点
function closestPointOnLine(x1: number, y1: number, x2: number, y2: number, pointX: number, pointY: number): number[] {
  const A = pointX - x1;
  const B = pointY - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  const param = dot / len_sq;

  let x, y;

  if (param < 0 || (x1 === x2 && y1 === y2)) {
    x = x1;
    y = y1;
  } else if (param > 1) {
    x = x2;
    y = y2;
  } else {
    x = x1 + param * C;
    y = y1 + param * D;
  }

  return [x, y];
}

function activeHitPoint (shapeId: string, direction: string) {
  const shape = shapes.find(shape => shape.id === shapeId)!;
  const el = shape.wrapper.querySelector(`.line-point.${direction}`);
  el.classList.add('hit');
}

function clearHitPoint () {
  const els = document.querySelectorAll('.shape-control .line-point');
  els.forEach(i => {
    i.classList.remove('hit');
  });
};

// 拖动已经画好了的线 改变线的连接
export function bindChangeLineEvent (
  el: HTMLElement,
  type: string, // 开始还是结束
  _this: Line,
  originX: number,
  originY: number
) {
  // 监听移动事件
  el.onmousedown = (e: MouseEvent) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    let isBreak = false;
    let hit = false;
    let shapeId = '';
    _this.disableActive();
    window.onmousemove = (e: MouseEvent) => {
      const moveX = e.clientX - clientX;
      const moveY = e.clientY - clientY;

      const finalX = originX + moveX;
      const finalY = originY + moveY;
      _this.el.style.zIndex = '1';

      hit = false;

      if (isBreak) {
        // 已经拉断了
        // 开始找新的点
        const tops = shapes.map(i => ({ point: i.topPoints, id: i.id }));
        const lefts = shapes.map(i => ({ point: i.leftPoints, id: i.id }));
        const rights = shapes.map(i => ({ point: i.rightPoints, id: i.id }));
        const bottoms = shapes.map(i => ({ point: i.bottomPoints, id: i.id }));
        const allPoints = [tops, lefts, rights, bottoms];
        for (let index = 0; index < allPoints.length; index++) {
          if (hit) break;
          for (let i = 0; i < allPoints[index].length; i++) {
            const [x, y] = allPoints[index][i].point;
            const id = allPoints[index][i].id;
            const disX = Math.abs(x - finalX);
            const disY = Math.abs(y - finalY);
            if (disX < 7 && disY < 7) {
              hit = true;
              shapeId = id;
              if (type === 'start') {
                _this.startX = x;
                _this.startY = y;
                if (index === 0) _this.startDirection = 'top';
                if (index === 1) _this.startDirection = 'left';
                if (index === 2) _this.startDirection = 'right';
                if (index === 3) _this.startDirection = 'bottom';
              } else {
                _this.endX = x;
                _this.endY = y;
                if (index === 0) _this.endDirection = 'top';
                if (index === 1) _this.endDirection = 'left';
                if (index === 2) _this.endDirection = 'right';
                if (index === 3) _this.endDirection = 'bottom';
              }
              _this.draw(_this.startDirection, _this.endDirection);
              _this.generateLineActiveCanvas();

              // 命中提示
              activeHitPoint(id, type === 'start' ? _this.startDirection : _this.endDirection);
              break;
            } else {
              // 正常画线
              hit = false;
              // 取消所有命中提示
              clearHitPoint();
              if (type === 'start') {
                // 开始
                _this.startX = finalX;
                _this.startY = finalY;
              } else {
                // 结束的点
                _this.endX = finalX;
                _this.endY = finalY;
              }
              _this.draw(_this.startDirection, _this.endDirection);
              _this.generateLineActiveCanvas();
            }
          }
        }
      } else {
        // 还没有拉断 // 拉出超过 10 个像素 就断开
        if (Math.abs(moveX) > 10 || Math.abs(moveY) > 10) {
          // 拉断了
          // 这个时候需要将图形上绑定的点去掉了
          // z-index也要变小
          shapes.forEach(i => {
            const index = i.lines.findIndex((i: ShapeLine) => i.id === _this.id && i.type === type);
            if (index > -1) i.lines.splice(index, 1);
          });
          if (type === 'start') {
            // 开始
            _this.startX = finalX;
            _this.startY = finalY;
          } else {
            // 结束的点
            _this.endX = finalX;
            _this.endY = finalY;
          }
          _this.draw(_this.startDirection, _this.endDirection);
          _this.generateLineActiveCanvas();
          requestAnimationFrame(() => {
            isBreak = true;
          });
        }
      }
    };

    window.onmouseup = function () {
      window.onmousemove = null;
      window.onmouseup = null;
      _this.enableActive();
      clearHitPoint();
      if (hit) {
        // 命中
        const shape = shapes.find(i => i.id === shapeId);
        if (shape) {
          shape.lines.push({
            id: _this.id,
            direction: type === 'start' ? _this.startDirection : _this.endDirection,
            type
          });
        }
      } else {
        _this.remove();
      }
    };
  };
};

// 清除所有的框选范围canvas
export function clearAllRangeCanvas () {
  const el = document.querySelector('#range-canvas');
  el && el.remove();
  selectedShapes.length = 0;
};
