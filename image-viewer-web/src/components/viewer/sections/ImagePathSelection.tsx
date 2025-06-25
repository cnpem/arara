// @ts-nocheck
import './../../../styles.css';
import { useViewerStore } from './../../../store/useViewerStore';

function ImagePathSelection() {

  const { setShowBrowser, peakSearching, firstImagePath } = useViewerStore();

  const openModal = () => {
    setShowBrowser(true);
  }

  return (
    <div className="section">
      <label htmlFor="chooseImage"><strong>Select a Dataset:</strong></label>
      <button className="button button-success" onClick={openModal} disabled={peakSearching}> Search Files</button>
      {firstImagePath && <p className="long-path">{firstImagePath}</p>}
    </div>
  )
}

export default ImagePathSelection;
