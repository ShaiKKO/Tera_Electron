import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { 
  setSettingAction, 
  resetSettingAction,
  updateAllSettingsAction,
  resetAppState
} from '../../../store/slices/appSlice';

const Container = styled.div`
  padding: 20px;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius};
  box-shadow: ${props => props.theme.shadows.medium};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
`;

const SettingGroup = styled.div`
  margin-bottom: 24px;
`;

const GroupTitle = styled.h3`
  font-size: 16px;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 16px;
`;

const Setting = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: ${props => props.theme.borderRadius};
  background-color: ${props => props.theme.colors.background.primary};
  margin-bottom: 8px;

  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const SettingLabel = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
`;

const SettingDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 12px;
  margin-top: 4px;
  margin-bottom: 0;
`;

const SettingControl = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  padding: 6px 12px;
  background-color: ${props => props.theme.colors.button.primary};
  color: ${props => props.theme.colors.button.text};
  border: none;
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  margin-left: 8px;
  font-size: 14px;
  
  &:hover {
    background-color: ${props => props.theme.colors.button.hover};
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.button.disabled};
    cursor: not-allowed;
  }
`;

const SelectControl = styled.select`
  padding: 6px 10px;
  border-radius: ${props => props.theme.borderRadius};
  border: 1px solid ${props => props.theme.colors.border.main};
  background-color: ${props => props.theme.colors.input.background};
  color: ${props => props.theme.colors.text.primary};
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary.main};
  }
`;

const ToggleSwitch = styled.div<{ isActive: boolean }>`
  width: 48px;
  height: 24px;
  background-color: ${props => props.isActive ? 
    props.theme.colors.switch.active : 
    props.theme.colors.switch.inactive
  };
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 2px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &::after {
    content: '';
    display: block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    transform: translateX(${props => props.isActive ? '24px' : '0'});
    transition: transform 0.2s;
  }
`;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  width: 180px;
`;

const Slider = styled.input`
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: ${props => props.theme.colors.slider.track};
  outline: none;
  border-radius: 2px;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${props => props.theme.colors.slider.thumb};
    cursor: pointer;
  }
`;

const SliderValue = styled.span`
  margin-left: 12px;
  color: ${props => props.theme.colors.text.primary};
  min-width: 32px;
  text-align: right;
`;

