import { subcategoryRules } from '../data/subcategoryRules';
import { useEffect, useState } from 'react';

let modifierFamiliesCache: any = null;

async function fetchModifierFamilies() {
  if (modifierFamiliesCache) return modifierFamiliesCache;
  const res = await fetch('/modifierFamilies.json');
  const data = await res.json();
  modifierFamiliesCache = data;
  return data;
}

type Subcat = 'Str' | 'Dex' | 'Int';

type ModsState = { prefixes: any[]; suffixes: any[] };

export function useModsForSubcategory(slot: string, subcat: string) {
  const [mods, setMods] = useState<ModsState>({ prefixes: [], suffixes: [] });

  useEffect(() => {
    let mounted = true;
    fetchModifierFamilies().then((modifierFamilies) => {
      const rules = subcategoryRules[subcat as Subcat] || { prefixes: [], suffixes: [] };
      const prefixes = rules.prefixes?.map((name: string) => ({ name, ...modifierFamilies[name] })) || [];
      const suffixes = rules.suffixes?.map((name: string) => ({ name, ...modifierFamilies[name] })) || [];
      if (mounted) setMods({ prefixes, suffixes });
    });
    return () => { mounted = false; };
  }, [slot, subcat]);

  return mods;
} 