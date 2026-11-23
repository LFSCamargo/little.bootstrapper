import React, { useState } from 'react';
import { Box } from 'ink';
import { PlanetBanner, PlanetThemeProvider } from '@little-bootstrapper/ui-cli';
import type { InteractiveMode } from '../commands/index.js';
import { MainMenuScreen } from './screens/MainMenuScreen.js';
import { InitWizardScreen } from './screens/InitWizardScreen.js';
import { RulesMarketplaceScreen } from './screens/RulesMarketplaceScreen.js';
import { McpCatalogScreen } from './screens/McpCatalogScreen.js';
import { NormalizeWizardScreen } from './screens/NormalizeWizardScreen.js';
import { UpdateWizardScreen } from './screens/UpdateWizardScreen.js';

export type WorkflowMode = InteractiveMode;

export interface AppProps {
  initialMode?: WorkflowMode;
  cwd: string;
}

export const App: React.FC<AppProps> = ({ initialMode = 'menu', cwd }) => {
  const [mode, setMode] = useState<WorkflowMode>(initialMode);
  const [completed, setCompleted] = useState(false);

  return (
    <PlanetThemeProvider>
      <Box flexDirection="column" padding={1}>
        <PlanetBanner animated={!completed} />

        <Box marginTop={1} flexDirection="column">
          {mode === 'menu' && <MainMenuScreen onSelectMode={setMode} />}
          {mode === 'init' && (
            <InitWizardScreen
              cwd={cwd}
              onBackToMenu={() => setMode('menu')}
              onCompleted={() => setCompleted(true)}
            />
          )}
          {mode === 'rules' && (
            <RulesMarketplaceScreen
              cwd={cwd}
              onBackToMenu={() => setMode('menu')}
              onCompleted={() => setCompleted(true)}
            />
          )}
          {mode === 'mcps' && (
            <McpCatalogScreen
              cwd={cwd}
              onBackToMenu={() => setMode('menu')}
              onCompleted={() => setCompleted(true)}
            />
          )}
          {mode === 'normalize' && (
            <NormalizeWizardScreen
              cwd={cwd}
              onBackToMenu={() => setMode('menu')}
              onCompleted={() => setCompleted(true)}
            />
          )}
          {mode === 'update' && (
            <UpdateWizardScreen
              cwd={cwd}
              onBackToMenu={() => setMode('menu')}
              onCompleted={() => setCompleted(true)}
            />
          )}
        </Box>
      </Box>
    </PlanetThemeProvider>
  );
};
