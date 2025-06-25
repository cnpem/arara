// @ts-nocheck
import { useViewerStore } from './../store/useViewerStore';

export function resetIndexedValues() {
  const {
    setXValues,
    setYValues,
    setIntensityValues,
    setIndexLabel,
    setLatticeParams,
    setFindSpotsLabel,
  } = useViewerStore();

  return () => {
    setXValues([]);
    setYValues([]);
    setIntensityValues([]);
    setIndexLabel('Index with DIALS');
    setFindSpotsLabel('Find Spots with XDS')
    setLatticeParams({
      a: 0,
      b: 0,
      c: 0,
      alpha: 0,
      beta: 0,
      gamma: 0,
      spaceGroup: 0,
    });
  };
}