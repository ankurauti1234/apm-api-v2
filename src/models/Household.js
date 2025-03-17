// Household.js
import mongoose from 'mongoose';

const householdSchema = new mongoose.Schema({
    HHID: {
        type: Number,
        required: true,
        unique: true
    },
    hh_email: String,
    hh_phone: String,
    max_members: {
        type: Number,
        default: 0
    },
    max_submeters: { // Added max_submeters field
        type: Number,
        default: 0
    },
    hh_status: {
        type: Boolean,
        default: true
    },
    otp: {
        type: String,
        default: null
    },
    is_assigned: {
        type: Boolean,
        default: false
    },
    Address: String,
    City: String,
    State: String,
    Region: String,
    TVOwnership: String,
    NoOfTVs: Number,
    members: [{
        MMID: String,
        Name: { type: String, required: true },
        MiddleName: String,
        LastName: String,
        Age: { type: Number, required: true },
        Gender: { type: String, required: true },
        EconomicBracket: String,
        PhoneNumber: String,
        AlternativePhoneNumber: String,
        EducationLevel: String,
        Occupation: String,
        MaritalStatus: String,
        NumberOfChildren: Number,
        LanguageSpoken: String,
        StreamingServiceSubscription: String,
        PreferredTVGenre: String,
        HoursOfTVWatchedDaily: Number,
        PetOwner: String,
        TypeOfPet: String,
        CarOwner: String,
        CarBrand: String,
        CarType: String,
        CreditCardUser: String,
        DebitCardUser: String,
        UPIUser: String,
        InvestmentInStocksMutualFunds: String,
        HomeOwnership: String,
        NumberOfCreditCards: Number,
        PreferredShoppingMode: String,
        PreferredEcommercePlatform: String,
        FrequencyOfOnlineShopping: String,
        FrequencyOfDiningOut: String,
        FrequencyOfTravel: String,
        HealthInsurance: String,
        LifeInsurance: String,
        PreferredModeOfTransport: String,
        SocialMediaUsage: Number,
        AdExposure: Number,
        LikelihoodToBuyAfterAdExposure: String,
        PreferredAdCategories: String,
        ProductsBoughtAfterAdExposure: String,
        BrandsPreferredBasedOnAds: String,
        InfluenceOfTVShowsOnPurchases: String,
        InfluenceOfStreamingContentOnPurchases: String,
        PreferredProductCategories: String,
        PreferredBrands: String,
        LikelihoodToBuyBasedOnTVShows: String,
        LikelihoodToBuyBasedOnStreamingContent: String
    }]
});

householdSchema.methods.resetHousehold = async function () {
    this.is_assigned = false;
    this.otp = null; // Clear OTP if present
    // Note: max_members and max_submeters are not reset as they are configuration values
    await this.save();
};

export default mongoose.model('Household', householdSchema);