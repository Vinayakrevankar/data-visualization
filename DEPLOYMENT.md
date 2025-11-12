# Deployment Notes

## Custom Domain Setup

This application is configured to use the custom domain: **vinayakrevankar.com**

### Important:
- **Always access the site via:** `https://vinayakrevankar.com`
- **Do NOT access via:** `https://vinayakrevankar.github.io/data-visualization/` (this will cause 404 errors for assets)

### Why?
The application is built with `base: '/'` for the custom domain. When accessed via the GitHub Pages subpath URL, asset paths won't resolve correctly.

### Troubleshooting 404 Errors:

If you see 404 errors for CSS/JS files:
1. **Check the URL** - Make sure you're using `https://vinayakrevankar.com`, not the GitHub Pages URL
2. **Verify DNS** - Ensure your custom domain DNS is properly configured
3. **Check GitHub Pages Settings** - Go to Settings → Pages and verify:
   - Custom domain is set to `vinayakrevankar.com`
   - "Enforce HTTPS" is enabled
   - The domain shows as verified (green checkmark)

### Data File Location:
- The data file is at: `/data/oscars.csv`
- It should be accessible at: `https://vinayakrevankar.com/data/oscars.csv`

