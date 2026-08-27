import React from 'react';
import { ALL_MODULES } from '../services/moduleCatalog';
import { ProjectTableWidget, QuickLinksWidget } from './groupA/ProjectWidgets';
import { ProjectsExpandedWorkbench } from './groupA/ProjectsExpandedWorkbench';
import { SecretsVaultWidget } from './groupB/SecretsWidgets';
import { SecretsExpandedWorkbench } from './groupB/SecretsExpandedWorkbench';
import { ArtifactsRegistryWidget } from './groupC/ArtifactsWidgets';
import { DockerContainersWidget, DockerExpandedWorkbench } from './groupC/DockerWidgets';
import { SslCertMonitorWidget, SslCertExpandedWorkbench } from './groupC/SslCertWidgets';
import { HealthMatrixWidget } from './groupD/HealthWidgets';
import { HealthExpandedWorkbench } from './groupD/HealthExpandedWorkbench';
import { PingTesterWidget, PingTesterExpandedWorkbench, DnsCheckWidget, DnsCheckExpandedWorkbench } from './groupD/NetworkDiagWidgets';
import { CliTerminalWidget, CliExpandedWorkbench } from './groupE/CliTerminalWidgets';
import { CloudflareOpsWidget, CloudflareExpandedWorkbench } from './groupE/CloudflareWidgets';
import { WebhookDispatcherWidget, WebhookDispatcherExpandedWorkbench } from './groupE/WebhookWidgets';
import { AiCopilotWidget, AiCopilotExpandedWorkbench } from './groupE/AiAssistantWidgets';
import { AuditLogWidget } from './groupF/AuditWidgets';
import { AccessAuditLedgerWidget, AccessAuditLedgerWorkbench } from './groupF/AccessAuditWidgets';
import { AsciiTopologyWidget } from './groupG/TopologyWidgets';
import { InteractiveCyberTopologyWidget, InteractiveCyberTopologyWorkbench } from './groupG/TopologyCanvasWidgets';
import { ResourceUsageWidget, ResourceUsageExpandedWorkbench } from './groupG/ResourceUsageWidgets';
import { ScratchpadWidget, NotepadExpandedWorkbench } from './groupH/NotepadWidgets';
import {
  JsonFormatterWidget,
  JsonFormatterExpandedWorkbench,
  Base64Widget,
  Base64ExpandedWorkbench,
  TextDiffWidget,
  TextDiffExpandedWorkbench,
  MarkdownPreviewWidget,
  MarkdownPreviewExpandedWorkbench
} from './groupH/UtilityWidgets';
import { TelegramBotWidget, TelegramExpandedWorkbench } from './groupI/TelegramWidgets';

export const standardWidgetRegistry: Record<string, React.FC> = {
  A1: ProjectTableWidget,
  A4: QuickLinksWidget,
  B1: SecretsVaultWidget,
  C1: ArtifactsRegistryWidget,
  C3: DockerContainersWidget,
  C4: SslCertMonitorWidget,
  D1: HealthMatrixWidget,
  D4: PingTesterWidget,
  D8: DnsCheckWidget,
  E1: CliTerminalWidget,
  E2: CloudflareOpsWidget,
  E3: WebhookDispatcherWidget,
  E9: AiCopilotWidget,
  F1: AuditLogWidget,
  F3: AccessAuditLedgerWidget,
  G1: InteractiveCyberTopologyWidget,
  G2: AsciiTopologyWidget,
  G3: ResourceUsageWidget,
  H2: ScratchpadWidget,
  H5: JsonFormatterWidget,
  H6: Base64Widget,
  H7: TextDiffWidget,
  H10: MarkdownPreviewWidget,
  I2: TelegramBotWidget,
};

export const expandedWorkbenchRegistry: Record<string, React.FC> = {
  A1: ProjectsExpandedWorkbench,
  B1: SecretsExpandedWorkbench,
  C3: DockerExpandedWorkbench,
  C4: SslCertExpandedWorkbench,
  D1: HealthExpandedWorkbench,
  D4: PingTesterExpandedWorkbench,
  D8: DnsCheckExpandedWorkbench,
  E1: CliExpandedWorkbench,
  E2: CloudflareExpandedWorkbench,
  E3: WebhookDispatcherExpandedWorkbench,
  E9: AiCopilotExpandedWorkbench,
  F3: AccessAuditLedgerWorkbench,
  G1: InteractiveCyberTopologyWorkbench,
  G3: ResourceUsageExpandedWorkbench,
  H2: NotepadExpandedWorkbench,
  H5: JsonFormatterExpandedWorkbench,
  H6: Base64ExpandedWorkbench,
  H7: TextDiffExpandedWorkbench,
  H10: MarkdownPreviewExpandedWorkbench,
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
