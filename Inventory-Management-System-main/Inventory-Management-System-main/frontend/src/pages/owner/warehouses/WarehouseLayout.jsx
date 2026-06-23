import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../../components/table/Table";
import Form from "../../../components/form/Form";
import PasswordModal from "../../../components/modal/PasswordModal";
import Select from "../../../components/form/Select";
import { useAlert } from "../../../context/AlertContext";
import { useUser } from "../../../context/UserContext";
import { warehouseServices } from "../../../services/api/warehouseServices";
import "./Warehouse.css";

// ===== LOCATION DATA =====
const locationData = {
	India: {
		Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Nadiad", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand"],
		Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Thane", "Kolhapur", "Amravati", "Nanded"],
		Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Dharwad", "Belagavi", "Ballari", "Shivamogga", "Tumakuru", "Udupi"],
		Delhi: ["NewDelhi", "NorthDelhi", "SouthDelhi", "EastDelhi", "WestDelhi", "Dwarka", "Rohini", "KarolBagh", "Saket", "Janakpuri"],
	},
	USA: {
		California: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Sacramento"],
		Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
	},
	UK: {
		England: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
		Scotland: ["Edinburgh", "Glasgow", "Aberdeen"],
	},
};


const INITIAL_FORM_DATA = {
	name: "",
	address: "",
	country: "India",
	state: "",
	city: "",
	postal_code: "",
	is_locked: 0,
};

// ===== TABLE CONFIG =====
function getTableColumns() {
	return [
		{ key: "name", label: "Name" },
		{ key: "address", label: "Address" },
		{ key: "city", label: "City" },
		{ key: "state", label: "State" },
		{ key: "postal_code", label: "Postal Code" },
		{
			key: "is_locked",
			label: "Status",
			render: (value) => (
				<span className={`status-badge ${value === 0 ? "active" : "locked"}`}>
					{value === 0 ? "Active" : "Locked"}
				</span>
			),
		},
	];
}

function getTableActions(onEditClick) {
	return [
		{
			key: "edit",
			label: "Edit",
			type: "edit",
			handler: (row) => onEditClick(row),
		},
	];
}

// ===== FORM CONFIG =====
function getFormFields(formData, editingWarehouse) {
	const countryOptions = Object.keys(locationData).map((country) => ({
		label: country,
		value: country,
	}));

	const stateOptions =
		formData.country && locationData[formData.country]
			? Object.keys(locationData[formData.country]).map((state) => ({
				label: state,
				value: state,
			}))
			: [];

	const cityOptions =
		formData.country && formData.state && locationData[formData.country]?.[formData.state]
			? locationData[formData.country][formData.state].map((city) => ({
				label: city,
				value: city,
			}))
			: [];

	const baseFields = [
		{
			name: "name",
			label: "Warehouse Name*",
			type: "text",
			placeholder: "Enter warehouse name",
		},
		{
			name: "address",
			label: "Address*",
			type: "text",
			placeholder: "Enter address",
		},
		{
			name: "country",
			label: "Country*",
			component: (props) => (
				<Select {...props} options={countryOptions} />
			),
		},
		{
			name: "state",
			label: "State*",
			component: (props) => (
				<Select {...props} options={stateOptions} />
			),
		},
		{
			name: "city",
			label: "City*",
			component: (props) => (
				<Select {...props} options={cityOptions} />
			),
		},
		{
			name: "postal_code",
			label: "Postal Code*",
			type: "text",
			placeholder: "Enter postal code",
		},
	];

	if (editingWarehouse) {
		baseFields.push({
			name: "is_locked",
			label: "Status",
			component: (props) => (
				<div className="status-toggle-section">
					<label>{props.label}</label>
					<div className="status-toggle">
						<label className="switch">
							<input
								type="checkbox"
								checked={props.value === 0}
								onChange={(e) =>
									props.onChange({
										target: {
											name: props.name,
											value: e.target.checked ? 0 : 1,
										},
									})
								}
							/>
							<span className="slider"></span>
						</label>
						<span className="status-text">
							{props.value === 0 ? "Active" : "Locked"}
						</span>
					</div>
				</div>
			),
		});
	}

	return baseFields;
}

// ===== VALIDATION =====
function validateForm(formData) {
	const errors = {};

	if (!formData.name.trim()) errors.name = "Warehouse name is required";
	if (!formData.address.trim()) errors.address = "Address is required";
	if (!formData.country) errors.country = "Country is required";
	if (!formData.state) errors.state = "State is required";
	if (!formData.city) errors.city = "City is required";
	if (!formData.postal_code.trim()) {
		errors.postal_code = "Postal code is required";
	} else if (!/^[0-9]{6}$/.test(formData.postal_code)) {
		errors.postal_code = "Please provide a valid 6-digit postal code";
	}

	return errors;
}

