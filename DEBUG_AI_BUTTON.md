# Debug: Why AI Coaching Button Not Showing

## How to Debug in Browser

1. **Open Sales OS:**
   - Go to: https://shaamelz.com/system/index.html
   
2. **Open Browser Console (F12)**
   
3. **Check if scripts loaded:**
   ```javascript
   // Check if Supabase loaded
   console.log('Supabase:', typeof window.supabaseClient);
   
   // Check if AI coaching script loaded
   console.log('initAICoaching:', typeof initAICoaching);
   ```

4. **Check for errors:**
   - Look for red errors in console
   - Common issues:
     - "supabaseClient is not defined"
     - "initAICoaching is not defined"
     - CORS errors

5. **Manually trigger initialization:**
   ```javascript
   // If function exists but didn't run, manually trigger
   if (typeof initAICoaching === 'function') {
     initAICoaching();
   }
   ```

6. **Check if buttons were added:**
   ```javascript
   // Count buttons with AI coaching text
   const aiButtons = Array.from(document.querySelectorAll('button'))
     .filter(btn => btn.textContent.includes('AI Coaching'));
   console.log('AI buttons found:', aiButtons.length);
   ```

7. **Check textarea selectors:**
   ```javascript
   // Find 4U textareas
   const textareas = document.querySelectorAll('textarea');
   console.log('Total textareas:', textareas.length);
   
   // Check placeholders
   textareas.forEach((ta, i) => {
     const ph = ta.getAttribute('placeholder') || '';
     if (ph.includes('fundamentally broken') || 
         ph.includes('impossible to ignore') ||
         ph.includes('must be solved now') ||
         ph.includes('no existing solution')) {
       console.log(`Found 4U textarea ${i}:`, ph.substring(0, 50));
     }
   });
   ```

## Likely Issues

**Issue 1: Script Load Order**
- `add-ai-coaching.js` runs before Supabase client is ready
- **Fix:** Wait for supabaseClient to be defined

**Issue 2: Script Path Wrong**
- `../supabase-client.js` might not resolve correctly from `/system/`
- **Fix:** Use absolute path `/supabase-client.js`

**Issue 3: Textareas Not Found**
- Script runs before DOM is ready
- **Fix:** Already has DOMContentLoaded check, but might need delay

## Quick Test

**Paste this in browser console when on Sales OS page:**
```javascript
// Quick test script
(function() {
  const textareas = document.querySelectorAll('textarea');
  let found = 0;
  
  textareas.forEach(ta => {
    const ph = ta.getAttribute('placeholder') || '';
    if (ph.includes('fundamentally broken')) {
      console.log('✅ Found Unworkable textarea');
      found++;
      
      // Add test button
      const btn = document.createElement('button');
      btn.textContent = '🤖 TEST BUTTON';
      btn.style.cssText = 'background:red;color:white;padding:10px;margin-top:10px';
      btn.onclick = () => alert('Button works!');
      ta.parentNode.insertBefore(btn, ta.nextSibling);
    }
  });
  
  console.log(`Found ${found} 4U textareas`);
})();
```

If you see TEST BUTTON appear, the textarea selector works.
If not, the HTML structure is different than expected.

## Report Back

Run the quick test above and tell me:
1. Do you see "✅ Found Unworkable textarea" in console?
2. Does TEST BUTTON appear on the page?
3. Any red errors in console?