interface SettingsPanelProps {
  sectionTitle?: string;
  onClose?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  sectionTitle = 'Settings',
  onClose
}) => {
  const appSettings = useSelector((state: RootState) => state.app);
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize settings from Electron on component mount
    window.electron.settings.getAll().then((allSettings) => {
      console.log('Settings loaded:', allSettings);
      // Update Redux store with settings
      if (allSettings) {
        // Convert nested object to flat dot notation
        const flatSettings: Record<string, any> = {};
        
        // Helper function to flatten nested object with dot notation
        const flattenObject = (obj: any, prefix = '') => {
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              flattenObject(obj[key], `${prefix}${key}.`);
            } else {
              flatSettings[`${prefix}${key}`] = obj[key];
            }
          }
        };
        
        // Flatten settings from electron store
        flattenObject(allSettings);
        
        // Dispatch action to update all settings at once
        dispatch(updateAllSettingsAction(flatSettings));
      }
    }).catch(error => {
      console.error('Failed to load settings:', error);
    });
  }, [dispatch]);

  // Function to handle boolean setting toggle
  const handleToggle = (path: string, currentValue: boolean) => {
    setIsSaving(true);
    window.electron.settings.set(path, !currentValue)
      .then(() => {
        dispatch(setSettingAction({ path, value: !currentValue }));
      })
      .catch(error => {
        console.error(`Failed to toggle setting ${path}:`, error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  // Function to handle select change
  const handleSelect = (path: string, value: string) => {
    setIsSaving(true);
    window.electron.settings.set(path, value)
      .then(() => {
        dispatch(setSettingAction({ path, value }));
      })
      .catch(error => {
        console.error(`Failed to update setting ${path}:`, error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  // Function to handle slider change
  const handleSlider = (path: string, value: number) => {
    window.electron.settings.set(path, value)
      .then(() => {
        dispatch(setSettingAction({ path, value }));
      })
      .catch(error => {
        console.error(`Failed to update setting ${path}:`, error);
      });
  };

  // Function to reset a setting to default
  const handleReset = (path: string) => {
    setIsSaving(true);
    window.electron.settings.reset(path)
      .then((defaultValue) => {
        dispatch(resetSettingAction({ path }));
      })
      .catch(error => {
        console.error(`Failed to reset setting ${path}:`, error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Container>
      <Title>{sectionTitle}</Title>
      
      {/* Display settings */}
      <SettingGroup>
        <GroupTitle>Display</GroupTitle>
        
        <Setting>
          <div>
            <SettingLabel>Theme</SettingLabel>
            <SettingDescription>Change application appearance</SettingDescription>
          </div>
          <SettingControl>
            <SelectControl 
              value={(appSettings.theme || 'system')} 
              onChange={(e) => handleSelect('ui.theme', e.target.value)}
              disabled={isSaving}
            >
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </SelectControl>
            <Button 
              onClick={() => handleReset('ui.theme')}
              disabled={isSaving}
            >
              Reset
            </Button>
          </SettingControl>
        </Setting>
        
        <Setting>
          <div>
            <SettingLabel>UI Animations</SettingLabel>
            <SettingDescription>Enable or disable UI animations</SettingDescription>
          </div>
          <SettingControl>
            <ToggleSwitch 
              isActive={appSettings.animations !== false} 
              onClick={() => handleToggle('ui.animations', !!appSettings.animations)}
            />
          </SettingControl>
        </Setting>
      </SettingGroup>
      
      {/* Game settings */}
      <SettingGroup>
        <GroupTitle>Game</GroupTitle>
        
        <Setting>
          <div>
            <SettingLabel>Autosave</SettingLabel>
            <SettingDescription>Automatically save game progress</SettingDescription>
          </div>
          <SettingControl>
            <ToggleSwitch 
              isActive={appSettings.autosave !== false} 
              onClick={() => handleToggle('game.gameplay.autosave', !!appSettings.autosave)}
            />
          </SettingControl>
        </Setting>
        
        <Setting>
          <div>
            <SettingLabel>Difficulty</SettingLabel>
            <SettingDescription>Set game difficulty level</SettingDescription>
          </div>
          <SettingControl>
            <SelectControl 
              value={(appSettings.difficulty || 'normal')} 
              onChange={(e) => handleSelect('game.gameplay.difficultyLevel', e.target.value)}
              disabled={isSaving}
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
              <option value="extreme">Extreme</option>
            </SelectControl>
            <Button 
              onClick={() => handleReset('game.gameplay.difficultyLevel')} 
              disabled={isSaving}
            >
              Reset
            </Button>
          </SettingControl>
        </Setting>
      </SettingGroup>
      
      {/* Audio settings */}
      <SettingGroup>
        <GroupTitle>Audio</GroupTitle>
        
        <Setting>
          <div>
            <SettingLabel>Master Volume</SettingLabel>
            <SettingDescription>Adjust overall game volume</SettingDescription>
          </div>
          <SettingControl>
            <SliderContainer>
              <Slider 
                type="range" 
                min={0} 
                max={1} 
                step={0.01} 
                value={(appSettings.masterVolume || 0.8)} 
                onChange={(e) => handleSlider('game.audio.masterVolume', parseFloat(e.target.value))}
              />
              <SliderValue>{Math.round(((appSettings.masterVolume || 0.8) * 100))}%</SliderValue>
            </SliderContainer>
            <Button 
              onClick={() => handleReset('game.audio.masterVolume')} 
              disabled={isSaving}
            >
              Reset
            </Button>
          </SettingControl>
        </Setting>
        
        <Setting>
          <div>
            <SettingLabel>Music Volume</SettingLabel>
            <SettingDescription>Adjust background music volume</SettingDescription>
          </div>
          <SettingControl>
            <SliderContainer>
              <Slider 
                type="range" 
                min={0} 
                max={1} 
                step={0.01} 
                value={(appSettings.musicVolume || 0.7)} 
                onChange={(e) => handleSlider('game.audio.musicVolume', parseFloat(e.target.value))}
              />
              <SliderValue>{Math.round(((appSettings.musicVolume || 0.7) * 100))}%</SliderValue>
            </SliderContainer>
            <Button 
              onClick={() => handleReset('game.audio.musicVolume')}
              disabled={isSaving}
            >
              Reset
            </Button>
          </SettingControl>
        </Setting>
      </SettingGroup>
      
      {/* Actions */}
      <SettingGroup>
          <Button 
            onClick={() => {
              window.electron.settings.resetAll()
                .then((defaultSettings) => {
                  // Reset all settings in Redux store
                  dispatch(resetAppState());
                  
                  // Then update with the default settings
                  if (defaultSettings) {
                    // Flatten the settings object
                    const flatSettings: Record<string, any> = {};
                    
                    const flattenObject = (obj: any, prefix = '') => {
                      for (const key in obj) {
                        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                          flattenObject(obj[key], `${prefix}${key}.`);
                        } else {
                          flatSettings[`${prefix}${key}`] = obj[key];
                        }
                      }
                    };
                    
                    flattenObject(defaultSettings);
                    dispatch(updateAllSettingsAction(flatSettings));
                  }
                })
                .catch(error => {
                  console.error('Failed to reset all settings:', error);
                });
            }}
            disabled={isSaving}
          >
          Reset All Settings
        </Button>
        {onClose && (
          <Button 
            onClick={onClose}
            style={{ marginLeft: 12, backgroundColor: '#6c757d' }}
          >
            Close
          </Button>
        )}
      </SettingGroup>
    </Container>
  );
};

export default SettingsPanel;
