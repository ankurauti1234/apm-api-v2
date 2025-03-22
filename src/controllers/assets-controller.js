// controllers/Assets-controller.js
import csv from 'csv-parser';
import fs from 'fs';
import Meter from '../models/Meter.js';
import Submeter from '../models/Submeter.js';

class AssetsController {
    static async uploadCSV(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No CSV file uploaded' });
            }

            const type = parseInt(req.query.type);
            if (!type || (type !== 1 && type !== 2)) {
                return res.status(400).json({ 
                    message: 'Invalid or missing type parameter. Use 1 for meters or 2 for submeters' 
                });
            }

            const results = [];
            const filePath = req.file.path;

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        if (type === 1) {
                            const meters = results.map(row => ({
                                METER_ID: parseInt(row.meterid)
                            }));

                            const existingMeterIds = await Meter.find({
                                METER_ID: { $in: meters.map(m => m.METER_ID) }
                            }).distinct('METER_ID');

                            const newMeters = meters.filter(
                                meter => !existingMeterIds.includes(meter.METER_ID)
                            );

                            if (newMeters.length === 0) {
                                fs.unlinkSync(filePath);
                                return res.status(200).json({
                                    message: 'No new meters to upload - all IDs already exist',
                                    count: 0,
                                    data: []
                                });
                            }

                            const savedMeters = await Meter.insertMany(newMeters, { ordered: false });
                            fs.unlinkSync(filePath);
                            return res.status(201).json({
                                message: 'Meters uploaded successfully',
                                count: savedMeters.length,
                                data: savedMeters
                            });

                        } else if (type === 2) {
                            const submeters = results.map(row => ({
                                submeter_id: parseInt(row.submeterid),
                                submeter_mac: row.wifi_mac,
                                bounded_serial_number: row.serial_number,
                                is_assigned: false,
                                associated_with: null,
                                created_at: new Date()
                            }));

                            // Find existing submeter IDs, MAC addresses, and serial numbers
                            const existingSubmeters = await Submeter.find({
                                $or: [
                                    { submeter_id: { $in: submeters.map(s => s.submeter_id) } },
                                    { submeter_mac: { $in: submeters.map(s => s.submeter_mac) } },
                                    { bounded_serial_number: { $in: submeters.map(s => s.bounded_serial_number) } }
                                ]
                            });

                            const existingSubmeterIds = existingSubmeters.map(s => s.submeter_id);
                            const existingMacs = existingSubmeters.map(s => s.submeter_mac);
                            const existingSerials = existingSubmeters.map(s => s.bounded_serial_number);

                            // Filter out submeters where any of the three identifiers already exist
                            const newSubmeters = submeters.filter(submeter => 
                                !existingSubmeterIds.includes(submeter.submeter_id) &&
                                !existingMacs.includes(submeter.submeter_mac) &&
                                !existingSerials.includes(submeter.bounded_serial_number)
                            );

                            if (newSubmeters.length === 0) {
                                fs.unlinkSync(filePath);
                                return res.status(200).json({
                                    message: 'No new submeters to upload - all IDs, MACs, or serial numbers already exist',
                                    count: 0,
                                    data: []
                                });
                            }

                            const savedSubmeters = await Submeter.insertMany(newSubmeters, { ordered: false });
                            fs.unlinkSync(filePath);
                            return res.status(201).json({
                                message: 'Submeters uploaded successfully',
                                count: savedSubmeters.length,
                                data: savedSubmeters
                            });
                        }
                    } catch (error) {
                        fs.unlinkSync(filePath);
                        return res.status(500).json({
                            message: 'Error processing CSV',
                            error: error.message
                        });
                    }
                })
                .on('error', (error) => {
                    fs.unlinkSync(filePath);
                    return res.status(500).json({
                        message: 'Error reading CSV',
                        error: error.message
                    });
                });
        } catch (error) {
            return res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }
    }
}

export default AssetsController;