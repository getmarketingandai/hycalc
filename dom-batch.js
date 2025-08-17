/**
 * DOM Batch Processor
 * 
 * This utility helps batch DOM operations to improve animation performance
 * by reducing layout thrashing and unnecessary reflows.
 */

// Create a global namespace for the batch processor
window.DOMBatch = (function() {
    // Queue for read operations
    const readQueue = [];
    // Queue for write operations
    const writeQueue = [];
    // Flag to check if a frame is scheduled
    let frameScheduled = false;
    
    /**
     * Schedule a read operation (like getBoundingClientRect)
     * @param {Function} readFn Function that reads from the DOM
     */
    function read(readFn) {
      readQueue.push(readFn);
      scheduleFrame();
    }
    
    /**
     * Schedule a write operation (like setting style properties)
     * @param {Function} writeFn Function that writes to the DOM
     */
    function write(writeFn) {
      writeQueue.push(writeFn);
      scheduleFrame();
    }
    
    /**
     * Schedule reads and writes to happen in the next animation frame
     */
    function scheduleFrame() {
      if (frameScheduled) return;
      
      frameScheduled = true;
      requestAnimationFrame(processQueues);
    }
    
    /**
     * Process all queued reads and writes
     */
    function processQueues() {
      // Process reads first (doesn't affect layout)
      const reads = readQueue.splice(0, readQueue.length);
      reads.forEach(readFn => readFn());
      
      // Then process writes (affects layout but we've already done all reads)
      const writes = writeQueue.splice(0, writeQueue.length);
      writes.forEach(writeFn => writeFn());
      
      frameScheduled = false;
      
      // If new operations were queued during processing, schedule a new frame
      if (readQueue.length || writeQueue.length) {
        scheduleFrame();
      }
    }
    
    /**
     * Update multiple DOM elements efficiently
     * @param {Array} elements Array of DOM elements
     * @param {Function} updateFn Function to update each element
     * @param {Boolean} staggered Whether to stagger the updates
     * @param {Number} staggerDelay Delay between staggered updates
     */
    function updateElements(elements, updateFn, staggered = false, staggerDelay = 50) {
      if (!staggered) {
        // Batch update all elements at once
        write(() => {
          elements.forEach(updateFn);
        });
      } else {
        // Stagger updates for visual effect but avoid excessive reflows
        elements.forEach((element, index) => {
          setTimeout(() => {
            write(() => updateFn(element, index));
          }, index * staggerDelay);
        });
      }
    }
    
    /**
     * Apply a fade-in animation to elements
     * @param {Array} elements Array of DOM elements
     * @param {Boolean} staggered Whether to stagger the animations
     * @param {Number} staggerDelay Delay between staggered animations
     * @param {Number} duration Animation duration
     */
    function animateFadeIn(elements, staggered = true, staggerDelay = 40, duration = 300) {
      // Prepare all elements first
      write(() => {
        elements.forEach(el => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(15px)';
          el.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
        });
      });
      
      // Force a reflow before starting animations
      read(() => void document.body.offsetHeight);
      
      // Now animate them in sequence or all at once
      updateElements(elements, (el, i) => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, staggered, staggerDelay);
    }
    
    /**
     * Apply transitions to elements without causing layout thrashing
     * @param {Array} elements Array of DOM elements 
     * @param {Object} styles CSS properties to animate
     * @param {Object} options Animation options
     */
    function applyTransition(elements, styles, options = {}) {
      const {
        duration = 300,
        easing = 'ease',
        staggered = false,
        staggerDelay = 40
      } = options;
      
      // Prepare transition properties
      const properties = Object.keys(styles).join(',');
      
      // Set transition property on all elements
      write(() => {
        elements.forEach(el => {
          el.style.transition = `${properties} ${duration}ms ${easing}`;
        });
      });
      
      // Apply styles with optional staggering
      updateElements(elements, (el, i) => {
        Object.entries(styles).forEach(([prop, value]) => {
          el.style[prop] = value;
        });
      }, staggered, staggerDelay);
    }
    
    /**
     * Optimize table rendering for large tables
     * @param {HTMLElement} tableContainer Container element for the table
     * @param {Number} visibleRowCount Maximum number of rows to show initially
     */
    function optimizeTableRendering(tableContainer, visibleRowCount = 20) {
      if (!tableContainer) return;
      
      const table = tableContainer.querySelector('table');
      if (!table) return;
      
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      if (rows.length <= visibleRowCount) return;
      
      // Hide rows beyond the visible count
      write(() => {
        rows.forEach((row, i) => {
          if (i >= visibleRowCount) {
            row.style.display = 'none';
          }
        });
      });
      
      // Create "Load More" button
      const loadMoreButton = document.createElement('button');
      loadMoreButton.textContent = `Show ${Math.min(20, rows.length - visibleRowCount)} More Rows`;
      loadMoreButton.style.cssText = `
        padding: 8px 16px;
        margin: 10px auto;
        display: block;
        background-color: #7adfbb;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      `;
      
      write(() => {
        tableContainer.appendChild(loadMoreButton);
      });
      
      // Load more rows when clicked
      let currentlyVisible = visibleRowCount;
      loadMoreButton.addEventListener('click', () => {
        const nextBatch = rows.slice(currentlyVisible, currentlyVisible + 20);
        currentlyVisible += nextBatch.length;
        
        // Show next batch with staggered animation
        write(() => {
          nextBatch.forEach(row => {
            row.style.display = 'table-row';
            row.style.opacity = '0';
          });
        });
        
        // Animate them in
        animateFadeIn(nextBatch);
        
        // Update button
        if (currentlyVisible >= rows.length) {
          loadMoreButton.style.display = 'none';
        } else {
          loadMoreButton.textContent = `Show ${Math.min(20, rows.length - currentlyVisible)} More Rows`;
        }
      });
    }
    
    return {
      read,
      write,
      updateElements,
      animateFadeIn,
      applyTransition,
      optimizeTableRendering
    };
  })();
  
  // Add lifecycle hooks to optimize performance at key points
  document.addEventListener('DOMContentLoaded', function() {
    // Apply to tables that exist on page load
    const spreadsheetContainer = document.getElementById('spreadsheet-container');
    if (spreadsheetContainer) {
      DOMBatch.optimizeTableRendering(spreadsheetContainer);
    }
    
    // Optimize form dictionary change handler
    const originalEventListener = document.addEventListener;
    document.addEventListener = function(type, listener, options) {
      if (type === 'formDictionaryChanged') {
        // Replace with optimized version
        const optimizedListener = function(event) {
          // Defer non-essential UI updates
          requestAnimationFrame(() => {
            // Apply GPU acceleration for performance
            document.body.style.willChange = 'transform';
            
            // Call original listener
            listener.call(this, event);
            
            // Reset will-change to avoid memory issues
            setTimeout(() => {
              document.body.style.willChange = 'auto';
            }, 1000);
          });
        };
        
        return originalEventListener.call(this, type, optimizedListener, options);
      }
      
      return originalEventListener.call(this, type, listener, options);
    };
  });