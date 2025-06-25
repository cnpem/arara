// @ts-nocheck
import { useViewerStore } from './../../../store/useViewerStore';
import './../../../styles.css';
import { PauseIcon, PlayIcon } from '@vidstack/react/icons';

function FastForwardMode() {
  const {
    stepValue,
    setStepValue,
    peakSearching,
    firstImagePath,
    sumImagesValue,
    setSumImagesValue,
    setStartPlaying,
  } = useViewerStore();

  const initializeStreaming = () => {
    setStartPlaying(true);
  }

  return (
    <div className="section">
      <label htmlFor="stride">
        <strong>Fast-Forward Stride Value:</strong>
      </label>

      <input
        type="number"
        value={stepValue}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);

          if (!isNaN(value)) {
            setStepValue(value);
          } else {
            setStepValue('');
          }
        }}
        onBlur={() => {
          if (stepValue < 0) {
            setStepValue(0);
          } else if (stepValue > 100) {
            setStepValue(100);
          }
        }}
        min={0}
        max={100}
        className="input-field"
      />

      <div className="button-container">
        <button
          className="button button-primary button-small"
          title="Stop"
          onClick={() => setStartPlaying(false)}
        >
          <PauseIcon className="w-5 h-5" />
        </button>

        <button
          className="button button-success button-small"
          title="Fast-Forward"
          onClick={initializeStreaming}
          disabled={peakSearching || firstImagePath === ''}
        >
          <PlayIcon className="w-5 h-5" />
        </button>
      </div>

      <label htmlFor="sum-images">
        <strong>Sum Images:</strong>
      </label>

      <input
        type="number"
        value={sumImagesValue}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);

          if (!isNaN(value)) {
            setSumImagesValue(value);
          } else {
            setSumImagesValue(1);
          }
        }}
        onBlur={() => {
          if (sumImagesValue < 1) {
            setSumImagesValue(1);
          } else if (sumImagesValue > 20) {
            setSumImagesValue(20);
          }
        }}
        min={1}
        max={20}
        className="input-field"
      />
    </div>
  );
}

export default FastForwardMode;