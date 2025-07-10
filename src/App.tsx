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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showFilterOutput, setShowFilterOutput] = useState(true);

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
      };
    };
  }>({});

  // Drag state for basetype painting
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragStartSelected, setDragStartSelected] = useState(false);
  const [dragType, setDragType] = useState<'good' | 'ok'>('ok');

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
        const [familiesRes, itemtypeRes, basetypeRes] = await Promise.all([
          fetch('/modifierFamiliesDisplay_6.json'),
          fetch('/itemtypes_4.json'),
          fetch('/basetypes_5.json'),
        ]);
        if (!familiesRes.ok || !itemtypeRes.ok || !basetypeRes.ok) throw new Error('Failed to fetch data');
        const familiesData = await familiesRes.json();
        const itemtypeData = await itemtypeRes.json();
        const basetypeData = await basetypeRes.json();
        
        setFamilies(familiesData);
        setItemtypeMap(itemtypeData);
        setBasetypeMap(basetypeData);
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
        setDragStartIndex(null);
        setDragStartSelected(false);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

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

  // Handle tier selection for Good tiers
  const handleGoodTierSelect = useCallback((familyName: string, tier: string) => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    setTierSelections(currentSelections => {
      const allTiers = families[familyName]?.mods.map(mod => mod.tier).sort() || [];
      const tierIndex = allTiers.indexOf(tier);
      if (tierIndex === -1) return currentSelections;
      
      const currentData = currentSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName] || { good: [], ok: [] };
      const currentGood = currentData.good;
      
      // Check if this tier is currently the highest selected in good
      const isCurrentlyHighest = currentGood.includes(tier) && 
        currentGood.every(t => allTiers.indexOf(t) <= tierIndex);
      
      const newGoodSelection = isCurrentlyHighest 
        ? allTiers.slice(0, tierIndex)  // Deselect this tier
        : allTiers.slice(0, tierIndex + 1);  // Select up to this tier
      
      return {
        ...currentSelections,
        [selectedEquipment]: {
          ...currentSelections[selectedEquipment],
          [selectedSubcategory]: {
            ...currentSelections[selectedEquipment]?.[selectedSubcategory],
            [familyName]: {
              ...currentData,
              good: newGoodSelection
            }
          }
        }
      };
    });
  }, [selectedEquipment, selectedSubcategory, families]);

  // Handle tier selection for OK tiers
  const handleOkTierSelect = useCallback((familyName: string, tier: string) => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    setTierSelections(currentSelections => {
      const allTiers = families[familyName]?.mods.map(mod => mod.tier).sort() || [];
      const tierIndex = allTiers.indexOf(tier);
      if (tierIndex === -1) return currentSelections;
      
      const currentData = currentSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName] || { good: [], ok: [] };
      const currentOk = currentData.ok;
      
      // Check if this tier is currently the highest selected in ok
      const isCurrentlyHighest = currentOk.includes(tier) && 
        currentOk.every(t => allTiers.indexOf(t) <= tierIndex);
      
      const newOkSelection = isCurrentlyHighest 
        ? allTiers.slice(0, tierIndex)  // Deselect this tier
        : allTiers.slice(0, tierIndex + 1);  // Select up to this tier
      
      return {
        ...currentSelections,
        [selectedEquipment]: {
          ...currentSelections[selectedEquipment],
          [selectedSubcategory]: {
            ...currentSelections[selectedEquipment]?.[selectedSubcategory],
            [familyName]: {
              ...currentData,
              ok: newOkSelection
            }
          }
        }
      };
    });
  }, [selectedEquipment, selectedSubcategory, families]);

  // Handle basetype selection for Good basetypes
  const handleGoodBasetypeSelect = useCallback((basetype: string) => {
    if (!selectedEquipment || !selectedSubcategory) return;
    
    const mappedSubcategory = getBasetypeSubcategory(selectedEquipment, selectedSubcategory);
    
    if (isNonTieredBasetype(selectedEquipment)) {
      // Non-tiered logic: toggle individual selection
      setBasetypeSelections(currentSelections => {
        const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [] };
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
        
        const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [] };
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
    
    const mappedSubcategory = getBasetypeSubcategory(selectedEquipment, selectedSubcategory);
    
    if (isNonTieredBasetype(selectedEquipment)) {
      // Non-tiered logic: toggle individual selection
      setBasetypeSelections(currentSelections => {
        const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [] };
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
        
        const currentData = currentSelections[selectedEquipment]?.[mappedSubcategory] || { good: [], ok: [] };
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
        newSelections[selectedEquipment][mappedSubcategory] = { good: [], ok: [] };
      }
      newSelections[selectedEquipment][mappedSubcategory][type] = [];
      return newSelections;
    });
  }, [selectedEquipment, selectedSubcategory, getBasetypeSubcategory]);

  // Get selected tiers for a family
  const getSelectedTiers = (familyName: string): { good: string[], ok: string[] } => {
    if (!selectedEquipment || !selectedSubcategory) return { good: [], ok: [] };
    return tierSelections[selectedEquipment]?.[selectedSubcategory]?.[familyName] || { good: [], ok: [] };
  };

  // Get selected basetypes
  const getSelectedBasetypes = (): { good: string[], ok: string[] } => {
    if (!selectedEquipment || !selectedSubcategory) return { good: [], ok: [] };
    return basetypeSelections[selectedEquipment]?.[getBasetypeSubcategory(selectedEquipment, selectedSubcategory)] || { good: [], ok: [] };
  };

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
  const getResistanceOrder = (familyName: string, family: ModifierFamily): number => {
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
  const getElementalDamageOrder = (familyName: string, family: ModifierFamily): number => {
    const displayName = family.displayName?.toLowerCase() || '';
    const stat = family.mods[0]?.stat?.toLowerCase() || '';
    
    // Elemental damage order: Fire, Cold, Lightning
    if (displayName.includes('adds fire damage') || stat.includes('adds fire damage')) return 1;
    if (displayName.includes('adds cold damage') || stat.includes('adds cold damage')) return 2;
    if (displayName.includes('adds lightning damage') || stat.includes('adds lightning damage')) return 3;
    
    return 999; // Not elemental damage
  };

  // Build debug display data
  const debugData = Object.entries(tierSelections).flatMap(([eq, subcats]) =>
    Object.entries(subcats).flatMap(([sub, fams]) => {
      const modNames: string[] = [];
      Object.entries(fams).forEach(([fam, tierData]) => {
        const family = families[fam];
        if (family) {
          // Combine good and ok tiers
          const allTiers = [...tierData.good, ...tierData.ok];
          allTiers.forEach(tier => {
            const mod = family.mods.find(m => m.tier === tier);
            if (mod && !modNames.includes(mod.name)) {
              modNames.push(mod.name);
            }
          });
        }
      });
      return modNames.length > 0 ? [{ eq, sub, modNames }] : [];
    })
  );

  // Generate filter output with three blocks
  const generateFilterOutput = (): string => {
    const filterBlocks: string[] = [];
    
    Object.entries(tierSelections).forEach(([equipment, subcats]) => {
      Object.entries(subcats).forEach(([subcategory, fams]) => {
        const goodModNames: string[] = [];
        const okModNames: string[] = [];
        
        // Collect mod names for good and ok tiers separately
        Object.entries(fams).forEach(([familyName, tierData]) => {
          const family = families[familyName];
          if (family) {
            // Good tiers
            tierData.good.forEach(tier => {
              const mod = family.mods.find(m => m.tier === tier);
              if (mod) {
                goodModNames.push(mod.name);
              }
            });
            // OK tiers
            tierData.ok.forEach(tier => {
              const mod = family.mods.find(m => m.tier === tier);
              if (mod) {
                okModNames.push(mod.name);
              }
            });
          }
        });
        
        // Get selected basetypes
        const selectedBasetypes = basetypeSelections[equipment]?.[getBasetypeSubcategory(equipment, subcategory)] || { good: [], ok: [] };
        
        // Create three blocks based on combinations
        const itemType = `${equipment} ${subcategory}`;
        
        // Block 1: OK Bases, Good Mods
        if (selectedBasetypes.ok.length > 0 && goodModNames.length > 0) {
          const okBasetypesOnly = selectedBasetypes.ok.filter(b => !selectedBasetypes.good.includes(b));
          if (okBasetypesOnly.length > 0) {
            const basetypeString = okBasetypesOnly.map(name => `"${name}"`).join(', ');
            const modNamesString = goodModNames.map(name => `"${name}"`).join(' ');
            
            const block = `Show
# "${itemType} - OK Bases, Good Mods"
	FracturedItem True
	Identified True
	Rarity Magic
	HasExplicitMod >=1 ${modNamesString}
	SetFontSize 30
	SetTextColor 26 26 26 255
	SetBorderColor 26 26 26 255
	SetBackgroundColor 231 184 111 255
	PlayEffect Blue
	MinimapIcon 0 Blue Diamond
BaseType == ${basetypeString}`;
            
            filterBlocks.push(block);
          }
        }
        
        // Block 2: Good Bases, OK Mods
        if (selectedBasetypes.good.length > 0 && okModNames.length > 0) {
          const okModsOnly = okModNames.filter(mod => !goodModNames.includes(mod));
          if (okModsOnly.length > 0) {
            const basetypeString = selectedBasetypes.good.map(name => `"${name}"`).join(', ');
            const modNamesString = okModsOnly.map(name => `"${name}"`).join(' ');
            
            const block = `Show
# "${itemType} - Good Bases, OK Mods"
	FracturedItem True
	Identified True
	Rarity Magic
	HasExplicitMod >=1 ${modNamesString}
	SetFontSize 30
	SetTextColor 26 26 26 255
	SetBorderColor 26 26 26 255
	SetBackgroundColor 231 184 111 255
	PlayEffect Blue
	MinimapIcon 0 Blue Diamond
BaseType == ${basetypeString}`;
            
            filterBlocks.push(block);
          }
        }
        
        // Block 3: Good Bases, Good Mods
        if (selectedBasetypes.good.length > 0 && goodModNames.length > 0) {
          const basetypeString = selectedBasetypes.good.map(name => `"${name}"`).join(', ');
          const modNamesString = goodModNames.map(name => `"${name}"`).join(' ');
          
          const block = `Show
# "${itemType} - Good Bases, Good Mods"
	FracturedItem True
	Identified True
	Rarity Magic
	HasExplicitMod >=1 ${modNamesString}
	SetFontSize 30
	SetTextColor 26 26 26 255
	SetBorderColor 26 26 26 255
	SetBackgroundColor 255 182 193 255
	PlayEffect Blue
	MinimapIcon 0 Blue Diamond
BaseType == ${basetypeString}`;
          
          filterBlocks.push(block);
        }
      });
    });
    
    return filterBlocks.join('\n\n');
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
                  className={`basetype-button good ${getSelectedBasetypes().good.includes(basetype) ? 'selected' : ''}`}
                  onClick={() => handleGoodBasetypeSelect(basetype)}
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
                  onClick={() => handleOkBasetypeSelect(basetype)}
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
                    const resistanceOrderA = getResistanceOrder(a, familyA);
                    const resistanceOrderB = getResistanceOrder(b, familyB);
                    
                    if (resistanceOrderA < 999 && resistanceOrderB < 999) {
                      return resistanceOrderA - resistanceOrderB;
                    }
                    if (resistanceOrderA < 999) return -1;
                    if (resistanceOrderB < 999) return 1;
                    
                    // Then group elemental damage families together
                    const elementalOrderA = getElementalDamageOrder(a, familyA);
                    const elementalOrderB = getElementalDamageOrder(b, familyB);
                    
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
                    
                    return (
                      <div key={familyName} className="family-card">
                        <div className="family-header">
                          <h5>{family.displayName}</h5>
                          <div className="off-buttons">
                            <button 
                              className="off-button good"
                              onClick={() => handleOffClick(familyName, 'good')}
                            >
                              Good OFF
                            </button>
                            <button 
                              className="off-button ok"
                              onClick={() => handleOffClick(familyName, 'ok')}
                            >
                              OK OFF
                            </button>
                          </div>
                        </div>
                        
                        {/* Good Tiers */}
                        <div className="tier-section">
                          <h6 className="good-label">Good Tiers</h6>
                          <div className="tier-buttons-row good-tiers">
                            {family.mods.map((mod, index) => (
                              <button
                                key={`good-${index}`}
                                className={`tier-button good ${selectedTiers.good.includes(mod.tier) ? 'selected' : ''}`}
                                onClick={() => handleGoodTierSelect(familyName, mod.tier)}
                              >
                                {mod.tier}
                              </button>
                            ))}
                          </div>
                          <div className="family-stat good">
                            {selectedTiers.good.length > 0 ? (() => {
                              const lowestSelectedTier = selectedTiers.good[selectedTiers.good.length - 1];
                              const lowestMod = family.mods.find(m => m.tier === lowestSelectedTier);
                              return lowestMod?.stat || '';
                            })() : '\u00A0'}
                          </div>
                        </div>
                        
                        {/* OK Tiers */}
                        <div className="tier-section">
                          <h6>OK Tiers</h6>
                          <div className="tier-buttons-row ok-tiers">
                            {family.mods.map((mod, index) => (
                              <button
                                key={`ok-${index}`}
                                className={`tier-button ok ${selectedTiers.ok.includes(mod.tier) ? 'selected' : ''}`}
                                onClick={() => handleOkTierSelect(familyName, mod.tier)}
                              >
                                {mod.tier}
                              </button>
                            ))}
                          </div>
                          <div className="family-stat ok">
                            {selectedTiers.ok.length > 0 ? (() => {
                              const lowestSelectedTier = selectedTiers.ok[selectedTiers.ok.length - 1];
                              const lowestMod = family.mods.find(m => m.tier === lowestSelectedTier);
                              return lowestMod?.stat || '';
                            })() : '\u00A0'}
                          </div>
                        </div>
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
                    const resistanceOrderA = getResistanceOrder(a, familyA);
                    const resistanceOrderB = getResistanceOrder(b, familyB);
                    
                    if (resistanceOrderA < 999 && resistanceOrderB < 999) {
                      return resistanceOrderA - resistanceOrderB;
                    }
                    if (resistanceOrderA < 999) return -1;
                    if (resistanceOrderB < 999) return 1;
                    
                    // Then group elemental damage families together
                    const elementalOrderA = getElementalDamageOrder(a, familyA);
                    const elementalOrderB = getElementalDamageOrder(b, familyB);
                    
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
                    
                    return (
                      <div key={familyName} className="family-card">
                        <div className="family-header">
                          <h5>{family.displayName}</h5>
                          <div className="off-buttons">
                            <button 
                              className="off-button good"
                              onClick={() => handleOffClick(familyName, 'good')}
                            >
                              Good OFF
                            </button>
                            <button 
                              className="off-button ok"
                              onClick={() => handleOffClick(familyName, 'ok')}
                            >
                              OK OFF
                            </button>
                          </div>
                        </div>
                        
                        {/* Good Tiers */}
                        <div className="tier-section">
                          <h6 className="good-label">Good Tiers</h6>
                          <div className="tier-buttons-row good-tiers">
                            {family.mods.map((mod, index) => (
                              <button
                                key={`good-${index}`}
                                className={`tier-button good ${selectedTiers.good.includes(mod.tier) ? 'selected' : ''}`}
                                onClick={() => handleGoodTierSelect(familyName, mod.tier)}
                              >
                                {mod.tier}
                              </button>
                            ))}
                          </div>
                          <div className="family-stat good">
                            {selectedTiers.good.length > 0 ? (() => {
                              const lowestSelectedTier = selectedTiers.good[selectedTiers.good.length - 1];
                              const lowestMod = family.mods.find(m => m.tier === lowestSelectedTier);
                              return lowestMod?.stat || '';
                            })() : '\u00A0'}
                          </div>
                        </div>
                        
                        {/* OK Tiers */}
                        <div className="tier-section">
                          <h6>OK Tiers</h6>
                          <div className="tier-buttons-row ok-tiers">
                            {family.mods.map((mod, index) => (
                              <button
                                key={`ok-${index}`}
                                className={`tier-button ok ${selectedTiers.ok.includes(mod.tier) ? 'selected' : ''}`}
                                onClick={() => handleOkTierSelect(familyName, mod.tier)}
                              >
                                {mod.tier}
                              </button>
                            ))}
                          </div>
                          <div className="family-stat ok">
                            {selectedTiers.ok.length > 0 ? (() => {
                              const lowestSelectedTier = selectedTiers.ok[selectedTiers.ok.length - 1];
                              const lowestMod = family.mods.find(m => m.tier === lowestSelectedTier);
                              return lowestMod?.stat || '';
                            })() : '\u00A0'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Output Panel Column */}
            <div className="output-col">
              <button className="copy-button" onClick={copyToClipboard}>
                Copy to Clipboard
              </button>
              <div className="output-content">
                <div className="filter-output">
                  {generateFilterOutput() || (
                    <div className="output-empty">No selections yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App; 