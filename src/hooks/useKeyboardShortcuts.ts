import { useEffect } from 'react';
import { soundFx } from '../services/soundFx';
import { useDashboard } from '../context/DashboardContext';
import { useTools } from '../context/ToolsContext';

export const useKeyboardShortcuts = () => {
  const { 
    zoomedModuleId, 
    setZoomedModuleId, 
    setColsMode, 
    setLayoutStyle, 
    setIsPickerOpen, 
    setIsLayoutModalOpen, 
    setIsSpotlightOpen 
  } = useDashboard();

  const { isBubbleOpen, setIsBubbleOpen } = useTools();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundFx.playClick(900);
        setIsSpotlightOpen(p => !p);
      } else if (e.key === 'Escape') {
        if (zoomedModuleId) {
          setZoomedModuleId(null);
          soundFx.playClick(700);
        } else if (isBubbleOpen) {
          setIsBubbleOpen(false);
        }
      } else if (e.key === '`' || (e.key === 'Tab' && e.altKey)) {
        e.preventDefault();
        setIsBubbleOpen(p => !p);
        soundFx.playClick(1000);
      } else if (e.key === 'F1') {
        e.preventDefault(); setColsMode(1); setLayoutStyle('grid');
      } else if (e.key === 'F2') {
        e.preventDefault(); setColsMode(2); setLayoutStyle('grid');
      } else if (e.key === 'F3') {
        e.preventDefault(); setColsMode(3); setLayoutStyle('grid');
      } else if (e.key === 'F4') {
        e.preventDefault(); setColsMode(4); setLayoutStyle('grid');
      } else if (e.key === 'F8') {
        e.preventDefault(); setIsPickerOpen(p => !p);
      } else if (e.key === 'F9') {
        e.preventDefault(); setIsLayoutModalOpen(p => !p);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomedModuleId, isBubbleOpen, setZoomedModuleId, setColsMode, setLayoutStyle, setIsPickerOpen, setIsLayoutModalOpen, setIsSpotlightOpen, setIsBubbleOpen]);
};
