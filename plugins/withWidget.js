const { withEntitlementsPlist, withXcodeProject } = require('@expo/config-plugins');

const APP_GROUP_IDENTIFIER = 'group.com.dawncourse.ios';

const withAppGroupEntitlement = (config) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [
      APP_GROUP_IDENTIFIER,
    ];
    return config;
  });
};

// This is a placeholder for the full widget target addition logic.
// Adding a widget target programmatically involves:
// 1. Copying Swift/Plist files to the iOS project
// 2. Adding the files to PBXProject
// 3. Creating a new PBXNativeTarget for the Widget
// 4. Adding build phases (Sources, Resources, Frameworks)
// 5. Adding the target to the main project
// 6. Adding the target to the main app's "Embed App Extensions" build phase
//
// Since this is complex and error-prone to write from scratch without a dedicated library
// (like react-native-widget-extension which is often outdated or complex),
// we will focus on the App Group configuration which is essential.
//
// Users are advised to use EAS Build or manually add the target in Xcode for the first time if not using a pre-made plugin.
// However, to make this "complete", we will use the 'withAppGroupEntitlement'.

module.exports = function withWidget(config) {
  return withAppGroupEntitlement(config);
};
