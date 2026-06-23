import { useState } from "react";

import Input from "../../../components/form/input";
import PhoneInput from "../../../components/form/PhoneInput";
import DateInput from "../../../components/form/DateInput";
import Select from "../../../components/form/Select";
import TextArea from "../../../components/form/TextArea";

import { useAlert } from "../../../context/AlertContext";

import "./UserForm.css";

export default function UserForm({onSubmit, isLoading = false}) {

    const [form, setForm] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        userEmail: "",
        userPhone: "",
        designation: "",
        dateOfBirth: "",
        gender: "",
        userAddress: "",
        userCity: "",
        userState: "",
        userPostalCode: "",
        userCountry: ""
    });

    const [errors, setErrors] = useState({});
    const {showAlert} = useAlert();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validate = () => {
        let newErrors = {};

        if (!form.firstName.trim()) newErrors.firstName = "First name required";
        if (!form.lastName.trim()) newErrors.lastName = "Last name required";
        if (!form.userEmail.trim()) newErrors.userEmail = "Email required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.userEmail)) newErrors.userEmail = "Invalid email format";
        if (!form.userPhone.trim()) {
            newErrors.userPhone = "Phone required";
        } else if (!/^[0-9]{10}$/.test(form.userPhone)) {
            newErrors.userPhone = "Phone must be 10 digits";
        }
        if (!form.designation.trim()) newErrors.designation = "Designation required";
        if (!form.dateOfBirth) newErrors.dateOfBirth = "Date of birth required";
        if (!form.gender) newErrors.gender = "Select gender";
        if (!form.userAddress.trim()) newErrors.userAddress = "Address required";
        if (!form.userCity.trim()) newErrors.userCity = "City required";
        if (!form.userState.trim()) newErrors.userState = "State required";
        
        if (!form.userPostalCode.trim()) {
            newErrors.userPostalCode = "Postal code required";
        } else if (!/^[0-9]{5,6}$/.test(form.userPostalCode)) {
            newErrors.userPostalCode = "Invalid postal code";
        }

        if (!form.userCountry.trim()) newErrors.userCountry = "Country required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(form);
        } else {
        showAlert(
            'Missing Information',
            'Please fill all required fields correctly.',
            'error',
            true
        );
        }
    };

    return (
        <div>
        <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}>
            <h2 className="section-title">Personal Information</h2>

            <div className="grid-3">

                <Input 
                    label="First Name" 
                    name="firstName" 
                    value={form.firstName} 
                    onChange={handleChange} 
                    error={errors.firstName}
                />

                <Input 
                    label="Middle Name" 
                    name="middleName" 
                    value={form.middleName} 
                    onChange={handleChange}
                    error={errors.middleName}
                />

                <Input 
                    label="Last Name" 
                    name="lastName" 
                    value={form.lastName} 
                    onChange={handleChange}
                    error={errors.lastName}
                />

                <Input 
                    label="Email" 
                    name="userEmail" 
                    value={form.userEmail} 
                    onChange={handleChange}
                    error={errors.userEmail}
                    type="email"
                />

                <PhoneInput 
                    label="Phone Number" 
                    name="userPhone" 
                    value={form.userPhone} 
                    onChange={handleChange}
                    error={errors.userPhone}
                />

                <Input 
                    label="Designation" 
                    name="designation" 
                    value={form.designation} 
                    onChange={handleChange}
                    error={errors.designation}
                />

                <DateInput 
                    label="Date of Birth" 
                    name="dateOfBirth" 
                    value={form.dateOfBirth} 
                    onChange={handleChange}
                    error={errors.dateOfBirth}
                />

                <Select
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    error={errors.gender}
                    options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" }
                    ]}
                />

                <TextArea 
                    label="Address" 
                    name="userAddress" 
                    value={form.userAddress} 
                    onChange={handleChange}
                    error={errors.userAddress}
                />

                <Input 
                    label="City" 
                    name="userCity" 
                    value={form.userCity} 
                    onChange={handleChange}
                    error={errors.userCity}
                />

                <Input 
                    label="State" 
                    name="userState" 
                    value={form.userState} 
                    onChange={handleChange}
                    error={errors.userState}
                />

                <Input 
                    label="Postal Code" 
                    name="userPostalCode" 
                    value={form.userPostalCode} 
                    onChange={handleChange}
                    error={errors.userPostalCode}
                />

                <Input 
                    label="Country" 
                    name="userCountry" 
                    value={form.userCountry} 
                    onChange={handleChange}
                    error={errors.userCountry}
                />
            </div>

            <div className="button-group">
                <button className="primary-btn" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? 'Completing...' : 'Complete Profile'}
                </button>
            </div>
        </form>

        </div>
    );
}