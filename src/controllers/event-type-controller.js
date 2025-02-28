import EventType from '../models/EventType.js';

// Add single event type
export const addEventType = async (req, res) => {
  try {
    const { typeId, name, isAlert } = req.body;
    
    const eventType = new EventType({
      typeId,
      name,
      isAlert: isAlert ?? false // Use provided value or default to false
    });

    const savedEventType = await eventType.save();
    res.status(201).json({
      success: true,
      data: savedEventType
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Add multiple event types
export const addMultipleEventTypes = async (req, res) => {
  try {
    const eventTypes = req.body.map(event => ({
      ...event,
      isAlert: event.isAlert ?? false // Use provided value or default to false
    }));
    
    const savedEventTypes = await EventType.insertMany(eventTypes);
    res.status(201).json({
      success: true,
      data: savedEventTypes
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all event types
export const getEventTypes = async (req, res) => {
  try {
    const eventTypes = await EventType.find();
    res.status(200).json({
      success: true,
      data: eventTypes
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update event type
export const updateEventType = async (req, res) => {
  try {
    const { id } = req.params;
    const { typeId, name, isAlert } = req.body;

    const updatedEventType = await EventType.findByIdAndUpdate(
      id,
      { 
        typeId, 
        name,
        isAlert: isAlert ?? false // Use provided value or default to false
      },
      { new: true, runValidators: true }
    );

    if (!updatedEventType) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedEventType
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete event type
export const deleteEventType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedEventType = await EventType.findByIdAndDelete(id);
    
    if (!deletedEventType) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event type deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};