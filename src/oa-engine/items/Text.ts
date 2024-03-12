import { getuuid } from '../helper';
import Line from './Line';
import { closestPointOnLineSegment, findClosestPoint, getpointsDistanceRatio, shortestDistanceToLineSegment } from '../utils';

class Text {
  startX: number;
  startY: number;
  position: number; // 范围为0 - 1，值为点到起点的距离占总线段长度的比例
  id: string;
  value = '';
  line: Line | undefined;
  height = 20;
  width = 50;
  el: HTMLElement;
  offsetX = 0; // 相对线偏离的距离， 跟坐标无关w
  offsetY = 0;

  constructor (startX: number, startY: number, line: Line) {
    this.startX = startX;
    this.startY = startY;
    this.line = line;

    const x = startX - 25;
    const y = startY - 10;
    const text = document.createElement('div');
    this.el = text;
    text.classList.add('line-text');
    text.id = `line-texr-${getuuid()}`;
    this.id = text.id;
    text.style.left = x + 'px';
    text.style.top = y + 'px';
    text.contentEditable = 'true';

    // line.el.appendChild(text);
    const wrapper = document.querySelector('#canvas-engine')!;
    wrapper.appendChild(text);
    text.focus();
    const position = getpointsDistanceRatio(startX, startY, line.points, line.long);
    this.position = position;

    text.oninput = (e: any) => {
      requestAnimationFrame(() => {
        const height = e.target.clientHeight;
        const width = e.target.clientWidth;
        const x = this.startX - width / 2;
        const y = this.startY - height / 2;
        text.style.left = x + this.offsetX + 'px';
        text.style.top = y + this.offsetY + 'px';

        this.value = e.target.innerText.trim();
        this.height = height;
        this.width = width;
      });
    };

    // 失去焦点时并且内容为空 删除
    text.onblur = (e: any) => {
      const el = e.target as HTMLElement;
      el.setAttribute('contenteditable', 'false');
      if (el.innerText.trim() === '') {
        const wrapper = document.querySelector('#canvas-engine')!;
        wrapper.removeChild(text);
        const index = line.texts.findIndex(item => item.id === text.id);
        if (index > -1) {
          line.texts.splice(index, 1);
        }
      }
    };

    text.onmousedown = (e: MouseEvent) => {
      e.stopPropagation();
      document.body.style.cursor = 'move';
      text.classList.add('moving');
      const clientX = e.clientX;
      const clientY = e.clientY;
      const startX = this.startX;
      const startY = this.startY;
      window.onmousemove = (e: MouseEvent) => {
        const moveX = e.clientX - clientX;
        const moveY = e.clientY - clientY;

        const endX = startX + moveX;
        const endY = startY + moveY;

        let minDis = Infinity;
        let targetX = 0;
        let targetY = 0;

        if (this.line) {
          for (let index = 1; index < this.line.points.length; index++) {
            const [x1, y1] = this.line.points[index - 1];
            const [x2, y2] = this.line.points[index];
            const dis = shortestDistanceToLineSegment(endX, endY, x1, y1, x2, y2);
            if (dis < minDis) {
              minDis = dis;
              const { x, y } = closestPointOnLineSegment(endX, endY, x1, y1, x2, y2);
              targetX = x;
              targetY = y;
              if (x1 === x2) {
                // 竖线
                if (minDis > this.width / 2) {
                  if (endX > x1) {
                    this.offsetX = this.width / 2 + 5;
                  } else {
                    this.offsetX = -this.width / 2 - 7;
                  }
                } else {
                  this.offsetX = 0;
                }
              } else {
                this.offsetX = 0;
              }
              if (y1 === y2) {
                // 横线
                if (minDis > this.height / 2) {
                  if (endY > y1) {
                    this.offsetY = this.height / 2 + 5;
                  } else {
                    this.offsetY = -this.height / 2 - 7;
                  }
                } else {
                  this.offsetY = 0;
                }
              } else {
                this.offsetY = 0;
              }
            }
          }
          this.startX = targetX;
          this.startY = targetY;
          this.position = getpointsDistanceRatio(targetX, targetY, this.line.points, this.line.long);
          this.el.style.left = this.startX - this.width / 2 + this.offsetX + 'px';
          this.el.style.top = this.startY - this.height / 2 + this.offsetY + 'px';
        } else {
          // 自由移动,
        }
      };
      window.onmouseup = function () {
        document.body.style.cursor = 'default';
        text.classList.remove('moving');
        window.onmousemove = null;
        window.onmouseup = null;
      };
    };

    text.ondblclick = function (e) {
      e.stopPropagation();
      const el = e.target as HTMLElement;
      el.setAttribute('contenteditable', 'true');
      el.focus();
    };
  }

  // 随着线的拖动 依据 position 重新找到定位点
  resize () {
    if (!this.line) return;
    const dis = this.line.long * this.position;
    const points = [] as number[];
    if (this.position === 1) {
      const [x, y] = this.line.points[this.line.points.length - 1];
      this.startX = x;
      this.startY = y;
      const left = x - this.width / 2 + this.offsetX;
      const top = y - this.height / 2 + this.offsetY;
      this.el.style.left = left + 'px';
      this.el.style.top = top + 'px';
      return false;
    }

    let currentDis = 0;
    for (let index = 1; index < this.line.points.length; index++) {
      const start = this.line.points[index - 1];
      const end = this.line.points[index];
      const [startX, startY] = start;
      const [endX, endY] = end;
      const d = Math.abs(endX - startX) + Math.abs(endY - startY);
      if (dis > currentDis && dis < currentDis + d) {
        // 说明就在这个线上

        const cor = dis - currentDis;
        if (startX === endX) {
          // 竖线
          const y = endY > startY ? startY + cor : startY - cor;
          points.push(startX, y);
        } else {
          // 横线
          const x = endX > startX ? startX + cor : startX - cor;
          points.push(x, startY);
        }
        break;
      } else {
        currentDis += d;
      }
    }

    // 重置位置
    const [x, y] = points;
    this.startX = x;
    this.startY = y;
    const left = x - this.width / 2 + this.offsetX;
    const top = y - this.height / 2 + this.offsetY;
    this.el.style.left = left + 'px';
    this.el.style.top = top + 'px';
  }
};

export default Text;
