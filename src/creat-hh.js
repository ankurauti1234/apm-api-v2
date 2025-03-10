import mongoose from 'mongoose';

// MongoDB Connection
const mongoConnect = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect('mongodb+srv://ankurauti:ankurauti02@cluster0.7ikri.mongodb.net/logo_base?retryWrites=true&w=majority&appName=Cluster0');
        console.log('MongoDB connected');
    }
};

// Household Schema
const householdSchema = new mongoose.Schema({
    HHID: { type: Number, required: true, unique: true },
    hh_email: String,
    hh_phone: String,
    max_members: Number,
    hh_status: { type: Boolean, default: true },
    otp: { type: String, default: null },
    Address: String,
    City: String,
    State: String,
    Region: String,
    TVOwnership: String,
    NoOfTVs: Number,
    submeter_mac: { type: String, required: false },
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

// Meter Schema
const meterSchema = new mongoose.Schema({
    METER_ID: { type: Number, required: true, unique: true },
    associated: { type: Boolean, default: false },
    associated_with: { type: Number, default: null },
    created_at: { type: Date, default: Date.now }
});

const Household = mongoose.model('Household', householdSchema);
const Meter = mongoose.model('Meter', meterSchema);

// Function to add households and meters
const addHouseholdsAndMeters = async () => {
    try {
        await mongoConnect();

        const households = [];
        const meters = [];

        for (let i = 100001; i <= 100010; i++) {
            households.push({
                HHID: i,
                hh_email: 'ankur.auti@inditronics.com',
                hh_phone: `123456${i}`,
                max_members: 4,
                Address: `${i} Main Street`,
                City: 'Pune',
                State: 'Maharashtra',
                Region: 'West',
                TVOwnership: 'Yes',
                NoOfTVs: 2,
                submeter_mac: `00:1A:2B:3C:4D:${i.toString().slice(-2)}`,
                members: [
                    {
                        MMID: `${i}-1`,
                        Name: `Person${i}`,
                        Age: 30,
                        Gender: 'M',
                        EducationLevel: 'Graduate',
                        Occupation: 'Engineer'
                    }
                ]
            });

            meters.push({
                METER_ID: i,
                associated: true,
                associated_with: i
            });
        }

        // Insert households
        await Household.insertMany(households);
        console.log('10 households added successfully');

        // Insert meters
        await Meter.insertMany(meters);
        console.log('10 meters added and associated successfully');
    } catch (error) {
        console.error('Error adding households and meters:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        }
    }
};

// Execute the function
addHouseholdsAndMeters();
