import { getuuid } from '../helper';
import { bindChangeLineEvent, drawLineCanvas, generateLinePoints, getLineLong, getpointsDistanceRatio, removeOverLapPoints } from '../utils';
import { lines, shapes } from '../data';
import Text from './Text';

class Line {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  cvs: HTMLCanvasElement;
  el: HTMLElement;
  minX = 0;
  minY = 0;
  startDirection = '';
  endDirection = '';
  id = '';
  points = [] as number[][];
  active = false;
  texts = [] as Text[];
  long = 0; // 线长，用于计算文本位置

  get height () {
    return Math.abs(this.endY - this.startY);
  }

  get width () {
    return Math.abs(this.endX - this.startX);
  }

  constructor (startX: number, startY: number, endX: number, endY: number) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;

    const div = document.createElement('div');
    div.classList.add('line-wrapper');
    const cvs = document.createElement('canvas');
    this.cvs = cvs;
    div.appendChild(cvs);
    this.el = div;

    Object.assign(div.style, {
      position: 'absolute',
      left: this.minX - 10 + 'px',
      top: this.minY - 10 + 'px',
      height: this.height < 20 ? 20 : this.height + 'px',
      width: this.width < 20 ? 20 : this.width + 'px',
      // border: '1px solid red',
      zIndex: 1
    });

