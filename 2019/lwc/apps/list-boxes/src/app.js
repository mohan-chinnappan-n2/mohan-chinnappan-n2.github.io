import { LightningElement, track, api } from 'lwc';

export default class App extends LightningElement {

    handleClick = () => {
        console.log('clicked');
    }


    // fruits combobox
    fruitValue = 'inProgress';
    get fruits()   {
        return [
            { label: 'Mango', value: 'Mango' },
            { label: 'Apple', value: 'Apple' },
            { label: 'Jackfruit', value: 'Jackfruit' },
        ];
    }

    handleFruitChange(event) {
        this.value = event.detail.value;
    }


    // dual listbox
    _selectedFruits = [];
    get selectedFruits() {
        return this._selectedFruits.length ? this._selectedFruits : 'NONE';
    }

    handleFruitChange(e) {
        this._selectedFruits = e.detail.value;
    }

    // datatable

    fruitsData = [

            {"id": "1234", "name": "apple", "qty": 100},

            {"id": "3444", "name": "mango", "qty": 1300},

            {"id": "5555", "name": "jackfruit", "qty": 720}
    
    
    

    ]
       
 furitCols = [
    { label: 'id', fieldName: 'id' },
    { label: 'name', fieldName: 'name' },
    { label: 'qty', fieldName: 'qty', type:'number'}
   
];
    
}

