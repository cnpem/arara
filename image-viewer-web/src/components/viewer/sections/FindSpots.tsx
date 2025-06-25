// @ts-nocheck
import { useViewerStore } from './../../../store/useViewerStore';
import { calculateInitialResolutionRings } from './../../../actions/CalculateInitialResolutionRings';
import { resetIndexedValues } from './../../../actions/ResetIndexedValues';
import './../../../styles.css';
import { Toaster, toast } from 'sonner'

type FindSpotsProps = {
    runningRef_current: boolean;
};

function FindSpots( {runningRef_current}:Readonly<FindSpotsProps> ) {

    const apiUrl = import.meta.env.VITE_REACT_APP_API_URL; 
    const resetIndexedValuesCall = resetIndexedValues();   
    const {
        firstImagePath,
        showIndexedValues, setShowIndexedValues,
        setXValues,
        setYValues,
        setIntensityValues,
        index,
        findSpotsLabel, setFindSpotsLabel,
        peakSearching,
        setShowPlot,
        resolutionValues,
        cols,
        beamCenterY,
        detectorDistance,
        lambda,
        pixelSizeMm
    } = useViewerStore();

    const calculateInitialResolutionRingsCall = calculateInitialResolutionRings();

    const findSpots = async () => {
      const csrfResponse = await fetch(`/api/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrf_token;
      setFindSpotsLabel("Loading...");

      try {
        const response = await fetch(`/api/find_spots_XDS/${index}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          body: JSON.stringify({
            firstImagePath: firstImagePath,
          }),
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        const responseData = await response.json();
        setXValues(responseData.x_values);
        setYValues(responseData.y_values);
        setIntensityValues(responseData.intensity_values);
        setFindSpotsLabel("Finished finding spots");
      } catch (error) {
        resetIndexedValuesCall();
        console.error('Error fetching or processing data:', error);
        setFindSpotsLabel("Error finding spots");
      }
    }

    const handlePlotClick = async () => {
      if (resolutionValues.length < 5) {
        calculateInitialResolutionRingsCall(
          cols,
          beamCenterY,
          detectorDistance,
          lambda,
          pixelSizeMm
        );
        toast('You have less than 5 resolution values. They have been reset.');
      }
      setShowPlot(true)
    }

    return (
        <div className="section">
          <Toaster
            position="bottom-right"
            toastOptions={{
            style: {
                background: '#333',
                color: '#fff',
                fontSize: '1rem',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                border: '1px solid #555',
            },
            duration: 8000,
            }}
          />
          <p><strong>{findSpotsLabel}</strong></p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={findSpots} className="button button-success" disabled={[runningRef_current, peakSearching, firstImagePath === ''].some(Boolean)}>Find Spots</button>
          </div>

          <label>
            <input type="checkbox" value="phasing" checked={showIndexedValues} onChange={() => setShowIndexedValues(!showIndexedValues)}/>
            <label htmlFor="showPeaks">Show Peaks</label>
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePlotClick} className="button button-success" disabled={[runningRef_current, peakSearching, firstImagePath === ''].some(Boolean)}>Plot Results</button>
          </div>
        </div>
    )
}

export default FindSpots;