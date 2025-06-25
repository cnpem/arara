// @ts-nocheck
import { useViewerStore } from './../../../store/useViewerStore';
import './../../../styles.css';

function ScaleAndThreshold() {
    
    const { 
        threshold, setThreshold,
        linear, setLinear,
        log, setLog,
        symLog, setSymLog,
        sqrt, setSqrt,
        invertScale, setInvertScale,
    } = useViewerStore();

    function handleChangeScale(value : string): null {
        if (value === 'linear') {
            setLinear(true);
            setLog(false);
            setSymLog(false);
            setSqrt(false);
        } 
        else if (value === 'log') {
            setLinear(false);
            setLog(true);
            setSymLog(false);
            setSqrt(false);
        } 
        else if (value === 'symlog') {
            setLinear(false);
            setLog(false);
            setSymLog(true);
            setSqrt(false);
        } 
        else if (value === 'sqrt') {
            setLinear(false);
            setLog(false);
            setSymLog(false);
            setSqrt(true);
        }
    };


    return (
        <div className="section">
            <label htmlFor="setThreshold"><strong>Set Threshold:</strong></label>
            <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                min={5}
                className="input-field"
            />
            <div className="scale-grid">
                <label className="scale-option">
                    <input
                    type="radio"
                    checked={linear}
                    onChange={() => handleChangeScale('linear')}
                    />
                    Linear
                </label>

                <label className="scale-option">
                    <input
                    type="radio"
                    checked={log}
                    onChange={() => handleChangeScale('log')}
                    />
                    Log
                </label>

                <label className="scale-option">
                    <input
                    type="radio"
                    checked={symLog}
                    onChange={() => handleChangeScale('symlog')}
                    />
                    SymLog
                </label>

                <label className="scale-option">
                    <input
                    type="radio"
                    checked={sqrt}
                    onChange={() => handleChangeScale('sqrt')}
                    />
                    Sqrt
                </label>
            </div>
            <div>
                <label>
                <input
                type="checkbox"
                value="phasing"
                checked={invertScale}
                onChange={() => setInvertScale(!invertScale)}/>
                <label htmlFor="invertScale">Invert Scale</label>
            </label>
            </div>
        </div>
    )
}

export default ScaleAndThreshold;