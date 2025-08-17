/**
 * Enhanced Mobile Enhancements for Real Estate Investment Calculator
 * Specific fixes for charts not displaying properly on mobile
 */

let lastWindowWidth = window.innerWidth;
let userHasManuallyExpanded = false;

document.addEventListener('DOMContentLoaded', function() {

    fixAndroidKeyboardIssue();
    
    // Check initial state
    if (isMobile()) {
        initMobileEnhancements();
        collapseAllSectionsOnMobile();
        if (!userHasManuallyExpanded) {
            setupMobileCollapsibles();
        }
    }
    
    // Re-check on resize events (for orientation changes)
    window.removeEventListener('resize', debounce(initMobileEnhancements, 250));
    window.addEventListener('resize', debounce(handleWindowResize, 250));
    window.addEventListener('resize', function() {
        const currentWidth = window.innerWidth;
    
        // Only re-collapse if width changed (ignore keyboard-triggered resize)
        if (currentWidth !== lastWindowWidth && currentWidth < 992) {
            collapseAllSectionsOnMobile();
        }
    
        lastWindowWidth = currentWidth;
    });
    // Handle resize events
    window.addEventListener('resize', debounce(function() {
        // Only run when within mobile size
        if (window.innerWidth < 992) {
            if (!userHasManuallyExpanded) {
                setupMobileCollapsibles();
            }
        }
    }, 250));


    // Add handler for form toggle switch
    const toggleSwitch = document.getElementById('toggle-switch');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', function() {
            userHasManuallyExpanded = false;
            // Brief delay to let form change complete
            setTimeout(collapseAllSectionsOnMobile, 100);
            setTimeout(setupMobileCollapsibles, 150);
        });
    }

    // Re-run after form changes
    document.addEventListener('formDictionaryChanged', function() {
        // Wait for charts to update
        setTimeout(function() {
            if (isMobile()) {
                makeTablesScrollable();
                optimizeChartsForMobile();
                ensureChartsVisible(); // New function to check chart visibility
                fixContainerWidths(); // Add this line
                adjustEquitySummaryHeight(); 
                fixEquityContainerHeight();


            }
        }, 1000);
    });

    // Add an additional timeout to check charts are visible
    // This handles cases where charts render after initial page load
    setTimeout(function() {
        if (isMobile()) {
            ensureChartsVisible();
            fixContainerWidths(); // Add this line
            adjustEquitySummaryHeight(); 
            fixEquityContainerHeight();
            collapseAllSectionsOnMobile();        

        }
    }, 2500);
});

/**
 * Debounce function to limit frequent calls
 */
function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

/**
 * Check if currently on a mobile device (screen width < 992px)
 */
function isMobile() {
    return window.innerWidth < 992;
}

/**
 * Main function to initialize all mobile enhancements
 */
function initMobileEnhancements() {
    // Only apply these changes on mobile screens
    if (!isMobile()) {
        // If moving from mobile to desktop, restore desktop experience
        restoreDesktopExperience();
        return;
    }
    
    // Apply mobile enhancements
    fixAndroidKeyboardIssue();
    createMobileFormToggle();
    makeTablesScrollable();
    optimizeChartsForMobile();
    enhanceMobileTouchTargets();
    ensureChartsVisible(); 
    preventRecursiveResize(); 
    fixContainerWidths(); 
    adjustEquitySummaryHeight(); 
    preventScrollResets();
    debounceChartUpdates();
    freezeStateWhileScrolling();
}

/**
 * New function to specifically check that charts are visible
 * This fixes cases where charts disappear on mobile
 */
function ensureChartsVisible() {
    // Get all chart canvases
    const chartCanvases = [
        document.getElementById('barChart'),
        document.getElementById('sourcesUsesChart'),
        document.getElementById('annualCashFlowChart'),
        document.getElementById('annualDebtPaymentChart'),
        document.getElementById('debtBalanceChart')
    ];
    
    // Check each canvas
    chartCanvases.forEach(canvas => {
        if (!canvas) return;
        
        // Check if canvas is visible and has size
        const rect = canvas.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        
        if (!isVisible) {
            console.log("Fixing invisible chart:", canvas.id);
            
            // Force minimum height and width
            canvas.style.height = '350px';
            canvas.style.minHeight = '350px';
            canvas.style.width = '100%';
            canvas.style.display = 'block';
            canvas.style.visibility = 'visible';
            canvas.style.opacity = '1';
            
            // Ensure parent containers are also visible
            let parent = canvas.parentElement;
            while (parent && parent !== document.body) {
                if (parent.style) {
                    parent.style.minHeight = '350px';
                    parent.style.visibility = 'visible';
                    parent.style.display = 'block';
                }
                parent = parent.parentElement;
            }
            
            // Try to force chart redraw if Chart.js is available
            if (typeof Chart !== 'undefined') {
                const chartInstance = Chart.getChart(canvas);
                if (chartInstance) {
                    try {
                        chartInstance.resize();
                    } catch (e) {
                        console.warn("Error resizing chart:", e);
                    }
                }
            }
        }
    });
    
    // Check if the section headings are visible
    const headings = document.querySelectorAll('.subheading');
    headings.forEach(heading => {
        if (heading.textContent.includes("How You Stack Up")) {
            heading.style.display = 'block';
            heading.style.visibility = 'visible';
            heading.style.marginTop = '30px';
            heading.style.marginBottom = '20px';
        }
    });
    
    // Final check - is the "How You Stack Up" section visible?
    const marketHeading = Array.from(document.querySelectorAll('.subheading')).find(
        h => h.textContent.includes("How You Stack Up")
    );
    
    if (marketHeading) {
        // Ensure parent containers are visible
        let currentNode = marketHeading;
        let foundBarChart = false;
        
        // Look at the next few siblings to find and fix the bar chart
        for (let i = 0; i < 5; i++) {
            currentNode = currentNode.nextElementSibling;
            if (!currentNode) break;
            
            if (currentNode.id === 'barChart' || currentNode.tagName === 'CANVAS') {
                foundBarChart = true;
                currentNode.style.height = '350px';
                currentNode.style.minHeight = '350px';
                currentNode.style.display = 'block';
                currentNode.style.visibility = 'visible';
                break;
            }
        }
        
        // If we couldn't find the chart, create a fallback
        if (!foundBarChart && typeof window.financialOutputs !== 'undefined') {
            const barChartCanvas = document.getElementById('barChart');
            if (barChartCanvas && !barChartCanvas.parentNode.querySelector('.chart-fallback')) {
                createFallbackContent(barChartCanvas);
            }
        }
    }
}

/**
 * Create fallback content for a chart that fails to render
 */
