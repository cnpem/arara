// @ts-nocheck
import { useViewerStore } from './../../../store/useViewerStore';
import './../../../styles.css';
import { PauseIcon, PlayIcon } from '@vidstack/react/icons';

type FastForwardModeProps = {
  runningRef_current: boolean;
  stopIncrementing: () => void;
  startIncrementing: () => void;
};

function FastForwardMode({ runningRef_current, stopIncrementing, startIncrementing }: Readonly<FastForwardModeProps>) {

  const { stepValue, setStepValue,
          peakSearching,
          firstImagePath,
          sumImagesValue, setSumImagesValue,
          setShowSumImages,
          mainThreshold,
          setThreshold,
          isQuerying
  } = useViewerStore();

  const handleSumImages = async () => {
    setShowSumImages(true);
  }

  const handleRemoveSumImages = async () => {
    setThreshold(mainThreshold);
    setShowSumImages(false);
  }

  return (
    <div className="section">
        <label htmlFor="stride"><strong>Fast-Forward Stride Value:</strong></label>
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
        <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={stopIncrementing} className="button button-primary button-small" title="Stop">
          <PauseIcon className="w-5 h-5" />
        </button>

        <button
          onClick={startIncrementing}
          className="button button-success button-small"
          title="Fast-Forward"
          disabled={[runningRef_current, peakSearching, firstImagePath === ''].some(Boolean)}
        >
          <PlayIcon className="w-5 h-5" />
        </button>
        </div>
        <label htmlFor="stride"><strong>Sum Images:</strong></label>
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
        <div style={{ display: 'flex', gap: '10px' }}>
          {isQuerying && <p style={{ fontSize: '12px' }}>Loading...</p>}
        </div>
    </div>
  )
}

export default FastForwardMode;