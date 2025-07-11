// @ts-nocheck
import './../../../styles.css';
import { useViewerStore } from './../../../store/useViewerStore';

type ImagePathSelectionProps = {
  runningRef_current: boolean;
};

function ImagePathSelection( {runningRef_current}: Readonly<ImagePathSelectionProps> ) {

  const { setShowBrowser, peakSearching, firstImagePath } = useViewerStore();

  const openModal = () => {
    setShowBrowser(true);
  }

  return (
    <div className="section">
      {!runningRef_current && <button className="button button-success" onClick={openModal} disabled={peakSearching}> Search Files</button>}
      {firstImagePath && <p>{firstImagePath}</p>}
    </div>
  )
}

export default ImagePathSelection;