function createFallbackContent(chartCanvas) {
    // Create fallback container
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'chart-fallback';
    fallbackDiv.innerHTML = `
        <div>
            <h3>Your Investment Performance</h3>
            <p>IRR: ${(window.financialOutputs?.IRR * 100 || 0).toFixed(1)}%</p>
            <p>S&P 500: 11.5%</p>
            <p>Real Estate ETF: 6.8%</p>
            <p>Bond ETF: 3.9%</p>
        </div>
    `;
    
    // Insert before the canvas
    chartCanvas.parentNode.insertBefore(fallbackDiv, chartCanvas);
    
    // Hide the original canvas since it's not rendering properly
    chartCanvas.style.display = 'none';
}

/**
 * Creates a toggle button to show/hide the form on mobile
 * With smooth animation when showing/hiding the form
 */
function createMobileFormToggle() {
    const formContainer = document.getElementById('form-container');
    const chartContainer = document.getElementById('chart-container');
    const containerWrapper = document.querySelector('.container-wrapper');
    
    if (!formContainer || !chartContainer || !containerWrapper) return;
    
    // Check if toggle already exists
    if (document.querySelector('.mobile-form-toggle')) {
        return;
    }
    
    // First, add a wrapper div at the top of the container to hold our button
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'mobile-button-wrapper';
    buttonWrapper.style.cssText = `
        width: 100%;
        margin-bottom: 15px;
        position: relative;
    `;
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Show Input Assumptions';
    toggleButton.className = 'mobile-form-toggle';
    toggleButton.style.cssText = `
        padding: 12px;
        background-color: rgba(255, 206, 86, 1);
        color: #333333; /* Dark gray text */
        border: none;
        border-radius: 4px;
        font-weight: bold;
        width: 100%;
        margin: 0;
        display: block;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: background-color 0.2s ease;
    `;
    
    // Add hover effect
    toggleButton.addEventListener('mouseover', function() {
        this.style.backgroundColor = 'rgba(245, 196, 76, 1)';
    });
    
    toggleButton.addEventListener('mouseout', function() {
        this.style.backgroundColor = 'rgba(255, 206, 86, 1)';
    });
    
    buttonWrapper.appendChild(toggleButton);
    
    // Insert the button wrapper at the very top of the container
    containerWrapper.insertBefore(buttonWrapper, containerWrapper.firstChild);
    
    // Add animation styles to the form container
    formContainer.style.transition = 'opacity 0.3s ease, max-height 0.5s ease';
    formContainer.style.overflow = 'hidden';
    
    // Initially hide the form
    formContainer.style.display = 'none';
    formContainer.style.opacity = '0';
    formContainer.style.maxHeight = '0';
    
    // Toggle functionality with animation
    toggleButton.addEventListener('click', function() {
        if (formContainer.style.display === 'none') {
            // Show form with animation
            formContainer.style.display = 'block';
            toggleButton.textContent = 'Hide Input Assumptions';
            
            // Set a reasonable max height for animation
            formContainer.style.maxHeight = '5000px'; // Large enough for any form
            
            // Force a reflow to ensure the animation works
            void formContainer.offsetHeight;
            
            // Fade in
            formContainer.style.opacity = '1';
        } else {
            // Hide form with animation
            formContainer.style.opacity = '0';
            formContainer.style.maxHeight = '0';
            
            toggleButton.textContent = 'Show Input Assumptions';
            
            // Wait for animation to complete before setting display: none
            setTimeout(() => {
                if (formContainer.style.opacity === '0') {
                    formContainer.style.display = 'none';
                }
            }, 300); // Match this with the opacity transition duration
        }
    });
    
    // Ensure the button wrapper stays positioned at the top
    // by adding CSS to handle the mobile layout
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @media (max-width: 991px) {
            .container-wrapper {
                display: flex;
                flex-direction: column;
            }
            
            .mobile-button-wrapper {
                order: -1; /* Make sure it's always at the top */
            }
            
            #form-container {
                order: 0;
            }
            
            #chart-container {
                order: 1;
            }
        }
    `;
    document.head.appendChild(styleElement);
}


/**
 * Makes tables horizontally scrollable on mobile
 */
function makeTablesScrollable() {
    // Identify all tables that need scrolling
    const tablesToMakeScrollable = [
        // Equity summary table
        document.querySelector('#equity-summary-table-container table'),
        // Spreadsheet table
        document.querySelector('#spreadsheet-container table'),
        // Cashflow detail table
        document.querySelector('#cashflow-detail-table')
    ];
    
    // Process each table
    tablesToMakeScrollable.forEach(table => {
        if (!table) return;
        
        // Skip if already wrapped
        if (table.parentNode.classList.contains('mobile-table-scroll')) return;
        
        // Create scrollable wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-table-scroll';
        wrapper.style.cssText = `
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            width: 100%;
            margin-bottom: 15px;
            position: relative;
        `;
        
        // Wrap table
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        
        // Add fading edge indicator to show scrollability
        const fadeEdge = document.createElement('div');
        fadeEdge.className = 'mobile-table-fade-edge';
        fadeEdge.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            height: 100%;
            width: 30px;
            background: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.9));
            pointer-events: none;
        `;
        wrapper.appendChild(fadeEdge);
    });
    
    // Apply mobile layout to Sources & Uses section
    const tableContainer = document.getElementById('table-container');
    const chartsContainer = document.getElementById('charts-container');
    
    if (tableContainer && chartsContainer) {
        tableContainer.style.width = '100%';
        tableContainer.style.float = 'none';
        chartsContainer.style.width = '100%';
        chartsContainer.style.float = 'none';
        chartsContainer.style.marginTop = '20px';
    }
}

