const SiteStyling = require('../models/SiteStyling');

// Middleware to inject site styling into all views
exports.injectSiteStyles = async (req, res, next) => {
  try {
    // Get site styling from database or create default
    let siteStyles = await SiteStyling.findOne();
    
    if (!siteStyles) {
      siteStyles = await new SiteStyling().save();
    }
    
    // Add CSS variables to res.locals for use in templates
    res.locals.siteStyles = siteStyles;
    res.locals.cssVariables = siteStyles.generateCSSVariables();
    
    next();
  } catch (error) {
    console.error('Error loading site styles:', error);
    // Continue even if styles fail to load with default values
    res.locals.siteStyles = {
      logoPath: '/images/default-logo.svg',
      primaryColor: '#d946ef',
      secondaryColor: '#c084fc'
    };
    res.locals.cssVariables = '';
    next();
  }
};