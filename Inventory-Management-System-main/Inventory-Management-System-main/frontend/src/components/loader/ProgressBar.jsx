import { useProgressBar } from "../../context/ProgressBarContext";
import "./ProgressBar.css";

const ProgressBar = () => {
    const { progress, isVisible } = useProgressBar();

    if (!isVisible && progress === 0) return null;

    return (
        <div className="progress-bar-container">
            <div 
                className="progress-bar"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

export default ProgressBar;