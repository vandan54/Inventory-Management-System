import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../../components/table/Table";
import Form from "../../../components/form/Form";
import Select from "../../../components/form/Select";
import PasswordModal from "../../../components/modal/PasswordModal";
import { productServices } from "../../../services/api/productServices";
import { useAlert } from "../../../context/AlertContext";
import { useUser } from "../../../context/UserContext";
import "./Products.css";

// ===== INITIAL DATA =====
const INITIAL_FORM_DATA = {
	name: "",
	category: "",
	sku: "",
	unit: "",
	description: "",
	reorder_level: 0,
	track_batch: 0,
	track_expiry: 0,
	track_serial: 0,
	is_locked: 0,
};

// ===== TABLE =====
function getTableColumns() {
	return [
		{ key: "sku", label: "SKU" },
		{ key: "name", label: "Product Name" },
		{ key: "category", label: "Category" },
		{ key: "unit", label: "Unit" },
		{
			key: "description",
			label: "Description",
			render: (value) =>
				value ? value.substring(0, 30) + "..." : "",
		},
		{
			key: "is_locked",
			label: "Status",
			render: (value) => (
				<span className={`status-badge ${value === 0 ? "active" : "inactive"}`}>
					{value === 0 ? "Active" : "Inactive"}
				</span>
			),
		},
	];
}

// ===== ACTION =====
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

// ===== FORM =====
function getFormFields(formData, onChange, editingProduct) {
	const categoryOptions = [
		{ label: "Electronics", value: "Electronics" },
		{ label: "Furniture", value: "Furniture" },
		{ label: "Clothing", value: "Clothing" },
	];

	const unitOptions = [
		{ label: "Piece", value: "Piece" },
		{ label: "Kg", value: "Kg" },
		{ label: "Liter", value: "Liter" },
	];

	return [
		{ name: "name", label: "Product Name*", type: "text" },

		{
			name: "category",
			label: "Category*",
			component: (props) => (
				<Select {...props} options={categoryOptions} />
			),
		},

		{ name: "sku", label: "SKU*", type: "text" },

		{
			name: "unit",
			label: "Unit*",
			component: (props) => (
				<Select {...props} options={unitOptions} />
			),
		},

		{ name: "description", label: "Description", type: "text" },

		{ name: "reorder_level", label: "Reorder Level*", type: "number" },

		{
			name: "toggles",
			label: "",
			component: () => (
				<div className="toggle-grid">
					{["track_batch", "track_expiry", "track_serial"].map((key) => (
						<div className="toggle-item" key={key}>
							<span>{key.replace("track_", "Track ")}</span>
							<label className="switch">
								<input
									type="checkbox"
									checked={formData[key] === 1}
									onChange={(e) =>
										onChange({
											target: {
												name: key,
												value: e.target.checked ? 1 : 0,
											},
										})
									}
								/>
								<span className="slider"></span>
							</label>
						</div>
					))}

					{editingProduct && (
						<div className="toggle-item">
							<span>Status</span>
							<label className="switch">
								<input
									type="checkbox"
									checked={formData.is_locked === 0}
									onChange={(e) =>
										onChange({
											target: {
												name: "is_locked",
												value: e.target.checked ? 0 : 1,
											},
										})
									}
								/>
								<span className="slider"></span>
							</label>
						</div>
					)}
				</div>
			),
		},
	];
}

// ===== VALIDATION =====
function validateForm(formData) {
	const errors = {};
	if (!formData.name.trim()) errors.name = "Required";
	if (!formData.category) errors.category = "Required";
	if (!formData.sku.trim()) errors.sku = "Required";
	if (!formData.unit) errors.unit = "Required";
	if (formData.reorder_level === undefined || formData.reorder_level === null || formData.reorder_level === "") errors.reorder_level = "Required";
	if (!formData.description || !formData.description.trim()) {
		errors.description = "Required";
	} else if (formData.description.length > 255) {
		errors.description = "Description cannot exceed 255 characters";
	}
	return errors;
}

// ===== MAIN =====
export default function ProductsLayout() {
	const [products, setProducts] = useState([]);
	const [showForm, setShowForm] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);
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

	// ===== FETCH PRODUCTS =====
	const fetchProducts = async () => {
		try {
			const { response, data } = await productServices.searchProduct(
				currentPage,
				searchTerm
			);

			if (response.ok) {
				setProducts(data.data || []);
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
			fetchProducts();
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm, currentPage]);

	// ===== HANDLERS =====
	const handleAddClick = () => {
		setEditingProduct(null);
		setFormData(INITIAL_FORM_DATA);
		setShowForm(true);
	};

	const handleEditClick = (product) => {
		setEditingProduct(product);
		setFormData(product);
		setShowForm(true);
	};

	const handleClose = () => {
		setShowForm(false);
		setEditingProduct(null);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	// ===== SUBMIT =====
	const handleSubmit = async () => {
		const errors = validateForm(formData);
		if (Object.keys(errors).length > 0) {
			setFormErrors(errors);
			return;
		}

		setIsSubmitLoading(true);

		try {
			let result;

			if (editingProduct) {
				result = await productServices.updateProduct(
					editingProduct.id,
					formData
				);
			} else {
				result = await productServices.createProduct(formData);
			}

			const { response, data } = result;

			showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);

			if (data.code === "TOKEN_EXPIRED") {
				localStorage.removeItem("token");
				logout();
				navigate("/login");
				return;
			}

			if (response.ok) {
				handleClose();
				fetchProducts();
			}
		} catch (err) {
			console.log(err);
		} finally {
			setIsSubmitLoading(false);
		}
	};

	// ===== DELETE =====
	const handleConfirmDelete = async (password) => {
		setIsDeleteLoading(true);

		try {
			const { response, data } = await productServices.deleteProduct(
				editingProduct.id,
				password
			);

			showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);

			if (response.ok) {
				setShowDeleteModal(false);
				handleClose();
				fetchProducts();
			}
		} catch (err) {
			console.log(err);
		} finally {
			setIsDeleteLoading(false);
		}
	};

	return (
		<div className="product-wrapper">
			<div className="product-header">
				<h1 className="product-title">Products</h1>
				<button className="btn-primary" onClick={handleAddClick}>
					+ Add Product
				</button>
			</div>

			<div className="product-content">
				<div className="list-search">
					<input
						className="search-input"
						placeholder="Search by SKU, name, category, or description..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				<Table
					data={products}
					columns={getTableColumns()}
					actions={getTableActions(handleEditClick)}
					currentPage={currentPage}
					totalPages={totalPages}
					onPrevPage={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
					onNextPage={() =>
						currentPage < totalPages && setCurrentPage(currentPage + 1)
					}
					isLoading={isDataLoading}
				/>
			</div>

			{showForm && (
				<Form
					title={editingProduct ? "Edit Product" : "Add Product"}
					mode={editingProduct ? "edit" : "add"}
					fields={getFormFields(formData, handleChange, editingProduct)}
					values={formData}
					errors={formErrors}
					onChange={handleChange}
					onSubmit={handleSubmit}
					onDelete={editingProduct ? () => setShowDeleteModal(true) : null}
					onClose={handleClose}
					isLoading={isSubmitLoading}
				/>
			)}

			{showDeleteModal && (
				<PasswordModal
					title="Delete Product"
					description="Enter your password to confirm the deletion of this product. This action is permanent."
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