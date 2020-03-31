/*
 invoice.js

 mohan chinnappan (mar-31-2020)
 
*/
// jshint esversion: 6 



const  addRow = (tableID, name, amount, cssClass) => {
    // Get a reference to the table
    let tableRef = document.getElementById(tableID);
    // Insert a row at the end of the table
    let newRow = tableRef.insertRow(-1);
    newRow.classList.add(cssClass);
    // Insert a cell in the row at index 0
    let nameCell = newRow.insertCell(0);
    // Append a text node to the cell
    let nameText = document.createTextNode(name);
    nameCell.appendChild(nameText);

    // Insert a cell in the row at index 1 
    let amountCell = newRow.insertCell(1);
    // Append a text node to the cell
    let amountText = document.createTextNode(`${amount}`);
    amountCell.appendChild(amountText);
};


const addDays = (date, days) => {
    const copy = new Date(Number(date));
    copy.setDate(date.getDate() + days);
    return copy;
};

const renderInvoice  = (pd) => {
    const today = new Date();
    const dueDate = addDays(today, pd.newDateDaysFromNow)
    const invMeta = `
    Invoice #: ${pd.invNum}<br>
    Created: ${today.toLocaleString('default', { month: 'long' })}  ${today.getDate()} ${today.getFullYear()}<br>
    Due: ${dueDate.toLocaleString('default', { month: 'long' }) } ${dueDate.getDate()} ${dueDate.getFullYear()}
    `;
    document.getElementById('invMeta').innerHTML =invMeta;
    
    document.getElementById('fromAddress').innerHTML = pd.fromAddress;
    document.getElementById('toAddress').innerHTML = pd.toAddress;
    document.getElementById('paymentMethod').innerHTML = pd.payment.method;
    document.getElementById('paymentDetails').innerHTML = pd.payment.details;

    let total = 0;
    pd.items.forEach((item, i) => {
        addRow('invoice-tbl', item.name, `${pd.currency}${item.amount.toFixed(2)}`, 'item');
        total += item.amount;
    });
    addRow('invoice-tbl', '', `Total: ${pd.currency}${total.toFixed(2)}`, 'total');
};





