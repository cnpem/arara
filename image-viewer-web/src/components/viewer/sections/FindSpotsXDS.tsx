// @ts-nocheck
import { useViewerStore } from '../../../store/useViewerStore';
import { calculateInitialResolutionRings } from '../../../actions/CalculateInitialResolutionRings';
import { resetIndexedValues } from '../../../actions/ResetIndexedValues';
import './../../../styles.css';
import { Toaster, toast } from 'sonner'

function FindSpotsXDS() {

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
        pixelSizeMm,
        startPlaying,
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

          <div className="status-label">
            {findSpotsLabel}
          </div>

          <div className="button-container">
            <button onClick={findSpots} className="button button-success" disabled={[startPlaying, peakSearching, firstImagePath === ''].some(Boolean)}>
              Find Spots
            </button>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showIndexedValues}
              onChange={() => setShowIndexedValues(!showIndexedValues)}
            />
            Show Peaks
          </label>

          <div className="button-container">
            <button onClick={handlePlotClick} className="button button-success" disabled={[startPlaying, peakSearching, firstImagePath === ''].some(Boolean)}>
              Plot Results
            </button>
          </div>

        </div>
    )
}

export default FindSpotsXDS;