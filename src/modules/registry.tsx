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
import { ScratchpadWidget, NotepadExpandedWorkbench } from './groupH/NotepadWidgets';

export const standardWidgetRegistry: Record<string, React.FC> = {
  A1: ProjectTableWidget,
  A4: QuickLinksWidget,
  B1: SecretsVaultWidget,
  C1: ArtifactsRegistryWidget,
  D1: HealthMatrixWidget,
  E1: CliTerminalWidget,
  F1: AuditLogWidget,
  G2: AsciiTopologyWidget,
  H2: ScratchpadWidget,
};

export const expandedWorkbenchRegistry: Record<string, React.FC> = {
  A1: ProjectsExpandedWorkbench,
  B1: SecretsExpandedWorkbench,
  D1: HealthExpandedWorkbench,
  E1: CliExpandedWorkbench,
  H2: NotepadExpandedWorkbench,
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
