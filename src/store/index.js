import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';
import LZString from 'lz-string';

Vue.use(Vuex);
const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
});

export default new Vuex.Store({

  state: {
    modalState: {
      newAscii: false,
      editAscii: false,
      pasteModal: false,
    },
    // The various options of ASCIIBIRD will eventually
    // end up in its own modal I guess
    options: {
      canvasRedrawSpeed: 2,
      defaultBg: 1,
      defaultFg: 0,
    },
    // Current tab user is viewing
    tab: 0,
    // asciibirdMeta holds all of the ASCII information for all the tabs
    asciibirdMeta: [],
    toolbarState: {
      currentColourFg: 0,
      currentColourBg: 1,
      isChoosingFg: false,
      isChoosingBg: false,
      isChoosingChar: false,
      brushSizeWidth: 1,
      brushSizeHeight: 1,
      // square, circle, cross
      brushSizeType: 'square',
      selectedFg: 0,
      selectedBg: 1,
      selectedChar: ' ',
      isUpdating: false,
      currentTool: 0,
      targetingFg: true,
      targetingBg: true,
      targetingChar: true,
      mirrorX: false,
      mirrorY: false,
      x: 8 * 2,
      y: 13 * 2,
      h: 13 * 39,
      w: 8 * 25,
    },
    debugPanelState: {
      x: 936,
      y: 39,
      h: 260,
      w: 320,
      visible: false,
    },
    blockSizeMultiplier: 1,
    brushBlocks: [],
    selectBlocks: [],
    libraryBlocks: [],
  },
  mutations: {
    changeState(state, payload) {
      Object.assign(state, payload);
    },
    changeTab(state, payload) {
      state.tab = payload;
    },
    changeDebugPanelState(state, payload) {
      state.debugPanelState = payload;
    },
    toggleDebugPanel(state, payload) {
      state.debugPanelState.visible = payload;
    },
    changeToolBarState(state, payload) {
      state.toolbarState.x = payload.x;
      state.toolbarState.y = payload.y;
      state.toolbarState.w = payload.w;
      state.toolbarState.h = payload.h;
    },
    changeAsciiWidthHeight(state, payload) {
      state.asciibirdMeta[state.tab].width = payload.width;
      state.asciibirdMeta[state.tab].height = payload.height;
    },
    changeAsciiCanvasState(state, payload) {
      state.asciibirdMeta[state.tab].x = payload.x;
      state.asciibirdMeta[state.tab].y = payload.y;
    },
    changeColourFg(state, payload) {
      state.toolbarState.currentColourFg = payload;
      state.toolbarState.isUpdating = false;
      state.toolbarState.isChoosingFg = false;
    },
    changeColourBg(state, payload) {
      state.toolbarState.currentColourBg = payload;
      state.toolbarState.isUpdating = false;
      state.toolbarState.isChoosingBg = false;
    },
    changeChar(state, payload) {
      state.toolbarState.selectedChar = payload;
      state.toolbarState.isUpdating = false;
      state.toolbarState.isChoosingChar = false;
    },
    changeTool(state, payload) {
      state.toolbarState.currentTool = payload;
    },
    changeIsUpdatingFg(state, payload) {
      state.toolbarState.isChoosingFg = payload;
    },
    changeIsUpdatingBg(state, payload) {
      state.toolbarState.isChoosingBg = payload;
    },
    changeIsUpdatingChar(state, payload) {
      state.toolbarState.isChoosingChar = payload;
    },
    changeTargetingFg(state, payload) {
      state.toolbarState.targetingFg = payload;
    },
    changeTargetingBg(state, payload) {
      state.toolbarState.targetingBg = payload;
    },
    changeTargetingChar(state, payload) {
      state.toolbarState.targetingChar = payload;
    },
    newAsciibirdMeta(state, payload) {
      state.asciibirdMeta.push(payload);
      state.tab = state.asciibirdMeta.length - 1;
    },
    updateToolBarState(state, payload) {
      state.toolbarState = payload;
    },
    updateMirror(state, payload) {
      state.toolbarState.mirrorX = payload.x;
      state.toolbarState.mirrorY = payload.y;
    },
    updateAsciiBlocks(state, payload, skipUndo = false) {
      if (!skipUndo) {
        state.asciibirdMeta[state.tab].history.push(state.asciibirdMeta[state.tab].blocks);
      }

      state.asciibirdMeta[state.tab].blocks = LZString.compressToUTF16(JSON.stringify(payload));
      state.asciibirdMeta[state.tab].redo = [];
    },
    updateAscii(state, payload) {
      state.asciibirdMeta[state.tab] = payload;
    },
    undoBlocks(state) {
      if (state.asciibirdMeta[state.tab].history.length > 1) {
        state.asciibirdMeta[state.tab].redo.push(state.asciibirdMeta[state.tab].blocks);
        state.asciibirdMeta[state.tab].blocks = state.asciibirdMeta[state.tab].history.pop();
      }
    },
    redoBlocks(state) {
      if (state.asciibirdMeta[state.tab].redo.length) {
        const next = state.asciibirdMeta[state.tab].redo.pop();
        state.asciibirdMeta[state.tab].blocks = next;
        state.asciibirdMeta[state.tab].history.push(next);
      }
    },
    updateBrushSize(state, payload) {
      state.toolbarState.brushSizeHeight = payload.brushSizeHeight;
      state.toolbarState.brushSizeWidth = payload.brushSizeWidth;
      state.toolbarState.brushSizeType = payload.brushSizeType;
    },
    brushBlocks(state, payload) {
      state.brushBlocks = LZString.compressToUTF16(JSON.stringify(payload));
    },
    selectBlocks(state, payload) {
      state.selectBlocks = LZString.compressToUTF16(JSON.stringify(payload));
    },
    openModal(state, type) {
      switch (type) {
        case 'new-ascii':
          state.modalState.newAscii = !state.modalState.newAscii;
          break;

        case 'edit-ascii':
          state.modalState.editAscii = !state.modalState.editAscii;
          break;

        case 'paste-modal':
          state.modalState.pasteModal = !state.modalState.pasteModal;
          break;
      }
    },
  },
  getters: {
    state: (state) => state,
    modalState: (state) => state.modalState,
    options: (state) => state.options,
    toolbarState: (state) => state.toolbarState,
    debugPanel: (state) => state.debugPanelState,
    currentTool: (state) => state.toolbarState.currentTool,
    isTargettingBg: (state) => state.toolbarState.targetingBg,
    isTargettingFg: (state) => state.toolbarState.targetingFg,
    isTargettingChar: (state) => state.toolbarState.targetingChar,
    currentFg: (state) => state.toolbarState.currentColourFg,
    currentBg: (state) => state.toolbarState.currentColourBg,
    getChar: (state) => state.toolbarState.selectedChar,
    currentTab: (state) => state.tab,
    currentAscii: (state) => state.asciibirdMeta[state.tab] ?? false,
    currentAsciiBlocks: (state) => JSON.parse(LZString.decompressFromUTF16(state.asciibirdMeta[state.tab]
      .blocks)) || [],
    asciibirdMeta: (state) => state.asciibirdMeta,
    nextTabValue: (state) => state.asciibirdMeta.length,
    brushSizeHeight: (state) => state.toolbarState.brushSizeHeight,
    brushSizeWidth: (state) => state.toolbarState.brushSizeWidth,
    brushSizeType: (state) => state.toolbarState.brushSizeType,
    blockSizeMultiplier: (state) => state.blockSizeMultiplier,
    brushBlocks: (state) => JSON.parse(LZString.decompressFromUTF16(state.brushBlocks)) || [],
    selectBlocks: (state) => JSON.parse(LZString.decompressFromUTF16(state.selectBlocks)) || [],
  },
  actions: {},
  modules: {},
  plugins: [vuexLocal.plugin],
});
