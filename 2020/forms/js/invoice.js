/*
 invoice.js

 mohan chinnappan (mar-31-2020)
 
*/
// jshint esversion: 6 


const sampleInvoiceData = {
    invNum : 343,
    
    currency: '$',
    dueDateDaysFromNow : 30,

    logoUrl: 'https://mohan-chinnappan-n2.github.io/2020/forms/img/logo-s.png',
    
    fromAddress : `GreenWorld, Inc.<br>12345 Sunny Road<br> Manchester, NH 12345 `,
    toAddress : `ABC Corp.<br> John Doe<br> john@example.com `,

    payment: { method: 'Check', details: '' },

    items:  [ 
    {name: 'Solution Design', amount:300 } ,
    {name: 'Wireframe Design', amount:175 } ,
    {name: 'Web Site Design', amount:200 },
    {name: 'Graphics Design', amount:120 },
    ]

};

const invoiceBox = `
<div class="invoice-box" id='invoice-box'>
    <table cellpadding="0" cellspacing="0" id='invoice-tbl'>
        <tr class="top">
            <td colspan="2">
                <table>
                    <tr>
                        <td class="title">
                            <img id='logo' class='logo'>
                        </td>
                        <td id='invMeta'> </td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <tr class="information">
            <td colspan="2">
                <table>
                    <tr>
                        <td id='fromAddress'> </td> 
                        <td id='toAddress'> </td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <tr class="heading"> <td> Payment Method </td> <td> </tr>
        <tr class="details"> <td id='paymentMethod'></td> <td id='paymentDetails'></td> </tr>
        <tr class="heading"> <td> Item </td> <td> Price </td> </tr>
    </table>
</div>
`;


const initInvoiceBox = (markup, id) => {
  document.getElementById(id).innerHTML = markup;
};


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

const renderInvoice  = (markup, pd, id) => {
    initInvoiceBox(markup,id);
    const today = new Date();
    const dueDate = addDays(today, pd.dueDateDaysFromNow);
    const invMeta = `
    Invoice #: ${pd.invNum}<br>
    Created: ${today.toLocaleString('default', { month: 'long' })}  ${today.getDate()} ${today.getFullYear()}<br>
    Due: ${dueDate.toLocaleString('default', { month: 'long' }) } ${dueDate.getDate()} ${dueDate.getFullYear()}
    `;
    document.getElementById('invMeta').innerHTML =invMeta;

    document.getElementById('logo').src =pd.logoUrl;
    
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





