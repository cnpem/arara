// @ts-nocheck
import {
    Annotation,
    useVisCanvasContext
  } from '@h5web/lib';
  import { Fragment } from 'react';
  import "@h5web/lib/dist/styles.css";
  import { Vector3 } from 'three';
  import { useViewerStore } from '../../store/useViewerStore';
  
  type ResolutionRingsProps = {
    radiiValues: number[];
  };

  
  function ResolutionRings({ radiiValues }: Readonly<ResolutionRingsProps>
  ) {

    const {
      rows,
      cols,
      beamCenterX,
      beamCenterY,
      resolutionValues,
      ringColor
    } = useViewerStore();

    const { visSize } = useVisCanvasContext();
    const { width, height } = visSize;
    const a = ((2*beamCenterX - (rows)) / ((rows))) * width/2;
    const b = -((2*beamCenterY - (cols)) / ((cols))) * height/2;

    const beamCenterCoords = new Vector3(
      a,
      b,
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
                (r/rows) * width - 0.2,
                (r/rows) * width + 0.2,
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
