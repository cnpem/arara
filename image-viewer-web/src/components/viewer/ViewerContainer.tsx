// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import Viewer from './Viewer';
import FileBrowserModal from '../modals/FileBrowserModal';
import SpotsPlotModal from '../modals/SpotsPlotModal';
import './../../styles.css';
import { calculateInitialResolutionRings } from '../../actions/CalculateInitialResolutionRings';
import { useQuery } from '@tanstack/react-query';
import { useViewerStore } from '../../store/useViewerStore';
import ChooseImage from './sections/ChooseImage';
import FastForwardMode from './sections/FastForwardMode';
import ResolutionRingsMenu from './sections/ResolutionRingsMenu';
import ResolutionList from './sections/ResolutionList';
import ScaleAndThreshold from './sections/ScaleAndThreshold';
import ChooseMapColor from './sections/ChooseMapColor';
import IndexDIALS from './sections/IndexDIALS';
import FindSpotsXDS from './sections/FindSpotsXDS';
import ImagePathSelection from './sections/ImagePathSelection';

function ViewerContainer() {

  const {
    showBrowser, setShowBrowser,
    showPlot, setShowPlot,
    firstImagePath,
    setLambda,
    setRows,
    setCols,
    setNumberOfImages,
    setBeamCenterX,
    setBeamCenterY,
    setDetectorDistance,
    setThreshold,
    setPixelSizeMm,
    sessionId, setSessionId,
  } = useViewerStore();

  const calculateInitialResolutionRingsCall = calculateInitialResolutionRings();

  const fetchCSRFToken = async () => {
    const response = await fetch(`/api/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    const csrfToken = data.csrf_token;
    return csrfToken
  };

  const fetchMetaData = async () => {
    const csrfToken = await fetchCSRFToken();

    const res = await fetch(
      '/api/metadata',
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          firstImagePath,
          session_id: sessionId || null,
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }

    return res.json();
  };
  
  const {
    data: metadata,
    isSuccess,
  } = useQuery({
    queryKey: ['metadata', firstImagePath],
    queryFn: fetchMetaData,
    enabled: firstImagePath !== '',
  });

  useEffect(() => {
    if (metadata) {
      setSessionId(metadata.session_id);
      setLambda(metadata.wavelength);
      setRows(metadata.rows);
      setCols(metadata.cols);
      setNumberOfImages(metadata.number_of_images);
      setBeamCenterX(metadata.beam_center_x);
      setBeamCenterY(metadata.beam_center_y);
      setDetectorDistance(metadata.detector_distance);
      setThreshold(metadata.threshold);
      setPixelSizeMm(metadata.pixel_size_mm);
  
      calculateInitialResolutionRingsCall(
        metadata.cols,
        metadata.beam_center_x,
        metadata.detector_distance,
        metadata.wavelength,
        metadata.pixel_size_mm
      );
    }
  }, [metadata]);

  return (
    <React.StrictMode>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
        }}
      >
        <div style={{ overflowX: 'auto'}}>
          <div className="container">

            <ImagePathSelection/>

            <ChooseImage/>

            <FastForwardMode/>

            <ScaleAndThreshold/>

            <ResolutionRingsMenu/>

            <ResolutionList/>

            <ChooseMapColor/>

            <IndexDIALS/>

            <FindSpotsXDS/>

          </div>
        </div>

        {isSuccess && sessionId && <Viewer></Viewer>}

      </div>

      {showBrowser && <FileBrowserModal 
      onClose={() => setShowBrowser(false)} />}

      {showPlot && <SpotsPlotModal 
      onClose={() => setShowPlot(false)} />}

    </React.StrictMode>
  );
}

export default ViewerContainer;
