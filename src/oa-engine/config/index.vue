<template>
  <div class="engine-config-wrapper">
    <h1>Config</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  setup () {}
});
</script>

<style lang="less" scoped>
@border-color: red;
.engine-config-wrapper {
  width: 300px;
  height: 100%;
  border-left: 1px solid @border-color;
  background: #fff;
  padding: 20px;
}
</style>
