const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
    section:  {
        type: mongoose.Schema.Types.ObjectId, ref: 'Products'
    },
    subSection: String,
    itemOnPromotion:  Object

});
module.exports = mongoose.model("Promotion", schema);
