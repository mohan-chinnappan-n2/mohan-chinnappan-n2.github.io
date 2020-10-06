global class NavigationMenuPicklist extends VisualEditor.DynamicPickList {

    // replace with your network id
    static String networkId = '0DBB00000001Bz6';

    global override VisualEditor.DataRow getDefaultValue(){
        return new VisualEditor.DataRow('Default Navigation', 'Default Navigation');
    }

    global override VisualEditor.DynamicPickListRows getValues() {
        VisualEditor.DynamicPickListRows  myValues = new VisualEditor.DynamicPickListRows();
        system.debug('networkId: ' + networkId);
        for (NavigationLinkSet nav : [SELECT MasterLabel FROM NavigationLinkSet WHERE NetworkId = :networkId]) {
            myValues.addRow(new VisualEditor.DataRow(nav.MasterLabel, nav.MasterLabel));
        }
        return myValues;
    }
}