function optimizeChartsForMobile() {

    if (!isMobile()) return;

    // Wait for Chart.js to be loaded
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded yet, trying again in 500ms");
        setTimeout(optimizeChartsForMobile, 500);
        return;
    }
    
    // Fix Sources & Uses chart container first
    const sourcesUsesChart = document.getElementById('sourcesUsesChart');
    const chartsContainer = document.getElementById('charts-container');
    const sourcesUsesWrapper = document.getElementById('sourcesUsesChart-wrapper');
    
    if (sourcesUsesChart && chartsContainer) {
        // Reset any positioning that might be causing overflow
        sourcesUsesChart.style.position = 'static';
        chartsContainer.style.position = 'relative';
        chartsContainer.style.overflow = 'hidden'; // Critical: contain the chart
        
        // Set fixed dimensions with proper containment
        sourcesUsesChart.style.height = '350px';
        sourcesUsesChart.style.maxHeight = '350px';
        chartsContainer.style.height = '350px';
        chartsContainer.style.maxHeight = '350px';
        
        // Make sure the wrapper is properly sized and contained
        if (sourcesUsesWrapper) {
            sourcesUsesWrapper.style.overflow = 'hidden';
            sourcesUsesWrapper.style.width = '100%';
        }
    }
    
    // Get all chart canvases
    const chartCanvases = document.querySelectorAll('canvas');
    
    // First pass - ensure all canvases have proper height and containment
    chartCanvases.forEach(canvas => {
        // Set standard heights for all charts
        canvas.style.height = '350px';
        canvas.style.maxHeight = '350px';
        canvas.style.width = '100%';
        canvas.style.maxWidth = '100%'; // Ensure it doesn't overflow horizontally
        canvas.style.display = 'block';
        
        // Ensure the parent container properly contains the chart
        const parent = canvas.parentElement;
        if (parent && parent !== document.body) {
            parent.style.overflow = 'hidden'; // Critical fix
            parent.style.width = '100%';
            parent.style.maxWidth = '100%';
        }
    });
    
    // Second pass - optimize chart configurations
    chartCanvases.forEach(canvas => {
        // Get chart instance associated with canvas
        let chartInstance;
        
        try {
            chartInstance = Chart.getChart(canvas);
        } catch (e) {
            console.warn(`Error getting chart for ${canvas.id}:`, e);
            return;
        }
        
        if (!chartInstance) {
            // If barChart is problematic, try to recreate it
            if (canvas.id === 'barChart' && window.myChart) {
                chartInstance = window.myChart;
            } else {
                return;
            }
        }
        
        // Store original options if not already stored
        if (!chartInstance._originalOptions) {
            try {
                chartInstance._originalOptions = JSON.parse(JSON.stringify({
                    legend: chartInstance.options.plugins?.legend?.display,
                    aspectRatio: chartInstance.options.maintainAspectRatio,
                    pointRadius: chartInstance.data.datasets.map(ds => ds.pointRadius),
                    pointHoverRadius: chartInstance.data.datasets.map(ds => ds.pointHoverRadius)
                }));
            } catch (e) {
                console.warn("Error storing original chart options:", e);
            }
        }
        
        try {
            // Mobile optimizations
            
            
            // 1. Make chart stay within bounds
            chartInstance.options.maintainAspectRatio = false;
            chartInstance.options.responsive = true;
            
            // 2. Add specific canvas sizing constraints
            if (canvas.id === 'sourcesUsesChart') {
                // For Sources and Uses chart, avoid complex resizing logic
                chartInstance.options.onResize = null;
                
                // Add explicit containment for chart elements
                if (chartInstance.options.layout) {
                    chartInstance.options.layout.padding = {
                        left: 0,
                        right: 0,
                        top: 10,
                        bottom: 10
                    };
                }
            }
            
            // 3. Adjust responsive behavior
            if (!chartInstance.options.plugins) chartInstance.options.plugins = {};
            chartInstance.options.plugins.customCanvasBackgroundColor = {
                color: 'white',
            };
            
            // Update the chart to apply changes
            chartInstance.update();
        } catch (e) {
            console.warn(`Error optimizing chart ${canvas.id}:`, e);
        }
    });
    
    // Final adjustments to specific containers
    document.querySelectorAll("[id$='-wrapper']").forEach(wrapper => {
        wrapper.style.overflow = 'hidden';
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '100%';
    });
    
    // Add viewport meta tag if it doesn't exist to prevent mobile scaling issues
    if (!document.querySelector('meta[name="viewport"]')) {
        const viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewportMeta);
    }
    
    // Apply CSS fixes for chart containers
    applyMobileChartContainerFixes();
}

// New function to apply targeted CSS fixes for chart containers
function applyMobileChartContainerFixes() {

    if (!isMobile()) return;

    // Check if our style element already exists
    let styleElement = document.getElementById('mobile-chart-fixes');
    if (!styleElement) {
        // Create style element
        styleElement = document.createElement('style');
        styleElement.id = 'mobile-chart-fixes';
        document.head.appendChild(styleElement);
    }
    
    // Add CSS rules to fix chart containment issues - with mobile-specific selectors
    styleElement.textContent = `
        /* We're adding a mobile-specific selector to all rules */
        @media (max-width: 991px) {
            /* Fix chart container overflow */
            #sourcesUsesChart-wrapper, #barChart-wrapper, #annual-cashflow-chart-container, 
            #annual-debt-payment-container, #debt-balance-container {
                overflow: hidden !important;
                width: 100% !important;
                max-width: 100% !important;
                position: relative !important;
            }
            
            /* Chart canvas containment */
            canvas {
                max-width: 100% !important;
                width: 100% !important;
                height: 350px !important;
                max-height: 350px !important;
            }
            
            /* Fix S&U chart specifically */
            #sourcesUsesChart-wrapper {
                display: block !important;
            }
            
            #table-container, #charts-container {
                width: 100% !important;
                float: none !important;
            }
            
            #charts-container {
                margin-top: 20px !important;
                height: 350px !important;
                max-height: 350px !important;
                overflow: hidden !important;
            }
            
            /* Fix stacking context issues */
            .container-wrapper {
                overflow: hidden;
                width: 95%;
            }
        }
    `;
    
    // Force layout recalculation
    document.body.offsetHeight;
}

/**
 * Make form elements more touch-friendly on mobile
 */
function enhanceMobileTouchTargets() {
    // Apply touch-friendly styling to form elements
    const formElements = {
        // Radio buttons and labels
        radioButtons: document.querySelectorAll('input[type="radio"]'),
        radioLabels: document.querySelectorAll('.radio-group label'),
        
        // Form inputs
        textInputs: document.querySelectorAll('input[type="text"], input[type="number"]'),
        
        // Collapsible headers
        collapsibleHeaders: document.querySelectorAll('.collapsible-header'),
        
        // Toggle switch
        toggleSwitch: document.getElementById('toggle-switch')
    };
    
    // Enhance radio buttons and labels
    formElements.radioButtons.forEach(radio => {
        radio.style.transform = 'scale(1.2)';
        radio.style.margin = '0 8px 0 0';
    });
    
    formElements.radioLabels.forEach(label => {
        label.style.minHeight = '44px';
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.marginTop = '0';
        label.style.padding = '5px 0';
    });
    
    // Enhance text inputs
    formElements.textInputs.forEach(input => {
        input.style.padding = '12px';
        input.style.fontSize = '16px'; // Prevents iOS zoom
        input.style.minHeight = '44px';
    });
    
    // Enhance collapsible headers
    formElements.collapsibleHeaders.forEach(header => {
        header.style.padding = '15px 10px';
        header.style.minHeight = '44px';
    });
    
    // Adjust layout of radio groups
    document.querySelectorAll('.radio-group').forEach(group => {
        group.style.display = 'flex';
        group.style.flexWrap = 'wrap';
        group.style.gap = '12px';
    });
}

/**
 * Restore desktop experience when returning to larger screens
 */
