### Using  Org Template in creating Scratch orgs

```json

{
  "orgName": "Your OrgName",

  "country": "US",

  "template": "Org Template ID: starts with OTT",

  "hasSampleData": "false",

  "features": [
    "API",
    "AuthorApex",
    "AddCustomApps:30",
    "AddCustomTabs:30",
    "ContactsToMultipleAccounts",
    "DebugApex",
    "DefaultWorkflowUser",
    "DevelopmentWave",
    "ForceComPlatform",
    "LightningSalesConsole",
    "LightningServiceConsole",
    "PersonAccounts",
    "ServiceCloud",
    "Communities"
  ],

  "orgPreferences": {
    "enabled": [
      "EventLogWaveIntegEnabled",
      "LoginForensicsEnabled",
      "ChatterEnabled",
      "IsAccountTeamsEnabled",
      "IsActivityRemindersEnabled",
      "IsChatterProfileEnabled",
      "IsIdeaThemesEnabled",
      "IsCascadeActivateToRelatedPricesEnabled",
      "IsIdeasEnabled",
      "IsIdeasReputationEnabled",
      "S1DesktopEnabled",
      "IsOpportunityTeamEnabled",
      "AnalyticsSharingEnable",
      "S1OfflinePref",
      "S1EncryptedStoragePref2",
      "OfflineDraftsEnabled",
      "EnhancedEmailEnabled",
      "TerritoryManagement2Enable",
      "SelfSetPasswordInApi",
      "IsNameSuffixEnabled",
      "NetworksEnabled"
    ],

    "disabled": [
      "SendThroughGmailPref",
      "SocialProfilesEnable",
      "NotesReservedPref01",
      "VoiceEnabled"
    ]
  }
}

```
### Sample scratch org definition file without template info

```json

{
  "orgName": "Acme",
  "edition": "Enterprise",
  "features": ["Communities", "ServiceCloud", "Chatbot"],
  "settings": {
      "orgPreferenceSettings": {
          "networksEnabled": true,
          "s1DesktopEnabled": true,
          "s1EncryptedStoragePref2": false
      },
      "omniChannelSettings": {
          "enableOmniChannel": true
      },

      "caseSettings": {
          "systemUserEmail": "support@acme.com"
      }
  }
}
```

