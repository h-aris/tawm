import React, { useEffect, useState, useCallback } from 'react';
import './App.css';

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

  // Giga selections state: equipment -> subcategory -> family -> giga selections
  const [gigaSelections, setGigaSelections] = useState<{
    [equipment: string]: {
      [subcategory: string]: {
        families: { [family: string]: { good: string[]; ok: string[] } };
        basetypes: { good: string[]; ok: string[] };
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
          fetch(import.meta.env.BASE_URL + 'modifierFamiliesDisplay_6.json'),
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
  const getGigaBase = (): string | null => {
    if (!selectedEquipment || !selectedSubcategory || currentBasetypes.length === 0) return null;
    return currentBasetypes[0]; // First basetype is the giga base
  };

  // Helper function to check if a basetype is giga
  const isGigaBase = (basetype: string): boolean => {
    const gigaBase = getGigaBase();
    return gigaBase === basetype;
  };

  // Helper function to get mod button selection for a family
  const getModButtonSelection = (familyName: string): 'good' | 'ok' | 'giga' | null => {
    if (!selectedEquipment || !selectedSubcategory) return null;
    return modButtonSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName] || null;
  };

  // Get selected tiers for a family
  const getSelectedTiers = (familyName: string): { good: string[], ok: string[] } => {
    if (!selectedEquipment || !selectedSubcategory) return { good: [], ok: [] };
    return tierSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName] || { good: [], ok: [] };
  };

  // Get selected basetypes
  const getSelectedBasetypes = (): { good: string[], ok: string[], all: string[], giga?: string[] } => {
    if (!selectedEquipment || !selectedSubcategory) return { good: [], ok: [], all: [], giga: [] };
    return basetypeSelections[selectedEquipment]?.[getBasetypeSubcategory(selectedEquipment, selectedSubcategory)] || { good: [], ok: [], all: [], giga: [] };
  };

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
    setTimeout(() => {
      if (activeFamily) {
        updateLastSelectedInfo(activeFamily);
      }
    }, 0);
    
    // Populate all basetypes when any tier selection is made
    populateAllBasetypes();
  }, [selectedEquipment, selectedSubcategory, families, activeFamily, populateAllBasetypes]);

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
  }, [selectedEquipment, selectedSubcategory, families]);



  // Update last selected info whenever selections change
  useEffect(() => {
    if (selectedEquipment && selectedSubcategory && activeFamily) {
      // Update with the active family's info
      updateLastSelectedInfo(activeFamily);
    }
  }, [tierSelections, basetypeSelections, selectedEquipment, selectedSubcategory, activeFamily, updateLastSelectedInfo]);

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
  }, [selectedEquipment, selectedSubcategory, currentBasetypes, getBasetypeSubcategory]);

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
  }, [selectedEquipment, selectedSubcategory, currentBasetypes, getBasetypeSubcategory]);

  // Enhanced basetype selection handlers that also update last selected info
  const handleGoodBasetypeSelectEnhanced = useCallback((basetype: string) => {
    handleGoodBasetypeSelect(basetype);
    populateAllBasetypes();
    
    // Update giga basetypes to be the first selected good basetype
    if (selectedEquipment && selectedSubcategory) {
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
    
    // Update last selected info with the first family if available
    if (currentFamilies.length > 0) {
      updateLastSelectedInfo(currentFamilies[0]);
    }
  }, [handleGoodBasetypeSelect, populateAllBasetypes, currentFamilies, updateLastSelectedInfo, selectedEquipment, selectedSubcategory, getBasetypeSubcategory]);

  const handleOkBasetypeSelectEnhanced = useCallback((basetype: string) => {
    handleOkBasetypeSelect(basetype);
    populateAllBasetypes();
    // Update last selected info with the first family if available
    if (currentFamilies.length > 0) {
      updateLastSelectedInfo(currentFamilies[0]);
    }
  }, [handleOkBasetypeSelect, populateAllBasetypes, currentFamilies, updateLastSelectedInfo]);

  // Handle OFF button click for tiers
  const handleOffClick = useCallback((familyName: string, type: 'good' | 'ok') => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    setTierSelections(currentSelections => {
      const newSelections = { ...currentSelections };
      if (newSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName]) {
        newSelections[selectedEquipment][selectedSubcategory][familyName] = {
          ...newSelections[selectedEquipment][selectedSubcategory][familyName],
          [type]: []
        };
      }
      return newSelections;
    });
  }, [selectedEquipment, selectedSubcategory]);

  // Handle basetype OFF button click
  const handleBasetypeOffClick = useCallback((type: 'good' | 'ok') => {
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

  // Copy to clipboard function
  const copyToClipboard = async () => {
    const filterOutput = generateFilterOutput();
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
    const filter = generateFilterOutput();
    if (!filter) return;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const MM = pad(now.getMonth() + 1);
    const DD = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const SS = pad(now.getSeconds());
    const filename = `Tawm-${MM}${DD}${HH}${mm}${SS}.filter`;
    const blob = new Blob([filter], { type: 'text/plain' });
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

  // Helper function to get family priority for ordering
  const getFamilyPriority = (familyName: string, family: ModifierFamily): number => {
    const displayName = family.displayName?.toLowerCase() || '';
    const stat = family.mods[0]?.stat?.toLowerCase() || '';
    const name = familyName.toLowerCase();
    
    // Spell suppression: absolute top priority
    if (displayName.includes('spell suppression') || stat.includes('spell suppression') || name.includes('spell suppression')) {
      return -100; // Absolute highest priority
    }
    
    // High priority for energy shield + evasion (above maximum life)
    if ((displayName.includes('energy shield') || stat.includes('energy shield') || name.includes('energy shield')) && 
        family.mods.length === 5) {
      return 1; // Above maximum life
    }
    
    // High priority families
    const highPriorityKeywords = [
      'maximum life', 'life', 'movement speed', 'spell damage',
      'level to all skill gems', 'energy shield', 'resistances', 'life regeneration',
      'intelligence', 'attack speed', 'physical damage reduction', 'ailment avoidance',
      'critical strike multiplier', 'accuracy'
    ];
    
    // Check if family matches high priority criteria
    for (const keyword of highPriorityKeywords) {
      if (displayName.includes(keyword) || stat.includes(keyword) || name.includes(keyword)) {
        // Additional check for 5-tier families
        if ((keyword.includes('life') || keyword.includes('energy shield') || keyword.includes('mana')) && family.mods.length === 5) {
          return 1; // High priority
        }
        return 2; // Medium priority
      }
    }
    
    // Elemental damage families (high priority on weapons and jewellery)
    if (displayName.includes('adds elemental damage') || stat.includes('adds elemental damage')) {
      return 2; // High priority
    }
    
    // Physical damage (very high on weapons, low on others)
    if (displayName.includes('physical damage') || stat.includes('physical damage')) {
      // This will be handled by equipment-specific logic
      return 2; // Default to medium priority
    }
    
    // Low priority families
    const lowPriorityKeywords = [
      'adds chaos damage', 'life per enemy killed', 'mana per enemy killed',
      'life per hit', 'mana per hit', 'life regeneration per second'
    ];
    
    for (const keyword of lowPriorityKeywords) {
      if (displayName.includes(keyword) || stat.includes(keyword) || name.includes(keyword)) {
        return 4; // Low priority
      }
    }
    
    return 3; // Normal priority
  };

  // Helper function to get resistance order
  const getResistanceOrder = (family: ModifierFamily): number => {
    const displayName = family.displayName?.toLowerCase() || '';
    const stat = family.mods[0]?.stat?.toLowerCase() || '';
    
    // Resistance order: Chaos, Fire, Cold, Lightning
    if (displayName.includes('chaos resistance') || stat.includes('chaos resistance')) return 1;
    if (displayName.includes('fire resistance') || stat.includes('fire resistance')) return 2;
    if (displayName.includes('cold resistance') || stat.includes('cold resistance')) return 3;
    if (displayName.includes('lightning resistance') || stat.includes('lightning resistance')) return 4;
    
    return 999; // Not a resistance
  };

  // Helper function to get elemental damage order
  const getElementalDamageOrder = (family: ModifierFamily): number => {
    const displayName = family.displayName?.toLowerCase() || '';
    const stat = family.mods[0]?.stat?.toLowerCase() || '';
    
    // Elemental damage order: Fire, Cold, Lightning
    if (displayName.includes('adds fire damage') || stat.includes('adds fire damage')) return 1;
    if (displayName.includes('adds cold damage') || stat.includes('adds cold damage')) return 2;
    if (displayName.includes('adds lightning damage') || stat.includes('adds lightning damage')) return 3;
    
    return 999; // Not elemental damage
  };

  // Build debug display data


  // Generate filter output using groupings JSON data
  const generateFilterOutput = (): string => {
    if (!groupingsData) return '';
    
    const filterBlocks: string[] = [];
    
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
            
            // Giga Mods: T1 tiers from families with Giga mod button active
            if (modButton === 'giga' && tierData.good.includes('T1')) {
              const mod = family.mods.find(m => m.tier === 'T1');
              if (mod && !modNamesByType.giga.includes(mod.name)) {
                modNamesByType.giga.push(mod.name);
              }
            }
            
            // GoodG Mods: Good tiers from families with Giga mod button active
            if (modButton === 'giga' && tierData.good.length > 0) {
              tierData.good.forEach(tier => {
                const mod = family.mods.find(m => m.tier === tier);
                if (mod && !modNamesByType.goodg.includes(mod.name)) {
                  modNamesByType.goodg.push(mod.name);
                }
              });
            }
            
            // Good Mods: Good tiers from families with Good mod button active
            if (modButton === 'good' && tierData.good.length > 0) {
              tierData.good.forEach(tier => {
                const mod = family.mods.find(m => m.tier === tier);
                if (mod && !modNamesByType.good.includes(mod.name)) {
                  modNamesByType.good.push(mod.name);
                }
              });
            }
            
            // OKG Mods: OK tiers from families with Giga mod button active
            if (modButton === 'giga' && tierData.ok.length > 0) {
              tierData.ok.forEach(tier => {
                const mod = family.mods.find(m => m.tier === tier);
                if (mod && !modNamesByType.okg.includes(mod.name)) {
                  modNamesByType.okg.push(mod.name);
                }
              });
            }
            
            // OKGood Mods: OK tiers from families with Good mod button active
            if (modButton === 'good' && tierData.ok.length > 0) {
              tierData.ok.forEach(tier => {
                const mod = family.mods.find(m => m.tier === tier);
                if (mod && !modNamesByType.okgood.includes(mod.name)) {
                  modNamesByType.okgood.push(mod.name);
                }
              });
            }
            
            // OK Mods: OK tiers from families with OK mod button active
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
        
        // Generate blocks using groupings data in priority order
        groupingsData.groupings.forEach((grouping: any) => {
          const { id, name, baseType, modType, backgroundColor, textColor } = grouping;
          
          // Check if we have the required base types
          let hasBase = false;
          let basetypeString = '';
          if (baseType === 'giga') {
            hasBase = !!(selectedBasetypes.giga && selectedBasetypes.giga.length > 0);
            if (hasBase) {
              basetypeString = selectedBasetypes.giga!.map((name: string) => `"${name}"`).join(' ');
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
          
          // Check if we have the required mod types
          const modNames = modNamesByType[modType] || [];
          const hasMods = modNames.length > 0;
          
          if (hasBase && hasMods) {
            const modNamesString = modNames.map((name: string) => `"${name}"`).join(' ');
            
            // Convert hex colors to RGB
            const hexToRgb = (hex: string) => {
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
              const block = `Show
# "${itemType} - ${name}"
	FracturedItem True
	Identified True
	Rarity Magic
	HasExplicitMod >=1 ${modNamesString}
	SetFontSize 30
	SetTextColor ${textRgb.r} ${textRgb.g} ${textRgb.b} 255
	SetBorderColor ${textRgb.r} ${textRgb.g} ${textRgb.b} 255
	SetBackgroundColor ${bgRgb.r} ${bgRgb.g} ${bgRgb.b} 255
	PlayEffect Blue
	MinimapIcon 0 Blue Diamond
BaseType == ${basetypeString}`;
              filterBlocks.push(block);
            }
          }
        });
      });
    });
    
    return filterBlocks.join('\n\n');
  };

  // Generate new groupings preview based on current selections
  const generateNewGroupingsPreview = (): React.ReactElement[] => {
    if (!lastSelectedInfo || !groupingsData) return [];
    
    const family = families[lastSelectedInfo.family];
    if (!family) return [];
    
    const selectedTiers = getSelectedTiers(lastSelectedInfo.family);
    const selectedBasetypes = getSelectedBasetypes();
    const modButton = getModButtonSelection(lastSelectedInfo.family);
    
    const previewItems: React.ReactElement[] = [];
    
    // Helper function to get lowest tier stat
    const getLowestTierStat = (tiers: string[]) => {
      if (tiers.length === 0) return null;
      const lowestTier = tiers[tiers.length - 1]; // Highest index = lowest tier
      return family.mods.find(m => m.tier === lowestTier)?.stat || null;
    };
    
    // Helper function to get lowest base
    const getLowestBase = (bases: string[]) => {
      if (bases.length === 0) return null;
      return bases[bases.length - 1]; // Highest index = lowest base
    };
    
    // Helper function to determine if a grouping should be shown
    const shouldShowGrouping = (grouping: any) => {
      const { baseType, modType, id } = grouping;
      
      // Check base type availability
      let hasBase = false;
      if (baseType === 'giga') hasBase = !!(selectedBasetypes.giga && selectedBasetypes.giga.length > 0);
      else if (baseType === 'good') hasBase = selectedBasetypes.good.length > 0;
      else if (baseType === 'ok') hasBase = selectedBasetypes.ok.length > 0;
      else if (baseType === 'all') hasBase = selectedBasetypes.all.length > 0;
      
      if (!hasBase) {
        return false;
      }
      
      // Check mod type availability
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
    
    // Generate preview items based on groupings data
    let validGroupings = groupingsData.groupings.filter((grouping: any) => shouldShowGrouping(grouping));
    
    // Sort by color scheme: giga -> salmon -> gold -> blue
    const colorSchemeOrder = { giga: 0, salmon: 1, gold: 2, blue: 3 };
    validGroupings.sort((a: any, b: any) => {
      const aScheme = typeof a.colorScheme === 'string' ? a.colorScheme.trim().toLowerCase() : '';
      const bScheme = typeof b.colorScheme === 'string' ? b.colorScheme.trim().toLowerCase() : '';
      const aOrder = colorSchemeOrder[aScheme as keyof typeof colorSchemeOrder] ?? 999;
      const bOrder = colorSchemeOrder[bScheme as keyof typeof colorSchemeOrder] ?? 999;
      return aOrder - bOrder;
    });
    
    // Remove redundant GoodG groupings when T1 is the only Good tier selected
    const hasOnlyT1InGood = selectedTiers.good.length === 1 && selectedTiers.good.includes('T1');
    if (hasOnlyT1InGood) {
      validGroupings = validGroupings.filter((grouping: any) => {
        // Remove GoodG groupings when T1 is the only Good tier
        if (grouping.modType === 'goodg') {
          return false;
        }
        return true;
      });
    }
    
    validGroupings.forEach((grouping: any) => {
      const { id, name, colorScheme, backgroundColor, textColor } = grouping;
      
      // Get the appropriate stat and base
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
        base = getLowestBase(selectedBasetypes.giga!);
      } else if (grouping.baseType === 'good') {
        base = getLowestBase(selectedBasetypes.good);
      } else if (grouping.baseType === 'ok') {
        base = getLowestBase(selectedBasetypes.ok);
      } else if (grouping.baseType === 'all') {
        base = getLowestBase(selectedBasetypes.all);
      }
      
      if (stat && base) {
        const style = {
          backgroundColor,
          color: textColor,
          border: `2px solid ${textColor}`
        };
        
        previewItems.push(
          <div key={id} className="preview-line" style={style}>
            <span className="preview-stat">{stat}</span>
            <span className="preview-base"> {base}</span>
          </div>
        );
      }
    });
    
    return previewItems;
  };

  if (loading) return <div className="app-loading">Loading...</div>;
  if (error) return <div className="app-error">Error: {error}</div>;

  return (
    <div className="app-root">
      <header className="app-header">TAWM'BERNO</header>
      <main className="app-main">
        {/* Equipment Selection */}
        <section className="app-selectors">
          <h3>Equipment</h3>
          <div className="equipment-selector">
            {equipmentList.map((eq: string) => (
              <button
                key={eq}
                className={eq === selectedEquipment ? 'selected' : ''}
                onClick={() => {
                  setSelectedEquipment(eq);
                  setSelectedSubcategory(null);
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
                  className={`basetype-button good ${getSelectedBasetypes().good.includes(basetype) ? 'selected' : ''} ${index === 0 && getSelectedBasetypes().good.includes(basetype) ? 'giga-style' : ''}`}
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
        <section className="families-section">
          <h3>Available Families</h3>
          <div className="families-columns">
            {/* Prefixes Column */}
            {selectedEquipment && selectedSubcategory && (
              <div className="families-col">
                <h4>Prefixes</h4>
                {currentFamilies
                  .filter((familyName: string) => families[familyName]?.type === 'Prefix')
                  .sort((a, b) => {
                    const familyA = families[a];
                    const familyB = families[b];
                    if (!familyA || !familyB) return 0;
                    
                    // First, group resistances together
                    const resistanceOrderA = getResistanceOrder(familyA);
                    const resistanceOrderB = getResistanceOrder(familyB);
                    
                    if (resistanceOrderA < 999 && resistanceOrderB < 999) {
                      return resistanceOrderA - resistanceOrderB;
                    }
                    if (resistanceOrderA < 999) return -1;
                    if (resistanceOrderB < 999) return 1;
                    
                    // Then group elemental damage families together
                    const elementalOrderA = getElementalDamageOrder(familyA);
                    const elementalOrderB = getElementalDamageOrder(familyB);
                    
                    if (elementalOrderA < 999 && elementalOrderB < 999) {
                      return elementalOrderA - elementalOrderB;
                    }
                    if (elementalOrderA < 999) return -1;
                    if (elementalOrderB < 999) return 1;
                    
                    // Then prioritize by family priority
                    const priorityA = getFamilyPriority(a, familyA);
                    const priorityB = getFamilyPriority(b, familyB);
                    
                    if (priorityA !== priorityB) {
                      return priorityA - priorityB;
                    }
                    
                    // Finally, sort alphabetically
                    return a.localeCompare(b);
                  })
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
            )}

            {/* Suffixes Column */}
            {selectedEquipment && selectedSubcategory && (
              <div className="families-col">
                <h4>Suffixes</h4>
                {currentFamilies
                  .filter((familyName: string) => families[familyName]?.type === 'Suffix')
                  .sort((a, b) => {
                    const familyA = families[a];
                    const familyB = families[b];
                    if (!familyA || !familyB) return 0;
                    
                    // First, group resistances together
                    const resistanceOrderA = getResistanceOrder(familyA);
                    const resistanceOrderB = getResistanceOrder(familyB);
                    
                    if (resistanceOrderA < 999 && resistanceOrderB < 999) {
                      return resistanceOrderA - resistanceOrderB;
                    }
                    if (resistanceOrderA < 999) return -1;
                    if (resistanceOrderB < 999) return 1;
                    
                    // Then group elemental damage families together
                    const elementalOrderA = getElementalDamageOrder(familyA);
                    const elementalOrderB = getElementalDamageOrder(familyB);
                    
                    if (elementalOrderA < 999 && elementalOrderB < 999) {
                      return elementalOrderA - elementalOrderB;
                    }
                    if (elementalOrderA < 999) return -1;
                    if (elementalOrderB < 999) return 1;
                    
                    // Then prioritize by family priority
                    const priorityA = getFamilyPriority(a, familyA);
                    const priorityB = getFamilyPriority(b, familyB);
                    
                    if (priorityA !== priorityB) {
                      return priorityA - priorityB;
                    }
                    
                    // Finally, sort alphabetically
                    return a.localeCompare(b);
                  })
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
            )}

            {/* Info Panel Column */}
            <div className="info-col">
              <h4>Preview</h4>
              <div className="info-content">
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
      <section className="filter-output-section" style={{ marginTop: '2rem' }}>
        <div className="output-header">
          <button className="copy-button" onClick={copyToClipboard}>
            Copy to Clipboard
          </button>
          <button className="download-button" onClick={downloadFilter} style={{ marginLeft: '1rem' }}>
            Download Filter
          </button>
        </div>
        <div className="output-content">
          <div className="filter-output">
            {generateFilterOutput() || (
              <div className="output-empty">No selections yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default App; 