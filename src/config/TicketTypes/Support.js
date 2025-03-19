const { CATEGORIES } = require('../config');

module.exports = {
    id: 'support',
    name: 'Support',
    category: CATEGORIES.SUPPORT,
    embedContent: {
        title: 'Support Ticket',
        description: 'Please describe your issue and a staff member will assist you shortly.'
    }
};