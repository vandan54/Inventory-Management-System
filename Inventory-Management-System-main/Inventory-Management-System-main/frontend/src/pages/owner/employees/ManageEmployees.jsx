import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../../components/table/Table";
import Form from "../../../components/form/Form";
import PasswordModal from "../../../components/modal/PasswordModal";
import Select from "../../../components/form/Select";
import { useAlert } from "../../../context/AlertContext";
import { useUser } from "../../../context/UserContext";
import { employeeServices } from "../../../services/api/employeeServices";
import "./ManageEmployees.css";

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
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "staff",
    gender: "Male",
    dateOfBirth: "",
    address: "",
    country: "India",
    state: "",
    city: "",
    postalCode: "",
    isActive: 1, // 1 for active, 0 for inactive
};

// ===== TABLE CONFIG =====
function getTableColumns() {
    return [
        {
            key: "name",
            label: "Name",
            // Mapping from database snake_case
            render: (value, row) => `${row.first_name} ${row.last_name}`.trim()
        },
        {
            key: "role",
            label: "Role",
            render: (value) => <span style={{ textTransform: 'capitalize' }}>{value}</span>
        },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        {
            key: "location",
            label: "Location",
            render: (value, row) => `${row.city}, ${row.state}`
        },
        {
            key: "is_active",
            label: "Status",
            render: (value) => (
                <span className={`status-badge ${value === 1 ? "active" : "locked"}`}>
                    {value === 1 ? "Active" : "Inactive"}
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
function getFormFields(formData, editingEmployee) {
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

    const roleOptions = [
        { label: "Manager", value: "manager" },
        { label: "Staff", value: "staff" },
    ];

    const genderOptions = [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
        { label: "Other", value: "Other" },
    ];

    const baseFields = [
        {
            name: "firstName",
            label: "First Name*",
            type: "text",
            placeholder: "Enter first name",
        },
        {
            name: "middleName",
            label: "Middle Name",
            type: "text",
            placeholder: "Enter middle name",
        },
        {
            name: "lastName",
            label: "Last Name*",
            type: "text",
            placeholder: "Enter last name",
        },
        {
            name: "email",
            label: "Email Address*",
            type: "email",
            placeholder: "Enter email address",
            disabled: !!editingEmployee, // Disabled during edit
        },
        {
            name: "phone",
            label: "Phone Number*",
            type: "text",
            placeholder: "Enter phone number",
        },
        {
            name: "role",
            label: "Role*",
            component: (props) => (
                <Select {...props} options={roleOptions} />
            ),
        },
        {
            name: "gender",
            label: "Gender*",
            component: (props) => (
                <Select {...props} options={genderOptions} />
            ),
        },
        {
            name: "dateOfBirth",
            label: "Date of Birth*",
            type: "date",
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
            name: "postalCode",
            label: "Postal Code*",
            type: "text",
            placeholder: "Enter postal code",
        },
    ];

    if (editingEmployee) {
        baseFields.push({
            name: "isActive",
            label: "Account Status",
            component: (props) => (
                <div className="status-toggle-section">
                    <label>{props.label}</label>
                    <div className="status-toggle">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={props.value === 1}
                                onChange={(e) =>
                                    props.onChange({
                                        target: {
                                            name: props.name,
                                            value: e.target.checked ? 1 : 0,
                                        },
                                    })
                                }
                            />
                            <span className="slider"></span>
                        </label>
                        <span className="status-text">
                            {props.value === 1 ? "Active" : "Inactive"}
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

    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";

    if (!formData.email.trim()) {
        errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
        errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
        errors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.role) errors.role = "Role is required";
    if (!formData.gender) errors.gender = "Gender is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.country) errors.country = "Country is required";
    if (!formData.state) errors.state = "State is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.postalCode.trim()) {
        errors.postalCode = "Postal code is required";
    }

    return errors;
}

// ===== MAIN COMPONENT =====
export default function ManageTeamLayout() {
    // State
    const [teamMembers, setTeamMembers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [formErrors, setFormErrors] = useState({});
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isSubmitLoading, setIsSubmitLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    const { showAlert } = useAlert();
    const { logout } = useUser();
    const navigate = useNavigate();

    const fetchTeamMembers = async () => {
        try {
            const { response, data } = await employeeServices.searchEmployee(currentPage, searchTerm);
            if (response.ok) {
                setTeamMembers(data.data || []);
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
            fetchTeamMembers();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, currentPage]);

    // Handlers
    const handleAddClick = () => {
        setEditingEmployee(null);
        setFormData(INITIAL_FORM_DATA);
        setFormErrors({});
        setShowForm(true);
    };

    const handleEditClick = (employee) => {
        setEditingEmployee(employee);

        // Map database (snake_case) to React state (camelCase)
        setFormData({
            firstName: employee.first_name || "",
            middleName: employee.middle_name || "",
            lastName: employee.last_name || "",
            email: employee.email || "",
            phone: employee.phone || "",
            role: employee.role || "staff",
            gender: employee.gender || "Male",
            dateOfBirth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : "",
            address: employee.address || "",
            country: employee.country || "India",
            state: employee.state || "",
            city: employee.city || "",
            postalCode: employee.postal_code || "",
            isActive: employee.is_active !== undefined ? employee.is_active : 1,
        });

        setFormErrors({});
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingEmployee(null);
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

        // Prep API payload by mapping React state (camelCase) back to DB schema (snake_case)
        const apiPayload = {
            first_name: formData.firstName,
            middle_name: formData.middleName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            gender: formData.gender,
            date_of_birth: formData.dateOfBirth,
            address: formData.address,
            country: formData.country,
            state: formData.state,
            city: formData.city,
            postal_code: formData.postalCode,
            is_active: formData.isActive
        };

        try {
            if (!editingEmployee) {
                const { response, data } = await employeeServices.createEmployee(apiPayload);

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
                    fetchTeamMembers();
                }
            } else {
                const { response, data } = await employeeServices.updateEmployee(editingEmployee.id, apiPayload);

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
                    fetchTeamMembers();
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
            const { response, data } = await employeeServices.deleteEmployee(editingEmployee.id, password);

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
                fetchTeamMembers();
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
                <h1 className="warehouse-title">Manage Employees</h1>
                <button className="btn-primary" onClick={handleAddClick}>
                    + Add Employee
                </button>
            </div>

            <div className="warehouse-content">
                <div className="list-search">
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="search-input"
                    />
                </div>

                <Table
                    data={teamMembers}
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
                    title={editingEmployee ? "Edit Employee Details" : "Add New Employee"}
                    mode={editingEmployee ? "edit" : "add"}
                    fields={getFormFields(formData, editingEmployee)}
                    values={formData}
                    errors={formErrors}
                    onChange={handleFormChange}
                    onSubmit={handleFormSubmit}
                    onDelete={editingEmployee ? handleDeleteClick : null}
                    onClose={handleCloseForm}
                    isLoading={isSubmitLoading}
                />
            )}

            {showDeleteModal && (
                <PasswordModal
                    title="Remove Employee"
                    description="Enter your password to confirm the removal of this employee."
                    confirmText="Remove"
                    isLoadingText="Removing..."
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    isLoading={isDeleteLoading}
                />
            )}
        </div>
    );
}