// @ts-nocheck
import React from 'react';
import { ResolutionPlot } from './ResolutionPlot';
import { useQuery } from '@tanstack/react-query';
import { FaFolder, FaFile } from "react-icons/fa";
import { useViewerStore } from '../../store/useViewerStore';

interface SpotsPlotModalProps {
  onClose: () => void;
}

function SpotsPlotModal ({ onClose } : Readonly<SpotsPlotModalProps> ) {

  const { 
    firstImagePath,
    resolutionValues,
    binSize, setBinSize,
  } = useViewerStore();

  const fetchData = async () => {

    const csrfResponse = await fetch(`/api/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrf_token;

    const res = await fetch(`/api/plot_data`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({
        firstImagePath: firstImagePath,
        resolutionValues: resolutionValues,
        binSize: binSize,
      }),
    });
    if (!res.ok) throw new Error('Failed to fetch data.');
    return res.json();
  };

  const {
    data,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: [firstImagePath, binSize, resolutionValues],
    queryFn: () => fetchData(),
    keepPreviousData: true,
    retry: false,
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '80vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}>
          <h2>Spots Plot</h2>
          <div>
            <label htmlFor="setBinSize"><strong>Set Bin Size:</strong></label>
            <input
              style = {{width: '300px'}}
              type="number"
              value={binSize}
              onChange={(e) => setBinSize(e.target.value)}
              min={1}
              max={100}
              className="input-field"
            />
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {isLoading && <div>Loading data...</div>}
        {isError && <div>Error loading data. Please try again.</div>}
        {data && <ResolutionPlot plotData={data} />}

      </div>
    </div>
  );
}

export default SpotsPlotModal;
