const data  = 
`Name,Value
Apple,20
Orange,30
Peach,50
`;

//console.log(btoa(data));
const encoded = Buffer.from(data).toString('base64');
const decoded = Buffer.from(encoded, 'base64').toString();
console.log(encoded);
const encoded2 = 'TmFtZSxWYWx1ZQ0KQXBwbGUsMjANCk9yYW5nZSwzMA0KUGVhY2gsNTANCg==';
console.log(encoded2)
const decoded2 = Buffer.from(encoded2, 'base64').toString();

const assert = require('assert');
//assert (data  == decoded2);
