import { getuuid } from '../helper';
import { appendItem, getItemWrapper, handleMove, handleStretch, drawEditLine, handleDrawLine, clickFindLine } from '../utils';
import { onClickOutside } from '@vueuse/core';
import type { ShapeLine } from '../types';
import { lines, shapes } from '../data';

export default class Shape {
  startX: number;
  startY: number;
  id: string;
  wrapper: HTMLElement;
  height: number;
  width: number;
  active = false;
  lines = [] as ShapeLine[];
  text = ''; // 文本信息

  get style () {
    return {
      height: this.height + 'px',
      width: this.width + 'px',
      background: 'transparent'
    };
  }

  get endX () {
    return this.startX + this.width;
  }

  get endY () {
    return this.startY + this.height;
  }

  get topPoints () {
    return [(this.startX + this.endX) / 2, this.startY];
  }

  get bottomPoints () {
    return [(this.endX + this.startX) / 2, this.endY];
  }

  get leftPoints () {
    return [this.startX, (this.endY + this.startY) / 2];
  }

  get rightPoints () {
    return [this.endX, (this.endY + this.startY) / 2];
  }

  constructor (startX: number, startY: number, width = 120, height = 60) {
    this.startX = startX;
    this.startY = startY;
    this.width = width;
    this.height = height;

    this.id = 'item-' + getuuid();

    const wrapper = getItemWrapper(this.id, this.width, this.height);
    this.wrapper = wrapper;
    Object.assign(wrapper.style, {
      ...this.style,
      left: this.startX + 'px',
      top: this.startY + 'px'
    });
    appendItem(wrapper);

    // 创建四个中点 划线用
    const middlePoints = ['top', 'bottom', 'left', 'right'];
    const anglePoints = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    middlePoints.forEach(i => {
      const div = document.createElement('div');
      div.classList.add(i);
      div.classList.add('line-point');
      wrapper.appendChild(div);
    });

    // 绘制图形
    this.draw();

    // 创建八个顶点 拉伸大小用
    [...middlePoints, ...anglePoints].forEach((i, index) => {
      const div = document.createElement('div');
      div.classList.add(i);
      div.classList.add(index < 4 ? 'line-point-1' : 'stretch-point');
      wrapper.appendChild(div);
    });

    // 创建一个新的canvas 画 编辑虚线用
    const cvs = document.createElement('canvas');
    cvs.height = (height + 20) * devicePixelRatio;
    cvs.width = (width + 20) * devicePixelRatio;
    Object.assign(cvs.style, {
      position: 'absolute',
      left: '-10px',
      top: '-10px'
    });
    cvs.id = `edit-${this.id}`;
    cvs.classList.add('edit-canvas');
    wrapper.appendChild(cvs);
    drawEditLine(cvs, this.width, this.height);

    // 创建可以编辑的div 编辑文本
    const text = document.createElement('div');
    text.classList.add('shape-text');
    text.contentEditable = 'true';
    this.wrapper.appendChild(text);

    // 鼠标按下事件
    wrapper.onmousedown = (e: any) => {
      e.stopPropagation();
      wrapper.style.zIndex = '9999';
      const el = e.target as HTMLElement;
      if (el.classList.contains('line-point') || el.classList.contains('line-point-1')) {
        el.classList.add('active');
        let startPoints: number[] = [];
        let startDirection = '';
        if (el.classList.contains('top')) {
          startPoints = this.topPoints; startDirection = 'top';
        }
        if (el.classList.contains('left')) {
          startPoints = this.leftPoints; startDirection = 'left';
        }
        if (el.classList.contains('right')) {
          startPoints = this.rightPoints; startDirection = 'right';
        }
        if (el.classList.contains('bottom')) {
          startPoints = this.bottomPoints; startDirection = 'bottom';
        }
        handleDrawLine(
          startPoints[0],
          startPoints[1],
          e.clientX,
          e.clientY,
          el,
          startDirection,
          wrapper,
          this.id
        );
      } else if (el.classList.contains('stretch-point')) {
        // 处理拉伸
        handleStretch(e.clientX, e.clientY, this, el.className, wrapper);
      } else {
        // 处理拖动之前先把所有的线的编辑状态取消
        this.lines.forEach(i => {
          const line = lines.find(l => l.id === i.id);
          line && line.disableActive();
        });
        // 处理拖动
        handleMove(e.clientX, e.clientY, this, wrapper);
      }
    };
    onClickOutside(wrapper, (e) => {
      // 取消选中状态
      clickFindLine(e);
      this.disableAcitve();
    });

    // 双击事件 编辑文本
    wrapper.ondblclick = () => {
      // 编辑文本
      const el = document.querySelector(`#${this.id} .shape-text`) as HTMLElement;
      if (!el) return false;

      // 将光标定位至最后一个
      const range = document.createRange();
      const sel = window.getSelection()!;
      range.setStart(el, el.childNodes.length);
      range.collapse(true);

      sel.removeAllRanges();
      sel.addRange(range);
      el.focus();
    };

    text.onblur = (e: any) => {
      const text = e.target.innerText;
      this.text = text;
    };
  }

  enableAcitve () {
    // 开启编辑模式
    this.active = true;
    const node = document.getElementById(this.id);
    node && node.classList.add('active');

    // 找到线
    const l = this.lines.filter(i => i.type === 'start');
    l.forEach(i => {
      const line = lines.find(l => l.id === i.id);
      line && line.enableScroll();
    });
  }

  disableAcitve () {
    // 关闭编辑模式
    this.active = false;
    const node = document.getElementById(this.id);
    node && node.classList.remove('active');

    const l = this.lines.filter(i => i.type === 'start');
    l.forEach(i => {
      const line = lines.find(l => l.id === i.id);
      line && line.disabledScroll();
    });
  }

  // ! 需要子类重写这个方法
  // ! 需要子类重写这个方法
  // ! 需要子类重写这个方
  draw () {}

  // 重新渲染 尺寸发生了变化
  resize () {
    this.wrapper.style.left = this.startX + 'px';
    this.wrapper.style.top = this.startY + 'px';
    Object.assign(this.wrapper.style, this.style);
    const cvs = document.querySelector(`#${this.id} canvas`)! as HTMLCanvasElement;
    cvs.height = this.height + 20;
    cvs.width = this.width + 20;
    this.draw();
    this.resetEditLine();
  }

  resetEditLine () {
    const cvs = document.getElementById(`edit-${this.id}`)! as HTMLCanvasElement;
    console.log(this.height, this.width);
    cvs.height = (this.height + 20);
    cvs.width = (this.width + 20);
    drawEditLine(cvs, this.width, this.height);
  }

  // 删除
  remove () {
    const w = document.querySelector('#canvas-engine');
    w && w.removeChild(this.wrapper);
    // 先将自己删除
    const index = shapes.findIndex(i => i.id === this.id);
    shapes.splice(index, 1);
    // 删除所有连接的线
    this.lines.forEach(i => {
      const line = lines.find(l => l.id === i.id);
      line && line.remove();
    });
  }
}
