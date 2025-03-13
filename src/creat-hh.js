import mongoose from 'mongoose';

// MongoDB Connection
const mongoConnect = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect('mongodb+srv://ankurauti:ankurauti02@cluster0.7ikri.mongodb.net/indi_test?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
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
    is_assigned: { type: Boolean, default: false }, // Added for assignment tracking
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
    is_assigned: { type: Boolean, default: false }, // Added for assignment tracking
    SIM2_IMSI: { type: String, default: null }, // Added for SIM2 IMSI
    SIM2_PASS: { type: Boolean, default: null }, // Added for SIM2 pass status
    SIM1_PASS: { type: Boolean, default: null }, // Added for SIM1 pass status
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

        // Sample member data for variety
        const memberTemplates = [
            { Name: "Amit Sharma", Age: 35, Gender: "M", EducationLevel: "Graduate", Occupation: "Engineer" },
            { Name: "Priya Patel", Age: 28, Gender: "F", EducationLevel: "Postgraduate", Occupation: "Doctor" },
            { Name: "Rohan Desai", Age: 45, Gender: "M", EducationLevel: "Diploma", Occupation: "Technician" },
            { Name: "Sneha Gupta", Age: 32, Gender: "F", EducationLevel: "Graduate", Occupation: "Teacher" }
        ];

        for (let i = 0; i < 10; i++) {
            const hhid = 1001 + i;
            const meterId = 50000101 + i;
            const memberCount = (i % 4) + 1; // 1 to 4 members, cycling through
            const members = [];

            for (let j = 0; j < memberCount; j++) {
                const template = memberTemplates[j % memberTemplates.length];
                members.push({
                    MMID: `${hhid}-${j + 1}`,
                    Name: `${template.Name} ${hhid}`,
                    Age: template.Age + (i % 5), // Vary age slightly
                    Gender: template.Gender,
                    EducationLevel: template.EducationLevel,
                    Occupation: template.Occupation,
                    PhoneNumber: `733013${1721 + i + j}` // Unique phone numbers
                });
            }

            households.push({
                HHID: hhid,
                hh_email: 'swapnil.gaikwad@inditronics.com',
                hh_phone: '7330131721',
                max_members: memberCount, // Set to the number of members
                Address: `${hhid} Main Street`,
                City: 'Pune',
                State: 'Maharashtra',
                Region: 'West',
                TVOwnership: 'Yes',
                NoOfTVs: 2,
                submeter_mac: `00:1A:2B:3C:4D:${(i + 1).toString().padStart(2, '0')}`,
                members: members,
                is_assigned: false // Initially unassigned
            });

            meters.push({
                METER_ID: meterId,
                associated: false, // Initially unassociated
                associated_with: null,
                is_assigned: false, // Initially unassigned
                SIM2_IMSI: null,
                SIM2_PASS: null,
                SIM1_PASS: null
            });
        }

        // Insert households
        await Household.insertMany(households);
        console.log('10 households added successfully');

        // Insert meters
        await Meter.insertMany(meters);
        console.log('10 meters added successfully');
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