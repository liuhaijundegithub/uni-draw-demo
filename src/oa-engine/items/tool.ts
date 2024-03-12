import { lines, selectedShapes, shapes } from '../data';
import { drawEditLine } from '../utils';
import Shape from './Shape';
import type { ShapeLine } from '../types';

export default class Tool {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  ctx: CanvasRenderingContext2D;
  el: HTMLCanvasElement;

  get minX () {
    return Math.min(this.startX, this.endX);
  }

  get maxX () {
    return Math.max(this.startX, this.endX);
  }

  get minY () {
    return Math.min(this.startY, this.endY);
  }

  get maxY () {
    return Math.max(this.startY, this.endY);
  }

  constructor (startX: number, startY: number) {
    const canvas = document.createElement('canvas');
    canvas.height = 1000;
    canvas.width = 1600;
    canvas.id = 'tool-canvas';
    const ctx = canvas.getContext('2d')!;
    this.ctx = ctx;
    this.el = canvas;
    this.startX = startX;
    this.startY = startY;
    this.endX = startX;
    this.endY = startY;
    const w = document.querySelector('#canvas-engine');
    w && w.appendChild(canvas);
  }

  // 绘制范围
  drawRange (shapes: Shape[]) {
    const canvas = document.createElement('canvas');
    canvas.id = 'range-canvas';

    const startXs = shapes.map(i => i.startX);
    const startYs = shapes.map(i => i.startY);
    const endXs = shapes.map(i => i.endX);
    const endYs = shapes.map(i => i.endY);
    let startX = Math.min(...startXs);
    let startY = Math.min(...startYs);
    const endX = Math.max(...endXs);
    const endY = Math.max(...endYs);

    canvas.width = endX - startX + 20;
    canvas.height = endY - startY + 20;

    const left = startX - 10;
    const top = startY - 10;

    canvas.style.left = left + 'px';
    canvas.style.top = top + 'px';

    const w = document.querySelector('#canvas-engine');
    w && w.appendChild(canvas);
    drawEditLine(canvas, canvas.width - 20, canvas.height - 20);

    // 可以拖拽移动位置
    canvas.onmousedown = (e: MouseEvent) => {
      const clientX = e.clientX;
      const clientY = e.clientY;
      const originStartX = startX;
      const originStartY = startY;

      const originShapePositions = shapes.map(i => ({ startX: i.startX, startY: i.startY, endX: i.endX, endY: i.endY }));
      window.onmousemove = (e: MouseEvent) => {
        function moveHandle() {
          const moveX = e.clientX - clientX;
          const moveY = e.clientY - clientY;

          const newStartX = originStartX + moveX;
          const newStartY = originStartY + moveY;
          startX = newStartX;
          startY = newStartY;

          canvas.style.left = newStartX - 10 + 'px';
          canvas.style.top = newStartY - 10 + 'px';

          // 将图形也动起来
          for (let index = 0; index < shapes.length; index++) {
            const s = shapes[index] as any;
            s.startX = originShapePositions[index].startX + moveX;
            s.startY = originShapePositions[index].startY + moveY;
            s.resize();
            s.lines.forEach((i: ShapeLine) => {
              const line = lines.find(l => l.id === i.id);
              if (!line) return false;
              if (i.type === 'start') {
                line.startX = s[`${line.startDirection}Points`][0];
                line.startY = s[`${line.startDirection}Points`][1];
              } else {
                line.endX = s[`${line.endDirection}Points`][0];
                line.endY = s[`${line.endDirection}Points`][1];
              }
              line && line.draw(line.startDirection, line.endDirection);
            });
          }
        }
        requestAnimationFrame(() => {
          moveHandle();
        });
      };

      window.onmouseup = () => {
        window.onmousemove = null;
        window.onmouseup = null;
      };
    };
  };

  getShapes () {
    const arr: Shape[] = [];
    shapes.forEach(i => {
      const { startX, startY, endX, endY } = i;
      if (
        startX >= this.minX && startY >= this.minY &&
        endX <= this.maxX && endY <= this.maxY
      ) {
        arr.push(i);
      }
    });

    // 如果只选中了一个
    // 将那一个选中就行
    if (arr.length === 0) return false;
    else if (arr.length === 1) {
      arr[0].enableAcitve();
    } else {
      // 选中多个
      // 开始绘制范围框
      this.drawRange(arr);
      selectedShapes.push(...arr.map(i => i.id));
    }
    return true;
  };

  draw () {
    const ctx = this.ctx;
    this.el.style.zIndex = '3';
    ctx.clearRect(0, 0, 1600, 1000);
    ctx.beginPath();
    ctx.moveTo(this.minX * devicePixelRatio, this.minY * devicePixelRatio);
    ctx.lineTo(this.maxX * devicePixelRatio, this.minY * devicePixelRatio);
    ctx.lineTo(this.maxX * devicePixelRatio, this.maxY * devicePixelRatio);
    ctx.lineTo(this.minX * devicePixelRatio, this.maxY * devicePixelRatio);
    ctx.lineTo(this.minX * devicePixelRatio, this.minY * devicePixelRatio);
    ctx.fillStyle = 'rgba(6, 123, 239, .1)';
    ctx.fill();
    ctx.strokeStyle = 'rgb(6, 123, 239)';
    ctx.lineWidth = 2 * devicePixelRatio;
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  remove () {
    const w = document.querySelector('#canvas-engine');
    const el = document.querySelector('#tool-canvas');
    el && w && w.removeChild(el);
  }
}
