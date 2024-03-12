<template>
  <div class="stadio-wrapper">
    <div id="canvas-engine">
      <canvas :class="{ addMode }" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, onUnmounted } from 'vue';
import Tool from '../items/tool';
import { shapes, lines, selectedShapes } from '../data';
import { clearAllRangeCanvas, clickFindLine, closestPointOnLineSegment, getShape, shortestDistanceToLineSegment } from '../utils';
export default defineComponent({
  setup () {
    onMounted(() => {
      const el = document.querySelector('#canvas-engine canvas') as HTMLCanvasElement;
      // const ctx = el?.getContext('2d')!;
      el.width = 1600 * devicePixelRatio;
      el.height = 1000 * devicePixelRatio;

      el.onmousedown = function (e: any) {
        clearAllRangeCanvas();
        const shape = getShape(e.offsetX, e.offsetY);
        const bouding = el.getBoundingClientRect();

        // 判断是不是moved
        let isMoved = false;

        if (shape) {
        } else {
          // 框选
          const startX = e.offsetX;
          const startY = e.offsetY;
          const tool = new Tool(startX, startY);
          window.onmousemove = function (e: MouseEvent) {
            isMoved = true;
            tool.endX = e.clientX - bouding.left;
            tool.endY = e.clientY - bouding.top;
            requestAnimationFrame(() => {
              tool.draw();
            });
          };
          window.onmouseup = function () {
            if (isMoved) {
              tool.getShapes();
            } else {
              // 没有拖拽过，那我认为是点击
              clickFindLine(e);
            }
            tool.remove();
            window.onmousemove = null;
            window.onmouseup = null;
          };
        }
      };
    });
    // 全局绑定delete事件
    window.onkeydown = function (e: KeyboardEvent) {
      if (e.keyCode === 46) {
        // 删除图形 单选的情况
        {
          const index = shapes.findIndex(i => i.active);
          if (index > -1) {
            const shape = shapes[index];
            shape.remove();
          }
        }

        {
          // 删除线
          const index = lines.findIndex(i => i.active);
          if (index > -1) {
            const line = lines[index];
            line.remove();
          }
        }
        selectedShapes.forEach(i => {
          const index = shapes.findIndex(s => s.id === i);
          const shape = shapes[index];
          shape.remove();
        });
        clearAllRangeCanvas();
      }
    };

    window.ondblclick = function (e: MouseEvent) {
      const el = document.querySelector('#canvas-engine canvas') as HTMLCanvasElement;
      const bouding = el.getBoundingClientRect();
      // 遍历所有的线
      const pointerX = e.clientX - bouding.left;
      const pointerY = e.clientY - bouding.top;
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const points = line.points;

        for (let index = 1; index < points.length; index++) {
          const p1 = points[index];
          const p2 = points[index - 1];
          const x1 = p1[0];
          const y1 = p1[1];
          const x2 = p2[0];
          const y2 = p2[1];
          const dis = shortestDistanceToLineSegment(pointerX, pointerY, x1, y1, x2, y2);
          if (dis <= 3) {
          // 找到那个点
            const { x, y } = closestPointOnLineSegment(pointerX, pointerY, x1, y1, x2, y2);
            line.generateText(x, y);
          }
        };
      }
    };

    onUnmounted(() => {
      window.onkeydown = null;
      window.onclick = null;
    });
    return {
    };
  }
});
</script>

<style lang="less" scoped>
@import url('../style/index.less');
</style>
