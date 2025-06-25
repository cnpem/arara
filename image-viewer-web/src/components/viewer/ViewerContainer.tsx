// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import Viewer from './Viewer';
import FileBrowserModal from '../modals/FileBrowserModal';
import SpotsPlotModal from '../modals/SpotsPlotModal';

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
import FindSpots from './sections/FindSpots';
import ImagePathSelection from './sections/ImagePathSelection';

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
    setMainThreshold,
    setPixelSizeMm,
    firstImagePath,
    showBrowser, setShowBrowser,
    showPlot, setShowPlot,
    showSumImages, setShowSumImages,
    sumImagesValue,
    isQuerying, setIsQuerying
  } = useViewerStore();

  const resetIndexedValuesCall = resetIndexedValues();
  const calculateInitialResolutionRingsCall = calculateInitialResolutionRings();

  const runningRef = useRef(false);
  const waitToMoveOn = useRef(true);
  const loadingData = useRef(false);
  const currentIndexValue = useRef(0);
  const [config, setConfig] = useState<{ values: number[][] } | null>(null);
  const [configCache, setConfigCache] = useState(new Map<number, { values: number[][] }>());

  const canMoveOn = () => {
    waitToMoveOn.current = false;
  }

  const incrementIndex = async (targetIndex, delay = 100) => {
    runningRef.current = true;
    for (let i = index; i < targetIndex; i++) {
      if (!runningRef.current) break;
      while (waitToMoveOn.current && loadingData.current) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (currentIndexValue.current >= numberOfImages) {
          runningRef.current = false;
          setIndex(0);
          setInputValue(1);
          currentIndexValue.current = 0;
          break
        }
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      waitToMoveOn.current = true;
      setIndex(Number(Number(currentIndexValue.current) + Number(stepValue)));
      setInputValue(String(Number(currentIndexValue.current) + 1 + stepValue));
      currentIndexValue.current = currentIndexValue.current + stepValue;

      if (currentIndexValue.current >= numberOfImages) {
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
    const response = await fetch(`/api/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    const csrfToken = data.csrf_token;
    return csrfToken
  }

  const fetchMetaData = async () => {
    const csrfToken = await fetchCSRFToken();
    const res = await fetch(`/api/metadata`, {
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
      //setThreshold(metadata.threshold);
      setMainThreshold(metadata.threshold);
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

  const indices = numberOfImages && rows && cols
    ? Array.from({ length: runningRef.current ? (Math.min(20, parseInt(numberOfImages/(10*stepValue)))) : (20) }, (_, i) =>
        runningRef.current ? currentIndexValue.current + i * stepValue : index + i
      ).filter(i => i < numberOfImages)
    : [];
  
  const uncachedIndices = indices.filter(i => !configCache.has(i));

  const fetchingIndicesRef = useRef<Set<number>>(new Set());
  
  const fetchGridConfigs = async (inputIndices: number[]): Promise<GridConfig[]> => {
    if (inputIndices.length === 0) return [];
  
    const csrfToken = await fetchCSRFToken();
    let currentSumImagesValue = -Infinity;

    if (sumImagesValue > 20) {
      currentSumImagesValue = 20;
    } else if (sumImagesValue < 1) {
      currentSumImagesValue = 1;
    } else {
      currentSumImagesValue = sumImagesValue;
    }

    const res = await fetch(`/api/grid-config`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ firstImagePath, indexes: inputIndices, currentSumImagesValue }),
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
      let maxValue = -Infinity;
      const currentData = match.values
      for (const row of currentData) {
        for (const val of row) {
          if (val > maxValue) maxValue = val;
        }
      }
      setThreshold(parseInt(maxValue * 0.0005 + 28 * (1 + Math.min(index + sumImagesValue + 1, numberOfImages) - index + 1 - 3)));
    }
  };

  const handleFetch = async () => {

    const allRelevant = indices.filter(i => !configCache.has(i) && !fetchingIndicesRef.current.has(i));
    if (allRelevant.length === 0) return;
    allRelevant.forEach(i => fetchingIndicesRef.current.add(i));
    const newAllRelevant = allRelevant.slice(0,10)

    loadingData.current = true;
    setIsQuerying(true);
    try {
      const newConfigs = await fetchGridConfigs(newAllRelevant);
      updateCache(newConfigs);
      updateSelectedConfig(newConfigs);
    } finally {
      setIsQuerying(false);
      loadingData.current = false;
    }
  };
  
  useEffect(() => {
    if (firstImagePath !== '' && uncachedIndices.length > 0 && !isQuerying && !loadingData.current) {
      handleFetch();
    }
  }, [uncachedIndices, firstImagePath, isQuerying, index, showSumImages, loadingData]);
  
  useEffect(() => {
    const cached = configCache.get(index);
    if (cached) {
      setConfig(cached);
    }
  }, [index, configCache]);

  useEffect(() => {
    setConfig(null);
    setConfigCache(new Map());
    fetchingIndicesRef.current = new Set();
  }, [sumImagesValue])

  useEffect(() => {
    if (configCache.size >= 400) {
      console.log('Cache reset!');
      setConfigCache(new Map());
      fetchingIndicesRef.current = new Set();
    }
  }, [configCache]);

  return (
    <React.StrictMode>
      <div style={{ overflowX: 'auto' }}>
        <div className="container">

          <ImagePathSelection runningRef_current={runningRef.current}/>

          <ChooseImage runningRef_current={runningRef.current} config={config}></ChooseImage>

          <FastForwardMode 
            runningRef_current={runningRef.current}
            stopIncrementing={stopIncrementing}
            startIncrementing={startIncrementing}>
          </FastForwardMode>

          <ScaleAndThreshold></ScaleAndThreshold>

          <ResolutionRingsMenu></ResolutionRingsMenu>

          <ResolutionList></ResolutionList>

          <ChooseMapColor></ChooseMapColor>

          <AnalyseImages runningRef_current={runningRef.current}></AnalyseImages>

          <FindSpots></FindSpots>

        </div>
      </div>

      {showBrowser && <FileBrowserModal 
                          setConfig={setConfig}
                          setConfigCache={setConfigCache}
                          onClose={() => setShowBrowser(false)}
                          resetFetchingIndicesRef={() => fetchingIndicesRef.current = new Set()} />}

      {showPlot && <SpotsPlotModal 
                          onClose={() => setShowPlot(false)} />}

      {config? (config.values && <Viewer values={config.values} canMoveOn={canMoveOn}/>) : (<p></p>)}

    </React.StrictMode>
  );
}

export default ViewerContainer;
