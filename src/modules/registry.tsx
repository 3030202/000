import React from 'react';
import { ALL_MODULES } from '../services/moduleCatalog';
import { ProjectTableWidget, QuickLinksWidget } from './groupA/ProjectWidgets';
import { ProjectsExpandedWorkbench } from './groupA/ProjectsExpandedWorkbench';
import { SecretsVaultWidget } from './groupB/SecretsWidgets';
import { SecretsExpandedWorkbench } from './groupB/SecretsExpandedWorkbench';
import { ArtifactsRegistryWidget } from './groupC/ArtifactsWidgets';
import { HealthMatrixWidget } from './groupD/HealthWidgets';
import { HealthExpandedWorkbench } from './groupD/HealthExpandedWorkbench';
import { CliTerminalWidget, CliExpandedWorkbench } from './groupE/CliTerminalWidgets';
import { AuditLogWidget } from './groupF/AuditWidgets';
import { AsciiTopologyWidget } from './groupG/TopologyWidgets';
import { InteractiveCyberTopologyWidget, InteractiveCyberTopologyWorkbench } from './groupG/TopologyCanvasWidgets';
import { ResourceUsageWidget, ResourceUsageExpandedWorkbench } from './groupG/ResourceUsageWidgets';
import { DockerContainersWidget, DockerExpandedWorkbench } from './groupC/DockerWidgets';
import { ScratchpadWidget, NotepadExpandedWorkbench } from './groupH/NotepadWidgets';
import { TelegramBotWidget, TelegramExpandedWorkbench } from './groupI/TelegramWidgets';
import { CloudflareOpsWidget, CloudflareExpandedWorkbench } from './groupE/CloudflareWidgets';
import { AiCopilotWidget, AiCopilotExpandedWorkbench } from './groupE/AiAssistantWidgets';

export const standardWidgetRegistry: Record<string, React.FC> = {
  A1: ProjectTableWidget,
  A4: QuickLinksWidget,
  B1: SecretsVaultWidget,
  C1: ArtifactsRegistryWidget,
  C3: DockerContainersWidget,
  D1: HealthMatrixWidget,
  E1: CliTerminalWidget,
  E2: CloudflareOpsWidget,
  E9: AiCopilotWidget,
  F1: AuditLogWidget,
  G1: InteractiveCyberTopologyWidget,
  G2: AsciiTopologyWidget,
  G3: ResourceUsageWidget,
  H2: ScratchpadWidget,
  I2: TelegramBotWidget,
};

export const expandedWorkbenchRegistry: Record<string, React.FC> = {
  A1: ProjectsExpandedWorkbench,
  B1: SecretsExpandedWorkbench,
  C3: DockerExpandedWorkbench,
  D1: HealthExpandedWorkbench,
  E1: CliExpandedWorkbench,
  E2: CloudflareExpandedWorkbench,
  E9: AiCopilotExpandedWorkbench,
  G1: InteractiveCyberTopologyWorkbench,
  G3: ResourceUsageExpandedWorkbench,
  H2: NotepadExpandedWorkbench,
  I2: TelegramExpandedWorkbench,
};

export const GenericModuleFallback: React.FC<{ modId: string }> = ({ modId }) => {
  const def = ALL_MODULES.find(m => m.id === modId);
  return (
    <div style={{ color: 'var(--fg-dim)', fontSize: '10.5px' }}>
      <div>{def?.name} ({def?.code}) — {def?.description}</div>
      <div style={{ marginTop: '6px' }}><span className="pill green">[ACTIVE]</span></div>
    </div>
  );
};

export const renderModuleContent = (modId: string, isZoomed: boolean): React.ReactNode => {
  if (isZoomed) {
    const ExpandedComponent = expandedWorkbenchRegistry[modId];
    if (ExpandedComponent) {
      return <ExpandedComponent />;
    }
  }

  const StandardComponent = standardWidgetRegistry[modId];
  if (StandardComponent) {
    return <StandardComponent />;
  }

  return <GenericModuleFallback modId={modId} />;
};
