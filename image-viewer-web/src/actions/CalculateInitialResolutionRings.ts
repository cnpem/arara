import { useViewerStore } from './../store/useViewerStore';

export function calculateInitialResolutionRings() {
  const { setResolutionValues } = useViewerStore();

  return (
    cols: number, 
    beam_center_y: number, 
    detector_distance: number, 
    wavelength: number,
    pixelSizeMm: number
  ) => {
    const R = Math.abs(cols - beam_center_y) / 5;
    const ringCount = 5;
    const resolutions = Array.from({ length: ringCount }, (_, i) => {
      const factor = i + 1;
      const angle = 0.5 * Math.atan((factor * R * pixelSizeMm) / detector_distance);
      const d = wavelength / (2 * Math.sin(angle));
      return Number(d.toFixed(2));
    });

    setResolutionValues(resolutions);
  };
}
