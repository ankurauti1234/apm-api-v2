// event-type-controller.js
import EventType from '../models/EventType.js';
import mongoose from 'mongoose';

export const addEventType = async (req, res) => {
  try {
    const { typeId, name, isAlert, priority } = req.body;
    
    const eventTypeData = {
      typeId,
      name,
      isAlert: isAlert ?? false,
      performedBy: req.user._id  // Add user who created the event type
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

export const addMultipleEventTypes = async (req, res) => {
  try {
    const eventTypes = req.body.map(event => {
      const eventData = {
        ...event,
        isAlert: event.isAlert ?? false,
        performedBy: req.user._id  // Add user who created the event types
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

export const getEventTypes = async (req, res) => {
  try {
    const eventTypes = await EventType.find()
      .populate('performedBy', 'firstname lastname email')
      .populate('updatedBy', 'firstname lastname email')
      .sort({ typeId: 1 });
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

export const updateEventType = async (req, res) => {
  try {
    const { id } = req.params;
    const { typeId, name, isAlert, priority } = req.body;

    const updateData = { 
      typeId, 
      name,
      isAlert: isAlert ?? false,
      updatedBy: req.user._id  // Add user who updated the event type
    };

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

export const deleteEventType = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type ID format'
      });
    }

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
