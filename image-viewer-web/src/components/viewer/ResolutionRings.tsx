// @ts-nocheck
import {
    Annotation,
    useVisCanvasContext
  } from '@h5web/lib';
  import { Fragment } from 'react';
  import { Vector3 } from 'three';
  import { useViewerStore } from '../../store/useViewerStore';

  
  function ResolutionRings() {

    const {
      rows,
      cols,
      beamCenterX,
      beamCenterY,
      resolutionValues,
      ringColor,
      lambda,
      detectorDistance,
      pixelSizeMm,
    } = useViewerStore();

    const radiiValues = resolutionValues.map(res => {
      let sinValue = lambda / (2 * res);
      if (sinValue >= 1) {
          return null;
      }
      let theta = 2*Math.asin(sinValue);
      let R_mm = detectorDistance * Math.tan(theta);
      let R_pixels = R_mm / pixelSizeMm;
      return R_pixels;
    })

    const { visSize } = useVisCanvasContext();
    const { width, height } = visSize;
    const x = ((2*beamCenterX - cols) / ((cols))) * width/2;
    const y = -((2*beamCenterY - rows) / ((rows))) * height/2;

    const beamCenterCoords = new Vector3(
      x,
      y,
      1
    );

    return (
      radiiValues.map((r, index) => (
        <Fragment key={r}>
        <group position={beamCenterCoords}>
          <mesh renderOrder={10}>
            <meshBasicMaterial color={ringColor} />
            <ringGeometry
              args={[
                (r/cols) * width - 0.2,
                (r/cols) * width + 0.2,
                Math.floor(2 * Math.PI * 100),
              ]}
            />
          </mesh>
        </group>
        <Annotation x={ Number.parseInt(beamCenterX) } y={ Number.parseInt(beamCenterY) - r}>
          <div style={{ color: ringColor, transform: 'translate3d(-50%, 0, 0)', whiteSpace: 'nowrap', fontSize: '24px' }}>
            {`${resolutionValues[index]} Å`}
          </div>
        </Annotation>
        </Fragment>
      ))
    )
  }
  
  export default ResolutionRings;
