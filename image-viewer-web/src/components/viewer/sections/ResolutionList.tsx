// @ts-nocheck
import { useViewerStore } from './../../../store/useViewerStore';
import './../../../styles.css';

function ResolutionList() {
    
    const { 
        resolutionValues, setResolutionValues,
    } = useViewerStore();

    const handleRemoveResolution = (value: number) => {
        setResolutionValues(resolutionValues.filter((v) => v !== value));
    };

    return (
        <div className="section">
            <ul className="resolution-list">
            {[...resolutionValues].sort((a, b) => a - b).map((value) => (
                <li key={value} className="resolution-item">
                    <span className="resolution-text">{value.toFixed(2)} Å</span>
                    <button onClick={() => handleRemoveResolution(value)} className="button button-danger">
                    Remove
                    </button>
                </li>
            ))}
            </ul>
        </div>
    )
}

export default ResolutionList;