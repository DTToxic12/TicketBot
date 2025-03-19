const { CATEGORIES } = require('../config');

module.exports = {
    id: 'report',
    name: 'Report',
    category: CATEGORIES.REPORT,
    embedContent: {
        title: 'Report Ticket',
        description: 'Please provide details about what you would like to report. A staff member will assist you shortly.'
    }
};