function restoreDesktopExperience() {
    // Remove mobile form toggle if it exists
    const formToggle = document.querySelector('.mobile-form-toggle');
    if (formToggle) {
        formToggle.remove();
    }
    
    // Ensure form is visible on desktop
    const formContainer = document.getElementById('form-container');
    if (formContainer) {
        formContainer.style.display = 'block';
    }
    
    // Remove any fallback content
    document.querySelectorAll('.chart-fallback').forEach(el => el.remove());
    
    // First, reset all canvas elements completely
    document.querySelectorAll('canvas').forEach(canvas => {
        // Display visibility
        canvas.style.display = 'block';
        
        // Reset dimensions
        canvas.style.width = '100%';  // Keep this as 100%
        canvas.style.maxWidth = '';
        canvas.style.maxHeight = '';
        canvas.style.height = '';
        canvas.style.position = '';
        canvas.style.minHeight = '';
        
        // Reset other potential styles
        canvas.style.top = '';
        canvas.style.left = '';
        canvas.style.visibility = '';
        canvas.style.opacity = '';
        canvas.style.zIndex = '';
    });
    
    // Restore original chart options
    if (typeof Chart !== 'undefined') {
        document.querySelectorAll('canvas').forEach(canvas => {
            try {
                const chartInstance = Chart.getChart(canvas);
                if (!chartInstance || !chartInstance._originalOptions) return;
                
                // Restore legend display
                if (chartInstance.options.plugins && chartInstance.options.plugins.legend) {
                    chartInstance.options.plugins.legend.display = chartInstance._originalOptions.legend;
                }
                
                // Restore aspect ratio
                chartInstance.options.maintainAspectRatio = chartInstance._originalOptions.aspectRatio;
                
                // Restore point sizes for specific charts
                if (canvas.id === 'annualCashFlowChart' && chartInstance.data.datasets.length > 8) {
                    chartInstance.data.datasets.forEach((dataset, index) => {
                        if (chartInstance._originalOptions.pointRadius[index]) {
                            dataset.pointRadius = chartInstance._originalOptions.pointRadius[index];
                        }
                        if (chartInstance._originalOptions.pointHoverRadius[index]) {
                            dataset.pointHoverRadius = chartInstance._originalOptions.pointHoverRadius[index];
                        }
                    });
                }
                
                // Update chart
                chartInstance.update();
                
                // Force resize after a short delay to ensure proper rendering
                setTimeout(() => {
                    if (chartInstance && typeof chartInstance.resize === 'function') {
                        chartInstance.resize();
                    }
                }, 50);
            } catch (err) {
                console.warn(`Error restoring chart ${canvas.id}:`, err);
            }
        });
    }
    
    // Remove the mobile CSS fixes completely
    const styleElement = document.getElementById('mobile-chart-fixes');
    if (styleElement) {
        styleElement.remove();
    }

    // Reset specific chart containers
    const sourcesUsesWrapper = document.getElementById('sourcesUsesChart-wrapper');
    if (sourcesUsesWrapper) {
        sourcesUsesWrapper.style.display = 'flex';
        sourcesUsesWrapper.style.flexWrap = 'wrap';
        sourcesUsesWrapper.style.width = '100%';
        sourcesUsesWrapper.style.overflow = '';
        sourcesUsesWrapper.style.height = '';
        sourcesUsesWrapper.style.maxHeight = '';
        sourcesUsesWrapper.style.position = '';
    }

    // Restore original table container widths
    const tableContainer = document.getElementById('table-container');
    const chartsContainer = document.getElementById('charts-container');
    
    if (tableContainer && chartsContainer) {
        // Reset table container
        tableContainer.style.width = '33%';
        tableContainer.style.float = 'left';
        tableContainer.style.minHeight = '350px';
        tableContainer.style.paddingRight = '10px';
        tableContainer.style.boxSizing = 'border-box';
        tableContainer.style.overflow = '';
        tableContainer.style.height = '';
        tableContainer.style.maxHeight = '';
        
        // Reset charts container
        chartsContainer.style.width = '66%';
        chartsContainer.style.float = 'right';
        chartsContainer.style.marginTop = '0';
        chartsContainer.style.height = '350px';
        chartsContainer.style.position = 'relative';
        chartsContainer.style.maxHeight = '';
        chartsContainer.style.overflow = '';
    }
    
    // Restore the original synchronizeHeights function
    if (window.originalSynchronizeHeights) {
        window.synchronizeHeights = window.originalSynchronizeHeights;
        window.originalSynchronizeHeights = null;
        
        // Call it once to reset proper heights with error handling
        setTimeout(() => {
            if (window.synchronizeHeights && typeof window.synchronizeHeights === 'function') {
                try {
                    window.synchronizeHeights();
                } catch (e) {
                    console.warn("Error calling synchronizeHeights:", e);
                }
            }
        }, 100);
    }
    
    // One last refresh of the S&U chart to ensure proper rendering
    if (window.sourcesUsesChart && typeof window.sourcesUsesChart.resize === 'function') {
        setTimeout(() => {
            try {
                window.sourcesUsesChart.resize();
            } catch (e) {
                console.warn("Error resizing sources-uses chart:", e);
            }
        }, 150);
    }
}

function preventRecursiveResize() {
    // For Sources & Uses chart specifically
    const sourcesUsesChart = document.getElementById('sourcesUsesChart');
    const chartsContainer = document.getElementById('charts-container');
    
    if (sourcesUsesChart && chartsContainer && isMobile()) {
        // Set definitive fixed heights
        sourcesUsesChart.style.height = '350px';
        sourcesUsesChart.style.maxHeight = '400px';
        chartsContainer.style.height = '350px';
        chartsContainer.style.maxHeight = '400px';
        
        // Prevent any resize observers from triggering endless cycles
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === sourcesUsesChart || entry.target === chartsContainer) {
                    // If height exceeds max, force it back down
                    if (entry.contentRect.height > 400) {
                        entry.target.style.height = '350px';
                    }
                }
            }
        });
        
        resizeObserver.observe(sourcesUsesChart);
        resizeObserver.observe(chartsContainer);
        
        // Store the observer for cleanup
        window._chartResizeObserver = resizeObserver;
    }
}

// Add this function to handle window resize events more intelligently
function handleWindowResize() {
    const wasMobile = isMobile();
    
    // Wait a moment for resize to complete
    setTimeout(() => {
        const isMobileNow = isMobile();
        
        // If we switched modes (mobile <-> desktop)
        if (wasMobile !== isMobileNow) {
            console.log(`Switched from ${wasMobile ? 'mobile' : 'desktop'} to ${isMobileNow ? 'mobile' : 'desktop'}`);
            
            if (isMobileNow) {
                // Switched to mobile
                initMobileEnhancements();
            } else {
                // Switched to desktop
                restoreDesktopExperience();
            }
        }
    }, 100);
}

/**
 * Function to fix container widths for mobile
 * Prevents right side cutoff issues
 */
