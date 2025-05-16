/**
 * TerraFlux - Direct Settings Manager Test
 * 
 * A simple script to test the settings manager without launching the full Electron app
 */

const path = require('path');
const settingsManager = require('./electron/config/settings-manager');

// Polyfill for Electron's app.getPath
const electron = {
  app: {
    getPath: (name) => {
      if (name === 'userData') {
        return path.join(__dirname, 'test-user-data');
      }
      return path.join(__dirname, 'test-data');
    }
  }
};

// Mock require electron
require.cache[require.resolve('electron')] = {
  exports: electron
};

async function runSettingsTest() {
  console.log('Starting settings manager test...');

  try {
    // Initialize the settings manager
    console.log('Initializing settings manager...');
    const settings = await settingsManager.initialize();
    console.log('Settings initialized successfully:');
    console.log(JSON.stringify(settings, null, 2));

    // Test getting settings
    console.log('\nTesting getSetting()...');
    const theme = await settingsManager.getSetting('ui.theme');
    const autosave = await settingsManager.getSetting('game.gameplay.autosave');
    console.log(`  ui.theme = ${theme}`);
    console.log(`  game.gameplay.autosave = ${autosave}`);

    // Test setting settings
    console.log('\nTesting setSetting()...');
    await settingsManager.setSetting('ui.theme', 'dark');
    await settingsManager.setSetting('game.audio.masterVolume', 0.5);
    
    // Get the updated settings
    console.log('\nVerifying updated settings...');
    const updatedTheme = await settingsManager.getSetting('ui.theme');
    const updatedVolume = await settingsManager.getSetting('game.audio.masterVolume');
    console.log(`  ui.theme = ${updatedTheme}`);
    console.log(`  game.audio.masterVolume = ${updatedVolume}`);

    // Test resetting a setting
    console.log('\nTesting resetSetting()...');
    await settingsManager.resetSetting('game.audio.masterVolume');
    
    // Check the reset value
    const resetVolume = await settingsManager.getSetting('game.audio.masterVolume');
    console.log(`  game.audio.masterVolume after reset = ${resetVolume}`);

    // Save the settings
    console.log('\nSaving settings...');
    await settingsManager.saveSettings(await settingsManager.getSettings());
    
    console.log('\nSettings test completed successfully!');
  } catch (error) {
    console.error('ERROR in settings test:', error);
  }
}

// Run the test
runSettingsTest();
