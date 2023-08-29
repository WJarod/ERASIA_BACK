import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: false },
    description: { type: String, required: false },
    
});

const Event = mongoose.model("Event", EventSchema);

export default Event;