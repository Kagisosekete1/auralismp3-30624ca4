import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a unique ISRC code for Auralis platform
 * ISRC Format: CC-XXX-YY-NNNNN
 * CC = Country Code (ZA for South Africa / Auralis)
 * XXX = Registrant Code (AUR for Auralis)
 * YY = Year of reference (last 2 digits)
 * NNNNN = Designation code (unique 5-digit number)
 */
export const generateISRC = async (): Promise<string> => {
  const countryCode = "ZA"; // South Africa
  const registrantCode = "AUR"; // Auralis
  const year = new Date().getFullYear().toString().slice(-2);
  
  let isUnique = false;
  let isrcCode = "";
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate random 5-digit designation code
    const designationCode = Math.floor(10000 + Math.random() * 90000).toString();
    isrcCode = `${countryCode}${registrantCode}${year}${designationCode}`;
    
    // Check if this ISRC already exists
    const { data } = await supabase
      .from("tracks")
      .select("id")
      .eq("isrc_code", isrcCode)
      .maybeSingle();
    
    if (!data) {
      isUnique = true;
    }
    
    attempts++;
  }

  if (!isUnique) {
    // Fallback: use timestamp-based code
    const timestamp = Date.now().toString().slice(-5);
    isrcCode = `${countryCode}${registrantCode}${year}${timestamp}`;
  }

  return isrcCode;
};

/**
 * Format ISRC code for display (with dashes)
 */
export const formatISRC = (isrc: string): string => {
  if (!isrc || isrc.length !== 12) return isrc;
  return `${isrc.slice(0, 2)}-${isrc.slice(2, 5)}-${isrc.slice(5, 7)}-${isrc.slice(7)}`;
};
