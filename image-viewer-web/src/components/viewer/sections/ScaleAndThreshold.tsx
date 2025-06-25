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
            <label>
                <input
                type="radio"
                value="phasing"
                checked={linear}
                onChange={() => handleChangeScale('linear')}/>
                <label htmlFor="linear">Linear</label>
            </label>
            <label>
                <input
                type="radio"
                value="phasing"
                checked={log}
                onChange={() => handleChangeScale('log')}/>
                <label htmlFor="log">Log</label>
            </label>
            <label>
                <input
                type="radio"
                value="phasing"
                checked={symLog}
                onChange={() => handleChangeScale('symlog')}/>
                <label htmlFor="symLog">SymLog</label>
            </label>
            <label>
                <input
                type="radio"
                value="phasing"
                checked={sqrt}
                onChange={() => handleChangeScale('sqrt')}/>
                <label htmlFor="sqrt">Sqrt</label>
            </label>
            <label>
                <input
                type="checkbox"
                value="phasing"
                checked={invertScale}
                onChange={() => setInvertScale(!invertScale)}/>
                <label htmlFor="invert">Invert</label>
            </label>
        </div>
    )
}

export default ScaleAndThreshold;