    Object.assign(this.cvs.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      zIndex: 2
    });

    this.id = `line-${getuuid()}`;
    div.id = this.id;

    const w = document.querySelector('#canvas-engine');
    w && w.appendChild(div);
  }

  draw (startDirection: string, endDirection: string) {
    const s1: number[] = [];
    const s2: number[] = [];
    const e2: number[] = [];
    const e1: number[] = [];
    // 第一个点
    e1.push(this.endX, this.endY);
    // 最后一个点
    s1.push(this.startX, this.startY);
    // 第二个点
    if (startDirection === 'top') s2.push(s1[0], s1[1] - 40);
    if (startDirection === 'bottom') s2.push(s1[0], s1[1] + 40);
    if (startDirection === 'left') s2.push(s1[0] - 40, s1[1]);
    if (startDirection === 'right') s2.push(s1[0] + 40, s1[1]);

    // 倒数第二个点
    if (endDirection === 'top') e2.push(e1[0], e1[1] - 40);
    if (endDirection === 'bottom') e2.push(e1[0], e1[1] + 40);
    if (endDirection === 'left') e2.push(e1[0] - 40, e1[1]);
    if (endDirection === 'right') e2.push(e1[0] + 40, e1[1]);

    drawLineCanvas([s1, s2, e2, e1], this);

    this.renderLine(s1, s2, e2, e1, startDirection, endDirection);

    // 更新文本的位置
    for (const text of this.texts) {
      text.resize();
    }
  }

  renderLine (
    s1: number[],
    s2: number[],
    e2: number[],
    e1: number[],
    startDirection: string,
    endDirection: string
  ) {
    const ctx = this.cvs.getContext('2d')!;
    const ps = generateLinePoints(s1, s2, e2, e1, startDirection, endDirection);
    const points = removeOverLapPoints(ps);
    this.points = points;
    this.long = getLineLong(points);
    ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
    ctx.beginPath();
    points.forEach((i, index) => {
      const x = i[0] - this.minX + 10;
      const y = i[1] - this.minY + 10;
      if (index === 0) {
        ctx.moveTo(x, y);
      }
      ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // 画一个箭头
    ctx.save();
    ctx.beginPath();
    const arrowPoints = [e1[0] - this.minX + 10, e1[1] - this.minY + 10];
    ctx.moveTo(arrowPoints[0], arrowPoints[1]);
    const height = 15;
    const width = 10;
    if (endDirection === 'top') {
      ctx.lineTo(arrowPoints[0] - (width / 2), arrowPoints[1] - height);
      ctx.lineTo(arrowPoints[0] + (width / 2), arrowPoints[1] - height);
    } else if (endDirection === 'bottom') {
      ctx.lineTo(arrowPoints[0] - (width / 2), arrowPoints[1] + height);
      ctx.lineTo(arrowPoints[0] + (width / 2), arrowPoints[1] + height);
    } else if (endDirection === 'left') {
      ctx.lineTo(arrowPoints[0] - height, arrowPoints[1] + (width / 2));
      ctx.lineTo(arrowPoints[0] - height, arrowPoints[1] - (width / 2));
    } else if (endDirection === 'right') {
      ctx.lineTo(arrowPoints[0] + height, arrowPoints[1] + (width / 2));
      ctx.lineTo(arrowPoints[0] + height, arrowPoints[1] - (width / 2));
    }
    ctx.lineTo(arrowPoints[0], arrowPoints[1]);
    ctx.fillStyle = '#000';
    ctx.fill();
  }

  remove () {
    const w = document.querySelector('#canvas-engine');
    w && w.removeChild(this.el);

    const index = lines.findIndex(i => i.id === this.id);
    index > -1 && lines.splice(index, 1);

    // 将图形中所关联的线都删除掉
    shapes.forEach(i => {
      const index = i.lines.findIndex((l: any) => l.id === this.id);
      if (index > -1) {
        i.lines.splice(index, 1);
      }
    });
  }

  interval = null as NodeJS.Timer | null;
  // 绘制滑动的小球
  enableScroll () {
    const cvs = document.createElement('canvas');
    cvs.height = this.cvs.height;
    cvs.width = this.cvs.width;
    cvs.classList.add('scroll-ball');
    this.el.appendChild(cvs);
    cvs.style.position = 'absolute';
    cvs.style.zIndex = '3';

    const ctx = cvs.getContext('2d')!;

    let offset = 0;
    const loop = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.beginPath();
      ctx.setLineDash([4, 120]);
      ctx.strokeStyle = 'rgb(219, 94, 94)';
      ctx.lineWidth = 4;
      ctx.lineDashOffset = -offset;
      this.points.forEach((i, index) => {
        const x = i[0] - this.minX + 10;
        const y = i[1] - this.minY + 10;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      offset = (offset + 2);
    };
    this.interval = setInterval(loop, 20);
  }

  // 取消
  disabledScroll () {
    const el = document.querySelector(`#${this.id} .scroll-ball`);
    el && this.el.removeChild(el);
    this.interval && clearInterval(this.interval);
    this.interval = null;
  }

  generateLineActiveCanvas () {
    const cvs = this.el.querySelector('.line-active') as HTMLCanvasElement || document.createElement('canvas');
    cvs.height = this.cvs.height;
    cvs.width = this.cvs.width;
    cvs.classList.add('line-active');
    this.el.appendChild(cvs);
    cvs.style.position = 'absolute';
    cvs.style.zIndex = '1';
    const ctx = cvs.getContext('2d')!;

    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.beginPath();
    ctx.strokeStyle = 'rgb(200, 225, 251)';
    ctx.lineWidth = 4;
    this.points.forEach((i, index) => {
      const x = i[0] - this.minX + 10;
      const y = i[1] - this.minY + 10;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 改变两个顶点的位置
    const points = this.el.querySelectorAll('.line-point');
    points.forEach((i: any) => {
      if (i.classList.contains('start')) {
        // 开始点
        const [x, y] = this.points[0];
        i.style.left = x - this.minX + 10 + 'px';
        i.style.top = y - this.minY + 10 + 'px';
      }
      if (i.classList.contains('end')) {
        // 结束点
        const [x, y] = this.points[this.points.length - 1];
        i.style.left = x - this.minX + 10 + 'px';
        i.style.top = y - this.minY + 10 + 'px';
      }
    });
  }

  // 启用编辑状态
  enableActive () {
    if (this.active) return;
    this.active = true;
    this.el.classList.add('active');
    this.el.style.zIndex = '3';
    this.generateLineActiveCanvas();

    // 首尾添加两个点 用来改变线的起点终点
    [this.points[0], this.points[this.points.length - 1]].forEach((i, index) => {
      const [x, y] = i;
      const el = document.createElement('div');
      el.classList.add('line-point');
      el.classList.add(index === 0 ? 'start' : 'end');
      this.el.appendChild(el);
      el.style.left = x - this.minX + 10 + 'px';
      el.style.top = y - this.minY + 10 + 'px';

      bindChangeLineEvent(
        el,
        index === 0 ? 'start' : 'end',
        this,
        x,
        y
      );
    });
  }

  disableActive () {
    const el = document.querySelector(`#${this.id} .line-active`);
    this.el.style.zIndex = '1';
    el && this.el.removeChild(el);
    const pointEls = this.el.querySelectorAll('.line-point');
    pointEls.forEach(i => {
      this.el.removeChild(i);
    });
    this.active = false;
    this.el.classList.remove('active');
  }

  // 生成文本
  generateText (startX: number, startY: number) {
    const text = new Text(startX, startY, this);
    this.texts.push(text);
  }
};

export default Line;
