/**
 * Consolidated Animation Optimizer
 * 
 * This single script improves animation performance across the entire application
 * by optimizing Chart.js, adding hardware acceleration, and improving transitions.
 */

// Execute when DOM is fully loaded, but with a slight delay to ensure other scripts are ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Animation Optimizer waiting for other scripts to initialize...");
  
  // Delay initialization to ensure other scripts have completed
  setTimeout(function() {
      console.log("Initializing Animation Optimizer...");
      AnimationOptimizer.init();
  }, 500);
});

// Global namespace for animation optimizations
const AnimationOptimizer = {
  // Initialize all optimizations
  init: function() {
      this.optimizeCharts();
      this.addHardwareAcceleration();
      this.optimizeFormTransitions();
      this.optimizeCollapsibles();
      this.optimizeTableAnimations();
      this.setupFormChangeHandler();
      this.setupResizeHandler();
      
      console.log("✓ Animation optimizations applied");
  },
  
  // Optimize Chart.js animations and rendering
  optimizeCharts: function() {
      // Check if Chart.js is loaded
      if (typeof Chart === 'undefined') {
          console.log("Chart.js not loaded yet, will retry in 500ms");
          setTimeout(() => this.optimizeCharts(), 500);
          return;
      }
      
      // Modify Chart.js defaults for better performance
      try {
          // Optimize animation settings
          Chart.defaults.animation = {
              duration: 500,         // Shorter animations (was 1000ms)
              easing: 'easeOutQuad', // Less CPU-intensive easing
              delay: 0               // No delay between elements
          };
          
          // Optimize tooltip animations
          if (Chart.defaults.plugins && Chart.defaults.plugins.tooltip) {
              Chart.defaults.plugins.tooltip.animation = {
                  duration: 150      // Faster tooltip animations
              };
          }
          
          // Optimize line charts
          if (Chart.defaults.elements) {
              // Smaller points render faster
              if (Chart.defaults.elements.point) {
                  Chart.defaults.elements.point.radius = 3;
                  Chart.defaults.elements.point.hoverRadius = 4;
              }
              
              // Less curved lines are faster to render
              if (Chart.defaults.elements.line) {
                  Chart.defaults.elements.line.tension = 0.1;
              }
          }
          
          // Update existing charts
          setTimeout(() => {
              this.updateExistingCharts();
          }, 1000);
          
          console.log("✓ Chart.js settings optimized");
      } catch (e) {
          console.error("Failed to optimize Chart.js:", e);
      }
  },
  
  // Update settings on already created charts
  updateExistingCharts: function() {
      try {
          // Find all canvas elements
          const canvases = document.querySelectorAll('canvas');
          let count = 0;
          
          canvases.forEach(canvas => {
              try {
                  // Get Chart instance for this canvas
                  const chart = Chart.getChart(canvas);
                  if (chart) {
                      // Apply optimized settings
                      chart.options.animation = {
                          duration: 500,
                          easing: 'easeOutQuad'
                      };
                      
                      // Disable animation on resize
                      chart.options.responsiveAnimationDuration = 0;
                      
                      // Apply GPU acceleration to canvas
                      canvas.style.transform = 'translateZ(0)';
                      canvas.style.backfaceVisibility = 'hidden';
                      
                      // Update chart to apply changes
                      chart.update('none'); // 'none' mode is faster
                      count++;
                  }
              } catch (e) {
                  // Ignore errors for canvases without charts
              }
          });
          
          if (count > 0) {
              console.log(`✓ Updated ${count} existing charts`);
          }
      } catch (e) {
          console.error("Error updating existing charts:", e);
      }
  },
  
  // Add hardware acceleration to key elements
  addHardwareAcceleration: function() {
      // Add optimized CSS rules
      const style = document.createElement('style');
      style.textContent = `
          /* Enable GPU acceleration for animations */
          .gpu-accelerated {
              transform: translateZ(0);
              will-change: opacity, transform;
              backface-visibility: hidden;
          }
          
          /* Optimized form transitions */
          #basic-form,
          #advanced-form {
              transition: opacity 0.3s ease;
              transform: translateZ(0);
              will-change: opacity;
          }
          
          /* Optimize collapsible sections */
          .collapsible-content {
              transition: height 0.3s ease-out, opacity 0.3s ease-out;
              will-change: height, opacity;
              transform: translateZ(0);
              backface-visibility: hidden;
          }
          
          /* Optimize table animations */
          .summary-table tr {
              transition: background-color 0.2s ease, transform 0.2s ease;
              will-change: transform, opacity;
              transform: translateZ(0);
          }
          
          /* Chart containers - prevent layout shifts */
          #chart-container > div {
              position: relative;
          }
          
          /* Optimize canvas elements for smooth rendering */
          canvas {
              transform: translateZ(0);
              will-change: transform;
              backface-visibility: hidden;
          }
          
          /* Fixed height chart containers to prevent layout shifts */
          #barChart-wrapper,
          #sourcesUsesChart-wrapper,
          #annual-cashflow-chart-container,
          #annual-debt-payment-container,
          #debt-balance-container {
              min-height: 350px;
          }
          
          /* Ensure smooth scrolling */
          html, body {
              scroll-behavior: smooth;
          }
          
          /* Fix mobile scroll performance */
          * {
              -webkit-overflow-scrolling: touch;
          }
      `;
      document.head.appendChild(style);
      
      // Apply GPU acceleration class to key elements
      const elementsToAccelerate = [
          // Form elements
          document.getElementById('form-container'),
          document.getElementById('basic-form'),
          document.getElementById('advanced-form'),
          
          // Chart containers
          document.getElementById('chart-container'),
          document.getElementById('barChart-wrapper'),
          document.getElementById('sourcesUsesChart-wrapper'),
          document.getElementById('annual-cashflow-chart-container'),
          document.getElementById('annual-debt-payment-container'),
          document.getElementById('debt-balance-container'),
          
          // All canvas elements
          ...document.querySelectorAll('canvas'),
          
          // Table containers
          document.getElementById('table-container'),
          document.getElementById('equity-summary-table-container'),
          document.getElementById('spreadsheet-container')
      ];
      
      // Add class to all valid elements
      elementsToAccelerate.forEach(element => {
          if (element) {
              element.classList.add('gpu-accelerated');
          }
      });
      
      console.log("✓ Hardware acceleration applied");
  },
  
  // Optimize form transitions
  optimizeFormTransitions: function() {
      const toggleSwitch = document.getElementById('toggle-switch');
      const basicForm = document.getElementById('basic-form');
      const advancedForm = document.getElementById('advanced-form');
      
      if (!toggleSwitch || !basicForm || !advancedForm) {
          console.log("Form elements not found, skipping optimization");
          return;
      }
      
      // Apply optimized transitions
      basicForm.style.transition = 'opacity 0.3s ease';
      advancedForm.style.transition = 'opacity 0.3s ease';
      
      // We won't modify the existing toggle event handlers to avoid conflicts,
      // but we'll add GPU acceleration to improve existing transitions
      
      console.log("✓ Form transitions optimized");
  },
  
  // Optimize collapsible sections
  optimizeCollapsibles: function() {
      // Get all collapsible sections
      const collapsibles = document.querySelectorAll('.collapsible input[type="checkbox"]');
      
      collapsibles.forEach(collapsible => {
          const content = collapsible.nextElementSibling?.nextElementSibling;
          if (!content) return;
          
          // Add optimized transitions
          content.style.transition = 'height 0.3s ease, opacity 0.3s ease';
          content.style.transform = 'translateZ(0)';
          content.style.willChange = 'height, opacity';
      });
      
      console.log("✓ Collapsible sections optimized");
  },
  
  // Optimize table animations
  optimizeTableAnimations: function() {
      try {
          // Instead of modifying the tables directly, add CSS rules
          // This is less likely to cause conflicts
          const tableStyle = document.createElement('style');
          tableStyle.textContent = `
              /* Optimize table rows */
              #equity-summary-table-container table tr,
              #spreadsheet-container table tr,
              #cashflow-detail-table tr {
                  transition: background-color 0.2s ease !important;
                  transform: translateZ(0);
              }
              
              /* More efficient hover effect */
              #equity-summary-table-container table tr:hover,
              #spreadsheet-container table tr:hover,
              #cashflow-detail-table tr:hover {
                  background-color: rgba(0, 0, 0, 0.05) !important;
              }
              
              /* Fix for spreadsheet table */
              #spreadsheet-container .table-wrapper {
                  will-change: scroll-position;
                  -webkit-overflow-scrolling: touch;
              }
              
              /* Fix for table sticky headers */
              thead th {
                  background-color: #7adfbb;
                  position: sticky;
                  top: 0;
                  z-index: 10;
              }
          `;
          document.head.appendChild(tableStyle);
          
          // Apply minimal DOM changes only where necessary
          // Find spreadsheet container and add optimization class
          const spreadsheetContainer = document.getElementById('spreadsheet-container');
          if (spreadsheetContainer) {
              spreadsheetContainer.classList.add('gpu-accelerated');
              
              // Fix for the 'months' error - add safety check for existing variables
              const fixScript = document.createElement('script');
              fixScript.textContent = `
                  // Add safety check for spreadsheet variables
                  window.ensureSpreadsheetVariables = function() {
                      if (typeof window.selectedMonthsToShow === 'undefined') {
                          window.selectedMonthsToShow = 12; // Default to showing 1 year
                      }
                  };
              `;
              document.head.appendChild(fixScript);
          }
          
          console.log("✓ Table animations optimized");
      } catch (e) {
          console.error("Error optimizing table animations:", e);
      }
  },
  
  // Optimize form dictionary update handling
  setupFormChangeHandler: function() {
      document.addEventListener('formDictionaryChanged', this.handleFormChange.bind(this));
      console.log("✓ Form change handler optimized");
  },
  
  // Handle form dictionary changes optimally
  handleFormChange: function(event) {
      // Tell browser to optimize rendering during updates
      document.body.style.willChange = 'transform';
      
      // Reset optimization after update
      setTimeout(() => {
          document.body.style.willChange = 'auto';
      }, 1000);
  },
  
  // Setup optimized window resize handler
  setupResizeHandler: function() {
      // Debounced resize handler for better performance
      const optimizedResize = this.debounce(() => {
          this.handleResize();
      }, 250);
      
      window.addEventListener('resize', optimizedResize);
      console.log("✓ Resize handler optimized");
  },
  
  // Handle window resize optimally
  handleResize: function() {
      try {
          // Avoid layout thrashing by batching reads and writes
          requestAnimationFrame(() => {
              // Optimize chart resizing
              const canvases = document.querySelectorAll('canvas');
              
              // First pass: get charts and disable animations
              const chartsToUpdate = [];
              const originalAnimations = [];
              
              canvases.forEach(canvas => {
                  try {
                      const chart = Chart.getChart(canvas);
                      if (chart && chart.options) {
                          // Store original animation settings
                          originalAnimations.push(chart.options.animation);
                          
                          // Temporarily disable animations
                          chart.options.animation = false;
                          
                          // Add to update list
                          chartsToUpdate.push(chart);
                      }
                  } catch (e) {
                      // Ignore errors for canvases without charts
                  }
              });
              
              // Second pass: resize all charts
              chartsToUpdate.forEach((chart, index) => {
                  try {
                      chart.resize();
                  } catch (e) {
                      console.warn("Error resizing chart:", e.message);
                  }
              });
              
              // Third pass: restore animation settings
              setTimeout(() => {
                  chartsToUpdate.forEach((chart, index) => {
                      try {
                          chart.options.animation = originalAnimations[index];
                      } catch (e) {
                          // Ignore animation restoration errors
                      }
                  });
              }, 100);
          });
      } catch (e) {
          console.error("Error handling resize:", e);
      }
  },
  
  // Utility function to debounce frequent events
  debounce: function(func, wait) {
      let timeout;
      return function() {
          const context = this;
          const args = arguments;
          clearTimeout(timeout);
          timeout = setTimeout(() => {
              func.apply(context, args);
          }, wait);
      };
  }
};

