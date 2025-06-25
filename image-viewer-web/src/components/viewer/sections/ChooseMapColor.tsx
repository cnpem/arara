// @ts-nocheck
import { useViewerStore } from './../../../store/useViewerStore';
import './../../../styles.css';

function ChooseMapColor() {
    
    const { 
        colorMap, setColorMap,
    } = useViewerStore();

    return (
        <div className="section">
            <p><strong>Map Color:</strong></p>
            <label>
                <input
                type="radio"
                value="phasing"
                checked={colorMap === 'Greys'}
                onChange={() => setColorMap('Greys')}/>
                <label htmlFor="greys">Greys</label>
            </label>
            <label>
                <input
                type="radio"
                value="phasing"
                checked={colorMap === 'Inferno'}
                onChange={() => setColorMap('Inferno')}/>
                <label htmlFor="inferno">Inferno</label>
            </label>
            <label>
                <input
                type="radio"
                value="phasing"
                checked={colorMap === 'Rainbow'}
                onChange={() => setColorMap('Rainbow')}/>
                <label htmlFor="rainbow">Rainbow</label>
            </label>
            <label>
                <input
                type="radio"
                value="phasing"
                checked={colorMap === 'Viridis'}
                onChange={() => setColorMap('Viridis')}/>
                <label htmlFor="viridis">Viridis</label>
            </label>
        </div>
    )
}

export default ChooseMapColor;