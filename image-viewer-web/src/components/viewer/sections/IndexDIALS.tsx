// @ts-nocheck
import { useViewerStore } from '../../../store/useViewerStore';
import { resetIndexedValues } from '../../../actions/ResetIndexedValues';
import './../../../styles.css';

function IndexDIALS() {

    const resetIndexedValuesCall = resetIndexedValues();   
    const {
        peakSearching, setPeakSearching,
        firstImagePath,
        a, b, c, alpha, beta, gamma, spaceGroup, setLatticeParams,
        showIndexedValues, setShowIndexedValues,
        setXValues,
        setYValues,
        setIntensityValues,
        index,
        indexLabel, setIndexLabel,
        startPlaying,
    } = useViewerStore();

    const fetchIndex = async () => {
        const csrfResponse = await fetch(`/api/csrf-token`, {
          method: 'GET',
          credentials: 'include'
        });
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.csrf_token;

        setIndexLabel('Loading...');
        setPeakSearching(true);
        try {
          const response = await fetch(`/api/index_image/${index}`, {
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
          setLatticeParams({
            a: responseData.a,
            b: responseData.b,
            c: responseData.c,
            alpha: responseData.alpha,
            beta: responseData.beta,
            gamma: responseData.gamma,
            spaceGroup: responseData.space_group,
          });
          setIntensityValues(responseData.intensity_values);
          setIndexLabel('Indexing ended!');
        } catch (error) {
          resetIndexedValuesCall();
          console.error('Error fetching or processing data:', error);
          setIndexLabel('Error indexing.');
        }
        setPeakSearching(false);
      }

    return (
        <div className="section">

          <div className="section-header">
            <strong>{indexLabel}</strong>
          </div>

          <div className="button-container">
            <button
              onClick={fetchIndex}
              className="button button-success"
              disabled={[startPlaying, peakSearching, firstImagePath === ''].some(Boolean)}
            >
              Start Indexing
            </button>
          </div>

          <div className="cell-grid">
            <div className="cell-item">
              <span className="cell-label">a: </span>
              <span className="cell-value">{a}</span>
            </div>

            <div className="cell-item">
              <span className="cell-label">b: </span>
              <span className="cell-value">{b}</span>
            </div>

            <div className="cell-item">
              <span className="cell-label">c: </span>
              <span className="cell-value">{c}</span>
            </div>

            <div className="cell-item">
              <span className="cell-label">α: </span>
              <span className="cell-value">{alpha}</span>
            </div>

            <div className="cell-item">
              <span className="cell-label">β: </span>
              <span className="cell-value">{beta}</span>
            </div>

            <div className="cell-item">
              <span className="cell-label">γ: </span>
              <span className="cell-value">{gamma}</span>
            </div>
          </div>

          <div className="space-group">
            <span className="cell-label">Space Group: </span>
            <span className="cell-value">{spaceGroup}</span>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showIndexedValues}
              onChange={() => setShowIndexedValues(!showIndexedValues)}
            />
            Show Peaks
          </label>

        </div>
    )
}

export default IndexDIALS;