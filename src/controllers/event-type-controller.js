import EventType from '../models/EventType.js';


// Add priority to addEventType
export const addEventType = async (req, res) => {
  try {
      const { typeId, name, isAlert, priority } = req.body;
      
      const eventTypeData = {
          typeId,
          name,
          isAlert: isAlert ?? false
      };

      if (isAlert && priority) {
          if (!['high', 'low', 'critical'].includes(priority)) {
              return res.status(400).json({
                  success: false,
                  message: "Invalid priority value. Must be 'high', 'low', or 'critical'"
              });
          }
          eventTypeData.priority = priority;
      }

      const eventType = new EventType(eventTypeData);
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

// Add priority to addMultipleEventTypes
export const addMultipleEventTypes = async (req, res) => {
  try {
      const eventTypes = req.body.map(event => {
          const eventData = {
              ...event,
              isAlert: event.isAlert ?? false
          };
          
          if (event.isAlert && event.priority) {
              if (!['high', 'low', 'critical'].includes(event.priority)) {
                  throw new Error(`Invalid priority value for ${event.name}`);
              }
              eventData.priority = event.priority;
          }
          
          return eventData;
      });
      
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

// Get all event types sorted by typeId in ascending order
export const getEventTypes = async (req, res) => {
  try {
    const eventTypes = await EventType.find().sort({ typeId: 1 }); // 1 for ascending order
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

// Update event type (modified to handle priority only for alerts)
export const updateEventType = async (req, res) => {
  try {
      const { id } = req.params;
      const { typeId, name, isAlert, priority } = req.body;

      const updateData = { 
          typeId, 
          name,
          isAlert: isAlert ?? false
      };

      // Only update priority if it's an alert
      if (isAlert && priority) {
          if (!['high', 'low', 'critical'].includes(priority)) {
              return res.status(400).json({
                  success: false,
                  message: "Invalid priority value. Must be 'high', 'low', or 'critical'"
              });
          }
          updateData.priority = priority;
      } else if (!isAlert && priority) {
          return res.status(400).json({
              success: false,
              message: "Priority can only be set for alert types"
          });
      }

      const updatedEventType = await EventType.findByIdAndUpdate(
          id,
          updateData,
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
    console.log('Attempting to delete event type with ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ID format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid event type ID format'
      });
    }

    const deletedEventType = await EventType.findByIdAndDelete(id);
    console.log('Delete result:', deletedEventType);
    
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
    console.error('Delete error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};