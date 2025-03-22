// Save as addData.js
import mongoose from 'mongoose';

// Household Schema
const householdSchema = new mongoose.Schema({
    HHID: { type: Number, required: true, unique: true },
    hh_email: String,
    hh_phone: String,
    max_members: { type: Number, default: 0 },
    max_submeters: { type: Number, default: 0 },
    hh_status: { type: Boolean, default: true },
    otp: { type: String, default: null },
    is_assigned: { type: Boolean, default: false },
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

const Household = mongoose.model('Household', householdSchema);

// Function to generate dummy members
const generateMembers = (hhid, count) => {
    const members = [];
    for (let i = 1; i <= count; i++) {
        members.push({
            MMID: `${hhid}-${i.toString().padStart(3, '0')}`,
            Name: `Person-${hhid}-${i}`,
            Age: 20 + i,
            Gender: i % 2 === 0 ? 'Female' : 'Male'
        });
    }
    return members;
};

// Main function to add households
async function addData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(
            'mongodb+srv://inditronics:jrBoHubfrp0xvPjx@cluster0.syyhv.mongodb.net/indi_test?retryWrites=true&w=majority&appName=Cluster0'
        );
        console.log('Connected to MongoDB');

        // Create households with HHIDs 2004-2010
        const householdConfigs = [];
        for (let hhid = 2004; hhid <= 2010; hhid++) {
            householdConfigs.push({
                HHID: hhid,
                max_members: 4,
                max_submeters: 1,
                actualMembers: 4
            });
        }

        // Add the households
        for (const config of householdConfigs) {
            const household = new Household({
                HHID: config.HHID,
                hh_email: 'chakradhar.rajegore@inditronics.com',
                hh_phone: '9696969696',
                max_members: config.max_members,
                max_submeters: config.max_submeters,
                members: generateMembers(config.HHID, config.actualMembers)
            });
            
            await household.save();
            console.log(`Added Household ${config.HHID} with max_members: ${config.max_members}, max_submeters: ${config.max_submeters}`);
        }

        console.log('\nSummary:');
        console.log('Added 7 Households:');
        for (let hhid = 2004; hhid <= 2010; hhid++) {
            console.log(`- HHID: ${hhid}, max_members: 4, max_submeters: 1, actual members: 4`);
        }
        console.log('Phone: 9696969696, Email: chakradhar.rajegore@inditronics.com');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the function
addData();