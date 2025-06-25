// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import Viewer from './Viewer';
import FileBrowserModal from '../modals/FileBrowserModal';
import './../../styles.css';
import { resetIndexedValues } from '../../actions/ResetIndexedValues';
import { calculateInitialResolutionRings } from '../../actions/CalculateInitialResolutionRings';

import { useQuery } from '@tanstack/react-query';
import { useViewerStore } from '../../store/useViewerStore';

import ChooseImage from './sections/ChooseImage';
import FastForwardMode from './sections/FastForwardMode';
import ResolutionRingsMenu from './sections/ResolutionRingsMenu';
import ResolutionList from './sections/ResolutionList';
import ScaleAndThreshold from './sections/ScaleAndThreshold';
import ChooseMapColor from './sections/ChooseMapColor';
import AnalyseImages from './sections/AnalyseImages';
import ImagePathSelection from './sections/ImagePathSelection';

const apiUrl = import.meta.env.VITE_REACT_APP_API_URL;

function ViewerContainer() {

  const {
    setInputValue,
    index, setIndex,
    setBeamCenterX,
    setBeamCenterY,
    setDetectorDistance,
    numberOfImages, setNumberOfImages,
    rows, setRows,
    cols, setCols,
    stepValue,
    setLambda,
    setThreshold,
    setPixelSizeMm,
    firstImagePath,
    showBrowser, setShowBrowser,
  } = useViewerStore();

  const resetIndexedValuesCall = resetIndexedValues();
  const calculateInitialResolutionRingsCall = calculateInitialResolutionRings();

  const runningRef = useRef(false);
  const currentIndexValue = useRef(0);
  const [config, setConfig] = useState<{ values: number[][] } | null>(null);
  const [configCache, setConfigCache] = useState(new Map<number, { values: number[][] }>());

  const incrementIndex = async (targetIndex, delay = 700) => {
    runningRef.current = true;
    for (let i = index; i < targetIndex; i++) {
      if (!runningRef.current) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
      setIndex(Number(Number(currentIndexValue.current) + Number(stepValue)));
      setInputValue(String(Number(currentIndexValue.current) + 1 + stepValue));
      currentIndexValue.current = currentIndexValue.current + stepValue;

      if (currentIndexValue.current > numberOfImages) {
        runningRef.current = false;
        setIndex(0);
        setInputValue(1);
        currentIndexValue.current = 0;
        break
      }
    }
    runningRef.current = false;
  };
  
  const startIncrementing = () => {
    resetIndexedValuesCall();
    runningRef.current = true;
    currentIndexValue.current = index;
    incrementIndex(numberOfImages - 1);
  };
  
  const stopIncrementing = () => {
    resetIndexedValuesCall();
    currentIndexValue.current = index;
    runningRef.current = false;
  };

  const fetchCSRFToken = async () => {
    const response = await fetch(`${apiUrl}/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    const csrfToken = data.csrf_token;
    return csrfToken
  }

  const fetchMetaData = async () => {
    const csrfToken = await fetchCSRFToken();
    const res = await fetch(`${apiUrl}/metadata`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ firstImagePath }),
    });
  
    if (!res.ok) throw new Error(`Error: ${res.statusText}`);
    return res.json();
  };
  
  const {
    data: metadata,
  } = useQuery({
    queryKey: ['metadata', firstImagePath],
    queryFn: fetchMetaData,
    enabled: firstImagePath !== '',
  });

  useEffect(() => {
    if (metadata) {
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
        metadata.beam_center_y,
        metadata.detector_distance,
        metadata.wavelength,
        metadata.pixel_size_mm
      );
    }
  }, [metadata]);

  const [isQuerying, setIsQuerying] = useState(false);
  
  const indices = numberOfImages && rows && cols
    ? Array.from({ length: 5 }, (_, i) =>
        runningRef.current ? index + i * stepValue : index + i
      ).filter(i => i < numberOfImages)
    : [];
  
  const uncachedIndices = indices.filter(i => !configCache.has(i));
  
  const fetchGridConfigs = async (inputIndices: number[]): Promise<GridConfig[]> => {
    if (inputIndices.length === 0) return [];
  
    const csrfToken = await fetchCSRFToken();
    const res = await fetch(`${apiUrl}/grid-config`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ firstImagePath, indexes: inputIndices }),
    });
    if (!res.ok) throw new Error(`Failed to fetch grid configs for indices ${inputIndices}`);
  
    const buffer = await res.arrayBuffer();
    const int16Array = new Int16Array(buffer);
  
    const r = rows;
    const c = cols;
    const configs: GridConfig[] = [];
  
    for (let i = 0; i < inputIndices.length; i++) {
      const start = i * r * c;
      const values = Array.from({ length: r }, (_, row) =>
        Array.from(int16Array.slice(start + row * c, start + (row + 1) * c))
      );
      configs.push({ values, index: inputIndices[i] });
    }
  
    return configs;
  };

  const updateCache = (newConfigs) => {
    setConfigCache((prev) => {
      const updated = new Map(prev);
      newConfigs.forEach(cfg => updated.set(cfg.index, cfg));
      return updated;
    });
  };

  const updateSelectedConfig = (newConfigs) => {
    const match = newConfigs.find(cfg => parseInt(cfg.index) === parseInt(index));
    if (match) {
      setConfig(match);
    }
  };

  const handleFetch = async () => {
    setIsQuerying(true);
    try {
      const newConfigs = await fetchGridConfigs(uncachedIndices);
      updateCache(newConfigs);
      updateSelectedConfig(newConfigs);
    } finally {
      setIsQuerying(false);
    }
  };
  
  useEffect(() => {
    if (firstImagePath !== '' && uncachedIndices.length > 0 && !isQuerying) {  
      handleFetch();
    }
  }, [uncachedIndices, firstImagePath, isQuerying, index]);  
  
  useEffect(() => {
    const cached = configCache.get(index);
    if (cached) {
      setConfig(cached);
    }
  }, [index, configCache]);

  return (
    <React.StrictMode>
      <div className="container">

        <ImagePathSelection runningRef_current={runningRef.current}/>

        <ChooseImage runningRef_current={runningRef.current} config={config}></ChooseImage>

        <FastForwardMode 
          runningRef_current={runningRef.current}
          stopIncrementing={stopIncrementing}
          startIncrementing={startIncrementing}>
        </FastForwardMode>

        <ResolutionRingsMenu></ResolutionRingsMenu>

        <ResolutionList></ResolutionList>

        <ScaleAndThreshold></ScaleAndThreshold>

        <ChooseMapColor></ChooseMapColor>

        <AnalyseImages runningRef_current={runningRef.current}></AnalyseImages>

      </div>

      {showBrowser && <FileBrowserModal 
                          setConfig={setConfig}
                          setConfigCache={setConfigCache}
                          onClose={() => setShowBrowser(false)} />}

      {config? (config.values && <Viewer values={config.values}/>) : (<p></p>)}

    </React.StrictMode>
  );
}

export default ViewerContainer;
