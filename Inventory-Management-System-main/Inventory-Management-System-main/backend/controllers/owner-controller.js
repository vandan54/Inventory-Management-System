const { updateProfile, editProfile, getFullProfile } = require("../models/owner-model");
const { getUser } = require("../models/auth-model");
const { signJWTToken } = require('../helpers/webToken-helper');

const completeProfile = async (req, res) => {
    try {
        const {
            //business details
            businessName,
            regitrationNo,
            taxId,
            businessType,
            industry,
            businessAddress,
            city,
            state,
            postalCode,
            businessContactEmail,
            businessContactPhone,
            country,

            //user details
            firstName,
            middleName,
            lastName,
            userPhone,
            designation,
            dateOfBirth,
            gender,
            userAddress,
            userCity,
            userState,
            userPostalCode,
            userCountry
        } = req.body ?? {};

        const requiredField = {
            businessName,
            regitrationNo,
            taxId,
            businessType,
            industry,
            businessAddress,
            city,
            state,
            postalCode,
            businessContactEmail,
            businessContactPhone,
            country,
            firstName,
            middleName,
            lastName,
            userPhone,
            designation,
            dateOfBirth,
            gender,
            userAddress,
            userCity,
            userState,
            userPostalCode,
            userCountry
        };

        const missingFields = Object.entries(requiredField)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: false,
                message: `Please provide: ${missingFields.join(', ')}`,
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        const result = await updateProfile(
            req.user.userbusinessId,
            businessName,
            regitrationNo,
            taxId,
            businessType,
            industry,
            businessAddress,
            city,
            state,
            postalCode,
            businessContactEmail,
            businessContactPhone,
            country,
            firstName,
            middleName,
            lastName,
            userPhone,
            designation,
            dateOfBirth,
            gender,
            userAddress,
            userCity,
            userState,
            userPostalCode,
            userCountry
        );

        const newToken = signJWTToken({
            ...req.user,
            isProfileCompleted: 1
        });

        if (result) {
            return res.status(200).json({
                status: true,
                message: "Your profile has been successfully completed. You can now start managing your inventory.",
                alertTitle: "Profile Completed",
                alertType: "success",
                autoClose: true,
                accessToken: newToken
            });
        }
    } catch (err) {
        console.error('Error registering owner:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const editProfileOwner = async (req, res) => {
    try {
        const {
            //business details
            businessName,
            businessAddress,
            city,
            state,
            postalCode,
            businessContactEmail,
            businessContactPhone,
            country,

            //user details
            firstName,
            middleName,
            lastName,
            userPhone,
            userAddress,
            userCity,
            userState,
            userPostalCode,
            userCountry
        } = req.body ?? {};

        const requiredField = {
            businessName,
            businessAddress,
            city,
            state,
            postalCode,
            businessContactEmail,
            businessContactPhone,
            country,
            firstName,
            middleName,
            lastName,
            userPhone,
            userAddress,
            userCity,
            userState,
            userPostalCode,
            userCountry
        };

        const missingFields = Object.entries(requiredField)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: false,
                message: `Please provide: ${missingFields.join(', ')}`,
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        const result = await editProfile(
            req.user.userId,
            req.user.userbusinessId,
            businessName,
            businessAddress,
            city,
            state,
            postalCode,
            businessContactEmail,
            businessContactPhone,
            country,
            firstName,
            middleName,
            lastName,
            userPhone,
            userAddress,
            userCity,
            userState,
            userPostalCode,
            userCountry
        );

        if (result) {
            const [userRows] = await getUser(req.user.userEmail);
            
            if (userRows && userRows.length > 0) {
                const newToken = signJWTToken(userRows[0]);

                return res.status(200).json({
                    status: true,
                    message: "Your profile has been successfully updated.",
                    alertTitle: "Profile Updated",
                    alertType: "success",
                    autoClose: true,
                    accessToken: newToken
                });
            } else {
                throw new Error("Failed to retrieve updated user data for token generation");
            }
        }
    } catch (err) {
        console.error('Error editing profile:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await getFullProfile(userId);

        if (!result || result[0].length === 0) {
            return res.status(404).json({
                status: false,
                message: "Profile not found.",
                alertTitle: "Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        const profileData = result[0][0];

        return res.status(200).json({
            status: true,
            data: profileData
        });
    } catch (err) {
        console.error('Error fetching profile:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong while fetching profile.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

module.exports = {
    completeProfile,
    editProfileOwner,
    getProfile
};