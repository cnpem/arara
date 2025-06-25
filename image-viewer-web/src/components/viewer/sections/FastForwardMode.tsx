// @ts-nocheck
import { useViewerStore } from './../../../store/useViewerStore';
import './../../../styles.css';

type FastForwardModeProps = {
  runningRef_current: boolean;
  stopIncrementing: () => void;
  startIncrementing: () => void;
};

function FastForwardMode({ runningRef_current, stopIncrementing, startIncrementing }: Readonly<FastForwardModeProps>) {

  const { stepValue, setStepValue,
          peakSearching,
          firstImagePath,
  } = useViewerStore();

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
            if (stepValue < 10) {
            setStepValue(10);
            } else if (stepValue > 100) {
            setStepValue(100);
            }
        }}
        min={10}
        max={100}
        className="input-field"
        />
        <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={stopIncrementing} className="button button-primary">Stop</button>
        <button onClick={startIncrementing} className="button button-success" disabled={[runningRef_current, peakSearching, firstImagePath === ''].some(Boolean)}>Fast-Forward</button>
        </div>
    </div>
  )
}

export default FastForwardMode;