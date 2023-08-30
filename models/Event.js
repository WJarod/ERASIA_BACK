import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: false },
    description: { type: String, required: false },
    
});

const Event = mongoose.model("Event", EventSchema);

Event.businessLogic = {
    // delete by title
    deleteByTitle: {
        route: "/deleteByTitle/:title",
        method: "delete",
        handler: async (req, res, next) => {
            try {
                const event = await Event.findOneAndDelete({ title: req.params.title });
                res.json(event);
            } catch (err) {
                next(err);
            }
        },
    },
};

export default Event;