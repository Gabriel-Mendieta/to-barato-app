const { withXcodeProject } = require('expo/config-plugins');

/**
 * Disables ENABLE_USER_SCRIPT_SANDBOXING so React Native's
 * "Bundle React Native code and images" script can write ip.txt
 * into the .app bundle (required for device debug builds).
 */
function withDisableUserScriptSandboxing(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key of Object.keys(configurations)) {
      const buildConfig = configurations[key];
      if (typeof buildConfig !== 'object' || !buildConfig.buildSettings) {
        continue;
      }
      buildConfig.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
    }

    return config;
  });
}

module.exports = withDisableUserScriptSandboxing;
