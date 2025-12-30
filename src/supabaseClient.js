import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('heritage_sites')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error };
    }
    
    console.log('✅ Supabase connected successfully!');
    return { success: true, data };
  } catch (err) {
    console.error('Supabase connection failed:', err);
    return { success: false, error: err };
  }
};

// ============ HERITAGE SITES DATABASE FUNCTIONS ============

// Load all sites from database
export const loadSitesFromDB = async () => {
  try {
    const { data, error } = await supabase
      .from('heritage_sites')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading sites:', error);
      return { success: false, error };
    }
    
    // Convert from database format to app format
    const sites = data.map(site => ({
      id: site.id,
      name: site.name,
      alternateName: site.alternate_name,
      type: site.type,
      lat: parseFloat(site.lat),
      lng: parseFloat(site.lng),
      region: site.region,
      county: site.county,
      era: site.era || [],
      startYear: site.start_year,
      endYear: site.end_year,
      description: site.description,
      extendedDescription: site.extended_description,
      highlights: site.highlights || [],
      image: site.image,
      rating: parseFloat(site.rating) || 4.5,
      reviews: site.reviews || 0,
      verified: site.verified || false,
      visitInfo: site.visit_info || {},
      bestTimeToVisit: site.best_time_to_visit,
      whatToWear: site.what_to_wear,
      photoTips: site.photo_tips,
      funFacts: site.fun_facts || []
    }));
    
    console.log(`✅ Loaded ${sites.length} sites from database`);
    return { success: true, data: sites };
  } catch (err) {
    console.error('Error loading sites:', err);
    return { success: false, error: err };
  }
};

// Save a single site to database (upsert - insert or update)
export const saveSiteToDB = async (site) => {
  try {
    const dbSite = {
      id: site.id,
      name: site.name,
      alternate_name: site.alternateName || null,
      type: site.type,
      lat: site.lat,
      lng: site.lng,
      region: site.region,
      county: site.county,
      era: site.era || [],
      start_year: site.startYear || null,
      end_year: site.endYear || null,
      description: site.description,
      extended_description: site.extendedDescription || null,
      highlights: site.highlights || [],
      image: site.image,
      rating: site.rating || 4.5,
      reviews: site.reviews || 0,
      verified: site.verified || false,
      visit_info: site.visitInfo || {},
      best_time_to_visit: site.bestTimeToVisit || null,
      what_to_wear: site.whatToWear || null,
      photo_tips: site.photoTips || null,
      fun_facts: site.funFacts || [],
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('heritage_sites')
      .upsert(dbSite, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error('Error saving site:', error);
      return { success: false, error };
    }
    
    console.log(`✅ Saved site: ${site.name}`);
    return { success: true, data };
  } catch (err) {
    console.error('Error saving site:', err);
    return { success: false, error: err };
  }
};

// Save all sites to database (bulk upsert)
export const saveAllSitesToDB = async (sites) => {
  try {
    const dbSites = sites.map(site => ({
      id: site.id,
      name: site.name,
      alternate_name: site.alternateName || null,
      type: site.type,
      lat: site.lat,
      lng: site.lng,
      region: site.region,
      county: site.county,
      era: site.era || [],
      start_year: site.startYear || null,
      end_year: site.endYear || null,
      description: site.description,
      extended_description: site.extendedDescription || null,
      highlights: site.highlights || [],
      image: site.image,
      rating: site.rating || 4.5,
      reviews: site.reviews || 0,
      verified: site.verified || false,
      visit_info: site.visitInfo || {},
      best_time_to_visit: site.bestTimeToVisit || null,
      what_to_wear: site.whatToWear || null,
      photo_tips: site.photoTips || null,
      fun_facts: site.funFacts || [],
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('heritage_sites')
      .upsert(dbSites, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error('Error saving sites:', error);
      return { success: false, error };
    }
    
    console.log(`✅ Saved ${sites.length} sites to database`);
    return { success: true, data };
  } catch (err) {
    console.error('Error saving sites:', err);
    return { success: false, error: err };
  }
};

// ============ IMAGE STORAGE FUNCTIONS ============

// Bucket name - must match exactly what's in Supabase Storage
const BUCKET_NAME = 'Heritage';

// Upload an image to Supabase Storage
export const uploadImage = async (file, fileName) => {
  try {
    // Create a unique filename
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    console.log('📤 Attempting upload to bucket:', BUCKET_NAME);
    console.log('📁 File name:', uniqueName);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('❌ Upload error details:', error.message, error);
      return { success: false, error };
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uniqueName);
    
    console.log(`✅ Uploaded image: ${uniqueName}`);
    console.log('🔗 Public URL:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl, path: data.path };
  } catch (err) {
    console.error('❌ Upload exception:', err);
    return { success: false, error: err };
  }
};

// Delete an image from Supabase Storage
export const deleteImage = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image:', error);
      return { success: false, error };
    }
    
    console.log(`✅ Deleted image: ${filePath}`);
    return { success: true };
  } catch (err) {
    console.error('Error deleting image:', err);
    return { success: false, error: err };
  }
};

// List all images in the bucket
export const listImages = async () => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error('Error listing images:', error);
      return { success: false, error };
    }
    
    // Get public URLs for all images
    const images = data.map(file => {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file.name);
      
      return {
        name: file.name,
        url: urlData.publicUrl,
        createdAt: file.created_at
      };
    });
    
    return { success: true, data: images };
  } catch (err) {
    console.error('Error listing images:', err);
    return { success: false, error: err };
  }
};

// ============ APP SETTINGS FUNCTIONS ============

// Load app settings (country card images, etc.)
export const loadAppSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .single();
    
    if (error) {
      // If no settings exist yet, return defaults
      if (error.code === 'PGRST116') {
        console.log('No settings found, using defaults');
        return { 
          success: true, 
          data: {
            albania_card_image: '',
            kosovo_card_image: ''
          }
        };
      }
      console.error('Error loading settings:', error);
      return { success: false, error };
    }
    
    console.log('✅ Loaded app settings');
    return { success: true, data };
  } catch (err) {
    console.error('Error loading settings:', err);
    return { success: false, error: err };
  }
};

// Save app settings
export const saveAppSettings = async (settings) => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({
        id: 1, // Single row for app settings
        albania_card_image: settings.albaniaCardImage || '',
        kosovo_card_image: settings.kosovoCardImage || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error('Error saving settings:', error);
      return { success: false, error };
    }
    
    console.log('✅ Saved app settings');
    return { success: true, data };
  } catch (err) {
    console.error('Error saving settings:', err);
    return { success: false, error: err };
  }
};
