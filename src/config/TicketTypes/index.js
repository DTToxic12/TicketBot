const TempMod = require('./TempMod');
const Support = require('./Support');
const Report = require('./Report');

const TICKET_TYPES = {
    [TempMod.id]: TempMod,
    [Support.id]: Support,
    [Report.id]: Report
};

module.exports = { TICKET_TYPES };