import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import isEqual from 'lodash.isequal';
// Import the new priority function
// @ts-ignore
import { getFamilyPriority } from '../new_priority_system';

// Types for the data
interface ModifierFamily {
  type: 'Prefix' | 'Suffix';
  mods: Array<{
    tier: string;
    name: string;
    stat: string;
  }>;
  displayName?: string;
}

interface FamiliesData {
  [family: string]: ModifierFamily;
}

interface ItemtypeMap {
  [equipment: string]: {
    [subcategory: string]: string[]; // array of family names
  };
}

interface BasetypeMap {
  [equipment: string]: {
    [subcategory: string]: string[]; // array of basetype names
  };
}

const App: React.FC = () => {
  // Data state
  const [families, setFamilies] = useState<FamiliesData>({});
  const [itemtypeMap, setItemtypeMap] = useState<ItemtypeMap>({});
  const [basetypeMap, setBasetypeMap] = useState<BasetypeMap>({});
  const [groupingsData, setGroupingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Tier selection state: equipment -> subcategory -> family -> selected tiers
  const [tierSelections, setTierSelections] = useState<{
    [equipment: string]: {
      [subcategory: string]: {
        [family: string]: {
          good: string[];
          ok: string[];
        };
      };
    };
  }>({});

  // Basetype selection state: equipment -> subcategory -> selected basetypes
  const [basetypeSelections, setBasetypeSelections] = useState<{
    [equipment: string]: {
      [subcategory: string]: {
        good: string[];
        ok: string[];
        all: string[];
        giga?: string[];
      };
    };
  }>({});

  // Mod button selection state: equipment -> subcategory -> family -> selected button
  const [modButtonSelections, setModButtonSelections] = useState<{
    [equipment: string]: {
      [subcategory: string]: {
        [family: string]: 'good' | 'ok' | 'giga' | null;
      };
    };
  }>({});

  // Most recently selected info for the new panel
  const [lastSelectedInfo, setLastSelectedInfo] = useState<{
    equipment: string;
    subcategory: string;
    family: string;
    tiers: { giga: string[]; good: string[]; ok: string[] };
    basetypes: { giga: string[]; good: string[]; ok: string[] };
  } | null>(null);
  
  // Track which family is currently being edited
  const [activeFamily, setActiveFamily] = useState<string | null>(null);

  // Drag state for basetype painting
  const [isDragging, setIsDragging] = useState(false);
  // const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  //const [dragStartSelected, setDragStartSelected] = useState(false);
  //const [dragType, setDragType] = useState<'good' | 'ok'>('ok');

  // Auto-select confirmation state
  const [autoSelectConfirmation, setAutoSelectConfirmation] = useState<{
    type: 'all' | 'equipment' | 'subcategory' | 'clear' | null;
    blinkingButton: string | null;
  }>({ type: null, blinkingButton: null });

  // Check if current item type uses non-tiered basetypes
  const isNonTieredBasetype = (equipment: string): boolean => {
    return equipment === 'Quiver' || equipment === 'Jewellery' || 
           equipment === 'OneHandAttack' || equipment === 'OneHandCast' || 
           equipment === 'TwoHandAttack' || equipment === 'TwoHandCast';
  };

  // Helper function to map itemtypes subcategory to basetypes subcategory
  const getBasetypeSubcategory = (equipment: string, subcategory: string): string => {
    // Handle weapon subcategories - they match directly
    if (equipment === 'Weapon') {
      return subcategory;
    }
    // Handle Quiver: always use 'Quiver' as subcategory
    if (equipment === 'Quiver') {
      return 'Quiver';
    }
    // Handle Jewellery equipment type
    if (equipment === 'Jewellery') {
      if (subcategory === 'Amulet') return 'Amulet';
      if (subcategory === 'Belt') return 'Belt';
      if (subcategory === 'Ring') return 'Ring';
    }
    // Handle other equipment types - map from itemtypes format to basetypes format
    if (equipment === 'Body Armour') {
      if (subcategory === 'StrInt') return 'StrInt';
      if (subcategory === 'StrDex') return 'StrDex';
      if (subcategory === 'DexInt') return 'DexInt';
      if (subcategory === 'Str') return 'Str';
      if (subcategory === 'Dex') return 'Dex';
      if (subcategory === 'Int') return 'Int';
    }
    if (equipment === 'Boots' || equipment === 'Gloves' || equipment === 'Helmets') {
      if (subcategory === 'StrInt') return 'StrInt';
      if (subcategory === 'StrDex') return 'StrDex';
      if (subcategory === 'DexInt') return 'DexInt';
      if (subcategory === 'Str') return 'Str';
      if (subcategory === 'Dex') return 'Dex';
      if (subcategory === 'Int') return 'Int';
    }
    if (equipment === 'Shield') {
      if (subcategory === 'Str') return 'Str';
      if (subcategory === 'Int') return 'Int';
    }
    return subcategory; // fallback
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [familiesRes, itemtypeRes, basetypeRes, groupingsRes] = await Promise.all([
          fetch(import.meta.env.BASE_URL + 'modifierFamiliesDisplay_7.json'),
          fetch(import.meta.env.BASE_URL + 'itemtypes_4.json'),
          fetch(import.meta.env.BASE_URL + 'basetypes_5.json'),
          fetch(import.meta.env.BASE_URL + 'groupings.json'),
        ]);
        if (!familiesRes.ok || !itemtypeRes.ok || !basetypeRes.ok || !groupingsRes.ok) throw new Error('Failed to fetch data');
        const familiesData = await familiesRes.json();
        const itemtypeData = await itemtypeRes.json();
        const basetypeData = await basetypeRes.json();
        const groupingsData = await groupingsRes.json();
        
        setFamilies(familiesData);
        setItemtypeMap(itemtypeData);
        setBasetypeMap(basetypeData);
        setGroupingsData(groupingsData);
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle global mouse up for drag ending
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // setDragStartIndex(null); // Removed
        // setDragStartSelected(false); // Removed
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Set document title to scrolling text
  useEffect(() => {
    const baseTitle = "TAWM'BERNO - Thank you for the fracture! ";
    let scrollTitle = baseTitle;
    const interval = setInterval(() => {
      scrollTitle = scrollTitle.slice(1) + scrollTitle[0];
      document.title = scrollTitle;
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Get available equipment and subcategories
  const equipmentList = Object.keys(itemtypeMap);
  const subcategoryList = selectedEquipment ? Object.keys(itemtypeMap[selectedEquipment]) : [];

  // Get families for current selection
  const currentFamilies: string[] = (selectedEquipment && selectedSubcategory)
    ? itemtypeMap[selectedEquipment][selectedSubcategory] || []
    : [];

  // Get basetypes for current selection using proper mapping
  const currentBasetypes: string[] = (selectedEquipment && selectedSubcategory)
    ? basetypeMap[selectedEquipment]?.[getBasetypeSubcategory(selectedEquipment, selectedSubcategory)] || []
    : [];

  // Helper function to get giga base for current selection
  const getGigaBase = useCallback((): string | null => {
    if (!selectedEquipment || !selectedSubcategory || currentBasetypes.length === 0) return null;
    return currentBasetypes[0]; // First basetype is the giga base
  }, [selectedEquipment, selectedSubcategory, currentBasetypes]);

  // Helper function to get mod button selection for a family
  const getModButtonSelection = useCallback((familyName: string): 'good' | 'ok' | 'giga' | null => {
    if (!selectedEquipment || !selectedSubcategory) return null;
    return modButtonSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName] || null;
  }, [selectedEquipment, selectedSubcategory, modButtonSelections]);

  // Get selected tiers for a family
  const getSelectedTiers = useCallback((familyName: string): { good: string[], ok: string[] } => {
    if (!selectedEquipment || !selectedSubcategory) return { good: [], ok: [] };
    return tierSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName] || { good: [], ok: [] };
  }, [selectedEquipment, selectedSubcategory, tierSelections]);

  // Get selected basetypes
  const getSelectedBasetypes = useCallback((): { good: string[], ok: string[], all: string[], giga?: string[] } => {
    if (!selectedEquipment || !selectedSubcategory) return { good: [], ok: [], all: [], giga: [] };
    const sel = basetypeSelections[selectedEquipment]?.[getBasetypeSubcategory(selectedEquipment, selectedSubcategory)] || { good: [], ok: [], all: [], giga: [] };
    return { ...sel };
  }, [selectedEquipment, selectedSubcategory, basetypeSelections, getBasetypeSubcategory]);

  // Helper function to update last selected info
  const updateLastSelectedInfo = useCallback((familyName: string) => {
    if (!selectedEquipment || !selectedSubcategory) return;
    const selectedTiers = getSelectedTiers(familyName);
    const selectedBasetypes = getSelectedBasetypes();
    const gigaBase = getGigaBase();
    const modButtonSelection = getModButtonSelection(familyName);
    const gigaTiers = modButtonSelection === 'giga' ? selectedTiers.good.slice(0, 1) : [];
    const gigaBasetypes = gigaBase && selectedBasetypes.good.includes(gigaBase) ? [gigaBase] : [];
    setLastSelectedInfo({
      equipment: selectedEquipment,
      subcategory: selectedSubcategory,
      family: familyName,
      tiers: {
        giga: gigaTiers,
        good: selectedTiers.good,
        ok: selectedTiers.ok
      },
      basetypes: {
        giga: gigaBasetypes,
        good: selectedBasetypes.good,
        ok: selectedBasetypes.ok
      }
    });
  }, [selectedEquipment, selectedSubcategory, getSelectedTiers, getSelectedBasetypes, getGigaBase, getModButtonSelection]);

  // Function to populate all basetypes when any selection is made
  const populateAllBasetypes = useCallback(() => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    const mappedSubcategory = getBasetypeSubcategory(selectedEquipment, selectedSubcategory);
    const allBasetypes = currentBasetypes;
    
    if (allBasetypes.length > 0) {
      setBasetypeSelections(currentSelections => {
        const newSelections = { ...currentSelections };
        if (!newSelections[selectedEquipment]) {
          newSelections[selectedEquipment] = {};
        }
        if (!newSelections[selectedEquipment][mappedSubcategory]) {
          newSelections[selectedEquipment][mappedSubcategory] = { good: [], ok: [], all: [], giga: [] };
        }
        
        // Always populate all basetypes
        newSelections[selectedEquipment][mappedSubcategory].all = [...allBasetypes];
        
        return newSelections;
      });
    }
  }, [selectedEquipment, selectedSubcategory, currentBasetypes, getBasetypeSubcategory]);

  // Unified tier selection handler for the single tier button list
  const handleTierSelect = useCallback((familyName: string, tier: string) => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    const modButtonSelection = getModButtonSelection(familyName);
    if (!modButtonSelection) return;
    
    // Set this as the active family being edited
    setActiveFamily(familyName);
    
    setTierSelections(currentSelections => {
      const allTiers = families[familyName]?.mods.map(mod => mod.tier).sort((a, b) => {
        const aNum = parseInt(a.replace(/\D/g, ''));
        const bNum = parseInt(b.replace(/\D/g, ''));
        return aNum - bNum;
      }) || [];
      const tierIndex = allTiers.indexOf(tier);
      if (tierIndex === -1) return currentSelections;
      
      const currentSelected = currentSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName] || { good: [], ok: [] };
      
      // Simple logic: if this tier is the highest selected, deselect it
      // Otherwise, select up to this tier
      let newSelection: { good: string[], ok: string[] };
      
      if (modButtonSelection === 'ok') {
        const currentOk = currentSelected.ok;
        const isHighestSelected = currentOk.includes(tier) && 
          currentOk.every(t => allTiers.indexOf(t) <= tierIndex);
        
        if (isHighestSelected) {
          // Deselect this tier
          newSelection = {
            good: [],
            ok: allTiers.slice(0, tierIndex)
          };
        } else {
          // Select up to this tier
          newSelection = {
            good: [],
            ok: allTiers.slice(0, tierIndex + 1)
          };
        }
      } else {
        const currentGood = currentSelected.good;
        const isHighestSelected = currentGood.includes(tier) && 
          currentGood.every(t => allTiers.indexOf(t) <= tierIndex);
        
        if (isHighestSelected) {
          // Deselect this tier
          newSelection = {
            good: allTiers.slice(0, tierIndex),
            ok: []
          };
        } else {
          // Select up to this tier
          const newGoodSelection = allTiers.slice(0, tierIndex + 1);
          
          // Apply +2 rule for OK tiers based on highest Good tier
          let newOkSelection: string[] = [];
          if (newGoodSelection.length > 0) {
            const maxGoodIndex = Math.max(...newGoodSelection.map(t => allTiers.indexOf(t)));
            const okEndIndex = Math.min(maxGoodIndex + 2, allTiers.length - 1);
            newOkSelection = allTiers.slice(0, okEndIndex + 1);
          }
          
          newSelection = {
            good: newGoodSelection,
            ok: newOkSelection
          };
        }
      }
      
      return {
        ...currentSelections,
        [selectedEquipment]: {
          ...currentSelections[selectedEquipment],
          [selectedSubcategory]: {
            ...currentSelections[selectedEquipment]?.[selectedSubcategory],
            [familyName]: newSelection
          }
        }
      };
    });
    
    // Update the panel immediately with the active family
    updateLastSelectedInfo(familyName);
    
    // Populate all basetypes when any tier selection is made
    populateAllBasetypes();
  }, [selectedEquipment, selectedSubcategory, families, activeFamily, populateAllBasetypes, getModButtonSelection, updateLastSelectedInfo]);

  // Handle mod button selection
  const handleModButtonSelect = useCallback((familyName: string, buttonType: 'off' | 'good' | 'ok' | 'giga') => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    // Set this as the active family being edited
    setActiveFamily(familyName);
    
    // Clear the family first
    setTierSelections(currentSelections => {
      const newSelections = { ...currentSelections };
      if (newSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName]) {
        newSelections[selectedEquipment][selectedSubcategory][familyName] = { good: [], ok: [] };
      }
      return newSelections;
    });
    
    // Set the selected button
    setModButtonSelections(currentSelections => {
      const newSelections = { ...currentSelections };
      if (!newSelections[selectedEquipment]) {
        newSelections[selectedEquipment] = {};
      }
      if (!newSelections[selectedEquipment][selectedSubcategory]) {
        newSelections[selectedEquipment][selectedSubcategory] = {};
      }
      
      // Set the selected button (null for 'off')
      if (buttonType === 'giga') {
        // Giga Mod should also select Good Mod
        newSelections[selectedEquipment][selectedSubcategory][familyName] = 'giga';
      } else {
        newSelections[selectedEquipment][selectedSubcategory][familyName] = buttonType === 'off' ? null : buttonType;
      }
      
      return newSelections;
    });

    // Handle auto-selection logic
    if (buttonType === 'good') {
      // Auto-select T1 for Good and T1 T2 T3 for OK
      const allTiers = families[familyName]?.mods.map(mod => mod.tier).sort() || [];
      if (allTiers.length > 0) {
        const t1Index = allTiers.indexOf('T1');
        if (t1Index !== -1) {
          // Auto-select T1 for Good
          const goodTiers = allTiers.slice(0, t1Index + 1);
          // Auto-select T1 T2 T3 for OK (if they exist)
          const okTiers = allTiers.slice(0, Math.min(t1Index + 3, allTiers.length));
          
          setTierSelections(currentTierSelections => {
            const newTierSelections = { ...currentTierSelections };
            if (!newTierSelections[selectedEquipment]) {
              newTierSelections[selectedEquipment] = {};
            }
            if (!newTierSelections[selectedEquipment][selectedSubcategory]) {
              newTierSelections[selectedEquipment][selectedSubcategory] = {};
            }
            if (!newTierSelections[selectedEquipment][selectedSubcategory][familyName]) {
              newTierSelections[selectedEquipment][selectedSubcategory][familyName] = { good: [], ok: [] };
            }
            
            newTierSelections[selectedEquipment][selectedSubcategory][familyName] = {
              good: goodTiers,
              ok: okTiers
            };
            
            return newTierSelections;
          });
        }
      }
    } else if (buttonType === 'ok') {
      // Auto-select T1 for OK
      const allTiers = families[familyName]?.mods.map(mod => mod.tier).sort() || [];
      if (allTiers.length > 0) {
        const t1Index = allTiers.indexOf('T1');
        const okTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
        
        setTierSelections(currentTierSelections => {
          const newTierSelections = { ...currentTierSelections };
          if (!newTierSelections[selectedEquipment]) {
            newTierSelections[selectedEquipment] = {};
          }
          if (!newTierSelections[selectedEquipment][selectedSubcategory]) {
            newTierSelections[selectedEquipment][selectedSubcategory] = {};
          }
          if (!newTierSelections[selectedEquipment][selectedSubcategory][familyName]) {
            newTierSelections[selectedEquipment][selectedSubcategory][familyName] = { good: [], ok: [] };
          }
          
          newTierSelections[selectedEquipment][selectedSubcategory][familyName] = {
            good: [],
            ok: okTiers
          };
          
          return newTierSelections;
        });
      }
    } else if (buttonType === 'giga') {
      // Auto-select Good Mod and T1 for Good and T1 T2 T3 for OK
      const allTiers = families[familyName]?.mods.map(mod => mod.tier).sort() || [];
      if (allTiers.length > 0) {
        const t1Index = allTiers.indexOf('T1');
        if (t1Index !== -1) {
          const goodTiers = allTiers.slice(0, t1Index + 1);
          const okTiers = allTiers.slice(0, Math.min(t1Index + 3, allTiers.length));
          
          setTierSelections(currentTierSelections => {
            const newTierSelections = { ...currentTierSelections };
            if (!newTierSelections[selectedEquipment]) {
              newTierSelections[selectedEquipment] = {};
            }
            if (!newTierSelections[selectedEquipment][selectedSubcategory]) {
              newTierSelections[selectedEquipment][selectedSubcategory] = {};
            }
            if (!newTierSelections[selectedEquipment][selectedSubcategory][familyName]) {
              newTierSelections[selectedEquipment][selectedSubcategory][familyName] = { good: [], ok: [] };
            }
            
            newTierSelections[selectedEquipment][selectedSubcategory][familyName] = {
              good: goodTiers,
              ok: okTiers
            };
            
            return newTierSelections;
          });
        }
      }
    }
    // For 'off' button, no additional logic needed as we already cleared everything
    
    // The useEffect will handle updating the panel when selections change
  }, [selectedEquipment, selectedSubcategory, families, getModButtonSelection, updateLastSelectedInfo]);

  // Handle basetype selection for Good basetypes
  const handleGoodBasetypeSelect = useCallback((basetype: string) => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    // Set the first family as active if no family is currently active
    if (!activeFamily && currentFamilies.length > 0) {
      setActiveFamily(currentFamilies[0]);
    }
    
    const mappedSubcategory = getBasetypeSubcategory(selectedEquipment, selectedSubcategory);
    
          if (isNonTieredBasetype(selectedEquipment)) {
        // Non-tiered logic: toggle individual selection
        setBasetypeSelections(currentSelections => {
          const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [], all: [], giga: [] };
          const currentGood = currentData.good;
          const newGoodSelection = currentGood.includes(basetype)
            ? currentGood.filter(b => b !== basetype)
            : [...currentGood, basetype];
          
          return {
            ...currentSelections,
            [selectedEquipment]: {
              ...currentSelections[selectedEquipment],
              [mappedSubcategory]: {
                ...currentData,
                good: newGoodSelection
              }
            }
          };
        });
    } else {
      // Tiered logic: cumulative selection
      setBasetypeSelections(currentSelections => {
        const allBasetypes = currentBasetypes;
        const basetypeIndex = allBasetypes.indexOf(basetype);
        if (basetypeIndex === -1) return currentSelections;
        
        const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [], all: [], giga: [] };
        const currentGood = currentData.good;
        
        // Check if this basetype is currently the highest selected in good
        const isCurrentlyHighest = currentGood.includes(basetype) && 
          currentGood.every(b => allBasetypes.indexOf(b) <= basetypeIndex);
        
        const newGoodSelection = isCurrentlyHighest 
          ? allBasetypes.slice(0, basetypeIndex)  // Deselect this basetype
          : allBasetypes.slice(0, basetypeIndex + 1);  // Select up to this basetype
        
        return {
          ...currentSelections,
          [selectedEquipment]: {
            ...currentSelections[selectedEquipment],
            [mappedSubcategory]: {
              ...currentData,
              good: newGoodSelection
            }
          }
        };
      });
    }
  }, [selectedEquipment, selectedSubcategory, currentBasetypes, getBasetypeSubcategory, isNonTieredBasetype]);

  // Handle basetype selection for OK basetypes
  const handleOkBasetypeSelect = useCallback((basetype: string) => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    // Set the first family as active if no family is currently active
    if (!activeFamily && currentFamilies.length > 0) {
      setActiveFamily(currentFamilies[0]);
    }
    
    const mappedSubcategory = getBasetypeSubcategory(selectedEquipment, selectedSubcategory);
    
    if (isNonTieredBasetype(selectedEquipment)) {
      // Non-tiered logic: toggle individual selection
              setBasetypeSelections(currentSelections => {
          const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [], all: [], giga: [] };
          const currentOk = currentData.ok;
          const newOkSelection = currentOk.includes(basetype)
            ? currentOk.filter(b => b !== basetype)
            : [...currentOk, basetype];
          
          return {
            ...currentSelections,
            [selectedEquipment]: {
              ...currentSelections[selectedEquipment],
              [mappedSubcategory]: {
                ...currentData,
                ok: newOkSelection
              }
            }
          };
        });
    } else {
      // Tiered logic: cumulative selection
      setBasetypeSelections(currentSelections => {
        const allBasetypes = currentBasetypes;
        const basetypeIndex = allBasetypes.indexOf(basetype);
        if (basetypeIndex === -1) return currentSelections;
        
        const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [], all: [], giga: [] };
        const currentOk = currentData.ok;
        
        // Check if this basetype is currently the highest selected in ok
        const isCurrentlyHighest = currentOk.includes(basetype) && 
          currentOk.every(b => allBasetypes.indexOf(b) <= basetypeIndex);
        
        const newOkSelection = isCurrentlyHighest 
          ? allBasetypes.slice(0, basetypeIndex)  // Deselect this basetype
          : allBasetypes.slice(0, basetypeIndex + 1);  // Select up to this basetype
        
        return {
          ...currentSelections,
          [selectedEquipment]: {
            ...currentSelections[selectedEquipment],
            [mappedSubcategory]: {
              ...currentData,
              ok: newOkSelection
            }
          }
        };
      });
    }
  }, [selectedEquipment, selectedSubcategory, currentBasetypes, getBasetypeSubcategory, isNonTieredBasetype]);

  // Enhanced basetype selection handlers that also update last selected info
  const handleGoodBasetypeSelectEnhanced = useCallback((basetype: string) => {
    handleGoodBasetypeSelect(basetype);
    populateAllBasetypes();
    
    // Update giga basetypes to be the first selected good basetype (only for tiered basetypes)
    if (selectedEquipment && selectedSubcategory && !isNonTieredBasetype(selectedEquipment)) {
      setBasetypeSelections(currentSelections => {
        const newSelections = { ...currentSelections };
        const mappedSubcategory = getBasetypeSubcategory(selectedEquipment, selectedSubcategory);
        if (newSelections[selectedEquipment]?.[mappedSubcategory]) {
          const currentData = newSelections[selectedEquipment][mappedSubcategory];
          const firstGoodBase = currentData.good.length > 0 ? currentData.good[0] : null;
          newSelections[selectedEquipment][mappedSubcategory] = {
            ...currentData,
            giga: firstGoodBase ? [firstGoodBase] : []
          };
        }
        return newSelections;
      });
    }
    
    // Remove direct call to updateLastSelectedInfo
    // if (currentFamilies.length > 0) {
    //   updateLastSelectedInfo(currentFamilies[0]);
    // }
  }, [handleGoodBasetypeSelect, populateAllBasetypes, currentFamilies, selectedEquipment, selectedSubcategory, getBasetypeSubcategory, isNonTieredBasetype]);

  const handleOkBasetypeSelectEnhanced = useCallback((basetype: string) => {
    handleOkBasetypeSelect(basetype);
    populateAllBasetypes();
    // Remove direct call to updateLastSelectedInfo
    // if (currentFamilies.length > 0) {
    //   updateLastSelectedInfo(currentFamilies[0]);
    // }
  }, [handleOkBasetypeSelect, populateAllBasetypes]);

  // Add useEffect to update lastSelectedInfo when relevant state changes
  useEffect(() => {
    if (selectedEquipment && selectedSubcategory && activeFamily) {
      // Compute the new info
      const selectedTiers = getSelectedTiers(activeFamily);
      const selectedBasetypes = getSelectedBasetypes();
      const gigaBase = getGigaBase();
      const modButtonSelection = getModButtonSelection(activeFamily);

      const gigaTiers = modButtonSelection === 'giga' ? selectedTiers.good.slice(0, 1) : [];
      const gigaBasetypes = gigaBase && selectedBasetypes.good.includes(gigaBase) ? [gigaBase] : [];

      const newInfo = {
        equipment: selectedEquipment,
        subcategory: selectedSubcategory,
        family: activeFamily,
        tiers: {
          giga: gigaTiers,
          good: selectedTiers.good,
          ok: selectedTiers.ok
        },
        basetypes: {
          giga: gigaBasetypes,
          good: selectedBasetypes.good,
          ok: selectedBasetypes.ok
        }
      };

      if (!isEqual(lastSelectedInfo, newInfo)) {
        setLastSelectedInfo(newInfo);
      }
    }
  }, [selectedEquipment, selectedSubcategory, activeFamily, tierSelections, basetypeSelections, getSelectedTiers, getSelectedBasetypes, getGigaBase, getModButtonSelection, lastSelectedInfo]);

  // Handle basetype OFF button click
  const handleBasetypeOffClick = useCallback((type: 'good' | 'ok' | 'giga') => {
    if (!selectedEquipment || !selectedSubcategory) return;
    setBasetypeSelections(currentSelections => {
      const newSelections = { ...currentSelections };
      const mappedSubcategory = getBasetypeSubcategory(selectedEquipment, selectedSubcategory);
      if (!newSelections[selectedEquipment]) {
        newSelections[selectedEquipment] = {};
      }
      if (!newSelections[selectedEquipment][mappedSubcategory]) {
        newSelections[selectedEquipment][mappedSubcategory] = { good: [], ok: [], all: [], giga: [] };
      }
      newSelections[selectedEquipment][mappedSubcategory][type] = [];
      return newSelections;
    });
  }, [selectedEquipment, selectedSubcategory, getBasetypeSubcategory]);

  // --- Add import UI state ---
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle'|'success'|'error'>("idle");
  const [importMessage, setImportMessage] = useState('');
  // --- Add filter output state ---
  const [filterOutput, setFilterOutput] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  // --- Export state as TAWM CODE ---
  const generateTawmCode = () => {
    const stateObj = {
      tierSelections,
      basetypeSelections,
      modButtonSelections
    };
    return encodeState(stateObj);
  };

  // --- Generate filter output only on button click ---
  const generateFilterOutput = () => {
    if (!groupingsData) return '';
    const filterBlocks = [];
    // (existing filter output logic)
    Object.entries(tierSelections).forEach(([equipment, subcats]) => {
      Object.entries(subcats).forEach(([subcategory, fams]) => {
        const itemType = `${equipment} ${subcategory}`;
        const selectedBasetypes = basetypeSelections[equipment]?.[getBasetypeSubcategory(equipment, subcategory)] || { good: [], ok: [], all: [] };
        // Collect mod names for each grouping type
        const modNamesByType: { [key: string]: string[] } = {
          giga: [],
          goodg: [],
          good: [],
          okg: [],
          okgood: [],
          ok: []
        };
        Object.entries(fams).forEach(([familyName, tierData]) => {
          const family = families[familyName];
          if (family) {
            const modButton = modButtonSelections[equipment]?.[subcategory]?.[familyName];
            if (modButton === 'giga' && tierData.good.includes('T1')) {
              const mod = family.mods.find(m => m.tier === 'T1');
              if (mod && !modNamesByType.giga.includes(mod.name)) {
                modNamesByType.giga.push(mod.name);
              }
            }
            if (modButton === 'giga' && tierData.good.length > 0) {
              tierData.good.forEach(tier => {
                const mod = family.mods.find(m => m.tier === tier);
                if (mod && !modNamesByType.goodg.includes(mod.name)) {
                  modNamesByType.goodg.push(mod.name);
                }
              });
            }
            if (modButton === 'good' && tierData.good.length > 0) {
              tierData.good.forEach(tier => {
                const mod = family.mods.find(m => m.tier === tier);
                if (mod && !modNamesByType.good.includes(mod.name)) {
                  modNamesByType.good.push(mod.name);
                }
              });
            }
            if (modButton === 'giga' && tierData.ok.length > 0) {
              tierData.ok.forEach(tier => {
                const mod = family.mods.find(m => m.tier === tier);
                if (mod && !modNamesByType.okg.includes(mod.name)) {
                  modNamesByType.okg.push(mod.name);
                }
              });
            }
            if (modButton === 'good' && tierData.ok.length > 0) {
              tierData.ok.forEach(tier => {
                const mod = family.mods.find(m => m.tier === tier);
                if (mod && !modNamesByType.okgood.includes(mod.name)) {
                  modNamesByType.okgood.push(mod.name);
                }
              });
            }
            if (modButton === 'ok' && tierData.ok.length > 0) {
              tierData.ok.forEach(tier => {
                const mod = family.mods.find(m => m.tier === tier);
                if (mod && !modNamesByType.ok.includes(mod.name)) {
                  modNamesByType.ok.push(mod.name);
                }
              });
            }
          }
        });
        groupingsData.groupings.forEach((grouping: any) => {
          const { baseType, modType, backgroundColor, textColor } = grouping;
          let hasBase = false;
          let basetypeString = '';
          if (baseType === 'giga') {
            hasBase = !!(selectedBasetypes.giga && selectedBasetypes.giga.length > 0);
            if (hasBase && selectedBasetypes.giga) {
              basetypeString = selectedBasetypes.giga.map((name: string) => `"${name}"`).join(' ');
            }
          } else if (baseType === 'good') {
            hasBase = selectedBasetypes.good.length > 0;
            if (hasBase) {
              basetypeString = selectedBasetypes.good.map((name: string) => `"${name}"`).join(' ');
            }
          } else if (baseType === 'ok') {
            hasBase = selectedBasetypes.ok.length > 0;
            if (hasBase) {
              basetypeString = selectedBasetypes.ok.map((name: string) => `"${name}"`).join(' ');
            }
          } else if (baseType === 'all') {
            hasBase = selectedBasetypes.all.length > 0;
            if (hasBase) {
              basetypeString = selectedBasetypes.all.map((name: string) => `"${name}"`).join(' ');
            }
          }
          const modNames = modNamesByType[modType] || [];
          const hasMods = modNames.length > 0;
          if (hasBase && hasMods) {
            const modNamesString = modNames.map((name: string) => `"${name}"`).join(' ');
            const hexToRgb = (hex: any) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            const bgRgb = hexToRgb(backgroundColor);
            const textRgb = hexToRgb(textColor);
            if (bgRgb && textRgb) {
              const block = `Show\n# "${itemType} - ${grouping.name}"\n\tFracturedItem True\n\tIdentified True\n\tRarity Magic\n\tHasExplicitMod >=1 ${modNamesString}\n\tSetFontSize 30\n\tSetTextColor ${textRgb.r} ${textRgb.g} ${textRgb.b} 255\n\tSetBorderColor ${textRgb.r} ${textRgb.g} ${textRgb.b} 255\n\tSetBackgroundColor ${bgRgb.r} ${bgRgb.g} ${bgRgb.b} 255\n\tPlayEffect Blue\n\tMinimapIcon 0 Blue Diamond\nBaseType == ${basetypeString}`;
              filterBlocks.push(block);
            }
          }
        });
      });
    });
    // Append TAWM CODE
  //const tawmCode = generateTawmCode();
    //filterBlocks.push(`# TAWM CODE: ${tawmCode}`);

    // --- Jewels Show block (static, always present) ---
    filterBlocks.push(`Show
	FracturedItem True
	Identified True
	Rarity Magic
	# "Shimmering" = ES
	HasExplicitMod >=1 "Unfaltering"  "Overpowering" "Virile" "of Bameth" "of Exile" "of the Gods" "of the Wind" "of the Genius" "of Fleshbinding" "of Nullification" "of Abjuration" "Hellion's" "of Grandmastery" "Dictator's" "Emperor's" "Conqueror's" "Merciless" "Tyrannical" "Flaring" "Lithomancer's" "Mad Lord's" "Thunderhand's" "Frost Singer's" "Flame Shaper's" "of Finesse" "of Unmaking" "of Incision" "of Penetrating" "Magister's" "of Disintegrating" "of Atrophying" "of Exsanguinating" "of Hemorrhaging" "of the Fanatical" "of the Zealous" "of Dissolution" "of Melting" "of Destruction" "of Acclaim" "Carbonising" "Crystalising" "Vapourising" "of Celebration" "Runic" "Glyphic" "Incanter's" "Overseer's" "Taskmaster's" "of the Deathless" "of the Lightning Rod" "Dragon's" "Incorporeal" "Phantasm's" "of Ferocity" "of Splintering" "of Rending" "Martinet's" "Empress's" "Queen's" "Princess's" "of Many" "Unassailable" "Blazing" "of the Gale" "of Everlasting" "Duchess's" "Zaffre" "Blue" "of Tzteosh" "of Haast" "of Ephij" "of the Rainbow" "Vivid" "of Zealousness" "Shimmering" "of the Elements" "of Sortilege" "Disintegrating" "Atrophying" "of Virulence" "Fanatical" "Zealous" "of the Ardent" "Ardent" "of the Zephyr" "of Legerdemain" "of the Multiverse" "Provocateur's" "Behemoth's" "Stormbrewer's" "Rimedweller's" "Vulcanist's" "Exalter's" "Athlete's" "of Skill" "of Expertise" "Flawless" "of Reveling" "of the Godslayer" "Devastating" "Magnifying" "of Convalescence" "Vigorous" "of the Solar Storm" "of the Mammoth" "of Harmony" "of Will" "of Obstruction" "Impaling" "Fecund" "Xoph's" "Pyroclastic" "Tul's" "Esh's" "of the Bastion" "Cremating" "Blasting" "Entombing" "Polar" "Electrocuting" "Discharging" "Incinerating" "Glaciated" "Shocking" "of Infamy" "of Fame" "of Puncturing" "of Fury" "Tempered" "of Liquefaction" "of Deteriorating" "Mazarine" "Occultist's" "Ionising" "Cryomancer's" "of Prestidigitation" "of the Gelid" "of the Fervid" "of Phlebotomising" "of Heartstopping" "of Ruin" "Lich's" "of Renown" "Rotund" "of the Span" "of Expulsion" "Robust" "Ultramarine" "Resplendent" "Unleashed" "of the Comet" "of the Blur" "of Mastery" 
	SetFontSize 30
	SetTextColor 255 255 255 255
	SetBorderColor 255 255 255 255
	SetBackgroundColor 0 8 255 255
	PlayEffect Blue
	MinimapIcon 0 Blue Diamond
Class == "Jewel"
# BaseType == "Cobalt Jewel", "Viridian Jewel", "Crimson Jewel", "Murderous Eye Jewel", "Ghastly Eye Jewel", "Hypnotic Eye Jewel", "Searching Eye Jewel"
`);

    // --- Small fallback Show block (static, always present) ---
    filterBlocks.push(`Show
	FracturedItem True
	Identified True
	Rarity Magic
	SetFontSize 18
	SetBackgroundColor 0 200 200 55
	SetTextColor 0 200 200 255
`);

    // Always append TAWM CODE last
    const tawmCode = generateTawmCode();
    filterBlocks.push(`# TAWM CODE: ${tawmCode}`);

    return filterBlocks.join('\n\n');
  };

  // --- Handler for generating filter output ---
  const handleGenerateFilterOutput = () => {
    const output = generateFilterOutput();
    setFilterOutput(output);
    setHasGenerated(true);
  };

  // --- Import handler ---
  const handleImport = () => {
    // Find the TAWM CODE in the importText
    const match = importText.match(/# TAWM CODE: ([A-Za-z0-9+/=]+)/);
    if (!match) {
      setImportStatus('error');
      setImportMessage('No valid TAWM CODE found in the pasted text.');
      return;
    }
    try {
      const decoded = decodeState(match[1]);
      // Validate structure
      if (
        typeof decoded === 'object' &&
        decoded &&
        'tierSelections' in decoded &&
        'basetypeSelections' in decoded &&
        'modButtonSelections' in decoded
      ) {
        // Handle backward compatibility: convert gigaNonT to giga
        const processedBasetypeSelections = { ...decoded.basetypeSelections };
        Object.keys(processedBasetypeSelections).forEach(equipment => {
          Object.keys(processedBasetypeSelections[equipment]).forEach(subcategory => {
            const subcatData = processedBasetypeSelections[equipment][subcategory];
            if (subcatData.gigaNonT) {
              // Convert old gigaNonT to new giga structure
              subcatData.giga = subcatData.gigaNonT;
              delete subcatData.gigaNonT;
            }
      });
    });
    
        setTierSelections(decoded.tierSelections || {});
        setBasetypeSelections(processedBasetypeSelections);
        setModButtonSelections(decoded.modButtonSelections || {});
        setImportStatus('success');
        setImportMessage('Selections imported successfully!');
      } else {
        setImportStatus('error');
        setImportMessage('TAWM CODE is invalid or incomplete.');
      }
    } catch (e) {
      setImportStatus('error');
      setImportMessage('Failed to decode TAWM CODE.');
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async () => {
    if (filterOutput) {
      try {
        await navigator.clipboard.writeText(filterOutput);
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  // Download filter output as file
  const downloadFilter = () => {
    if (!filterOutput) return;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const MM = pad(now.getMonth() + 1);
    const DD = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const SS = pad(now.getSeconds());
    const filename = `Tawm-${MM}${DD}${HH}${mm}${SS}.filter`;
    const blob = new Blob([filterOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // Helper function to get display name for equipment
  const getEquipmentDisplayName = (equipment: string): string => {
    switch (equipment) {
      case 'OneHandAttack': return 'Attack Weapons 1H';
      case 'TwoHandAttack': return 'Attack Weapons 2H';
      case 'TwoHandCast': return 'Caster Weapons 2H';
      case 'OneHandCast': return 'Caster Weapons 1H';
      default: return equipment;
    }
  };

  // Helper function to get display name for subcategory
  const getSubcategoryDisplayName = (subcategory: string): string => {
    switch (subcategory) {
      case 'Str': return 'Armour';
      case 'StrInt': return 'Armour / ES';
      case 'Int': return 'Energy Shield';
      case 'DexInt': return 'ES / Evasion';
      case 'Dex': return 'Evasion';
      case 'StrDex': return 'Evasion / Armour';
      default: return subcategory;
    }
  };

  // Helper function to get subcategory priority for ordering
  const getSubcategoryPriority = (subcategory: string): number => {
    switch (subcategory) {
      case 'Str': return 1; // Armour
      case 'StrInt': return 2; // Armour / ES
      case 'Int': return 3; // Energy Shield
      case 'DexInt': return 4; // ES / Evasion
      case 'Dex': return 5; // Evasion
      case 'StrDex': return 6; // Evasion / Armour
      default: return 999;
    }
  };

  
  // Helper: encode state as base64
  const encodeState = (obj: any): string => {
    // Use btoa for browser base64
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  };
  // Helper: decode state from base64
  const decodeState = (str: string): any => {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  };

  // Refactored preview: group by base group and add titles
  const generateNewGroupingsPreview = (): React.ReactElement[] => {
    if (!lastSelectedInfo || !groupingsData) return [];
    const family = families[lastSelectedInfo.family];
    if (!family) return [];
    const selectedTiers = getSelectedTiers(lastSelectedInfo.family);
    const selectedBasetypes = getSelectedBasetypes();
    const modButton = getModButtonSelection(lastSelectedInfo.family);
    // Get all preview items as before
    const previewItems: { group: string, base: string, element: React.ReactElement }[] = [];
    const getLowestTierStat = (tiers: string[]) => {
      if (tiers.length === 0) return null;
      const lowestTier = tiers[tiers.length - 1];
      return family.mods.find(m => m.tier === lowestTier)?.stat || null;
    };
    const getLowestBase = (bases: string[]) => {
      if (bases.length === 0) return null;
      return bases[bases.length - 1];
    };
    const shouldShowGrouping = (grouping: any) => {
      const { baseType, modType } = grouping;
      let hasBase = false;
      if (baseType === 'giga') {
        if (isNonTieredBasetype(selectedEquipment!)) {
          hasBase = !!(selectedBasetypes.giga && selectedBasetypes.giga.length > 0);
        } else {
          hasBase = !!(selectedBasetypes.giga && selectedBasetypes.giga.length > 0);
        }
      } else if (baseType === 'good') hasBase = selectedBasetypes.good.length > 0;
      else if (baseType === 'ok') hasBase = selectedBasetypes.ok.length > 0;
      else if (baseType === 'all') hasBase = selectedBasetypes.all.length > 0;
      if (!hasBase) return false;
      let hasMod = false;
      if (modType === 'giga') {
        hasMod = modButton === 'giga' && selectedTiers.good.includes('T1');
      } else if (modType === 'goodg') {
        hasMod = modButton === 'giga' && selectedTiers.good.length > 0;
      } else if (modType === 'good') {
        hasMod = modButton === 'good' && selectedTiers.good.length > 0;
      } else if (modType === 'okg') {
        hasMod = modButton === 'giga' && selectedTiers.ok.length > 0;
      } else if (modType === 'okgood') {
        hasMod = modButton === 'good' && selectedTiers.ok.length > 0;
      } else if (modType === 'ok') {
        hasMod = modButton === 'ok' && selectedTiers.ok.length > 0;
      }
      return hasMod;
    };
    let validGroupings = groupingsData.groupings.filter((grouping: any) => shouldShowGrouping(grouping));
    const colorSchemeOrder = { giga: 0, salmon: 1, gold: 2, blue: 3 };
    validGroupings.sort((a: any, b: any) => {
      const aScheme = typeof a.colorScheme === 'string' ? a.colorScheme.trim().toLowerCase() : '';
      const bScheme = typeof b.colorScheme === 'string' ? b.colorScheme.trim().toLowerCase() : '';
      const aOrder = colorSchemeOrder[aScheme as keyof typeof colorSchemeOrder] ?? 999;
      const bOrder = colorSchemeOrder[bScheme as keyof typeof colorSchemeOrder] ?? 999;
      return aOrder - bOrder;
    });
    const hasOnlyT1InGood = selectedTiers.good.length === 1 && selectedTiers.good.includes('T1');
    if (hasOnlyT1InGood) {
      validGroupings = validGroupings.filter((grouping: any) => grouping.modType !== 'goodg');
        }
    validGroupings.forEach((grouping: any) => {
      const { backgroundColor, textColor, baseType } = grouping;
      let stat = null;
      let base = null;
      if (grouping.modType === 'giga') {
        stat = getLowestTierStat(['T1']);
      } else if (grouping.modType === 'goodg' || grouping.modType === 'good') {
        stat = getLowestTierStat(selectedTiers.good);
      } else if (grouping.modType === 'okg' || grouping.modType === 'okgood' || grouping.modType === 'ok') {
        stat = getLowestTierStat(selectedTiers.ok);
      }
      if (grouping.baseType === 'giga') {
        if (isNonTieredBasetype(selectedEquipment!)) {
          // Use all selected giga bases
          if (selectedBasetypes.giga && selectedBasetypes.giga.length > 0) {
            selectedBasetypes.giga.forEach((gigaBase: string) => {
              if (stat && gigaBase) {
                const style = {
                  backgroundColor,
                  color: textColor,
                  border: `2px solid ${textColor}`
                };
                previewItems.push({
                  group: baseType,
                  base: gigaBase,
                  element: (
                    <div key={grouping.id + '-' + gigaBase} className="preview-line" style={style}>
                      <span className="preview-stat">{stat}</span>
                      <span className="preview-base"> {gigaBase}</span>
                    </div>
                  )
                });
              }
            });
          }
        } else {
        base = getLowestBase(selectedBasetypes.giga!);
          if (stat && base) {
            const style = {
              backgroundColor,
              color: textColor,
              border: `2px solid ${textColor}`
            };
            previewItems.push({
              group: baseType,
              base,
              element: (
                <div key={grouping.id} className="preview-line" style={style}>
                  <span className="preview-stat">{stat}</span>
                  <span className="preview-base"> {base}</span>
                </div>
              )
            });
          }
        }
      } else if (grouping.baseType === 'good') {
        base = getLowestBase(selectedBasetypes.good);
        if (stat && base) {
          const style = {
            backgroundColor,
            color: textColor,
            border: `2px solid ${textColor}`
          };
          previewItems.push({
            group: baseType,
            base,
            element: (
              <div key={grouping.id} className="preview-line" style={style}>
                <span className="preview-stat">{stat}</span>
                <span className="preview-base"> {base}</span>
              </div>
            )
          });
        }
      } else if (grouping.baseType === 'ok') {
        base = getLowestBase(selectedBasetypes.ok);
        if (stat && base) {
          const style = {
            backgroundColor,
            color: textColor,
            border: `2px solid ${textColor}`
          };
          previewItems.push({
            group: baseType,
            base,
            element: (
              <div key={grouping.id} className="preview-line" style={style}>
                <span className="preview-stat">{stat}</span>
                <span className="preview-base"> {base}</span>
              </div>
            )
          });
        }
      } else if (grouping.baseType === 'all') {
        base = getLowestBase(selectedBasetypes.all);
      if (stat && base) {
        const style = {
          backgroundColor,
          color: textColor,
          border: `2px solid ${textColor}`
        };
          previewItems.push({
            group: baseType,
            base,
            element: (
          <div key={grouping.id} className="preview-line" style={style}>
            <span className="preview-stat">{stat}</span>
            <span className="preview-base"> {base}</span>
              </div>
            )
          });
        }
      }
    });
    // Group and order: Giga, Good, OK, All
    const groupOrder = [
      { key: 'giga', title: (base: string) => `Giga Base${isNonTieredBasetype(selectedEquipment!) ? 's' : ''} (up to ${base})` },
      { key: 'good', title: (base: string) => `Good Bases (up to ${base})` },
      { key: 'ok', title: (base: string) => `OK Bases (up to ${base})` },
      { key: 'all', title: (base: string) => `All Bases (up to ${base})` }
    ];
    const grouped: React.ReactElement[] = [];
    groupOrder.forEach(({ key, title }) => {
      const groupItems = previewItems.filter(item => item.group === key);
      if (groupItems.length > 0) {
        // Use the base of the last item for the title (should be the worst base)
        grouped.push(
          <div key={key + '-group'} style={{ marginBottom: 8 }}>
            <div className="preview-group-title" style={{ fontWeight: 600, marginBottom: 2 }}>{title(groupItems[groupItems.length - 1].base)}</div>
            {groupItems.map(item => item.element)}
          </div>
        );
      }
    });
    return grouped;
  };

  // Add handler for Giga basetype selection, using the same logic as Good/OK
  const handleGigaBasetypeSelect = useCallback((basetype: string) => {
    if (!selectedEquipment || !selectedSubcategory) return;
    const mappedSubcategory = getBasetypeSubcategory(selectedEquipment, selectedSubcategory);
    if (isNonTieredBasetype(selectedEquipment)) {
      // Non-tiered logic: toggle individual selection
      setBasetypeSelections(currentSelections => {
        const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [], all: [], giga: [] };
        const currentGiga = currentData.giga || [];
        const newGigaSelection = currentGiga.includes(basetype)
          ? currentGiga.filter(b => b !== basetype)
          : [...currentGiga, basetype];
        return {
          ...currentSelections,
          [selectedEquipment]: {
            ...currentSelections[selectedEquipment],
            [mappedSubcategory]: {
              ...currentData,
              giga: newGigaSelection
            }
          }
        };
      });
    } else {
      // Tiered logic: cumulative selection (single selection, always first base)
      setBasetypeSelections(currentSelections => {
        const allBasetypes = currentBasetypes;
        const basetypeIndex = allBasetypes.indexOf(basetype);
        if (basetypeIndex === -1) return currentSelections;
        const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [], all: [], giga: [] };
        const currentGiga = currentData.giga || [];
        const isCurrentlyHighest = currentGiga.includes(basetype) && 
          currentGiga.every(b => allBasetypes.indexOf(b) <= basetypeIndex);
        const newGigaSelection = isCurrentlyHighest 
          ? allBasetypes.slice(0, basetypeIndex)  // Deselect this basetype
          : allBasetypes.slice(0, basetypeIndex + 1);  // Select up to this basetype
        return {
          ...currentSelections,
          [selectedEquipment]: {
            ...currentSelections[selectedEquipment],
            [mappedSubcategory]: {
              ...currentData,
              giga: newGigaSelection
            }
          }
        };
      });
    }
  }, [selectedEquipment, selectedSubcategory, currentBasetypes, getBasetypeSubcategory, isNonTieredBasetype]);

  // Hardcoded family keys for one-shot auto-select
  const GIGA_FAMILIES = [
    // Chaos Resistance
    'ChaosResistance', 'MaximumChaosResistance',
    // Spell Suppression
    'ChanceToSuppressSpells', 'ChanceToSuppressSpells2',
    // Attack Speed
    'IncreasedAttackSpeed', 'IncreasedAttackSpeed2', 'IncreasedAttackSpeed22',
    // Physical Damage Reduction
    'ReducedPhysicalDamageTaken',
    // Increased Physical Damage %
    'LocalPhysicalDamagePercent', 'LocalIncreasedPhysicalDamagePercentAndAccuracyRating',
    // All Gem Level families
    'AllGemChaos', 'AllGemChaos3', 'AllGemCold', 'AllGemCold3', 'AllGemFire', 'AllGemFire3', 
    'AllGemLightning', 'AllGemLightning3', 'AllGemMinion', 'AllGemPhysical', 'AllGemPhysical3',
    'AllMinionGemLevel',
    // Pure Spell Damage
    'SpellDamage',
  ];
  const GOOD_FAMILIES = [
    // Fire Resistance
    'FireResistance',
    // Cold Resistance
    'ColdResistance',
    // Lightning Resistance
    'LightningResistance',
    // Increased Maximum Life (all variants)
    'IncreasedLife', 'IncreasedLife2', 'IncreasedLife3', 'IncreasedLife4',
    // Increased Elemental Damage with Attacks (all variants)
    'IncreasedWeaponElementalDamagePercent', 'IncreasedWeaponElementalDamagePercent2', 'IncreasedWeaponElementalDamagePercent222',
    // Adds Fire Damage (all variants)
    'FireDamage', 'FireDamage2', 'FireDamage22', 'FireDamageAddsTo22', 'FireDamageAddsTo222',
    // Adds Cold Damage (all variants)
    'ColdDamage', 'ColdDamage2', 'ColdDamageAddsTo22', 'ColdDamageAddsTo222',
    // Adds Lightning Damage (all variants)
    'LightningDamage', 'LightningDamage2', 'LightningDamageAddsTo2', 'LightningDamageAddsTo22', 'LightningDamageAddsTo222',
    // Pure Mana families
    'IncreasedMana', 'IncreasedMana2', 'IncreasedMana22', 'IncreasedMana222', 'IncreasedMana3',
  ];

  // Add one-shot auto-select handler
  const handleOneShotAutoSelect = useCallback(() => {
    // Build new state objects
    const newTierSelections: typeof tierSelections = {};
    const newBasetypeSelections: typeof basetypeSelections = {};
    const newModButtonSelections: typeof modButtonSelections = {};

    for (const equipment of Object.keys(itemtypeMap)) {
      newTierSelections[equipment] = {};
      newBasetypeSelections[equipment] = {};
      newModButtonSelections[equipment] = {};
      for (const subcategory of Object.keys(itemtypeMap[equipment])) {
        // Basetypes
        const basetypes = basetypeMap[equipment]?.[getBasetypeSubcategory(equipment, subcategory)] || [];
        const isTiered = !isNonTieredBasetype(equipment);
        // Good: first 3, OK: first 6, Giga: first for tiered
        newBasetypeSelections[equipment][subcategory] = {
          good: basetypes.slice(0, 3),
          ok: basetypes.slice(0, 6),
          giga: isTiered && basetypes.length > 0 ? [basetypes[0]] : [],
          all: [...basetypes],
        };
        // Families
        //const familiesList = Object.keys(itemtypeMap[equipment]?.[subcategory] ? itemtypeMap[equipment][subcategory] : {});
        const allFamilies = Object.keys(families);
        const subcatFamilies = allFamilies.filter(fam => (itemtypeMap[equipment]?.[subcategory] || []).includes(fam));
        newModButtonSelections[equipment][subcategory] = {};
        newTierSelections[equipment][subcategory] = {};
        for (const family of subcatFamilies) {
          const allTiers = (families[family]?.mods || []).map((mod: any) => mod.tier).sort();
          
          // Determine selection based on family type
          let selection: 'giga' | 'good' | 'ok' = 'ok';
          
          // Special logic for flat physical damage - only giga if percentage physical damage is also present and giga
          if (['PhysicalDamage', 'PhysicalDamageAddsTo2', 'PhysicalDamageAddsTo222', 'PhysicalDamage22'].includes(family)) {
            const hasPercentagePhysical = subcatFamilies.includes('LocalPhysicalDamagePercent') || 
                                       subcatFamilies.includes('LocalIncreasedPhysicalDamagePercentAndAccuracyRating');
            if (hasPercentagePhysical) {
              selection = 'giga';
            } else {
              selection = 'good';
            }
          } else if (GIGA_FAMILIES.includes(family)) {
            selection = 'giga';
          } else if (GOOD_FAMILIES.includes(family)) {
            selection = 'good';
          }
          
          newModButtonSelections[equipment][subcategory][family] = selection;
          
          // Set tiers based on selection
          const t1Index = allTiers.indexOf('T1');
          if (selection === 'giga') {
            // Giga: good = T1, ok = T1-T3 (if they exist)
            const goodTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
            const okTiers = t1Index !== -1 ? allTiers.slice(0, Math.min(t1Index + 3, allTiers.length)) : [];
            newTierSelections[equipment][subcategory][family] = { good: goodTiers, ok: okTiers };
          } else if (selection === 'good') {
            // Good: good = T1, ok = T1-T3 (if they exist)
            const goodTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
            const okTiers = t1Index !== -1 ? allTiers.slice(0, Math.min(t1Index + 3, allTiers.length)) : [];
            newTierSelections[equipment][subcategory][family] = { good: goodTiers, ok: okTiers };
          } else {
            // OK: ok = T1 (if it exists)
            const okTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
            newTierSelections[equipment][subcategory][family] = { good: [], ok: okTiers };
          }
        }
      }
    }
    setTierSelections(newTierSelections);
    setBasetypeSelections(newBasetypeSelections);
    setModButtonSelections(newModButtonSelections);
  }, [setTierSelections, setBasetypeSelections, setModButtonSelections, families, itemtypeMap, basetypeMap, getBasetypeSubcategory, isNonTieredBasetype]);

  // Auto-select equipment handler
  const handleAutoSelectEquipment = useCallback(() => {
    if (!selectedEquipment) return;
    
    const newTierSelections: typeof tierSelections = { ...tierSelections };
    const newBasetypeSelections: typeof basetypeSelections = { ...basetypeSelections };
    const newModButtonSelections: typeof modButtonSelections = { ...modButtonSelections };

    // Initialize equipment if not exists
    if (!newTierSelections[selectedEquipment]) newTierSelections[selectedEquipment] = {};
    if (!newBasetypeSelections[selectedEquipment]) newBasetypeSelections[selectedEquipment] = {};
    if (!newModButtonSelections[selectedEquipment]) newModButtonSelections[selectedEquipment] = {};

    for (const subcategory of Object.keys(itemtypeMap[selectedEquipment])) {
      // Basetypes
      const basetypes = basetypeMap[selectedEquipment]?.[getBasetypeSubcategory(selectedEquipment, subcategory)] || [];
      const isTiered = !isNonTieredBasetype(selectedEquipment);
      // Good: first 3, OK: first 6, Giga: first for tiered
      newBasetypeSelections[selectedEquipment][subcategory] = {
        good: basetypes.slice(0, 3),
        ok: basetypes.slice(0, 6),
        giga: isTiered && basetypes.length > 0 ? [basetypes[0]] : [],
        all: [...basetypes],
      };
      // Families
      const allFamilies = Object.keys(families);
      const subcatFamilies = allFamilies.filter(fam => (itemtypeMap[selectedEquipment]?.[subcategory] || []).includes(fam));
      newModButtonSelections[selectedEquipment][subcategory] = {};
      newTierSelections[selectedEquipment][subcategory] = {};
      for (const family of subcatFamilies) {
        const allTiers = (families[family]?.mods || []).map((mod: any) => mod.tier).sort();
        
        // Determine selection based on family type
        let selection: 'giga' | 'good' | 'ok' = 'ok';
        
        // Special logic for flat physical damage - only giga if percentage physical damage is also present and giga
        if (['PhysicalDamage', 'PhysicalDamageAddsTo2', 'PhysicalDamageAddsTo222', 'PhysicalDamage22'].includes(family)) {
          const hasPercentagePhysical = subcatFamilies.includes('LocalPhysicalDamagePercent') || 
                                     subcatFamilies.includes('LocalIncreasedPhysicalDamagePercentAndAccuracyRating');
          if (hasPercentagePhysical) {
            selection = 'giga';
          } else {
            selection = 'good';
          }
        } else if (GIGA_FAMILIES.includes(family)) {
          selection = 'giga';
        } else if (GOOD_FAMILIES.includes(family)) {
          selection = 'good';
        }
        
        newModButtonSelections[selectedEquipment][subcategory][family] = selection;
        
        // Set tiers based on selection
        const t1Index = allTiers.indexOf('T1');
        if (selection === 'giga') {
          // Giga: good = T1, ok = T1-T3 (if they exist)
          const goodTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
          const okTiers = t1Index !== -1 ? allTiers.slice(0, Math.min(t1Index + 3, allTiers.length)) : [];
          newTierSelections[selectedEquipment][subcategory][family] = { good: goodTiers, ok: okTiers };
        } else if (selection === 'good') {
          // Good: good = T1, ok = T1-T3 (if they exist)
          const goodTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
          const okTiers = t1Index !== -1 ? allTiers.slice(0, Math.min(t1Index + 3, allTiers.length)) : [];
          newTierSelections[selectedEquipment][subcategory][family] = { good: goodTiers, ok: okTiers };
        } else {
          // OK: ok = T1 (if it exists)
          const okTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
          newTierSelections[selectedEquipment][subcategory][family] = { good: [], ok: okTiers };
        }
      }
    }
    setTierSelections(newTierSelections);
    setBasetypeSelections(newBasetypeSelections);
    setModButtonSelections(newModButtonSelections);
  }, [selectedEquipment, setTierSelections, setBasetypeSelections, setModButtonSelections, families, itemtypeMap, basetypeMap, getBasetypeSubcategory, isNonTieredBasetype, tierSelections, basetypeSelections, modButtonSelections]);

  // Auto-select subcategory handler
  const handleAutoSelectSubcategory = useCallback(() => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    const newTierSelections: typeof tierSelections = { ...tierSelections };
    const newBasetypeSelections: typeof basetypeSelections = { ...basetypeSelections };
    const newModButtonSelections: typeof modButtonSelections = { ...modButtonSelections };

    // Initialize equipment and subcategory if not exists
    if (!newTierSelections[selectedEquipment]) newTierSelections[selectedEquipment] = {};
    if (!newBasetypeSelections[selectedEquipment]) newBasetypeSelections[selectedEquipment] = {};
    if (!newModButtonSelections[selectedEquipment]) newModButtonSelections[selectedEquipment] = {};
    if (!newTierSelections[selectedEquipment][selectedSubcategory]) newTierSelections[selectedEquipment][selectedSubcategory] = {};
    if (!newBasetypeSelections[selectedEquipment][selectedSubcategory]) newBasetypeSelections[selectedEquipment][selectedSubcategory] = { good: [], ok: [], all: [], giga: [] };
    if (!newModButtonSelections[selectedEquipment][selectedSubcategory]) newModButtonSelections[selectedEquipment][selectedSubcategory] = {};

    // Basetypes
    const basetypes = basetypeMap[selectedEquipment]?.[getBasetypeSubcategory(selectedEquipment, selectedSubcategory)] || [];
    const isTiered = !isNonTieredBasetype(selectedEquipment);
    // Good: first 3, OK: first 6, Giga: first for tiered
    newBasetypeSelections[selectedEquipment][selectedSubcategory] = {
      good: basetypes.slice(0, 3),
      ok: basetypes.slice(0, 6),
      giga: isTiered && basetypes.length > 0 ? [basetypes[0]] : [],
      all: [...basetypes],
    };
    // Families
    const allFamilies = Object.keys(families);
    const subcatFamilies = allFamilies.filter(fam => (itemtypeMap[selectedEquipment]?.[selectedSubcategory] || []).includes(fam));
    newModButtonSelections[selectedEquipment][selectedSubcategory] = {};
    newTierSelections[selectedEquipment][selectedSubcategory] = {};
    for (const family of subcatFamilies) {
      const allTiers = (families[family]?.mods || []).map((mod: any) => mod.tier).sort();
      
      // Determine selection based on family type
      let selection: 'giga' | 'good' | 'ok' = 'ok';
      
      // Special logic for flat physical damage - only giga if percentage physical damage is also present and giga
      if (['PhysicalDamage', 'PhysicalDamageAddsTo2', 'PhysicalDamageAddsTo222', 'PhysicalDamage22'].includes(family)) {
        const hasPercentagePhysical = subcatFamilies.includes('LocalPhysicalDamagePercent') || 
                                   subcatFamilies.includes('LocalIncreasedPhysicalDamagePercentAndAccuracyRating');
        if (hasPercentagePhysical) {
          selection = 'giga';
        } else {
          selection = 'good';
        }
      } else if (GIGA_FAMILIES.includes(family)) {
        selection = 'giga';
      } else if (GOOD_FAMILIES.includes(family)) {
        selection = 'good';
      }
      
      newModButtonSelections[selectedEquipment][selectedSubcategory][family] = selection;
      
      // Set tiers based on selection
      const t1Index = allTiers.indexOf('T1');
      if (selection === 'giga') {
        // Giga: good = T1, ok = T1-T3 (if they exist)
        const goodTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
        const okTiers = t1Index !== -1 ? allTiers.slice(0, Math.min(t1Index + 3, allTiers.length)) : [];
        newTierSelections[selectedEquipment][selectedSubcategory][family] = { good: goodTiers, ok: okTiers };
      } else if (selection === 'good') {
        // Good: good = T1, ok = T1-T3 (if they exist)
        const goodTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
        const okTiers = t1Index !== -1 ? allTiers.slice(0, Math.min(t1Index + 3, allTiers.length)) : [];
        newTierSelections[selectedEquipment][selectedSubcategory][family] = { good: goodTiers, ok: okTiers };
      } else {
        // OK: ok = T1 (if it exists)
        const okTiers = t1Index !== -1 ? allTiers.slice(0, t1Index + 1) : [];
        newTierSelections[selectedEquipment][selectedSubcategory][family] = { good: [], ok: okTiers };
      }
    }
    setTierSelections(newTierSelections);
    setBasetypeSelections(newBasetypeSelections);
    setModButtonSelections(newModButtonSelections);
  }, [selectedEquipment, selectedSubcategory, setTierSelections, setBasetypeSelections, setModButtonSelections, families, itemtypeMap, basetypeMap, getBasetypeSubcategory, isNonTieredBasetype, tierSelections, basetypeSelections, modButtonSelections]);

  // Confirmation handlers
  const handleAutoSelectAllClick = useCallback(() => {
    setAutoSelectConfirmation({ type: 'all', blinkingButton: 'all' });
  }, []);

  const handleAutoSelectEquipmentClick = useCallback(() => {
    if (!selectedEquipment) return;
    setAutoSelectConfirmation({ type: 'equipment', blinkingButton: 'equipment' });
  }, [selectedEquipment]);

  const handleAutoSelectSubcategoryClick = useCallback(() => {
    if (!selectedSubcategory) return;
    setAutoSelectConfirmation({ type: 'subcategory', blinkingButton: 'subcategory' });
  }, [selectedSubcategory]);

  const handleClearAllClick = useCallback(() => {
    setAutoSelectConfirmation({ type: 'clear', blinkingButton: 'clear' });
  }, []);

  const handleConfirmYes = useCallback(() => {
    if (autoSelectConfirmation.type === 'all') {
      handleOneShotAutoSelect();
    } else if (autoSelectConfirmation.type === 'equipment') {
      handleAutoSelectEquipment();
    } else if (autoSelectConfirmation.type === 'subcategory') {
      handleAutoSelectSubcategory();
    } else if (autoSelectConfirmation.type === 'clear') {
      setTierSelections({});
      setBasetypeSelections({});
      setModButtonSelections({});
      setSelectedEquipment(null);
      setSelectedSubcategory(null);
    }
    setAutoSelectConfirmation({ type: null, blinkingButton: null });
  }, [autoSelectConfirmation.type, handleOneShotAutoSelect, handleAutoSelectEquipment, handleAutoSelectSubcategory]);

  const handleConfirmNo = useCallback(() => {
    setAutoSelectConfirmation({ type: null, blinkingButton: null });
  }, []);

  if (loading) return <div className="app-loading">Loading...</div>;
  if (error) return <div className="app-error">Error: {error}</div>;

  return (
    <div className="app-root" style={{ 
      minHeight: '100vh', 
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <header className="app-header">TAWM'BERNO</header>
      <main className="app-main" style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {/* Equipment Selection */}
        <section className="app-selectors">
          {/* Auto-select buttons moved here */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, marginTop: 20, gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className={`generate-button ${autoSelectConfirmation.blinkingButton === 'all' ? 'blinking' : ''}`}
              onClick={handleAutoSelectAllClick}
              style={{
                padding: '0.4em 1.1em',
                fontSize: '1.2rem',
                fontWeight: '500',
                backgroundColor: autoSelectConfirmation.blinkingButton === 'all' ? 'var(--selected)' : 'var(--surface)',
                color: autoSelectConfirmation.blinkingButton === 'all' ? 'var(--selected-text)' : 'var(--text)',
                border: '2px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                flex: '1',
                maxWidth: '200px',
                transition: 'background 0.15s, border 0.15s, color 0.15s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
              }}
              onMouseEnter={(e) => {
                if (autoSelectConfirmation.blinkingButton === 'all') {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                } else {
                  e.currentTarget.style.backgroundColor = 'var(--button-hover)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (autoSelectConfirmation.blinkingButton === 'all') {
                  e.currentTarget.style.backgroundColor = 'var(--selected)';
                  e.currentTarget.style.borderColor = 'var(--selected)';
                } else {
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              Autoselect ALL
            </button>
            <button 
              className={`generate-button ${autoSelectConfirmation.blinkingButton === 'equipment' ? 'blinking' : ''}`}
              onClick={handleAutoSelectEquipmentClick}
              disabled={!selectedEquipment}
              style={{ 
                padding: '0.4em 1.1em',
                fontSize: '1.2rem',
                fontWeight: '500',
                backgroundColor: autoSelectConfirmation.blinkingButton === 'equipment' ? 'var(--selected)' : 'var(--surface)',
                color: autoSelectConfirmation.blinkingButton === 'equipment' ? 'var(--selected-text)' : 'var(--text)',
                border: '2px solid var(--border)',
                borderRadius: '4px',
                cursor: selectedEquipment ? 'pointer' : 'not-allowed',
                flex: '1',
                maxWidth: '200px',
                transition: 'background 0.15s, border 0.15s, color 0.15s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                opacity: selectedEquipment ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (autoSelectConfirmation.blinkingButton === 'equipment') {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                } else if (selectedEquipment) {
                  e.currentTarget.style.backgroundColor = 'var(--button-hover)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (autoSelectConfirmation.blinkingButton === 'equipment') {
                  e.currentTarget.style.backgroundColor = 'var(--selected)';
                  e.currentTarget.style.borderColor = 'var(--selected)';
                } else {
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              Autoselect Equipment
            </button>
            <button 
              className={`generate-button ${autoSelectConfirmation.blinkingButton === 'subcategory' ? 'blinking' : ''}`}
              onClick={handleAutoSelectSubcategoryClick}
              disabled={!selectedSubcategory}
              style={{ 
                padding: '0.4em 1.1em',
                fontSize: '1.2rem',
                fontWeight: '500',
                backgroundColor: autoSelectConfirmation.blinkingButton === 'subcategory' ? 'var(--selected)' : 'var(--surface)',
                color: autoSelectConfirmation.blinkingButton === 'subcategory' ? 'var(--selected-text)' : 'var(--text)',
                border: '2px solid var(--border)',
                borderRadius: '4px',
                cursor: selectedSubcategory ? 'pointer' : 'not-allowed',
                flex: '1',
                maxWidth: '200px',
                transition: 'background 0.15s, border 0.15s, color 0.15s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                opacity: selectedSubcategory ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (autoSelectConfirmation.blinkingButton === 'subcategory') {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                } else if (selectedSubcategory) {
                  e.currentTarget.style.backgroundColor = 'var(--button-hover)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (autoSelectConfirmation.blinkingButton === 'subcategory') {
                  e.currentTarget.style.backgroundColor = 'var(--selected)';
                  e.currentTarget.style.borderColor = 'var(--selected)';
                } else {
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              Autoselect Subcat
            </button>
            <button 
              className={`generate-button ${autoSelectConfirmation.blinkingButton === 'clear' ? 'blinking' : ''}`}
              onClick={handleClearAllClick}
              style={{ 
                padding: '0.4em 1.1em',
                fontSize: '1.2rem',
                fontWeight: '500',
                backgroundColor: autoSelectConfirmation.blinkingButton === 'clear' ? 'var(--selected)' : '#2a1a1a',
                color: autoSelectConfirmation.blinkingButton === 'clear' ? 'var(--selected-text)' : 'var(--text)',
                border: '2px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                flex: '1',
                maxWidth: '200px',
                transition: 'background 0.15s, border 0.15s, color 0.15s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
              }}
              onMouseEnter={(e) => {
                if (autoSelectConfirmation.blinkingButton === 'clear') {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                } else {
                  e.currentTarget.style.backgroundColor = '#3a2a2a';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (autoSelectConfirmation.blinkingButton === 'clear') {
                  e.currentTarget.style.backgroundColor = 'var(--selected)';
                  e.currentTarget.style.borderColor = 'var(--selected)';
                } else {
                  e.currentTarget.style.backgroundColor = '#2a1a1a';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              Clear ALL
            </button>
          </div>
          {/* Confirmation area */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginBottom: 8,
            minHeight: '40px'
          }}>
            {autoSelectConfirmation.type === 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>This will replace ALL your current selections. Are you sure?</span>
                <button className="generate-button" onClick={handleConfirmYes}>Yes</button>
                <button className="generate-button" onClick={handleConfirmNo}>No</button>
              </div>
            )}
            {autoSelectConfirmation.type === 'equipment' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>This will replace your selections for {getEquipmentDisplayName(selectedEquipment || '')}. Are you sure?</span>
                <button className="generate-button" onClick={handleConfirmYes}>Yes</button>
                <button className="generate-button" onClick={handleConfirmNo}>No</button>
              </div>
            )}
            {autoSelectConfirmation.type === 'subcategory' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>This will replace your selections for {getSubcategoryDisplayName(selectedSubcategory || '')} - {getEquipmentDisplayName(selectedEquipment || '')}. Are you sure?</span>
                <button className="generate-button" onClick={handleConfirmYes}>Yes</button>
                <button className="generate-button" onClick={handleConfirmNo}>No</button>
              </div>
            )}
            {autoSelectConfirmation.type === 'clear' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>This will clear ALL your selections and reset the app. Are you sure?</span>
                <button className="generate-button" onClick={handleConfirmYes}>Yes</button>
                <button className="generate-button" onClick={handleConfirmNo}>No</button>
              </div>
            )}
          </div>
          <h3 style={{ marginTop: 8 }}>Equipment</h3>
          <div className="equipment-selector" style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '8px',
            maxWidth: '100%'
          }}>
            {equipmentList.map((eq: string) => (
              <button
                key={eq}
                className={eq === selectedEquipment ? 'selected' : ''}
                onClick={() => {
                  setSelectedEquipment(eq);
                  setSelectedSubcategory(null);
                }}
                style={{
                  order: (() => {
                    switch (eq) {
                      case 'Body Armour': return 0;
                      case 'Boots': return 1;
                      case 'Gloves': return 2;
                      case 'Helmets': return 3;
                      case 'Shield': return 4;
                      case 'OneHandCast': return 5;
                      case 'TwoHandCast': return 6;
                      case 'OneHandAttack': return 7;
                      case 'TwoHandAttack': return 8;
                      case 'Jewellery': return 9;
                      case 'Quiver': return 10;
                      default: return 999;
                    }
                  })()
                }}
              >
                {getEquipmentDisplayName(eq)}
              </button>
            ))}
          </div>
        </section>

        {/* Subcategory Selection */}
        {selectedEquipment && (
          <section className="app-selectors">
            <h3>Subcategory</h3>
            <div className="subcategory-selector">
              {subcategoryList
                .sort((a, b) => getSubcategoryPriority(a) - getSubcategoryPriority(b))
                .map((sub: string) => (
                <button
                  key={sub}
                  className={sub === selectedSubcategory ? 'selected' : ''}
                  data-type={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                >
                  {getSubcategoryDisplayName(sub)}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Basetype Selection */}
        {selectedEquipment && selectedSubcategory && (
          <section className="basetype-section">
            {/* Giga Bases row for non-tiered basetypes */}
            {isNonTieredBasetype(selectedEquipment) && (
              <>
                <div className="basetype-header">
                  <h3 className="giga-label">Giga Bases</h3>
                  <button 
                    className="off-button giga"
                    onClick={() => handleBasetypeOffClick('giga')}
                  >
                    OFF
                  </button>
                </div>
                <div className="basetype-buttons-row giga-basetypes">
                  {currentBasetypes.map((basetype, index) => (
                    <button
                      key={`giga-${index}`}
                      className={`basetype-button giga ${(getSelectedBasetypes().giga ?? []).includes(basetype) ? 'selected giga-style' : ''}`}
                      onClick={() => handleGigaBasetypeSelect(basetype)}
                    >
                      {basetype}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="basetype-header">
              <h3 className="good-label">Good Bases</h3>
              <button 
                className="off-button good"
                onClick={() => handleBasetypeOffClick('good')}
              >
                OFF
              </button>
            </div>
            <div className="basetype-buttons-row good-basetypes">
              {currentBasetypes.map((basetype, index) => (
                <button
                  key={`good-${index}`}
                  className={`basetype-button good ${getSelectedBasetypes().good.includes(basetype) ? 'selected' : ''} ${!isNonTieredBasetype(selectedEquipment) && index === 0 && getSelectedBasetypes().good.includes(basetype) ? 'giga-style' : ''}`}
                  onClick={() => handleGoodBasetypeSelectEnhanced(basetype)}
                >
                  {basetype}
                </button>
              ))}
            </div>
            
            <div className="basetype-header">
              <h3 className="ok-label">OK Bases</h3>
              <button 
                className="off-button ok"
                onClick={() => handleBasetypeOffClick('ok')}
              >
                OFF
              </button>
            </div>
            <div className="basetype-buttons-row ok-basetypes">
              {currentBasetypes.map((basetype, index) => (
                <button
                  key={`ok-${index}`}
                  className={`basetype-button ok ${getSelectedBasetypes().ok.includes(basetype) ? 'selected' : ''}`}
                  onClick={() => handleOkBasetypeSelectEnhanced(basetype)}
                >
                  {basetype}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Families Display */}
        <section className="families-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h3>Available Families</h3>
          <div className="families-columns" style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
            {/* Prefixes Column */}
            {selectedEquipment && selectedSubcategory && (
              <div className="families-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <h4>Prefixes</h4>
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {currentFamilies
                  .filter((familyName: string) => families[familyName]?.type === 'Prefix')
                  .sort((a, b) => getFamilyPriority(a) - getFamilyPriority(b))
                  .map((familyName: string) => {
                    const family = families[familyName];
                    if (!family) return null;
                    
                    const selectedTiers = getSelectedTiers(familyName);
                    
                    const modButtonSelection = getModButtonSelection(familyName);
                    
                    return (
                      <div key={familyName} className="family-card">
                        <div className="family-header">
                          <h5>{family.displayName}</h5>
                          <div className="mod-buttons-grid">
                            <button 
                              className={`mod-button ${modButtonSelection === null ? 'selected' : ''}`}
                              onClick={() => handleModButtonSelect(familyName, 'off')}
                            >
                              OFF
                            </button>
                            <button 
                              className={`mod-button ${modButtonSelection === 'ok' ? 'selected' : ''}`}
                              onClick={() => handleModButtonSelect(familyName, 'ok')}
                            >
                              OK MOD
                            </button>
                            <button 
                              className={`mod-button ${modButtonSelection === 'good' ? 'selected good' : ''}`}
                              onClick={() => handleModButtonSelect(familyName, 'good')}
                            >
                              Good Mod
                            </button>
                            <button 
                              className={`mod-button ${modButtonSelection === 'giga' ? 'giga-style' : ''}`}
                              onClick={() => handleModButtonSelect(familyName, 'giga')}
                            >
                              {modButtonSelection === 'giga' ? 'GIGA MOD' : 'GIGA MOD?'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Single Tier Section - adapts based on mod selection */}
                        {(modButtonSelection === 'good' || modButtonSelection === 'giga' || modButtonSelection === 'ok') && (
                          <div className="tier-section">
                            <h6 className={modButtonSelection === 'ok' ? '' : 'good-label'}>
                              {modButtonSelection === 'ok' ? 'OK Tiers' : 'Good Tiers'}
                            </h6>
                            <div className={`tier-buttons-row ${modButtonSelection === 'ok' ? 'ok-tiers' : 'good-tiers'}`}>
                              {family.mods.map((mod, index) => {
                                const isSelected = modButtonSelection === 'ok' 
                                  ? selectedTiers.ok.includes(mod.tier)
                                  : selectedTiers.good.includes(mod.tier);
                                const isGiga = modButtonSelection === 'giga' && mod.tier === 'T1';
                                return (
                                  <button
                                    key={`tier-${index}`}
                                    className={`tier-button ${modButtonSelection === 'ok' ? 'ok' : 'good'} ${isSelected ? 'selected' : ''} ${isGiga ? 'giga-style' : ''}`}
                                    onClick={() => handleTierSelect(familyName, mod.tier)}
                                  >
                                    {mod.tier}
                                  </button>
                                );
                              })}
                            </div>
                            <div className={`family-stat ${modButtonSelection === 'ok' ? 'ok' : 'good'}`}>
                              {(() => {
                                const tiers = modButtonSelection === 'ok' ? selectedTiers.ok : selectedTiers.good;
                                if (tiers.length > 0) {
                                  const lowestSelectedTier = tiers[tiers.length - 1];
                                  const lowestMod = family.mods.find(m => m.tier === lowestSelectedTier);
                                  return lowestMod?.stat || '';
                                }
                                return '\u00A0';
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suffixes Column */}
            {selectedEquipment && selectedSubcategory && (
              <div className="families-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <h4>Suffixes</h4>
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {currentFamilies
                  .filter((familyName: string) => families[familyName]?.type === 'Suffix')
                  .sort((a, b) => getFamilyPriority(a) - getFamilyPriority(b))
                  .map((familyName: string) => {
                    const family = families[familyName];
                    if (!family) return null;
                    
                    const selectedTiers = getSelectedTiers(familyName);
                    
                    const modButtonSelection = getModButtonSelection(familyName);
                    
                    return (
                      <div key={familyName} className="family-card">
                        <div className="family-header">
                          <h5>{family.displayName}</h5>
                          <div className="mod-buttons-grid">
                            <button 
                              className={`mod-button ${modButtonSelection === null ? 'selected' : ''}`}
                              onClick={() => handleModButtonSelect(familyName, 'off')}
                            >
                              OFF
                            </button>
                            <button 
                              className={`mod-button ${modButtonSelection === 'ok' ? 'selected' : ''}`}
                              onClick={() => handleModButtonSelect(familyName, 'ok')}
                            >
                              OK MOD
                            </button>
                            <button 
                              className={`mod-button ${modButtonSelection === 'good' ? 'selected good' : ''}`}
                              onClick={() => handleModButtonSelect(familyName, 'good')}
                            >
                              Good Mod
                            </button>
                            <button 
                              className={`mod-button ${modButtonSelection === 'giga' ? 'giga-style' : ''}`}
                              onClick={() => handleModButtonSelect(familyName, 'giga')}
                            >
                              {modButtonSelection === 'giga' ? 'GIGA MOD' : 'GIGA MOD?'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Single Tier Section - adapts based on mod selection */}
                        {(modButtonSelection === 'good' || modButtonSelection === 'giga' || modButtonSelection === 'ok') && (
                          <div className="tier-section">
                            <h6 className={modButtonSelection === 'ok' ? '' : 'good-label'}>
                              {modButtonSelection === 'ok' ? 'OK Tiers' : 'Good Tiers'}
                            </h6>
                            <div className={`tier-buttons-row ${modButtonSelection === 'ok' ? 'ok-tiers' : 'good-tiers'}`}>
                              {family.mods.map((mod, index) => {
                                const isSelected = modButtonSelection === 'ok' 
                                  ? selectedTiers.ok.includes(mod.tier)
                                  : selectedTiers.good.includes(mod.tier);
                                const isGiga = modButtonSelection === 'giga' && mod.tier === 'T1';
                                return (
                                  <button
                                    key={`tier-${index}`}
                                    className={`tier-button ${modButtonSelection === 'ok' ? 'ok' : 'good'} ${isSelected ? 'selected' : ''} ${isGiga ? 'giga-style' : ''}`}
                                    onClick={() => handleTierSelect(familyName, mod.tier)}
                                  >
                                    {mod.tier}
                                  </button>
                                );
                              })}
                            </div>
                            <div className={`family-stat ${modButtonSelection === 'ok' ? 'ok' : 'good'}`}>
                              {(() => {
                                const tiers = modButtonSelection === 'ok' ? selectedTiers.ok : selectedTiers.good;
                                if (tiers.length > 0) {
                                  const lowestSelectedTier = tiers[tiers.length - 1];
                                  const lowestMod = family.mods.find(m => m.tier === lowestSelectedTier);
                                  return lowestMod?.stat || '';
                                }
                                return '\u00A0';
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info Panel Column */}
            <div className="info-col" style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <h4>Preview</h4>
              <div className="info-content" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {/* New Groupings Preview */}
                {lastSelectedInfo && (() => {
                  const previewItems = generateNewGroupingsPreview();
                  if (previewItems.length > 0) {
                    return (
                      <div className="preview-text">
                        {previewItems}
                      </div>
                    );
                  }
                  return <div className="preview-text">No groupings to preview</div>;
                })()}
                {lastSelectedInfo ? (
                  <>
                    <div className="info-item"><span className="info-label">Equipment:</span><span className="info-value">{lastSelectedInfo.equipment}</span></div>
                    <div className="info-item"><span className="info-label">Subcategory:</span><span className="info-value">{lastSelectedInfo.subcategory}</span></div>
                    <div className="info-item"><span className="info-label">Family:</span><span className="info-value">{lastSelectedInfo.family}</span></div>
                    <div className="info-item"><span className="info-label">Selected Tiers:</span><span className="info-value">Giga: {lastSelectedInfo.tiers.giga.map(t => t).join(' ')} Good: {lastSelectedInfo.tiers.good.map(t => t).join(' ')} OK: {lastSelectedInfo.tiers.ok.map(t => t).join(' ')}</span></div>
                    <div className="info-item"><span className="info-label">Selected Basetypes:</span><span className="info-value">Giga: {lastSelectedInfo.basetypes.giga.map(b => `"${b}"`).join(' ')} Good: {lastSelectedInfo.basetypes.good.map(b => `"${b}"`).join(' ')} OK: {lastSelectedInfo.basetypes.ok.map(b => `"${b}"`).join(' ')}</span></div>
                    

                  </>
                ) : (
                  <div className="info-item">No selection yet.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Filter Output at the bottom */}
      <section className="filter-output-section" style={{ marginTop: '2rem', flexShrink: 0 }}>
        <div className="output-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button 
            className="download-button" 
            onClick={downloadFilter} 
            disabled={!hasGenerated}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: hasGenerated ? '#4CAF50' : '#ccc',
              color: hasGenerated ? 'white' : '#666',
              border: '2px solid #45a049',
              borderRadius: '8px',
              cursor: hasGenerated ? 'pointer' : 'not-allowed',
              flex: '1',
              marginRight: '0.5rem'
            }}
          >
            Download Filter
          </button>
          <button 
            className="generate-button" 
            onClick={handleGenerateFilterOutput}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#FFD700',
              color: '#000',
              border: '2px solid #DAA520',
              borderRadius: '8px',
              cursor: 'pointer',
              flex: '1',
              margin: '0 0.5rem'
            }}
          >
            Generate Filter Output
          </button>
          <button 
            className="copy-button" 
            onClick={copyToClipboard} 
            disabled={!hasGenerated}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: hasGenerated ? '#2196F3' : '#ccc',
              color: hasGenerated ? 'white' : '#666',
              border: '2px solid #1976D2',
              borderRadius: '6px',
              cursor: hasGenerated ? 'pointer' : 'not-allowed',
              flex: '1',
              margin: '0 0.5rem'
            }}
          >
            Copy to Clipboard
          </button>
        </div>
        <div className="output-content">
          <div className="filter-output" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxWidth: 700, margin: '0 auto' }}>
            {hasGenerated ? (
              filterOutput
            ) : (
              <div className="output-empty">No selections yet. Click 'Generate Filter Output' to create your filter.</div>
            )}
          </div>
        </div>
        {/* --- Import UI --- */}
        <div className="import-section" style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
          <h4>Import TAWM CODE</h4>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="Paste filter output or TAWM CODE here..."
            rows={4}
            wrap="soft"
            style={{ 
              width: '100%',
              fontFamily: 'monospace', 
              marginBottom: '1rem', 
              wordBreak: 'break-all', 
              whiteSpace: 'pre-wrap'
            }}
          />
          <button 
            onClick={handleImport} 
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: '2px solid #1976D2',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '0.5rem'
            }}
          >
            Import
          </button>
          {importStatus === 'success' && (
            <div style={{ color: 'green', textAlign: 'center' }}>{importMessage}</div>
          )}
          {importStatus === 'error' && (
            <div style={{ color: 'red', textAlign: 'center' }}>{importMessage}</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default App; 