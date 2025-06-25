// @ts-nocheck
import {
  VisCanvas,
  TooltipMesh,
  DefaultInteractions,
  ScaleType,
  ColorBar,
  HeatmapMesh,
  Annotation
} from '@h5web/lib';
import "@h5web/lib/dist/styles.css";
import ndarray from 'ndarray';
import ResolutionRings from './ResolutionRings';
import { useViewerStore } from '../../store/useViewerStore';
import React, { useEffect, useState, useRef } from 'react';

type ViewerProps = { values: number[][], canMoveOn: () => void };

function Viewer({ values, canMoveOn }: Readonly<ViewerProps>) {
  const {
    resolutionValues,
    threshold,
    lambda,
    detectorDistance,
    pixelSizeMm,
    rows,
    cols,
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
    setXValues,
    setYValues,
    showIndexedValues,
    ringColor
  } = useViewerStore();

  function returnScaleType(): ScaleType {
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

  function returnDomain(): list {
    if (invertScale) {
      return [0, threshold]
    } else {
      return [threshold, 0]
    }
  }

  const valuesArray = ndarray(new Float32Array(values.flat()), [cols, rows]);
  const scaleType = returnScaleType();
  const domain = returnDomain();

  function computeResolution(x: number, y: number): number {
    let R = Math.sqrt((x-beamCenterX)**2 + (y-beamCenterY)**2);
    let sin_theta = Math.sin(0.5*Math.atan(R*pixelSizeMm/detectorDistance));
    let d = lambda/(2*sin_theta);
    return d
  }

  function returnIntensity(x: number, y: number): string {
    let safeX = Number.parseInt(x);
    let safeY = Number.parseInt(y);
    const intensity = valuesArray.get(cols - safeY, safeX)?.toString() ?? "N/A";
    return intensity
  }

  function calculateRadii(resolutions: number[]): number[] {
    return resolutions.map(res => {
        let sinValue = lambda / (2 * res);
        if (sinValue >= 1) {
            return null;
        }
        let theta = 2*Math.asin(sinValue);
        let R_mm = detectorDistance * Math.tan(theta);
        let R_pixels = R_mm / pixelSizeMm;
        return R_pixels;
    })
  }

  const radiiValues = calculateRadii(resolutionValues);

  const renderedOnce = useRef(false);
  
  useEffect(() => {
    renderedOnce.current = false;
  }, [values]);

  return (
    <div style={{justifyContent: 'space-between', display: 'flex', alignItems: 'center'}}>
    <div
	    style={{
        display: 'flex',
        height: '60vw',
        width: '80vw',
      }}
    >
      <VisCanvas
        aspect='equal'
        abscissaConfig={{ visDomain: [0, rows], showGrid: false }}
        ordinateConfig={{ visDomain: [cols, 0], showGrid: false }}
        showAxes={false}
      >
        <DefaultInteractions />
        <HeatmapMesh
          values={valuesArray}
          domain={domain}
          scaleType={scaleType}
          colorMap={colorMap}
          onAfterRender={() => {
            if (!renderedOnce.current) {
              renderedOnce.current = true;
              canMoveOn();
            }
          }}
        />
        <TooltipMesh
          renderTooltip={(x: number, y: number) =>{
            return (
              <div>
                <p style={{ fontSize: '1.5rem' }}>
                  {`${Number.parseInt(x)}, ${Number.parseInt(y)}`}
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

            {showResolutionRings && 
            <ResolutionRings radiiValues={radiiValues}/>}

            <Annotation x={beamCenterX} y={beamCenterY}>
              <div style={{
                fontSize: '50px',
                color: ringColor,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                key: 'beamCenter'
              }}>
                +
              </div>
            </Annotation>

            {showIndexedValues && xValues && yValues && xValues.map((r, index) => (
              <Annotation key={`${xValues[index]}-${yValues[index]}`} x={xValues[index]} y={yValues[index]}>
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
    </div>
    <div style={{display: 'flex', width: '10%', height: '60vw'}}>
    <ColorBar
      domain={[0, threshold]}
      vertical
      scaleType={scaleType}
      colorMap={colorMap}
      invertColorMap={!invertScale}
    />
  </div>
  </div>
  );
}

export default Viewer;


