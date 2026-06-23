import { useUser } from "../../context/UserContext";
import "./Profile.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/form/input";
import PhoneInput from "../../components/form/PhoneInput";
import { ownerServices } from "../../services/api/ownerService";
import { useAlert } from "../../context/AlertContext";
import { jwtDecode } from "jwt-decode";

export default function Profile() {
    const { user, login } = useUser();
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const [showEditModal, setShowEditModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState(null);

    const [formValues, setFormValues] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        userPhone: "",
        userAddress: "",
        userCity: "",
        userState: "",
        userPostalCode: "",
        userCountry: "",
        businessName: "",
        businessAddress: "",
        city: "",
        state: "",
        postalCode: "",
        businessContactEmail: "",
        businessContactPhone: "",
        country: ""
    });

    const [formErrors, setFormErrors] = useState({});

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setFormValues((prev) => ({
            ...prev,
            [name]: value
        }));

        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleEditClick = () => {
        setShowEditModal(true);
    };

    const handleFormSubmit = async () => {
        setIsSaving(true);
        try {
            const res = await ownerServices.editProfile(formValues);

            if (res.response.ok && res.data.status) {
                if (res.data.alertTitle) {
                    showAlert(res.data.alertTitle, res.data.message, res.data.alertType, res.data.autoClose);
                }
                
                if (res.data.accessToken) {
                    localStorage.setItem('token', res.data.accessToken);
                    const decoded = jwtDecode(res.data.accessToken);
                    login({
                        id: decoded.userId,
                        userName: decoded.userName,
                        email: decoded.userEmail,
                        businessId: decoded.userbusinessId,
                        role: decoded.userRole,
                        businessName: decoded.businessName,
                        profileCompleted: decoded.isProfileCompleted,
                        mustChangePassword: decoded.mustChangePassword
                    });
                }
                
                fetchProfile();
                setShowEditModal(false);
            } else {
                if (res.data.alertTitle) {
                    showAlert(res.data.alertTitle, res.data.message, res.data.alertType, res.data.autoClose);
                }
            }
        } catch (err) {
            console.error("Failed to edit profile", err);
            showAlert("Server Error", "An unexpected error occurred while saving the profile.", "error", true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseModal = () => {
        setShowEditModal(false);
        setFormErrors({});
    };

    const fetchProfile = async () => {
        try {
            const res = await ownerServices.getProfile();
            if (res.response.ok && res.data.status) {
                const data = res.data.data;
                setProfileData(data);
                
                setFormValues({
                    firstName: data.first_name || "",
                    middleName: data.middle_name || "",
                    lastName: data.last_name || "",
                    userPhone: data.phone || "",
                    userAddress: data.address || "",
                    userCity: data.city || "",
                    userState: data.state || "",
                    userPostalCode: data.postal_code || "",
                    userCountry: data.country || "",
                    businessName: data.business_name || "",
                    businessAddress: data.businessAddress || "",
                    city: data.businessCity || "",
                    state: data.businessState || "",
                    postalCode: data.businessPostalCode || "",
                    businessContactEmail: data.businessContactEmail || "",
                    businessContactPhone: data.businessContactPhone || "",
                    country: data.businessCountry || ""
                });
            }
        } catch (err) {
            console.error("Error fetching profile", err);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchProfile();
    }, [user]);

    if (!user || !profileData) {
        return (
            <div className="profile-page">
                <div className="personal-details" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <p style={{ fontSize: '18px', color: '#666' }}>Loading profile details...</p>
                </div>
            </div>
        );
    }

    const roleLabel = {
        owner: "Owner",
        manager: "Manager",
        staff: "Staff"
    };

    const actualRole = user.role;

    return (
        <div className="profile-page">

            {/* PERSONAL DETAILS */}
            <div className="personal-details">
                <h2>Personal Details</h2>

                <div className="profile-row">
                    <span className="label">First Name</span>
                    <span>{profileData.first_name || "-"}</span>
                </div>

                <div className="profile-row">
                    <span className="label">Middle Name</span>
                    <span>{profileData.middle_name || "-"}</span>
                </div>

                <div className="profile-row">
                    <span className="label">Last Name</span>
                    <span>{profileData.last_name || "-"}</span>
                </div>

                <div className="profile-row">
                    <span className="label">Role</span>
                    <span>{roleLabel[actualRole] || "-"}</span>
                </div>

                <div className="profile-row">
                    <span className="label">Business</span>
                    <span>{profileData.business_name || "-"}</span>
                </div>
            </div>

            {/* CONTACT */}
            <div className="contact-details">
                <h2>Contact Details</h2>

                <div className="profile-row">
                    <span className="label">Email</span>
                    <span>{profileData.email || "-"}</span>
                </div>

                <div className="profile-row">
                    <span className="label">Contact Number</span>
                    <span>{profileData.phone || "-"}</span>
                </div>
            </div>

            {/* ADDRESS */}
            <div className="address-section">
                <h2>Address</h2>

                <div className="profile-row">
                    <span className="label">Address</span>
                    <span>{profileData.address || "-"}</span>
                </div>

                <div className="profile-row">
                    <span className="label">City</span>
                    <span>{profileData.city || "-"}</span>
                </div>

                <div className="profile-row">
                    <span className="label">State</span>
                    <span>{profileData.state || "-"}</span>
                </div>

                <div className="profile-row">
                    <span className="label">Postal Code</span>
                    <span>{profileData.postal_code || "-"}</span>
                </div>

                <div className="profile-row">
                    <span className="label">Country</span>
                    <span>{profileData.country || "-"}</span>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="profile-actions">

                {/* ✅ ONLY OWNER CAN SEE EDIT BUTTON */}
                {actualRole === "owner" && (
                    <button className="btn btn-primary" onClick={handleEditClick}>
                        Edit Profile
                    </button>
                )}

                <button
                    className="btn btn-warning"
                    onClick={() => navigate(`/${actualRole}/update-password`)}
                >
                    Update Password
                </button>

            </div>

            {/* EDIT MODAL */}
            {showEditModal && (
                <>
                    <div className="modal-overlay" onClick={handleCloseModal} />

                    <div className="profile-edit-modal">
                        <div className="modal-header">
                            <h2>Edit Profile</h2>
                            <button className="btn-close" onClick={handleCloseModal}>✕</button>
                        </div>

                        <div className="modal-body">

                            {/* PERSONAL */}
                            <div className="edit-card">
                                <div className="card-header">
                                    <h3>Personal Details</h3>
                                </div>

                                <div className="card-body">
                                    <Input label="First Name" name="firstName" value={formValues.firstName} onChange={handleFormChange} />
                                    <Input label="Middle Name" name="middleName" value={formValues.middleName} onChange={handleFormChange} />
                                    <Input label="Last Name" name="lastName" value={formValues.lastName} onChange={handleFormChange} />
                                    <PhoneInput label="Phone" name="userPhone" value={formValues.userPhone} onChange={handleFormChange} />
                                    <Input label="Address" name="userAddress" value={formValues.userAddress} onChange={handleFormChange} />
                                    <Input label="City" name="userCity" value={formValues.userCity} onChange={handleFormChange} />
                                    <Input label="State" name="userState" value={formValues.userState} onChange={handleFormChange} />
                                    <Input label="Postal Code" name="userPostalCode" value={formValues.userPostalCode} onChange={handleFormChange} />
                                    <Input label="Country" name="userCountry" value={formValues.userCountry} onChange={handleFormChange} />
                                </div>
                            </div>

                            {/* BUSINESS */}
                            <div className="edit-card">
                                <div className="card-header">
                                    <h3>Business Details</h3>
                                </div>

                                <div className="card-body">
                                    <Input label="Business Name" name="businessName" value={formValues.businessName} onChange={handleFormChange} />
                                    <Input label="Business Address" name="businessAddress" value={formValues.businessAddress} onChange={handleFormChange} />
                                    <Input label="Business City" name="city" value={formValues.city} onChange={handleFormChange} />
                                    <Input label="Business State" name="state" value={formValues.state} onChange={handleFormChange} />
                                    <Input label="Business Postal Code" name="postalCode" value={formValues.postalCode} onChange={handleFormChange} />
                                    <Input label="Business Email" name="businessContactEmail" type="email" value={formValues.businessContactEmail} onChange={handleFormChange} />
                                    <PhoneInput label="Business Phone" name="businessContactPhone" value={formValues.businessContactPhone} onChange={handleFormChange} />
                                    <Input label="Business Country" name="country" value={formValues.country} onChange={handleFormChange} />
                                </div>
                            </div>

                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleFormSubmit} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}