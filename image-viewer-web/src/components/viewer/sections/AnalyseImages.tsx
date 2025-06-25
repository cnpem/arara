// @ts-nocheck
import { useViewerStore } from './../../../store/useViewerStore';
import { resetIndexedValues } from './../../../actions/ResetIndexedValues';
import './../../../styles.css';

type AnalyseImagesProps = {
    runningRef_current: boolean;
};

function AnalyseImages( {runningRef_current}:Readonly<AnalyseImagesProps> ) {

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
          <p><strong>{indexLabel}</strong></p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchIndex} className="button button-success" disabled={[runningRef_current, peakSearching, firstImagePath === ''].some(Boolean)}>Start Indexing</button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <strong>a:</strong>
            <strong>{a}</strong>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <strong>b:</strong>
            <strong>{b}</strong>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <strong>c:</strong>
            <strong>{c}</strong>
            </label>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <strong>alpha:</strong>
            <strong>{alpha}</strong>
            </label>


            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <strong>beta:</strong>
            <strong>{beta}</strong>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <strong>gamma:</strong>
            <strong>{gamma}</strong>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <strong>Space Group:</strong>
            <strong>{spaceGroup}</strong>
            </label>
          </div>

          <label>
            <input type="checkbox" value="phasing" checked={showIndexedValues} onChange={() => setShowIndexedValues(!showIndexedValues)}/>
            <label htmlFor="showPeaks">Show Peaks</label>
          </label>
        </div>
    )
}

export default AnalyseImages;