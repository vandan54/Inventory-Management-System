import Input from "../form/input";
import "./PasswordModal.css";
import { useState } from "react";

export default function PasswordModal({ 
	onConfirm, 
	onCancel,
	title = "Confirm Action",
	description = "Enter your password to confirm this action.",
	confirmText = "Confirm",
	isLoadingText = "Processing...",
	buttonClass = "btn-danger",
	isLoading = false 
}) {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		
		if (!password.trim()) {
			setError("Password is required");
			return;
		}

		onConfirm(password);
	};

	const handleCancel = () => {
		setPassword("");
		setError("");
		onCancel();
	};

	return (
		<>
			<div className="modal-overlay" onClick={handleCancel} />
			
			<div className="password-modal">
				<h3 className="modal-title">{title}</h3>
				<p className="modal-description">
					{description}
				</p>

				<form onSubmit={handleSubmit} className="password-form">
					<Input
						label="Password*"
						name="password"
						type="password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							setError("");
						}}
						error={error}
						placeholder="Enter password"
					/>

					<div className="modal-buttons">
						<button
							type="button"
							className="btn-cancel"
							onClick={handleCancel}
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className={buttonClass}
							disabled={isLoading}
						>
							{isLoading ? isLoadingText : confirmText}
						</button>
					</div>
				</form>
			</div>
		</>
	);
}