// @ts-nocheck
import { useViewerStore } from './../store/useViewerStore';

export function resetIndexedValues() {
  const {
    setXValues,
    setYValues,
    setIntensityValues,
    setIndexLabel,
    setLatticeParams,
  } = useViewerStore();

  return () => {
    setXValues([]);
    setYValues([]);
    setIntensityValues([]);
    setIndexLabel('Peak Search:');
    setLatticeParams({
      a: 0,
      b: 0,
      c: 0,
      alpha: 0,
      beta: 0,
      gamma: 0,
    });
  };
}