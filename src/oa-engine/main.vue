<template>
  <div class="oa-engine-main">
    <Menu />
    <Canvas />
    <Config />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Menu from './menu/index.vue';
import Canvas from './canvas/index.vue';
import Config from './config/index.vue';
export default defineComponent({
  components: { Menu, Canvas, Config },
  setup () {}
});
</script>

<style lang="less" scoped>
.oa-engine-main {
  height: 100%;
  display: flex;
  width: 100%;
  justify-content: space-between;
}
</style>