function fixContainerWidths() {
    // Fix main container wrapper
    const containerWrapper = document.querySelector('.container-wrapper');
    if (containerWrapper) {
        containerWrapper.style.maxWidth = '95%';
        containerWrapper.style.width = '95%';
        containerWrapper.style.boxSizing = 'border-box';
        containerWrapper.style.overflow = 'hidden';
        containerWrapper.style.margin = '0 auto';
    }
    
    // Fix chart blocks
    const chartBlocks = document.querySelectorAll('.chart-block');
    chartBlocks.forEach(block => {
        block.style.width = '100%';
        block.style.maxWidth = '100%';
        block.style.boxSizing = 'border-box';
        block.style.overflow = 'hidden';
        block.style.padding = '15px'; // Smaller padding on mobile
    });
    
    // Fix Sources and Uses section specifically
    const sourcesUsesWrapper = document.getElementById('sourcesUsesChart-wrapper');
    if (sourcesUsesWrapper) {
        sourcesUsesWrapper.style.width = '100%';
        sourcesUsesWrapper.style.maxWidth = '100%';
        sourcesUsesWrapper.style.boxSizing = 'border-box';
        sourcesUsesWrapper.style.overflow = 'hidden';
    }
    
    // Stack table and chart containers
    const tableContainer = document.getElementById('table-container');
    const chartsContainer = document.getElementById('charts-container');
    
    if (tableContainer) {
        tableContainer.style.width = '100%';
        tableContainer.style.float = 'none';
        tableContainer.style.margin = '0 0 15px 0';
        tableContainer.style.padding = '0';
        tableContainer.style.boxSizing = 'border-box';
        tableContainer.style.overflowX = 'auto'; // Enable horizontal scrolling if needed
    }
    
    if (chartsContainer) {
        chartsContainer.style.width = '100%';
        chartsContainer.style.float = 'none';
        chartsContainer.style.margin = '0';
        chartsContainer.style.padding = '0';
        chartsContainer.style.boxSizing = 'border-box';
        chartsContainer.style.height = '300px';
        chartsContainer.style.minHeight = '300px';
    }
    
    // Ensure currency cells don't wrap
    const currencyCells = document.querySelectorAll('.summary-table td:nth-child(2), .currency-cell');
    currencyCells.forEach(cell => {
        cell.style.whiteSpace = 'nowrap';
    });
    
    // Fix all canvases
    document.querySelectorAll('canvas').forEach(canvas => {
        canvas.style.maxWidth = '100%';
    });
}

function adjustEquitySummaryHeight() {
    const equityContainer = document.getElementById('equity-container');
    const tableSummaryContainer = document.getElementById('equity-summary-table-container');
    
    if (!equityContainer || !tableSummaryContainer) return;
    
    // Wait for the table to be fully rendered
    setTimeout(() => {
        // Get the actual table
        const table = tableSummaryContainer.querySelector('table');
        if (!table) return;
        
        // Get the table height
        const tableHeight = table.offsetHeight;
        
        // Add some padding to account for margins and headers
        const containerPadding = 50; // Adjust this value if needed
        
        // Set the container height to match the table plus some padding
        tableSummaryContainer.style.height = 'auto';
        tableSummaryContainer.style.minHeight = 'auto';
        tableSummaryContainer.style.maxHeight = 'none';
        tableSummaryContainer.style.overflow = 'visible';
        
        // Apply final height to outer container if needed
        const totalHeight = tableHeight + containerPadding;
        equityContainer.style.minHeight = totalHeight + 'px';
        
        console.log("Adjusted equity summary height to", totalHeight, "px");
    }, 300);
}

/**
 * Fix equity container height to properly fit table
 */
function fixEquityContainerHeight() {
    const equityContainer = document.getElementById('equity-container');
    const tableContainer = document.getElementById('equity-summary-table-container');
    
    if (!equityContainer || !tableContainer) return;
    
    // Get the actual table
    const table = tableContainer.querySelector('table');
    if (!table) return;
    
    // Measure the table height
    const tableHeight = table.getBoundingClientRect().height;
    
    // Add padding for header and margins
    const requiredHeight = tableHeight + 80; // 80px for header and padding
    
    // Set container heights to accommodate the table
    equityContainer.style.height = requiredHeight + 'px';
    equityContainer.style.minHeight = requiredHeight + 'px';
    tableContainer.style.height = tableHeight + 'px';
    tableContainer.style.minHeight = tableHeight + 'px';
    
    // Remove scrolling
    equityContainer.style.overflow = 'visible';
    tableContainer.style.overflow = 'visible';
    
    console.log('Fixed equity container height to', requiredHeight, 'px');
}

// Add this function to your existing code 
function collapseAllSectionsOnMobile() {
    // Only run on mobile devices
    if (window.innerWidth >= 992) return;
    
    if (userHasManuallyExpanded) return;

    console.log("Collapsing all sections for mobile view");
    
    // Get the active form (basic or advanced)
    const activeForm = document.getElementById('toggle-switch')?.checked ? 
                      document.getElementById('advanced-form') : 
                      document.getElementById('basic-form');
    
    if (!activeForm) return;
    
    // Find all collapsible checkboxes in the active form
    const collapsibles = activeForm.querySelectorAll('.collapsible input[type="checkbox"]');
    
    // Collapse all sections (uncheck all checkboxes) - with optional first section exception
    collapsibles.forEach(function(checkbox, index) {
      // Option 1: Collapse everything
      checkbox.checked = false;
      
      // Option 2: Keep first section expanded if you prefer
      // checkbox.checked = (index === 0);
      
      // Make sure the content is properly hidden
      const content = checkbox.nextElementSibling?.nextElementSibling;
      if (content) {
        content.style.display = 'none';
        content.style.height = '0';
        content.style.opacity = '0';
      }
    });
    
    // Force the container height to adjust
    const formContainer = document.getElementById('form-container');
    if (formContainer) {
      formContainer.style.height = 'auto';
    }
  }