// Handle errors gracefully
window.addEventListener('error', function(e) {
  // Only log errors from our script
  if (e.filename && e.filename.includes('animation-optimizer')) {
      console.error('Animation Optimizer Error:', e.message);
      
      // Check for common errors and try to fix them
      if (e.message.includes("Cannot access 'months'")) {
          console.log("Attempting to fix 'months' variable error...");
          
          // Try to fix the months variable error
          if (window.ensureSpreadsheetVariables) {
              window.ensureSpreadsheetVariables();
          }
      }
  }
  // Don't prevent other error handlers from running
  return false;
});

// Add fallback error recovery
window.addEventListener('load', function() {
  // Double-check for any missed optimizations after everything is loaded
  setTimeout(function() {
      try {
          // Apply hardware acceleration to any missed canvases
          document.querySelectorAll('canvas').forEach(canvas => {
              if (!canvas.classList.contains('gpu-accelerated')) {
                  canvas.classList.add('gpu-accelerated');
              }
          });
          
          // Check if Chart.js is available but wasn't optimized
          if (typeof Chart !== 'undefined' && !Chart._optimized) {
              AnimationOptimizer.optimizeCharts();
              Chart._optimized = true;
          }
      } catch (e) {
          console.warn("Error in fallback recovery:", e);
      }
  }, 2000);
});