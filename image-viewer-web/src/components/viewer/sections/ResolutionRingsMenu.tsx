// @ts-nocheck
import React from 'react';
import { useViewerStore } from './../../../store/useViewerStore';
import './../../../styles.css';

function ResolutionRingsMenu() {
    
    const { 
        resolutionValues, setResolutionValues,
        showResolutionRings, setShowResolutionRings,
    } = useViewerStore();

    const handleAddResolution = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const value = parseFloat(e.currentTarget.value);
            if (!isNaN(value) && !resolutionValues.includes(value)) {
                setResolutionValues([...resolutionValues, value]);
                e.currentTarget.value = "";
            }
        }
    };

    return (
        <div className="section">
            <label htmlFor="addResolution"><strong>Add Resolution:</strong></label>
            <input type="number" onKeyPress={handleAddResolution} step="0.01" className="input-field" />
            <label>
                <input
                type="checkbox"
                value="phasing"
                checked={showResolutionRings}
                onChange={() => setShowResolutionRings(!showResolutionRings)}/>
                <label htmlFor="showResolutionRings">Show Resolution Rings</label>
            </label>
        </div>
    )
}

export default ResolutionRingsMenu;