function setupMobileCollapsibles() {
    // Only run on mobile devices
    if (window.innerWidth >= 992) return;
    
    console.log("Setting up mobile collapsible sections with proper icons");
    
    // Get the active form (basic or advanced)
    const activeForm = document.getElementById('toggle-switch')?.checked ? 
                      document.getElementById('advanced-form') : 
                      document.getElementById('basic-form');
    
    if (!activeForm) return;
    
    // Find all collapsible checkboxes in the active form
    const collapsibles = activeForm.querySelectorAll('.collapsible input[type="checkbox"]');
    
    // Store a reference to the original state
    if (!window._originalCollapsibleStates) {
        window._originalCollapsibleStates = new Map();
    }
    
    // Initially collapse all sections except those user interacted with
    collapsibles.forEach(function(checkbox, index) {
        // Store original state if not already stored
        if (!window._originalCollapsibleStates.has(checkbox)) {
            window._originalCollapsibleStates.set(checkbox, checkbox.checked);
        }
        
        // Only modify sections that aren't being interacted with
        if (!checkbox.dataset.userInteracted) {
            // Set to collapsed
            checkbox.checked = false;
            
            // Update the icon
            const header = checkbox.nextElementSibling;
            const icon = header ? header.querySelector('.collapsible-icon') : null;
            
            if (icon) {
                icon.textContent = '+';
                icon.style.fontSize = '16px';
            }
            
            // Adjust content visibility
            const content = checkbox.nextElementSibling?.nextElementSibling;
            if (content) {
                content.style.display = 'none';
                content.style.opacity = '0';
                content.style.height = '0';
            }
        } else {
            // For user-interacted checkboxes, restore from the stored state
            const storedState = checkbox.dataset.expanded === 'true';
            checkbox.checked = storedState;
            
            // Update the icon
            const header = checkbox.nextElementSibling;
            const icon = header ? header.querySelector('.collapsible-icon') : null;
            
            if (icon) {
                icon.textContent = storedState ? '-' : '+';
                icon.style.fontSize = storedState ? '24px' : '16px';
            }
            
            // Adjust content visibility
            const content = checkbox.nextElementSibling?.nextElementSibling;
            if (content) {
                content.style.display = storedState ? 'block' : 'none';
                content.style.opacity = storedState ? '1' : '0';
                content.style.height = storedState ? 'auto' : '0';
            }
        }
    });
    
    // Ensure all collapsibles have proper click handling without duplicates
    collapsibles.forEach(function(checkbox) {
        // Use a data attribute to mark if we've already added the handler
        if (!checkbox.dataset.handlerAttached) {
            // Remove any existing handlers to prevent duplicates
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            // Add proper change handler
            newCheckbox.addEventListener('change', handleCollapsibleChange);
            newCheckbox.dataset.handlerAttached = 'true';
            
            // If it was marked as user-interacted, preserve that
            if (checkbox.dataset.userInteracted) {
                newCheckbox.dataset.userInteracted = 'true';
            }
            
            // If it had an expanded state, preserve that
            if (checkbox.dataset.expanded) {
                newCheckbox.dataset.expanded = checkbox.dataset.expanded;
            }
        }
    });
}
  
function handleCollapsibleChange(event) {

    userHasManuallyExpanded = true;
    // Mark this checkbox as user-interacted
    event.target.dataset.userInteracted = 'true';
    
    // Store the expanded state in a custom attribute
    event.target.setAttribute('data-expanded', event.target.checked);
    
    // Get the header and icon elements
    const header = event.target.nextElementSibling;
    const icon = header ? header.querySelector('.collapsible-icon') : null;
    const content = header?.nextElementSibling;
    
    if (!content || !icon) return;
    
    if (event.target.checked) {
        // Expanding section
        icon.textContent = '-';
        icon.style.fontSize = '24px'; // Larger size for minus sign
        
        content.style.display = 'block';
        // Force a reflow before setting transition properties
        void content.offsetHeight;
        content.style.opacity = '1';
        content.style.height = 'auto';
    } else {
        // Collapsing section
        icon.textContent = '+';
        icon.style.fontSize = '16px'; // Smaller size for plus sign
        
        content.style.opacity = '0';
        content.style.height = '0';
        // Add a timeout to hide the element after transition
        setTimeout(() => {
            if (!event.target.checked) {
                content.style.display = 'none';
            }
        }, 300); // Match this to your transition duration
    }
}

