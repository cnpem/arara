// @ts-nocheck
import { create } from 'zustand';

type ViewerStore = {

  isLogged: boolean;
  setIsLogged: (b: bool) => void;

  username: string;
  setUsername: (val: string) => void;

  password: string;
  setPassword: (val: string) => void;

  loginIsHappening: boolean;
  setLoginIsHappening: (b: bool) => void;

  proposals: list;
  setProposals: (val: list) => void;

  firstImagePath: string;
  setFirstImagePath: (val: string) => void;

  inputValue: string;
  setInputValue: (val: string) => void;

  index: number;
  setIndex: (i: number) => void;

  threshold: number;
  setThreshold: (t: number) => void;

  mainThreshold: number;
  setMainThreshold: (t: number) => void;

  lambda: number;
  setLambda: (l: number) => void;

  detectorDistance: number;
  setDetectorDistance: (d: number) => void;

  numberOfImages: number;
  setNumberOfImages: (n: number) => void;

  rows: number;
  cols: number;
  setRows: (r: number) => void;
  setCols: (c: number) => void;

  beamCenterX: number;
  beamCenterY: number;
  setBeamCenterX: (x: number) => void;
  setBeamCenterY: (y: number) => void;

  pixelSizeMm: number;
  setPixelSizeMm: (p: number) => void;

  resolutionValues: number[];
  setResolutionValues: (vals: number[]) => void;

  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  spaceGroup: number;
  setLatticeParams: (params: { a: number; b: number; c: number; alpha: number; beta: number; gamma: number, spaceGroup: number }) => void;

  peakSearching: bool;
  setPeakSearching: (s: bool) => void;

  stepValue: number;
  setStepValue: (s: number) => void;

  showResolutionRings: bool;
  setShowResolutionRings: (s: bool) => void;

  linear: bool;
  setLinear: (s: bool) => void;

  log: bool;
  setLog: (s: bool) => void;

  symLog: bool;
  setSymLog: (s: bool) => void;

  sqrt: bool;
  setSqrt: (s: bool) => void;

  invertScale: bool;
  setInvertScale: (s: bool) => void;

  colorMap: string;
  setColorMap: (val: string) => void;

  indexLabel: string;
  setIndexLabel: (val: string) => void;

  findSpotsLabel: string;
  setFindSpotsLabel: (val: string) => void;

  showIndexedValues: boolean;
  setShowIndexedValues: (s: bool) => void;

  xValues: list;
  setXValues: (val: list) => void;

  yValues: list;
  setYValues: (val: list) => void;

  intensityValues: list;
  setIntensityValues: (val: list) => void;

  showBrowser: boolean;
  setShowBrowser: (b: bool) => void;

  showPlot: boolean;
  setShowPlot: (b: bool) => void;

  listingFiles: boolean;
  setListingFiles: (b: bool) => void;

  currentPath: string;
  setCurrentPath: (val: string) => void;

  binSize: number;
  setBinSize: (s: number) => void;

  sumImagesValue: number;
  setSumImagesValue: (s: number) => void;

  showSumImages: boolean;
  setShowSumImages: (b: bool) => void;

  isQuerying: boolean;
  setIsQuerying: (b: bool) => void;

  ringColor: string;
  setRingColor: (b: string) => void;

};

export const useViewerStore = create<ViewerStore>((set) => ({
  inputValue: "1",
  setInputValue: (val) => set({ inputValue: val }),

  index: 0,
  setIndex: (i) => set({ index: i }),

  threshold: 100,
  setThreshold: (t) => set({ threshold: t }),

  mainThreshold: 100,
  setMainThreshold: (t) => set({ mainThreshold: t }),

  lambda: 0.97,
  setLambda: (l) => set({ lambda: l }),

  detectorDistance: 250.0,
  setDetectorDistance: (d) => set({ detectorDistance: d }),

  numberOfImages: 1800,
  setNumberOfImages: (n) => set({ numberOfImages: n }),

  rows: 1475,
  cols: 1679,
  setRows: (r) => set({ rows: r }),
  setCols: (c) => set({ cols: c }),

  beamCenterX: 742,
  beamCenterY: 861,
  setBeamCenterX: (x) => set({ beamCenterX: x }),
  setBeamCenterY: (y) => set({ beamCenterY: y }),

  pixelSizeMm: 0.172,
  setPixelSizeMm: (p) => set({ pixelSizeMm: p }),

  resolutionValues: [],
  setResolutionValues: (vals) => set({ resolutionValues: vals }),

  a: 0.0,
  b: 0.0,
  c: 0.0,
  alpha: 0.0,
  beta: 0.0,
  gamma: 0.0,
  spaceGroup: 0,
  setLatticeParams: ({ a, b, c, alpha, beta, gamma, spaceGroup }) =>
    set({ a, b, c, alpha, beta, gamma, spaceGroup }),

  peakSearching: false,
  setPeakSearching: (b) => set({ peakSearching: b }),

  stepValue: 10,
  setStepValue: (n) => set({ stepValue: n }),

  showResolutionRings: true,
  setShowResolutionRings: (b) => set({ showResolutionRings: b }),

  linear: true,
  setLinear: (b) => set({ linear: b }),

  log: false,
  setLog: (b) => set({ log: b }),

  symLog: false,
  setSymLog: (b) => set({ symLog: b }),

  sqrt: false,
  setSqrt: (b) => set({ sqrt: b }),

  invertScale: true,
  setInvertScale: (b) => set({ invertScale: b }),

  colorMap: "Greys",
  setColorMap: (val) => set({ colorMap: val }),

  indexLabel: 'Index with DIALS',
  setIndexLabel: (val) => set({ indexLabel: val }),

  findSpotsLabel: 'Find Spots with XDS',
  setFindSpotsLabel: (val) => set({ findSpotsLabel: val }),

  showIndexedValues: true,
  setShowIndexedValues: (b) => set({ showIndexedValues: b }),

  xValues: [],
  setXValues: (l) => set({ xValues: l }),

  yValues: [],
  setYValues: (l) => set({ yValues: l }),

  intensityValues: [],
  setIntensityValues: (l) => set({ intensityValues: l }),

  isLogged: false,
  setIsLogged: (b) => set({ isLogged: b }),

  username: '',
  setUsername: (s) => set({ username: s }),

  password: '',
  setPassword: (s) => set({ password: s }),

  loginIsHappening: false,
  setLoginIsHappening: (b) => set({ loginIsHappening: b }),

  proposals: [],
  setProposals: (l) => set({ proposals: l }),

  firstImagePath: '',
  setFirstImagePath: (s) => set({ firstImagePath: s }),

  showBrowser: false,
  setShowBrowser: (b) => set({ showBrowser: b }),

  showPlot: false,
  setShowPlot: (b) => set({ showPlot: b }),

  listingFiles: false,
  setListingFiles: (b) => set({ listingFiles: b }),

  currentPath: '',
  setCurrentPath: (s) => set({ currentPath: s }),

  binSize: 15,
  setBinSize: (s) => set({ binSize: s }),

  sumImagesValue: 1,
  setSumImagesValue: (s) => set({ sumImagesValue: s }),

  showSumImages: false,
  setShowSumImages: (b) => set({ showSumImages: b }),

  isQuerying: false,
  setIsQuerying: (b) => set({ isQuerying: b }),

  ringColor: 'white',
  setRingColor: (s) => set({ ringColor: s }),

}));


