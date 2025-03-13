import mongoose from 'mongoose';

const householdSchema = new mongoose.Schema({
    HHID: {
        type: Number,
        required: true,
        unique: true
    },
    hh_email: String,
    hh_phone: String,
    max_members: Number,
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
    submeter_mac: [{ // Updated to array for multiple submeters
        type: String,
        required: false
    }],
    bounded_serial_numbers: [{ // Added to store serial numbers
        type: String,
        required: false
    }],
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

// Method to reset household data on decommission
householdSchema.methods.resetHousehold = async function () {
    this.is_assigned = false;
    this.submeter_mac = [];
    this.bounded_serial_numbers = [];
    await this.save();
};

export default mongoose.model('Household', householdSchema);