// ===== MAIN COMPONENT =====
export default function WarehouseLayout() {
	// State
	const [warehouses, setWarehouses] = useState([]);
	const [showForm, setShowForm] = useState(false);
	const [editingWarehouse, setEditingWarehouse] = useState(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [formData, setFormData] = useState(INITIAL_FORM_DATA);
	const [formErrors, setFormErrors] = useState({});
	const [isDataLoading, setIsDataLoading] = useState(true);
	const [isSubmitLoading, setIsSubmitLoading] = useState(false);
	const [isDeleteLoading, setIsDeleteLoading] = useState(false);

	const { showAlert } = useAlert();
	const { logout } = useUser();
	const navigate = useNavigate();

	const fetchWarehouses = async () => {
		try {
			const { response, data } = await warehouseServices.searchWarehouse(currentPage, searchTerm);
			if (response.ok) {
				setWarehouses(data.data || []);
				setTotalPages(data.pagination?.totalPages || 1);
			}
		} catch (err) {
			console.log(err);
		} finally {
			setIsDataLoading(false);
		}
	};

	useEffect(() => {
		setIsDataLoading(true);
		const timer = setTimeout(() => {
			fetchWarehouses();
		}, 500);                      //this time delay is required for stopping multiple api call for fetch data

		return () => clearTimeout(timer);
	}, [searchTerm, currentPage]);

	// Handlers
	const handleAddClick = () => {
		setEditingWarehouse(null);
		setFormData(INITIAL_FORM_DATA);
		setFormErrors({});
		setShowForm(true);
	};

	const handleEditClick = (warehouse) => {
		setEditingWarehouse(warehouse);
		setFormData(warehouse);
		setFormErrors({});
		setShowForm(true);
	};

	const handleCloseForm = () => {
		setShowForm(false);
		setEditingWarehouse(null);
		setFormData(INITIAL_FORM_DATA);
		setFormErrors({});
	};

	const handleFormChange = (e) => {
		const { name, value } = e.target;
		let updated = { ...formData, [name]: value };

		if (name === "country") {
			updated.state = "";
			updated.city = "";
		}
		if (name === "state") {
			updated.city = "";
		}

		setFormData(updated);
		if (formErrors[name]) {
			setFormErrors({ ...formErrors, [name]: "" });
		}
	};

	const handleFormSubmit = async () => {
		const errors = validateForm(formData);

		if (Object.keys(errors).length > 0) {
			setFormErrors(errors);
			return;
		}

		setIsSubmitLoading(true);
		try {
			if (!editingWarehouse) {
				const { response, data } = await warehouseServices.createWarehouse(formData);

				showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);

				if (data.code === 'TOKEN_EXPIRED') {
					setTimeout(() => {
						localStorage.removeItem('token');
						logout();
						navigate('/login');
					}, 1500);
					return;
				}

				if (response.ok) {
					handleCloseForm();
					fetchWarehouses();
				}
			} else {
				const { response, data } = await warehouseServices.updateWarehouse(editingWarehouse.id, formData);

				showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);

				if (data.code === 'TOKEN_EXPIRED') {
					setTimeout(() => {
						localStorage.removeItem('token');
						logout();
						navigate('/login');
					}, 1500);
					return;
				}

				if (response.ok) {
					handleCloseForm();
					fetchWarehouses();
				}
			}
		} catch (err) {
			console.log(err);
			showAlert(
				'Connection Failed',
				'Unable to connect to the server. Please try again.',
				'error',
				true
			);
		} finally {
			setIsSubmitLoading(false);
		}
	};

	const handleDeleteClick = () => {
		setShowDeleteModal(true);
	};

	const handleConfirmDelete = async (password) => {
		setIsDeleteLoading(true);

		try {
			const { response, data } = await warehouseServices.deleteWarehouse(editingWarehouse.id, password);

			showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);

			if (data.code === 'TOKEN_EXPIRED') {
				setTimeout(() => {
					localStorage.removeItem('token');
					logout();
					navigate('/login');
				}, 1500);
				return;
			}

			if (response.ok) {
				setShowDeleteModal(false);
				handleCloseForm();
				fetchWarehouses();
			}
		} catch (err) {
			console.log(err);
			showAlert(
				'Connection Failed',
				'Unable to connect to the server. Please try again.',
				'error',
				true
			);
		} finally {
			setIsDeleteLoading(false);
		}
	};

	const handleSearch = (e) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1);
	};

	// Render
	return (
		<div className="warehouse-wrapper">
			<div className="warehouse-header">
				<h1 className="warehouse-title">Warehouses</h1>
				<button className="btn-primary" onClick={handleAddClick}>
					+ Add Warehouse
				</button>
			</div>

			<div className="warehouse-content">
				<div className="list-search">
					<input
						type="text"
						placeholder="Search by name, city, state, or address..."
						value={searchTerm}
						onChange={handleSearch}
						className="search-input"
					/>
				</div>

				<Table
					data={warehouses}
					columns={getTableColumns()}
					actions={getTableActions(handleEditClick)}
					currentPage={currentPage}
					totalPages={totalPages}
					onPrevPage={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
					onNextPage={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
					isLoading={isDataLoading}
				/>
			</div>

			{showForm && (
				<Form
					title={editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
					mode={editingWarehouse ? "edit" : "add"}
					fields={getFormFields(formData, editingWarehouse)}
					values={formData}
					errors={formErrors}
					onChange={handleFormChange}
					onSubmit={handleFormSubmit}
					onDelete={editingWarehouse ? handleDeleteClick : null}
					onClose={handleCloseForm}
					isLoading={isSubmitLoading}
				/>
			)}

			{showDeleteModal && (
				<PasswordModal
					title="Delete Warehouse"
					description="Enter your password to confirm deletion of this warehouse."
					confirmText="Delete"
					isLoadingText="Deleting..."
					onConfirm={handleConfirmDelete}
					onCancel={() => setShowDeleteModal(false)}
					isLoading={isDeleteLoading}
				/>
			)}
		</div>
	);
}