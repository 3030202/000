import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ProjectItem, 
  SecretItem, 
  ArtifactItem, 
  HealthEndpoint, 
  QuickAction, 
  DefconLevel 
} from '../types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_SECRETS, 
  INITIAL_ARTIFACTS, 
  INITIAL_HEALTH_ENDPOINTS, 
  INITIAL_QUICK_ACTIONS 
} from '../services/initialData';
import { soundFx } from '../services/soundFx';

export interface DashboardContextType {
  layoutStyle: 'grid' | 'master' | 'rows';
  setLayoutStyle: React.Dispatch<React.SetStateAction<'grid' | 'master' | 'rows'>>;
  colsMode: number;
  setColsMode: React.Dispatch<React.SetStateAction<number>>;
  density: 'standard' | 'nano';
  setDensity: React.Dispatch<React.SetStateAction<'standard' | 'nano'>>;
  theme: 'cyber' | 'matrix' | 'amber' | 'mono';
  setTheme: React.Dispatch<React.SetStateAction<'cyber' | 'matrix' | 'amber' | 'mono'>>;
  activeModuleIds: string[];
  setActiveModuleIds: React.Dispatch<React.SetStateAction<string[]>>;
  zoomedModuleId: string | null;
  setZoomedModuleId: React.Dispatch<React.SetStateAction<string | null>>;
  toggleZoom: (id: string) => void;
  
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  selectedSecretId: string;
  setSelectedSecretId: (id: string) => void;
  selectedEndpointId: string;
  setSelectedEndpointId: (id: string) => void;
  selectedArtifactId: string;
  setSelectedArtifactId: (id: string) => void;
  selectedLogId: string;
  setSelectedLogId: (id: string) => void;

  isPickerOpen: boolean;
  setIsPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLayoutModalOpen: boolean;
  setIsLayoutModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSpotlightOpen: boolean;
  setIsSpotlightOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPasswordModalOpen: boolean;
  setIsPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  defcon: DefconLevel;
  setDefcon: (lvl: DefconLevel) => void;
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;

  projects: ProjectItem[];
  secrets: SecretItem[];
  artifacts: ArtifactItem[];
  healthEndpoints: HealthEndpoint[];
  quickActions: QuickAction[];

  handleSaveSlot: (slotNum: number) => void;
  handleLoadSlot: (slotNum: number) => boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'master' | 'rows'>(() => {
    return (localStorage.getItem('000_layout_style') as any) || 'grid';
  });

  const [colsMode, setColsMode] = useState<number>(() => {
    return Number(localStorage.getItem('000_cols') || '3');
  });

  const [density, setDensity] = useState<'standard' | 'nano'>(() => {
    return (localStorage.getItem('000_density') as any) || 'standard';
  });

  const [theme, setTheme] = useState<'cyber' | 'matrix' | 'amber' | 'mono'>(() => {
    return (localStorage.getItem('000_theme') as any) || 'cyber';
  });

  const [activeModuleIds, setActiveModuleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('000_active_modules');
    return saved ? JSON.parse(saved) : ['A1', 'B1', 'D1', 'E1', 'F1', 'H2'];
  });

  const [zoomedModuleId, setZoomedModuleId] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(INITIAL_PROJECTS[0]?.id || '');
  const [selectedSecretId, setSelectedSecretId] = useState<string>(INITIAL_SECRETS[0]?.id || '');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(INITIAL_HEALTH_ENDPOINTS[0]?.id || '');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(INITIAL_ARTIFACTS[0]?.id || '');
  const [selectedLogId, setSelectedLogId] = useState<string>('');

  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);

  const [defcon, setDefconState] = useState<DefconLevel>(5);
  const [soundOn, setSoundOnState] = useState<boolean>(soundFx.enabled);

  const [projects] = useState<ProjectItem[]>(() => {
    const s = localStorage.getItem('000_projects');
    return s ? JSON.parse(s) : INITIAL_PROJECTS;
  });

  const [secrets] = useState<SecretItem[]>(() => {
    const s = localStorage.getItem('000_secrets');
    return s ? JSON.parse(s) : INITIAL_SECRETS;
  });

  const [artifacts] = useState<ArtifactItem[]>(() => {
    const s = localStorage.getItem('000_artifacts');
    return s ? JSON.parse(s) : INITIAL_ARTIFACTS;
  });

  const [healthEndpoints] = useState<HealthEndpoint[]>(() => {
    const s = localStorage.getItem('000_health');
    return s ? JSON.parse(s) : INITIAL_HEALTH_ENDPOINTS;
  });

  const [quickActions] = useState<QuickAction[]>(INITIAL_QUICK_ACTIONS);

  // Apply Theme & Density Classes to Body
  useEffect(() => {
    document.body.className = `theme-${theme} density-${density}`;
  }, [theme, density]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('000_active_modules', JSON.stringify(activeModuleIds));
  }, [activeModuleIds]);

  useEffect(() => {
    localStorage.setItem('000_layout_style', layoutStyle);
  }, [layoutStyle]);

  useEffect(() => {
    localStorage.setItem('000_cols', String(colsMode));
  }, [colsMode]);

  useEffect(() => {
    localStorage.setItem('000_density', density);
  }, [density]);

  useEffect(() => {
    localStorage.setItem('000_theme', theme);
  }, [theme]);

  const setDefcon = (lvl: DefconLevel) => {
    setDefconState(lvl);
    if (lvl <= 2) {
      soundFx.playAlarm();
    } else {
      soundFx.playClick(600);
    }
  };

  const setSoundOn = (on: boolean) => {
    setSoundOnState(on);
    soundFx.enabled = on;
  };

  const toggleZoom = (id: string) => {
    soundFx.playClick(zoomedModuleId === id ? 700 : 1100);
    setZoomedModuleId(prev => (prev === id ? null : id));
  };

  const handleSaveSlot = (slotNum: number) => {
    const payload = {
      modules: activeModuleIds,
      layoutStyle,
      colsMode,
      density,
      theme
    };
    localStorage.setItem(`000_slot_${slotNum}`, JSON.stringify(payload));
  };

  const handleLoadSlot = (slotNum: number): boolean => {
    const s = localStorage.getItem(`000_slot_${slotNum}`);
    if (!s) return false;
    try {
      const data = JSON.parse(s);
      if (data.modules) setActiveModuleIds(data.modules);
      if (data.layoutStyle) setLayoutStyle(data.layoutStyle);
      if (data.colsMode) setColsMode(data.colsMode);
      if (data.density) setDensity(data.density);
      if (data.theme) setTheme(data.theme);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        layoutStyle,
        setLayoutStyle,
        colsMode,
        setColsMode,
        density,
        setDensity,
        theme,
        setTheme,
        activeModuleIds,
        setActiveModuleIds,
        zoomedModuleId,
        setZoomedModuleId,
        toggleZoom,
        selectedProjectId,
        setSelectedProjectId,
        selectedSecretId,
        setSelectedSecretId,
        selectedEndpointId,
        setSelectedEndpointId,
        selectedArtifactId,
        setSelectedArtifactId,
        selectedLogId,
        setSelectedLogId,
        isPickerOpen,
        setIsPickerOpen,
        isLayoutModalOpen,
        setIsLayoutModalOpen,
        isSpotlightOpen,
        setIsSpotlightOpen,
        isPasswordModalOpen,
        setIsPasswordModalOpen,
        defcon,
        setDefcon,
        soundOn,
        setSoundOn,
        projects,
        secrets,
        artifacts,
        healthEndpoints,
        quickActions,
        handleSaveSlot,
        handleLoadSlot
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
