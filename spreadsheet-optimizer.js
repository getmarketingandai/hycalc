/**
 * Spreadsheet Performance Optimizer
 * 
 * This module optimizes the spreadsheet.js file for smoother animations
 * and better performance with large tables.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Attach to existing spreadsheet functionality
    window.SpreadsheetOptimizer = {
      /**
       * Initialize optimizer on the spreadsheet component
       */
      init: function() {
        // Check if we have a spreadsheet container
        const container = document.getElementById('spreadsheet-container');
        if (!container) return;
        
        console.log('Initializing spreadsheet performance optimizer');
        
        // Implement virtual scrolling for large tables
        this.setupVirtualScrolling(container);
        
        // Optimize table creation
        this.monkeyPatchTableCreation();
        
        // Optimize rendering
        this.optimizeRendering();
      },
      
      /**
       * Set up virtual scrolling for the spreadsheet table
       */
      setupVirtualScrolling: function(container) {
        if (!container) return;
        
        // Create or find the table wrapper
        let tableWrapper = container.querySelector('.table-wrapper');
        if (!tableWrapper) {
          // Create it if it doesn't exist
          tableWrapper = document.createElement('div');
          tableWrapper.className = 'table-wrapper';
          tableWrapper.style.cssText = `
            overflow: auto;
            max-height: 500px;
            position: relative;
            contain: strict;
            will-change: transform;
            transform: translateZ(0);
          `;
          
          // Wait for container to be ready then append
          setTimeout(() => {
            if (container.firstChild) {
              container.insertBefore(tableWrapper, container.firstChild);
            } else {
              container.appendChild(tableWrapper);
            }
          }, 100);
        }
        
        // Listen for scroll events to optimize rendering
        tableWrapper.addEventListener('scroll', this.handleTableScroll.bind(this), { passive: true });
      },
      
      /**
       * Handle scroll events in the table
       */
      handleTableScroll: function(event) {
        if (!this._scrollTimeout) {
          this._scrollTimeout = requestAnimationFrame(() => {
            this.updateVisibleRows(event.target);
            this._scrollTimeout = null;
          });
        }
      },
      
      /**
       * Update which rows are visible based on scroll position
       */
      updateVisibleRows: function(scrollContainer) {
        if (!scrollContainer) return;
        
        const table = scrollContainer.querySelector('table');
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        if (!rows.length) return;
        
        const containerTop = scrollContainer.scrollTop;
        const containerBottom = containerTop + scrollContainer.clientHeight;
        const buffer = 300; // Extra buffer to pre-render rows just outside view
        
        // Update row visibility based on position
        Array.from(rows).forEach(row => {
          const rowTop = row.offsetTop;
          const rowBottom = rowTop + row.offsetHeight;
          
          // Check if row is visible in viewport (plus buffer)
          const isVisible = (rowBottom >= containerTop - buffer) && 
                            (rowTop <= containerBottom + buffer);
          
          // Optimize rendering of visible vs. non-visible rows
          if (isVisible) {
            // For visible rows, ensure content is rendered
            if (row.classList.contains('virtual-row')) {
              row.classList.remove('virtual-row');
              // Restore original cell content if saved
              if (row._originalContent) {
                Array.from(row.cells).forEach((cell, i) => {
                  if (row._originalContent[i]) {
                    cell.textContent = row._originalContent[i];
                  }
                });
              }
            }
          } else {
            // For non-visible rows, simplify rendering
            if (!row.classList.contains('virtual-row')) {
              // Save original cell content if not already saved
              if (!row._originalContent) {
                row._originalContent = Array.from(row.cells).map(cell => cell.textContent);
              }
              row.classList.add('virtual-row');
            }
          }
        });
      },
      
      /**
       * Optimize table rendering
       */
      optimizeRendering: function() {
        // Add styles for virtual rows
        const style = document.createElement('style');
        style.textContent = `
          .virtual-row td:not(:first-child) {
            color: transparent !important;
            background: #f9f9f9;
          }
          .virtual-row:nth-child(even) td:not(:first-child) {
            background: white;
          }
          .table-wrapper::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .table-wrapper::-webkit-scrollbar-track {
            background: #f5f5f5;
          }
          .table-wrapper::-webkit-scrollbar-thumb {
            background-color: #ddd;
            border-radius: 4px;
          }
        `;
        document.head.appendChild(style);
      },
      
      /**
       * Override the table creation function for better performance
       */
      monkeyPatchTableCreation: function() {
        // Store a reference to the original createCashflowTable function
        if (window.originalCreateCashflowTable) return;
        
        if (typeof createCashflowTable === 'function') {
          window.originalCreateCashflowTable = createCashflowTable;
          
          // Replace with optimized version
          window.createCashflowTable = function(outputs) {
            if (!outputs) {
              console.error("No financial outputs available");
              return;
            }
            
            // Get the container
            const container = document.getElementById('spreadsheet-container');
            if (!container) return;
            
            // Create a loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.textContent = 'Generating Table...';
            loadingIndicator.style.cssText = `
              text-align: center;
              padding: 20px;
              font-weight: bold;
              color: #7adfbb;
            `;
            
            // Show loading indicator
            container.innerHTML = '';
            container.appendChild(loadingIndicator);
            
            // Use setTimeout to allow browser to render loading indicator
            setTimeout(() => {
              // Create the table with original function
              const table = window.originalCreateCashflowTable(outputs);
              
              // Apply our optimizations
              if (table) {
                // Ensure all elements have hardware acceleration
                const allCells = table.querySelectorAll('td, th');
                allCells.forEach(cell => {
                  cell.style.transform = 'translateZ(0)';
                });
                
                // Add intersection observer for lazy loading
                const observer = new IntersectionObserver(
                  (entries) => {
                    entries.forEach(entry => {
                      if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                      } else {
                        entry.target.style.opacity = '0.5';
                      }
                    });
                  },
                  { rootMargin: '100px', threshold: 0.1 }
                );
                
                // Observe rows for lazy loading
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                  row.style.transition = 'opacity 0.2s ease';
                  observer.observe(row);
                });
              }
              
              // Find table wrapper and update visible rows
              const tableWrapper = container.querySelector('.table-wrapper');
              if (tableWrapper) {
                // Initialize visible rows after a short delay
                setTimeout(() => {
                  SpreadsheetOptimizer.updateVisibleRows(tableWrapper);
                }, 100);
              }
            }, 50);
          };
        }
      }
    };
    
    // Initialize spreadsheet optimizer
    SpreadsheetOptimizer.init();
    
    // Listen for form changes to re-optimize
    document.addEventListener('formDictionaryChanged', function() {
      // Re-initialize with a delay to ensure the new table is created
      setTimeout(() => {
        SpreadsheetOptimizer.init();
      }, 500);
    });
  });