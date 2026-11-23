import React, { useEffect, useState } from 'react';
import { Box, useApp, useInput } from 'ink';
import {
  Alert,
  BenderCard,
  MarkdownPanel,
  MultiSelect,
  Select,
  Spinner,
  StatusFooter,
  StepProgress,
  SummaryTable,
} from '@little-bootstrapper/ui-cli';
import type { AIAgent, AdditionalTool, DetectedSetup, McpServerId } from '../../types/index.js';
import {
  ADDITIONAL_TOOLS,
  AI_AGENTS,
  DEFAULT_VERIFIED_MCPS,
  VERIFIED_MCPS,
} from '../../modules/catalog/index.js';
import { applyNormalization, detectCurrentSetup } from '../../modules/workflows/index.js';

export interface NormalizeWizardScreenProps {
  cwd: string;
  onBackToMenu: () => void;
  onCompleted: () => void;
}

type NormStep = 'agent' | 'agents-list' | 'tools' | 'mcps' | 'done';

export const NormalizeWizardScreen: React.FC<NormalizeWizardScreenProps> = ({
  cwd,
  onBackToMenu,
  onCompleted,
}) => {
  const { exit } = useApp();
  const [step, setStep] = useState<NormStep>('agent');
  const [detected, setDetected] = useState<DetectedSetup | null>(null);
  const [normalizingAgent, setNormalizingAgent] = useState<AIAgent>('claude');
  const [chosenAgents, setChosenAgents] = useState<AIAgent[]>(AI_AGENTS.map((a) => a.id));
  const [chosenTools, setChosenTools] = useState<AdditionalTool[]>(
    ADDITIONAL_TOOLS.map((t) => t.id).filter((id) => id !== 'financial-audit'),
  );
  const [chosenMcps, setChosenMcps] = useState<McpServerId[]>(DEFAULT_VERIFIED_MCPS);
  const [doneFiles, setDoneFiles] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void detectCurrentSetup(cwd)
      .then((res) => {
        if (cancelled) return;
        setDetected(res);
        if (res.mcpsConfigured.length > 0) {
          const valid = res.mcpsConfigured.filter((id): id is McpServerId =>
            VERIFIED_MCPS.some((m) => m.id === id),
          );
          if (valid.length > 0) setChosenMcps(valid);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [cwd]);

  useEffect(() => {
    if (step !== 'done') return;
    onCompleted();
    const timer = setTimeout(() => exit(), 80);
    return () => clearTimeout(timer);
  }, [step, exit, onCompleted]);

  // Allow Esc back-navigation on Select and Error views (MultiSelect handles its own Esc -> onBack)
  useInput((_input, key) => {
    if (!key.escape) return;
    if (error || step === 'agent') {
      onBackToMenu();
    }
  });

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Alert variant="error" title="Normalize Error">
          {error}
        </Alert>
        <Select
          options={[{ label: '↩️  Back to Main Menu', value: 'back' }]}
          onChange={onBackToMenu}
        />
        <StatusFooter context="NORMALIZE" hints={[{ key: 'Esc/Enter', action: 'Back to menu' }]} />
      </Box>
    );
  }

  if (!detected) {
    return (
      <Box flexDirection="column">
        <Spinner label="Scanning repository for tools, AI agents, MCPs & rules..." type="dots" />
        <StatusFooter context="NORMALIZE" hints={[{ key: 'Ctrl+C', action: 'Cancel' }]} />
      </Box>
    );
  }

  if (step === 'done' && doneFiles) {
    const markdown = [
      '# Normalization Report',
      `- Executed by agent: **${normalizingAgent}**`,
      `- Synced **${doneFiles.length}** files including \`.ai/normalization-plan.md\``,
      '- Next step: run `little-bootstrapper validate` to confirm 8/8 checks pass',
    ].join('\n');

    return (
      <Box flexDirection="column" gap={1}>
        <BenderCard message={`Normalization complete via ${normalizingAgent}!`} />
        <SummaryTable
          title="Normalized Repository Summary"
          columns={[
            { key: 'section', header: 'Component', color: 'cyan' },
            { key: 'configured', header: 'Synced Selection', color: 'green' },
          ]}
          rows={[
            { section: 'Normalizing Agent', configured: normalizingAgent },
            { section: 'AI Agents', configured: chosenAgents.join(', ') },
            { section: 'Tools & Skills', configured: `${chosenTools.length} active` },
            { section: 'Verified MCPs', configured: chosenMcps.join(', ') || 'none' },
            { section: 'Files Synced', configured: `${doneFiles.length} files` },
          ]}
        />
        <MarkdownPanel title="Handoff Notes" markdown={markdown} />
        <StatusFooter
          context="DONE"
          hints={[{ key: 'Exit', action: 'Command complete — returned to shell' }]}
        />
      </Box>
    );
  }

  if (step === 'agent') {
    return (
      <Box flexDirection="column" gap={1}>
        <StepProgress
          workflow="NORMALIZE"
          stepName="Select Normalizing Agent"
          currentStep={1}
          totalSteps={4}
        />
        <SummaryTable
          title="Detected Repository Setup"
          columns={[
            { key: 'area', header: 'Area', color: 'cyan' },
            { key: 'present', header: 'Detected', color: 'green' },
            { key: 'missing', header: 'Missing / Gaps', color: 'yellow' },
          ]}
          rows={[
            {
              area: 'AI Agents',
              present: detected.agents.join(', ') || 'none',
              missing: detected.missingAgents.join(', ') || 'none',
            },
            {
              area: 'Tools & Skills',
              present: `${detected.tools.length} active`,
              missing: detected.missingTools.join(', ') || 'none',
            },
            {
              area: 'Universal Rules',
              present: `${detected.rulesPresent.length} active`,
              missing: detected.rulesMissing.join(', ') || 'none',
            },
            {
              area: 'MCP Servers',
              present: detected.mcpsConfigured.join(', ') || 'none',
              missing: detected.hasMcpConfig ? 'synced' : 'no mcp.json',
            },
          ]}
        />
        <Select
          options={AI_AGENTS.map((a) => ({ label: `${a.label} — ${a.description}`, value: a.id }))}
          onChange={(val) => {
            setNormalizingAgent(val as AIAgent);
            setStep('agents-list');
          }}
        />
        <StatusFooter
          context="NORMALIZE 1/4"
          hints={[
            { key: '↑/↓', action: 'Choose agent' },
            { key: 'Enter', action: 'Next' },
            { key: 'Esc', action: 'Back to menu' },
          ]}
        />
      </Box>
    );
  }

  if (step === 'agents-list') {
    return (
      <Box flexDirection="column">
        <StepProgress
          workflow="NORMALIZE"
          stepName="Select AI Agents"
          currentStep={2}
          totalSteps={4}
        />
        <MultiSelect
          options={AI_AGENTS.map((a) => ({
            label: a.label,
            value: a.id,
            hint: detected.agents.includes(a.id) ? '(detected)' : '(missing)',
          }))}
          initialSelected={chosenAgents}
          onBack={() => setStep('agent')}
          onSubmit={(selected) => {
            setChosenAgents(selected);
            setStep('tools');
          }}
        />
        <StatusFooter
          context="NORMALIZE 2/4"
          hints={[
            { key: '↑/↓', action: 'Move' },
            { key: 'Space', action: 'Toggle' },
            { key: 'Enter', action: 'Next' },
            { key: 'Esc', action: 'Previous step' },
          ]}
        />
      </Box>
    );
  }

  if (step === 'tools') {
    return (
      <Box flexDirection="column">
        <StepProgress
          workflow="NORMALIZE"
          stepName="Select Tools & Skills"
          currentStep={3}
          totalSteps={4}
        />
        <MultiSelect
          searchable
          options={ADDITIONAL_TOOLS.map((t) => ({
            label: t.label,
            value: t.id,
            hint: detected.tools.includes(t.id) ? '(detected)' : '(missing)',
          }))}
          initialSelected={chosenTools}
          minSelected={0}
          onBack={() => setStep('agents-list')}
          onSubmit={(selected) => {
            setChosenTools(selected);
            setStep('mcps');
          }}
        />
        <StatusFooter
          context="NORMALIZE 3/4"
          hints={[
            { key: '↑/↓', action: 'Move' },
            { key: 'Space', action: 'Toggle' },
            { key: '/', action: 'Search' },
            { key: 'Enter', action: 'Next' },
            { key: 'Esc', action: 'Previous step' },
          ]}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <StepProgress
        workflow="NORMALIZE"
        stepName="Select Verified MCPs"
        currentStep={4}
        totalSteps={4}
      />
      <MultiSelect
        searchable
        searchPlaceholder="Press / to search verified MCPs..."
        options={VERIFIED_MCPS.map((m) => ({
          label: `[${m.category}] ${m.name} (${m.publisher})`,
          value: m.id,
          category: m.category,
          hint: detected.mcpsConfigured.includes(m.id) ? '(installed)' : m.description,
        }))}
        initialSelected={chosenMcps}
        minSelected={0}
        onBack={() => setStep('tools')}
        onSubmit={async (selectedMcps) => {
          try {
            setChosenMcps(selectedMcps);
            const res = await applyNormalization(
              cwd,
              chosenAgents,
              chosenTools,
              normalizingAgent,
              selectedMcps,
            );
            setDoneFiles(res.filesUpdated);
            setStep('done');
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }}
      />
      <StatusFooter
        context="NORMALIZE 4/4"
        hints={[
          { key: '↑/↓', action: 'Move' },
          { key: 'Space', action: 'Toggle' },
          { key: '/', action: 'Search' },
          { key: 'Enter', action: 'Apply & Exit' },
          { key: 'Esc', action: 'Previous step' },
        ]}
      />
    </Box>
  );
};
