const mongoose = require('mongoose');

const SiteStylingSchema = new mongoose.Schema({
  primaryColor: {
    type: String,
    default: '#6c5ce7'
  },
  secondaryColor: {
    type: String,
    default: '#a29bfe'
  },
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  fontFamily: {
    type: String,
    enum: ['Montserrat', 'Inter', 'Roboto', 'Open Sans', 'Lato'],
    default: 'Montserrat'
  },
  baseFontSize: {
    type: Number,
    default: 16
  },
  headingScale: {
    type: Number,
    default: 1.2
  },
  buttonRadius: {
    type: Number,
    default: 4
  },
  headerTextColor: {
    type: String,
    default: '#2d3436'
  },
  footerTextColor: {
    type: String,
    default: '#2d3436'
  },
  logoPath: {
    type: String,
    default: '/images/default-logo.svg'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate CSS variables
SiteStylingSchema.methods.generateCSSVariables = function() {
  return `
    :root {
      --primary-color: ${this.primaryColor};
      --secondary-color: ${this.secondaryColor};
      --background-color: ${this.backgroundColor};
      --font-family: ${this.fontFamily}, sans-serif;
      --base-font-size: ${this.baseFontSize}px;
      --heading-scale: ${this.headingScale};
      --button-radius: ${this.buttonRadius}px;
      --header-text-color: ${this.headerTextColor};
      --footer-text-color: ${this.footerTextColor};
    }
  `;
};

module.exports = mongoose.model('SiteStyling', SiteStylingSchema);