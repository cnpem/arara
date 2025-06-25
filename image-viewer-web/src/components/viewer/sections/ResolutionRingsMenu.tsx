// @ts-nocheck
import React from 'react';
import { useViewerStore } from './../../../store/useViewerStore';
import './../../../styles.css';

function ResolutionRingsMenu() {
    
    const { 
        resolutionValues, setResolutionValues,
        showResolutionRings, setShowResolutionRings,
        ringColor, setRingColor,
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
            <label htmlFor="addResolution"><strong>Add Resolution Ring:</strong></label>
            <input type="number" onKeyPress={handleAddResolution} step="0.01" className="input-field" />
            <label>
                <input
                type="checkbox"
                value="phasing"
                checked={showResolutionRings}
                onChange={() => setShowResolutionRings(!showResolutionRings)}/>
                <label htmlFor="showResolutionRings">Show Resolution Rings</label>
            </label>
            <label htmlFor="addResolution"><strong>Choose Ring Color:</strong></label>
            <select
                className="input-field"
                value={ringColor}
                onChange={(e) => setRingColor(e.target.value)}
            >
                <option value="red">Red</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="yellow">Yellow</option>
                <option value="cyan">Cyan</option>
                <option value="magenta">Magenta</option>
                <option value="white">White</option>
            </select>
        </div>
    )
}

export default ResolutionRingsMenu;