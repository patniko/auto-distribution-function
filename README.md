# Getting Started
1. Install the latest Azure Functions CLI on your system. 
 
```npm install -g azure-functions-core-tools@core ```
 
2. Link the project to your subscription before running by navigating to the Azure portal, creating a new Function called RereleaseTimer underneath a subscription and running the command below to link the two.

```func azure functionapp fetch-app-settings RereleaseTimer ```

3. Update _APP_CENTER_TOKEN_ in `local.settings.json` with a valid [App Center API token](https://appcenter.ms/settings/apitokens).

4. Update the `config.json` file in the RereleaseTimer folder.

```
[{
  "owner": "Tester-Apps",
  "app": "AC-Tester-App-iOS",
  “source”: “Alpha Testers”,
  “installs”: 1,
  “sessions”: 1,
  “crashes”: 0,
  “destination”: “Beta Testers”	
  "type": "group" OR "store"
}]
```

- _owner_ and _app_ properties can be found by navigating to any of the apps attached to your account in App Center and looking at the address bar. 
- _source_ and _destination_ properties are reserved for the distribution groups you wish to move a release between. 
- _type_ specifies the type of destination you want to automatically redistribute releases to.
- _installs_ are the total number of devices on the latest release
- _sessions_ are the number of devices that have used the latest version for longer than a minute
- _crashes_ represents the total number of crash events App Center has received. 

If at any point the latest release within a source group meets all its criteria, it will automatically be distributed to the destination. 

5. Run the Azure Function locally to verify releases are being processed correctly.

```func host start –-debug vscode```

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
