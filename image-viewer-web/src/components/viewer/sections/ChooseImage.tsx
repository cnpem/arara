// @ts-nocheck
import React from 'react';
import { useViewerStore } from './../../../store/useViewerStore';
import './../../../styles.css';

function ChooseImage() {

  const { inputValue, setInputValue, 
          numberOfImages,
          index, setIndex,
          peakSearching,
          firstImagePath,
  } = useViewerStore();

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const newIndex = parseInt(inputValue, 10);
      if (!isNaN(newIndex) && newIndex > 0 && newIndex <= numberOfImages) {
        setIndex(newIndex - 1);
      }
    }
  };

  const handleNextImage = () => {
    let newIndex = index + 1;
    if (newIndex >= numberOfImages) {
      newIndex = 0;
    }
    setIndex(newIndex);
    setInputValue((newIndex + 1).toString());
  };

  const handlePreviousImage = () => {
    let newIndex = index - 1;
    if (newIndex < 0) {
      newIndex = 0;
    }
    setIndex(newIndex);
    setInputValue((newIndex + 1).toString());
  };

  return (
    <div className="section">
      <label htmlFor="chooseImage"><strong>Choose Image:</strong></label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            min={1}
            max={numberOfImages}
            className="input-field"
          />
          <div className="button button-container">
            <button onClick={handlePreviousImage} className="button button-primary" disabled={[peakSearching, firstImagePath === ''].some(Boolean)}>Previous</button>
            <button onClick={handleNextImage} className="button button-success" disabled={[peakSearching, firstImagePath === ''].some(Boolean)}>Next</button>
          </div>
          <strong><span>Current Image: {(index + 1).toString()}</span></strong>
          <strong><span>Number of Images: {numberOfImages}</span></strong>
    </div>
  )
}

export default ChooseImage;