// @ts-nocheck
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaFolder, FaFile } from "react-icons/fa";
import { useViewerStore } from '../../store/useViewerStore';

const baseDir = '/ibira/lnls/beamlines/manaca/proposals/';
const shortBaseDir = '/ibira/.../proposals/';

interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
}

interface FileBrowserModalProps {
  setConfig: React.Dispatch<React.SetStateAction<{ values: number[][] } | null>>;
  setConfigCache: React.Dispatch<React.SetStateAction<Map<number, { values: number[][] }>>>;
  onClose: () => void;
  resetFetchingIndicesRef: () => void;
}

function FileBrowserModal ({ setConfig, setConfigCache, onClose, resetFetchingIndicesRef } : Readonly<FileBrowserModalProps> ) {

  const { 
    proposals, 
    setFirstImagePath,
    setXValues,
    setYValues,
    setIntensityValues,
    setIndex,
    setInputValue,
    setLatticeParams,
    currentPath, 
    setCurrentPath
  } = useViewerStore();

  const fetchFiles = async (path: string) => {

    const csrfResponse = await fetch(`/api/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrf_token;

    const res = await fetch(`/api/list_files`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({
        current_path: path,
        proposals: proposals,
      }),
    });
    if (!res.ok) throw new Error('Failed to list files');
    return res.json();
  };

  const {
    data,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: [currentPath],
    queryFn: () => fetchFiles(currentPath),
    keepPreviousData: false,
    retry: false,
  });

  const handleFolderClick = (path: string) => {
    if (!isFetching) setCurrentPath(path);
  };

  const handleFileClick = (path: string) => {
    const fullPath = baseDir + path;
    setFirstImagePath(fullPath);
    setConfig(null);
    setConfigCache(new Map());
    resetFetchingIndicesRef();
    setXValues([]);
    setYValues([]);
    setIntensityValues([]);
    setIndex(0);
    setInputValue(1);
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

  const handleClick = (f) => {
    if (isFetching) {
      console.log('Another search is occurring');
      return;
    }

    if (f.is_dir) {
      handleFolderClick(f.path);
    } else {
      handleFileClick(f.path);
    }
  };

  const goBack = () => {
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
  };

  const files: FileItem[] = data?.files ?? [];

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
          width: '500px',
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
          }}
        >
          <h2>File Browser</h2>
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

        <div style={{ marginBottom: '10px' }}>
          <strong>Current Path:</strong> {shortBaseDir + currentPath}
        </div>

        {isLoading && <div>Loading files...</div>}
        {isError && <div>Error loading files. Please try again.</div>}
        {isFetching && !isLoading && <div>Refreshing list...</div>}

        {currentPath && (
          <button onClick={goBack} disabled={isFetching}>
            ⬅ Back
          </button>
        )}

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {files.map((f) => (
            <li key={f.path} style={{ padding: '5px 0' }}>
            <button
              key={f.path}
              onClick={() => handleClick(f)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              >
              {f.is_dir ? <FaFolder style={{ marginRight: '8px' }} /> : <FaFile style={{ marginRight: '8px' }} />}
              {f.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FileBrowserModal;
