// @ts-nocheck
import React from 'react';
import { useViewerStore } from './../../../store/useViewerStore';
import { resetIndexedValues } from './../../../actions/ResetIndexedValues';
import './../../../styles.css';

type ChooseImageProps = {
  runningRef_current: boolean;
  config: {values: number[][]};
};

function ChooseImage({ runningRef_current, config }: Readonly<ChooseImageProps>) {

  const { inputValue, setInputValue, 
          numberOfImages,
          index, setIndex,
          peakSearching,
          firstImagePath,
  } = useViewerStore();

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && config) {
      const newIndex = parseInt(inputValue, 10);
      if (!isNaN(newIndex) && newIndex > 0 && newIndex <= numberOfImages) {
        setIndex(newIndex - 1);
      }
    }
  };

  const resetIndexedValuesCall = resetIndexedValues();

  const handleNextImage = () => {
    resetIndexedValuesCall();
    let newIndex = index + 1;
    if (newIndex >= numberOfImages) {
      newIndex = 0;
    }
    setIndex(newIndex);
    setInputValue((newIndex + 1).toString());
  };

  const handlePreviousImage = () => {
    resetIndexedValuesCall();
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePreviousImage} className="button button-primary" disabled={[runningRef_current, peakSearching, firstImagePath === ''].some(Boolean)}>Previous</button>
            <button onClick={handleNextImage} className="button button-success" disabled={[runningRef_current, peakSearching, firstImagePath === ''].some(Boolean)}>Next</button>
          </div>
          <p><strong>Current Image: {(index + 1).toString()}</strong></p>
          <p><strong>Number of Images: {numberOfImages}</strong></p>
    </div>
  )
}

export default ChooseImage;