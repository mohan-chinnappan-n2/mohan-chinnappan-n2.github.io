public with sharing class NavigationItemsController {
    public NavigationItemsController() {}

    @AuraEnabled(cacheable=true)
    public static List<NavigationMenuItem> getNavigationItems(String menuName, String publishStatus) {
        String networkId = Network.getNetworkId();
        List<NavigationLinkSet> linkSets = [
            SELECT Id 
            FROM NavigationLinkSet
            WHERE MasterLabel = :menuName AND NetworkId = :networkId
        ];
        Id linkSetId = linkSets.get(0).Id;
        return [SELECT Label, Target
            FROM NavigationMenuItem
            WHERE NavigationLinkSetId = :linkSetId
            AND Status = :publishStatus 
            ORDER BY Position
        ];
    }

}
