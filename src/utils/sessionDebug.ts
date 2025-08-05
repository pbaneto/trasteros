export const checkSessionStorage = () => {
  const keys = Object.keys(localStorage);
  const supabaseKeys = keys.filter(key => key.includes('supabase'));
  
  console.log('LocalStorage Supabase keys:', supabaseKeys);
  
  supabaseKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        console.log(`${key}:`, parsed);
      }
    } catch (e) {
      console.log(`${key}: (not JSON)`, localStorage.getItem(key));
    }
  });
};

export const clearSessionStorage = () => {
  const keys = Object.keys(localStorage);
  const supabaseKeys = keys.filter(key => key.includes('supabase'));
  
  supabaseKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('Cleared Supabase session storage');
};