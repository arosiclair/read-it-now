<template>
  <div id="app">
    <div class="content py-md-4">
      <div class="container padded-content">
        <TransitionedRouter />
      </div>
    </div>
    <DebugLayer v-if="isDebug" />
    <UserSettings />
  </div>
</template>

<script>
// global styling
import './styles/inputs.css'
import './styles/text.css'
import './styles/layout.css'
import './styles/misc.css'
import 'animate.css'

import TransitionedRouter from './components/TransitionedRouter.vue'
import DebugLayer from './components/debug/DebugLayer.vue'
import UserSettings from './components/UserSettings.vue'
import { isDebug } from './modules/utilities'

export default {
  name: 'App',
  components: {
    TransitionedRouter,
    DebugLayer,
    UserSettings
  },
  data () {
    return {
      isDebug: isDebug()
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');

html, body {
  height: 100%;
}

body {
  background-color: #f5f5f5;
  color: #212121;
  font-family: 'Poppins', sans-serif;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  overflow: hidden;
  position: relative;

  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  overflow: auto;
}
.content::-webkit-scrollbar-track
{
  background-color: transparent;
}

.content::-webkit-scrollbar
{
  width: 6px;
  background-color: transparent;
}

.content::-webkit-scrollbar-thumb
{
  border-radius: 10px;
  background-color: #c5c5c5;
}

.padded-content {
  text-align: center;
  max-width: 750px;
  height: 100%;
}
</style>
