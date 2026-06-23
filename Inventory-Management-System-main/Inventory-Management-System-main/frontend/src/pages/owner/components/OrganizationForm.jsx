import { useState } from "react";

import Input from "../../../components/form/input";
import Select from "../../../components/form/Select";
import PhoneInput from "../../../components/form/PhoneInput";
import TextArea from "../../../components/form/TextArea";

import { useAlert } from "../../../context/AlertContext";

import "./OrganizationForm.css";

export default function OrganizationForm({ onSubmit, isLoading = false }) {

    const [form, setForm] = useState({
        businessName: "",
        regitrationNo: "",
        taxId: "",
        businessType: "",
        industry: "",
        businessAddress: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        businessContactEmail: "",
        businessContactPhone: ""
    });

    const [errors, setErrors] = useState({});
    const {showAlert} = useAlert();

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const validate = () => {
        let newErrors = {};

        if (!form.businessName.trim()) newErrors.businessName = "Organization name required";
        if (!form.regitrationNo.trim()) newErrors.regitrationNo = "Registration number required";
        if (!form.taxId.trim()) newErrors.taxId = "Tax ID required";
        if (!form.businessType) newErrors.businessType = "Select business type";
        if (!form.industry) newErrors.industry = "Select industry";
        if (!form.businessAddress.trim()) newErrors.businessAddress = "Address required";
        if (!form.city.trim()) newErrors.city = "City required";
        if (!form.state.trim()) newErrors.state = "State required";
        
        if (!form.postalCode.trim()) {
            newErrors.postalCode = "Postal code required";
        } else if (!/^[0-9]{5,6}$/.test(form.postalCode)) {
            newErrors.postalCode = "Invalid postal code";
        }

        if (!form.country.trim()) newErrors.country = "Country required";
        
        if (!form.businessContactEmail.trim()) {
            newErrors.businessContactEmail = "Email required";
        } else if (!/\S+@\S+\.\S+/.test(form.businessContactEmail)) {
            newErrors.businessContactEmail = "Invalid email";
        }

        if (!form.businessContactPhone.trim()) {
            newErrors.businessContactPhone = "Phone required";
        } else if (!/^[0-9]{10}$/.test(form.businessContactPhone)) {
            newErrors.businessContactPhone = "Phone must be 10 digits";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
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
            handleNext();
        }}>
        <h2 className="section-title">Organization Details</h2>

        <div className="grid-2">

            <Input
            label="Organization Name"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            error={errors.businessName}
            />

            <Input
            label="Registration Number"
            name="regitrationNo"
            value={form.regitrationNo}
            onChange={handleChange}
            error={errors.regitrationNo}
            />

            <Input
            label="Tax ID"
            name="taxId"
            value={form.taxId}
            onChange={handleChange}
            error={errors.taxId}
            />

            <Select
            label="Business Type"
            name="businessType"
            value={form.businessType}
            onChange={handleChange}
            error={errors.businessType}
            options={[
                { value: "sole", label: "Sole Proprietorship" },
                { value: "partnership", label: "Partnership" },
                { value: "private", label: "Private Limited" },
                { value: "public", label: "Public Limited" },
                { value: "llp", label: "LLP" }
            ]}
            />

            <Select
            label="Industry"
            name="industry"
            value={form.industry}
            onChange={handleChange}
            error={errors.industry}
            options={[
                { value: "it", label: "IT & Software" },
                { value: "finance", label: "Finance" },
                { value: "health", label: "Healthcare" },
                { value: "education", label: "Education" },
                { value: "manufacturing", label: "Manufacturing" }
            ]}
            />

            <TextArea
            label="Address"
            name="businessAddress"
            value={form.businessAddress}
            onChange={handleChange}
            error={errors.businessAddress}
            />

            <Input
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
            error={errors.city}
            />

            <Input
            label="State"
            name="state"
            value={form.state}
            onChange={handleChange}
            error={errors.state}
            />

            <Input
            label="Postal Code"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            error={errors.postalCode}
            />

            <Input
            label="Country"
            name="country"
            value={form.country}
            onChange={handleChange}
            error={errors.country}
            />

            <Input
            label="Email"
            name="businessContactEmail"
            value={form.businessContactEmail}
            onChange={handleChange}
            error={errors.businessContactEmail}
            />

            <PhoneInput
            label="Phone Number"
            name="businessContactPhone"
            value={form.businessContactPhone}
            onChange={handleChange}
            error={errors.businessContactPhone}
            />

        </div>

        <div className="button-group">
            <button className="primary-btn" type="submit" onClick={handleNext} disabled={isLoading}>
            Next
            </button>
        </div>
        </form>

        </div>
    );
}