<template>
  <div class="oa-engine-menu">
    <!-- <div class="flex-center" @mousedown="itemMouseDown">矩形</div> -->
    <div
      v-for="prop in menu"
      :key="prop.name"
      @mousedown="e => itemMouseDown(e, prop)"
      class="flex-center"
    >
      {{ prop.name }}
    </div>
  </div>
</template>

<script lang="ts">

/** eslint-disable-next-line @typescript-eslint/no-non-null-assertion **/

import { defineComponent } from 'vue';
import menu from './const';
import { OaEngineMenu } from '../types';
import { checkConIsInsideCanvas } from '../utils';
import { shapes } from '../data';

export default defineComponent({
  setup () {
    const itemMouseDown = (e: MouseEvent, prop: OaEngineMenu) => {
      const canvasBouding = document.getElementById('canvas-engine')?.getBoundingClientRect()!;
      const ghost = document.createElement('div');
      ghost.classList.add('flex-center');
      // ghost.innerText = prop.name;
      document.body.appendChild(ghost);

      window.onmousemove = (moveE: MouseEvent) => {
        Object.assign(ghost.style, {
          position: 'absolute',
          top: (moveE.clientY - prop.height / 2) + 'px',
          left: (moveE.clientX - prop.width / 2) + 'px',
          height: prop.height + 'px',
          width: prop.width + 'px',
          border: '1px solid #000',
          background: '#fff',
          borderRadius: '2px'
        });
      };
      window.onmouseup = (e: MouseEvent) => {
        window.onmousemove = null;
        window.onmouseup = null;
        document.body.removeChild(ghost);
        if (checkConIsInsideCanvas(e.x, e.y, canvasBouding)) {
          // 创建图形
          const x = e.x - canvasBouding.left - prop.width / 2;
          const y = e.y - canvasBouding.top - prop.height / 2;
          const shape = new prop.constructor(x, y, prop.width, prop.height);
          shapes.push(shape);
        }
      };
    };
    return {
      itemMouseDown,
      menu
    };
  }
});
</script>

<style lang="less" scoped>
.oa-engine-menu {
  width: 80px;
  border-right: 1px solid var(--border-color);
  background: #fff;
  height: 100%;
  padding: 10px;
  > div {
    border: 1px solid var(--border-color);
    cursor: move;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