// Add this function to your mobile-enhancements.js file
function preventScrollResets() {
// Flag to track if we're currently scrolling
let isScrolling = false;
let scrollTimeout;

// Only apply on mobile
if (!isMobile()) return;

// Capture scroll events and set a flag
window.addEventListener('scroll', function() {
    isScrolling = true;
    
    // Clear the previous timeout
    clearTimeout(scrollTimeout);
    
    // Set a timeout to reset the flag after scrolling stops
    scrollTimeout = setTimeout(function() {
    isScrolling = false;
    }, 150);
}, { passive: true });

// Modify all event handlers that might trigger during scroll
const originalAddEventListener = document.addEventListener;
document.addEventListener = function(type, listener, options) {
    if (type === 'formDictionaryChanged') {
    // Wrap the listener to check if scrolling
    const wrappedListener = function(event) {
        // Only execute the handler if we're not scrolling
        if (!isScrolling) {
        listener.call(this, event);
        }
    };
    return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// Store collapsible states to prevent reset during scrolling
preserveCollapsibleStates();
}
  
// Enhanced version of preserveCollapsibleStates function
// This should replace the existing function in your code
function preserveCollapsibleStates() {
    // Only run on mobile
    if (!isMobile()) return;
    
    console.log("Setting up enhanced collapsible state preservation");
    
    // Keep track of which sections are expanded with more details
    const collapsibleStates = new Map();
    let isPreservingState = false; // To prevent overlap with freezeStateWhileScrolling
    
    // Get all collapsible checkboxes once
    const activeForm = document.getElementById('toggle-switch')?.checked ? 
                      document.getElementById('advanced-form') : 
                      document.getElementById('basic-form');
    
    if (!activeForm) return;
    
    const collapsibles = activeForm.querySelectorAll('.collapsible input[type="checkbox"]');
    
    // Initial state capture - store more details than before
    collapsibles.forEach((checkbox, index) => {
      // Create a unique identifier key for this checkbox
      const checkboxId = checkbox.id || `checkbox-${index}`;
      
      // Store more complete information about the state
      collapsibleStates.set(checkboxId, {
        checked: checkbox.checked,
        userInteracted: checkbox.dataset.userInteracted === 'true',
        expanded: checkbox.dataset.expanded,
        header: checkbox.nextElementSibling,
        content: checkbox.nextElementSibling?.nextElementSibling,
        icon: checkbox.nextElementSibling?.querySelector('.collapsible-icon')
      });
      
      // Enhanced change handler with debouncing
      let changeTimeout;
      checkbox.addEventListener('change', function() {
        clearTimeout(changeTimeout);
        
        // Set attributes immediately
        this.dataset.userInteracted = 'true';
        this.dataset.expanded = this.checked;
        
        // Debounce the update to our state tracking
        changeTimeout = setTimeout(() => {
          // Update our state tracking
          collapsibleStates.set(checkboxId, {
            checked: checkbox.checked,
            userInteracted: true,
            expanded: checkbox.dataset.expanded,
            header: checkbox.nextElementSibling,
            content: checkbox.nextElementSibling?.nextElementSibling,
            icon: checkbox.nextElementSibling?.querySelector('.collapsible-icon')
          });
        }, 50);
      });
    });
    
    // Track scroll state with debouncing
    let isScrolling = false;
    let scrollTimeout;
    let lastScrollY = 0;
    let scrollLockThreshold = 15; // Minimum scroll distance to trigger preservation
    
    function startScrollTracking() {
      isScrolling = true;
      document.body.classList.add('preserve-state');
      
      // Don't restore while scrolling; just mark as scrolling
      if (isPreservingState) return;
      
      isPreservingState = true;
      
      // Capture current states of collapsibles - if a significant scroll
      captureCollapsibleStates();
    }
    
    function stopScrollTracking() {
      isScrolling = false;
      document.body.classList.remove('preserve-state');
      
      // Small delay to ensure we don't restore while other handlers are running
      setTimeout(() => {
        isPreservingState = false;
      }, 100);
    }
    
    // More detailed state capture
    function captureCollapsibleStates() {
      collapsibles.forEach((checkbox, index) => {
        const checkboxId = checkbox.id || `checkbox-${index}`;
        
        // Update our state tracking with latest state
        collapsibleStates.set(checkboxId, {
          checked: checkbox.checked,
          userInteracted: checkbox.dataset.userInteracted === 'true',
          expanded: checkbox.dataset.expanded,
          header: checkbox.nextElementSibling,
          content: checkbox.nextElementSibling?.nextElementSibling,
          icon: checkbox.nextElementSibling?.querySelector('.collapsible-icon')
        });
      });
    }
    
    // Apply states from our tracking
    function restoreCollapsibleStates() {
      if (!isPreservingState) return;
      
      // Apply CSS class to prevent transitions during restoration
      document.body.classList.add('no-transitions');
      
      collapsibles.forEach((checkbox, index) => {
        const checkboxId = checkbox.id || `checkbox-${index}`;
        const state = collapsibleStates.get(checkboxId);
        
        if (!state) return;
        
        // Only restore for elements that have user interaction
        if (state.userInteracted) {
          const desiredState = state.checked;
          
          // Only change if different to prevent triggering change events
          if (checkbox.checked !== desiredState) {
            // Directly set checked state
            checkbox.checked = desiredState;
            
            // Manually sync DOM to match the state
            const content = state.content;
            const icon = state.icon;
            
            if (content) {
              content.style.display = desiredState ? 'block' : 'none';
              content.style.opacity = desiredState ? '1' : '0';
              content.style.height = desiredState ? 'auto' : '0';
            }
            
            if (icon) {
              icon.textContent = desiredState ? '-' : '+';
              icon.style.fontSize = desiredState ? '24px' : '16px';
            }
          }
        }
      });
      
      // Remove transition blocking
      setTimeout(() => {
        document.body.classList.remove('no-transitions');
      }, 20);
    }
    
    // Enhanced scroll handler with distance check
    window.addEventListener('scroll', function() {
      // Calculate scroll distance
      const currentScrollY = window.scrollY;
      const scrollDistance = Math.abs(currentScrollY - lastScrollY);
      
      // Only act if scroll is significant
      if (!isScrolling && scrollDistance > scrollLockThreshold) {
        startScrollTracking();
      }
      
      // Always update lastScrollY
      lastScrollY = currentScrollY;
      
      // Clear and reset timeout on continued scrolling
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function() {
        stopScrollTracking();
        
        // Restore states after scrolling stops
        setTimeout(restoreCollapsibleStates, 50);
      }, 150);
    }, { passive: true });
    
    // Add styles to help prevent flashing
    const preserveStyles = document.createElement('style');
    preserveStyles.innerHTML = `
      .preserve-state .collapsible-content {
        transition: none !important;
      }
      
      .no-transitions * {
        transition: none !important;
        animation: none !important;
      }
    `;
    document.head.appendChild(preserveStyles);
    
    // Create mutation observer to detect DOM changes during scroll
    const observer = new MutationObserver((mutations) => {
      if (isScrolling) {
        // Check if mutations are affecting our collapsibles
        const collapsibleChanges = mutations.some(mutation => 
          mutation.target.classList?.contains('collapsible-content') ||
          (mutation.target.tagName === 'INPUT' && mutation.target.type === 'checkbox')
        );
        
        if (collapsibleChanges) {
          // If changes detected during scroll, restore immediately
          restoreCollapsibleStates();
        }
      }
    });
    
    // Start observing with a targeted approach
    observer.observe(activeForm, {
      attributes: true,
      attributeFilter: ['checked', 'style', 'class'],
      subtree: true
    });
  }
  
// Debounce chart updates during scrolling
function debounceChartUpdates() {
    if (!isMobile()) return;

    // Only update charts when scrolling stops
    let isScrolling = false;
    let scrollDebounceTimer;

    window.addEventListener('scroll', function() {
        isScrolling = true;
        
        // Clear previous timer
        clearTimeout(scrollDebounceTimer);
        
        // Set a new timer to allow updates after scrolling stops
        scrollDebounceTimer = setTimeout(function() {
        isScrolling = false;
        }, 300);
    }, { passive: true });

    // Patch Chart.js update method to debounce during scrolls
    if (typeof Chart !== 'undefined') {
        const originalUpdate = Chart.prototype.update;
        
        Chart.prototype.update = function(mode) {
        // If scrolling, delay non-essential updates
        if (isScrolling && mode !== 'none' && mode !== 'resize') {
            // Debounce regular updates during scroll
            clearTimeout(this._updateTimer);
            this._updateTimer = setTimeout(() => {
            originalUpdate.apply(this, arguments);
            }, 400);
        } else {
            // For critical updates or when not scrolling, update immediately
            return originalUpdate.apply(this, arguments);
        }
        };
    }
}

/**
 * Balanced solution for preventing collapsible state changes during scroll
 * This avoids infinite loops while still being effective
 */
function freezeStateWhileScrolling() {
    // Only apply on mobile
    if (!isMobile()) return;
    
    console.log("Setting up balanced scroll freeze");
    
    // State tracking
    let isScrolling = false;
    let scrollTimer = null;
    let collapsibleState = [];
    let preventRecursion = false; // Flag to prevent infinite loops
    let startScrollY = 0;
    let lastScrollTime = 0;
    
    // More detailed but safe state capture
    function captureState() {
      if (preventRecursion) return; // Safety check
      
      preventRecursion = true;
      collapsibleState = [];
      
      try {
        // Get the active form
        const activeForm = document.getElementById('toggle-switch')?.checked ? 
                        document.getElementById('advanced-form') : 
                        document.getElementById('basic-form');
        
        if (!activeForm) return;
        
        // Find all collapsible checkboxes and store detailed state
        const checkboxes = activeForm.querySelectorAll('.collapsible input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          const contentEl = checkbox.nextElementSibling?.nextElementSibling;
          const iconEl = checkbox.nextElementSibling?.querySelector('.collapsible-icon');
          
          collapsibleState.push({
            element: checkbox,
            checked: checkbox.checked,
            userInteracted: checkbox.dataset.userInteracted === 'true',
            expanded: checkbox.dataset.expanded,
            contentDisplay: contentEl?.style.display,
            contentOpacity: contentEl?.style.opacity,
            contentHeight: contentEl?.style.height,
            iconText: iconEl?.textContent,
            iconFontSize: iconEl?.style.fontSize
          });
        });
      } finally {
        preventRecursion = false;
      }
    }
    
    // Direct DOM manipulation for restoration
    function restoreState() {
      if (preventRecursion) return; // Safety check
      
      preventRecursion = true;
      
      try {
        // Apply a blocker class to temporarily disable all transitions
        document.body.classList.add('instant-changes');
        
        collapsibleState.forEach(item => {
          if (!document.body.contains(item.element)) return;
          
          // Check if user has interacted or if we see mismatched state
          if (item.userInteracted || item.element.checked !== item.checked) {
            // Carefully update without triggering events
            if (item.element.checked !== item.checked) {
              item.element.checked = item.checked;
            }
            
            // Manually ensure content matches
            const content = item.element.nextElementSibling?.nextElementSibling;
            if (content) {
              if (item.checked) {
                content.style.display = 'block';
                content.style.opacity = '1';
                content.style.height = 'auto';
              } else {
                content.style.display = 'none';
                content.style.opacity = '0';
                content.style.height = '0';
              }
            }
            
            // Manually ensure icon matches
            const icon = item.element.nextElementSibling?.querySelector('.collapsible-icon');
            if (icon) {
              icon.textContent = item.checked ? '-' : '+';
              icon.style.fontSize = item.checked ? '24px' : '16px';
            }
          }
        });
        
        // Remove the transition blocker class after a short delay
        setTimeout(() => {
          document.body.classList.remove('instant-changes');
        }, 50);
      } finally {
        preventRecursion = false;
      }
    }
    
    // Enhance scroll detection
    function isRealScroll(currentY) {
      const now = Date.now();
      const distance = Math.abs(currentY - startScrollY);
      const timeDelta = now - lastScrollTime;
      
      // Only trigger for "real" scrolls
      return distance > 20 || timeDelta > 300;
    }
    
    // Careful CSS that won't cause recursive updates
    const style = document.createElement('style');
    style.innerHTML = `
      /* Disable transitions during scroll */
      body.is-scrolling * {
        transition: none !important;
        animation: none !important;
      }
      
      /* Disable transitions during restoration */
      body.instant-changes * {
        transition: none !important;
        animation: none !important;
      }
      
      /* Lock the form while scrolling */
      body.is-scrolling #form-container .collapsible-content {
        pointer-events: none;
      }
      
      /* Explicitly define collapsed and expanded states to avoid confusion */
      body.is-scrolling .collapsible input[type="checkbox"]:checked + .collapsible-header + .collapsible-content {
        display: block !important;
        opacity: 1 !important;
        height: auto !important;
        overflow: hidden !important;
      }
      
      body.is-scrolling .collapsible input[type="checkbox"]:not(:checked) + .collapsible-header + .collapsible-content {
        display: none !important;
        opacity: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);
    
    // Improved scroll handler
    window.addEventListener('scroll', function() {
      const currentY = window.scrollY;
      const now = Date.now();
      
      // On scroll start
      if (!isScrolling) {
        startScrollY = currentY;
        lastScrollTime = now;
        
        // Only capture state on real scrolls (not tiny adjustments)
        if (isRealScroll(currentY)) {
          isScrolling = true;
          document.body.classList.add('is-scrolling');
          
          // Capture state safely
          captureState();
        }
      } else {
        // Already scrolling, update time
        lastScrollTime = now;
      }
      
      // Clear existing timer
      clearTimeout(scrollTimer);
      
      // Set new timer with increased delay for stability
      scrollTimer = setTimeout(function() {
        isScrolling = false;
        document.body.classList.remove('is-scrolling');
        
        // Restore state with a small delay to let events settle
        setTimeout(() => {
          restoreState();
        }, 50);
      }, 300);
    }, { passive: true });
    
    // Also add scroll protections for form dictionary events
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type, listener, options) {
      if (type === 'formDictionaryChanged') {
        // Wrap listener to prevent execution during scroll
        const wrappedListener = function(event) {
          if (!isScrolling) {
            listener.call(this, event);
          }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // One more safety measure: handle click events during scroll
    document.body.addEventListener('click', function(e) {
      if (isScrolling && e.target.closest('.collapsible-header')) {
        // Prevent clicks on collapsible headers during scroll
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  /**
 * Fix collapsible sections that close when keyboard appears on Android
 */
/**
 * Direct fix for Android keyboard collapsing sections
 * This approach completely prevents section collapse when inputs are focused
 */
function fixAndroidKeyboardIssue() {
    // Skip if not mobile
    if (!isMobile()) return;
    
    console.log("Applying Android keyboard fix");
    
    // Track active input and its section
    let activeInput = null;
    let activeSection = null;
    
    // Apply input focus handlers to ALL form inputs
    const allTextInputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    
    allTextInputs.forEach(input => {
      // When input receives focus, disable all collapse/expand behavior
      input.addEventListener('focus', function(e) {
        // Find the parent section
        activeInput = this;
        activeSection = findParentSection(this);
        
        if (activeSection) {
          // Force section to be open
          const checkbox = activeSection.querySelector('input[type="checkbox"]');
          const content = activeSection.querySelector('.collapsible-content');
          const icon = activeSection.querySelector('.collapsible-icon');
          
          if (checkbox && !checkbox.checked) {
            // Manually open the section
            checkbox.checked = true;
            
            if (content) {
              content.style.display = 'block';
              content.style.opacity = '1';
              content.style.height = 'auto';
            }
            
            if (icon) {
              icon.textContent = '-';
              icon.style.fontSize = '24px';
            }
            
            // Prevent any automatic collapse
            userHasManuallyExpanded = true;
            checkbox.dataset.keyboardLocked = 'true';
          }
        }
      }, true);
      
      // When focus is lost, restore normal behavior
      input.addEventListener('blur', function() {
        setTimeout(() => {
          // Only reset if moving to a non-input element
          if (!document.activeElement || 
              !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            activeInput = null;
            activeSection = null;
          }
        }, 100);
      }, true);
    });
    
    // Helper to find parent collapsible section
    function findParentSection(element) {
      let current = element;
      // Walk up the DOM tree
      while (current && !current.classList.contains('collapsible')) {
        current = current.parentElement;
      }
      return current;
    }
    
    // CRITICAL: Block resize events that happen during input focus
    const originalResize = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'resize') {
        // Wrap resize listeners to check for keyboard
        const wrappedListener = function(event) {
          // If we have an active input, this is probably a keyboard
          if (activeInput && document.activeElement === activeInput) {
            // Skip resize handler completely
            return;
          }
          
          // Also check for height-only changes (keyboard indicator)
          const heightChange = Math.abs(window.innerHeight - lastKeyboardHeight);
          if (heightChange > 100 && window.innerWidth === lastWindowWidth) {
            // Skip any resize that's likely from keyboard
            return;
          }
          
          // Otherwise, proceed with original handler
          listener.call(this, event);
        };
        
        return originalResize.call(this, type, wrappedListener, options);
      }
      
      return originalResize.call(this, type, listener, options);
    };
    
    // Disable the automatic collapse logic completely while an input has focus
    const originalHandleWindowResize = handleWindowResize;
    handleWindowResize = function() {
      // Skip if we have an active input with focus
      if (activeInput && document.activeElement === activeInput) {
        return;
      }
      
      // Otherwise run the original function
      originalHandleWindowResize.apply(this, arguments);
    };
  }