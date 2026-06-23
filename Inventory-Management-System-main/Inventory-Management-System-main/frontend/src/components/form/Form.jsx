import Input from "./input";
import "./Form.css";

export default function Form({
	title,
	mode = "add",
	fields,
	values,
	errors,
	onChange,
	onSubmit,
	onDelete,
	onClose,
	isLoading = false
}) {
	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit();
	};

	return (
		<>
			<div className="form-overlay" onClick={onClose} />

			<div className="form-modal">
				<div className="form-header">
					<h2 className="form-title">{title}</h2>
					<button className="btn-close" onClick={onClose}>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="form-content">
					{fields.map((field) => (
						<div key={field.name}>
							{field.component ? (
								field.component({
									name: field.name,
									label: field.label,
									value: values[field.name],
									onChange,
									error: errors[field.name],
									...field.props
								})
							) : (
								<Input
									label={field.label}
									name={field.name}
									type={field.type || "text"}
									value={values[field.name] ?? ""}
									onChange={onChange}
									error={errors[field.name]}
									placeholder={field.placeholder}
									disabled={field.disabled}
								/>
							)}
						</div>
					))}
				</form>

				<div className="form-footer">
					{mode === "edit" && onDelete && (
						<button
							type="button"
							className="btn-danger"
							onClick={onDelete}
							disabled={isLoading}
						>
							Delete
						</button>
					)}
					<button
						type="submit"
						className="btn-primary"
						onClick={handleSubmit}
						disabled={isLoading}
					>
						{isLoading ? (mode === "edit" ? "Updating..." : "Adding...") : (mode === "edit" ? "Update" : "Add")}
					</button>
				</div>
			</div>
		</>
	);
}