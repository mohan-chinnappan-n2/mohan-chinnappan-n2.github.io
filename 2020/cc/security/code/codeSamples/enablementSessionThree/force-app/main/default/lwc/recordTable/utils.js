const uiApiToDatatabletypes = {
    'Boolean': 'boolean',
    'Currency': 'currency',
    'Date': 'date-local',
    'DateTime': 'date',
    'Double': 'number',
    'Email': 'email',
    'Int': 'number',
    'Location': 'location',
    'Percent': 'percent',
    'Phone': 'phone',
    'Url': 'url'
};

export function convertType(type) {
    return uiApiToDatatabletypes[type] || 'text';
}
