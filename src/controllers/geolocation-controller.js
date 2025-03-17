import axios from 'axios';
import logger from '../utils/logger.js';

// API Keys
const GOOGLE_API_KEY = 'AIzaSyDD83aXp60C4_8JcC9L5int-l-AVqKaAOc';
const UNWIREDLABS_API_KEY = 'pk.c4f2e3d84bcc6bae8333620bb3eaf8e1';


// Google Geolocation API
export const getGeolocationGoogle = async (req, res) => {
  try {
    const { Details } = req.body;
    if (!Details || !Details.Cell_Info || !Array.isArray(Details.Cell_Info) || Details.Cell_Info.length === 0) {
      return res.status(400).json({ error: 'Invalid request: Details.Cell_Info array is required and must not be empty' });
    }

    // Use the first cell tower object from the array
    const { MCC, MNC, LAC, CID } = Details.Cell_Info[0];

    if (!MCC || !MNC || !LAC || !CID) {
      return res.status(400).json({
        error: 'Missing required fields: MCC, MNC, LAC, and CID are required in Cell_Info[0]',
      });
    }

    const url = `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_API_KEY}`;
    const requestBody = {
      considerIp: false,
      cellTowers: [
        {
          cellId: CID,
          locationAreaCode: LAC,
          mobileCountryCode: MCC,
          mobileNetworkCode: MNC,
          radioType: Details.Cell_Info[0].Band.toLowerCase() || 'lte', // Use Band if provided, default to 'lte'
        },
      ],
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { lat, lng } = response.data.location || {};
    const accuracy = response.data.accuracy;

    if (!lat || !lng) {
      return res.status(404).json({ error: 'No location data returned from Google API' });
    }

    res.json({
      latitude: lat,
      longitude: lng,
      accuracy: accuracy,
      provider: 'google',
    });
  } catch (error) {
    logger.error('Google API Error:', error.message);
    if (error.response) {
      res.status(500).json({
        error: 'Google API error',
        details: error.response.data,
        status: error.response.status,
      });
    } else {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
};

// Unwired Labs Geolocation API
export const getGeolocationUnwired = async (req, res) => {
  try {
    const { Details } = req.body;
    if (!Details || !Details.Cell_Info || !Array.isArray(Details.Cell_Info) || Details.Cell_Info.length === 0) {
      return res.status(400).json({ error: 'Invalid request: Details.Cell_Info array is required and must not be empty' });
    }

    // Use the first cell tower object from the array
    const { MCC, MNC, LAC, CID } = Details.Cell_Info[0];

    if (!MCC || !MNC || !LAC || !CID) {
      return res.status(400).json({
        error: 'Missing required fields: MCC, MNC, LAC, and CID are required in Cell_Info[0]',
      });
    }

    const url = `https://us1.unwiredlabs.com/v2/process.php`;
    const requestBody = {
      token: UNWIREDLABS_API_KEY,
      radio: Details.Cell_Info[0].Band.toLowerCase() || 'lte', // Use Band if provided, default to 'lte'
      mcc: Number(MCC),
      mnc: Number(MNC),
      cells: [
        {
          lac: Number(LAC),
          cid: Number(CID),
        },
      ],
      address: 0,
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { lat, lon, accuracy, status } = response.data;

    if (status === 'error' || !lat || !lon) {
      return res.status(404).json({
        error: 'No location data returned from Unwired Labs API',
        details: response.data.message || 'Unknown error',
      });
    }

    res.json({
      latitude: lat,
      longitude: lon,
      accuracy: accuracy,
      provider: 'unwiredlabs',
    });
  } catch (error) {
    logger.error('Unwired Labs API Error:', error.message);
    if (error.response) {
      res.status(500).json({
        error: 'Unwired Labs API error',
        details: error.response.data,
        status: error.response.status,
      });
    } else {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
};