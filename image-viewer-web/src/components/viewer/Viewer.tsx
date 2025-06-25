import { useEffect, useRef, useState } from 'react';
import ndarray from 'ndarray';

import ResolutionRings from './ResolutionRings';

import { useViewerStore } from '../../store/useViewerStore';

import {
  VisCanvas,
  TooltipMesh,
  Annotation,
  DefaultInteractions,
  ScaleType,
  ColorBar,
  HeatmapMesh,
  ResetZoomButton,
} from '@h5web/lib';

import type { VisScaleType } from '@h5web/lib';

export default function App() {
  const {
    rows,
    cols,
    index,
    setIndex,
    firstImagePath,
    startPlaying, setStartPlaying,
    stepValue,
    sumImagesValue,
    threshold,
    lambda,
    detectorDistance,
    pixelSizeMm,
    beamCenterX,
    beamCenterY,
    linear,
    log,
    symLog,
    sqrt,
    colorMap,
    showResolutionRings,
    invertScale,
    xValues,
    yValues,
    showIndexedValues,
    ringColor,
    numberOfImages,
    sessionId,
  } = useViewerStore();

  const [frame, setFrame] = useState<Uint8Array | null>(null);

  const playingRef = useRef(false);

  async function loadFrame(frameNumber: number) {
    try {
      const res = await fetch(
        `/api/frame/${sessionId}/${frameNumber}/${sumImagesValue}/${stepValue}`
      );

      if (!res.ok) {
        console.log(`Frame ${frameNumber} not found`);
        return false;
      }

      const buffer = await res.arrayBuffer();

      setFrame(new Uint8Array(buffer));
      setIndex(frameNumber);

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  useEffect(() => {
    if (firstImagePath) {
      loadFrame(0);
    }
  }, [firstImagePath]);

  useEffect(() => {
    if (!playingRef.current) {
      loadFrame(index);
    }
  }, [index]);

  useEffect(() => {
    if (startPlaying) {
      play();
    } else {
      pause();
    }
  }, [startPlaying]);

  async function play() {
    if (playingRef.current) return;

    playingRef.current = true;

    let frameNumber = index;

    try {
      while (playingRef.current) {
        const start = performance.now();

        const ok = await loadFrame(frameNumber);

        if (!ok) {
          console.log('Reached last frame');
          break;
        }

        frameNumber = frameNumber + stepValue;

        if (frameNumber > numberOfImages) {
          playingRef.current = false;
          setStartPlaying(false);
          setIndex(0);
        }

        if (frameNumber + sumImagesValue > numberOfImages) {
          playingRef.current = false;
          setStartPlaying(false);
          setIndex(0);
        }

        const elapsed = performance.now() - start;

        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, 100 - elapsed))
        );
      }
    } finally {
      playingRef.current = false;
    }
  }

  function pause() {
    playingRef.current = false;
  }

  if (!frame || !rows || !cols) {
    return <div>Loading...</div>;
  }

  const values = ndarray(frame, [rows, cols]);

  function computeResolution(x: number, y: number): number {
    let R = Math.sqrt((x-beamCenterX)**2 + (y-beamCenterY)**2);
    let sin_theta = Math.sin(0.5*Math.atan(R*pixelSizeMm/detectorDistance));
    let d = lambda/(2*sin_theta);
    return d
  }

  function returnIntensity(x: number, y: number): string {
    let safeX = rows - 1 - Math.floor(y);
    let safeY = Math.floor(x);
    const intensity = values.get(safeX, safeY)?.toString() ?? "N/A";
    return intensity
  }

  function returnScaleType(): VisScaleType {
    if (linear) {
      return ScaleType.Linear
    }
    else if (log) {
      return ScaleType.Log
    }
    else if (symLog) {
      return ScaleType.SymLog
    }
    else if (sqrt) {
      return ScaleType.Sqrt
    } else {
      return ScaleType.Linear
    }
  }

  function returnDomain(): [number, number] {
    if (invertScale) {
      return [0, threshold]
    } else {
      return [threshold, 0]
    }
  }

  const scaleType = returnScaleType();
  const domain = returnDomain();


  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '1.5rem',
        boxSizing: 'border-box',
      }}
    >
      <VisCanvas
        aspect="equal"
        abscissaConfig={{
          visDomain: [0, cols],
          showGrid: false,
        }}
        ordinateConfig={{
          visDomain: [rows, 0],
          showGrid: false,
        }}
      >
        <DefaultInteractions />

        <ResetZoomButton />

        <HeatmapMesh
          values={values}
          domain={domain}
          scaleType={scaleType}
          colorMap={colorMap}
        />

        <TooltipMesh
          renderTooltip={(x: number, y: number) =>{
            return (
              <div>
                <p style={{ fontSize: '1.5rem' }}>
                  {`${Math.floor(x)}, ${Math.floor(y)}`}
                </p>      
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  Intensity: {returnIntensity(x,y)}
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  Resolution: {computeResolution(x, y).toFixed(2)} Å
                </p>
              </div>
            );
          }}
          guides="both"
        />

        {showResolutionRings && <ResolutionRings/>}

        <Annotation x={beamCenterX} y={beamCenterY}>
          <div style={{
            fontSize: '50px',
            color: ringColor,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}>
            +
          </div>
        </Annotation>

        {showIndexedValues && xValues && yValues && xValues.map((_: number, i: number) => (
          <Annotation key={`${xValues[i]}-${yValues[i]}`} x={xValues[i]} y={yValues[i]}>
          <div style={{
            fontSize: '30px',
            color: 'red',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}>
            +
          </div>
        </Annotation>
        ))}


      </VisCanvas>

      <div
        style={{
          display: 'grid',
          padding: '0 1.625rem 0 5rem',
        }}
      >
        <ColorBar
          domain={domain}
          scaleType={scaleType}
          colorMap={colorMap}
          invertColorMap={false}
        />
      </div>
    </div>
  );
}