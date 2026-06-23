import { useEffect, useRef } from "react";
import { useAlert } from "../../context/AlertContext";
import { useNavigate } from "react-router-dom";
import { useProgressBar } from "../../context/ProgressBarContext";

export default function NotFound() {
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const { complete } = useProgressBar();

    const hasTriggered = useRef(false);

    useEffect(() => {
        if (hasTriggered.current) return;

        hasTriggered.current = true;

        const timer = setTimeout(() => {
            complete();
        }, 100);

        showAlert(
            "Invalid Page",
            "This page does not exist.",
            "error",
            true
        );
        navigate(-1)
        return () => clearTimeout(timer);
    }, [showAlert, navigate]);

    return null;
}