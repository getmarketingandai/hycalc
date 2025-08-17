document.addEventListener('DOMContentLoaded', function() {
    console.log("Sources-uses-chart.js loaded");
    setTimeout(handleScreenSizeChange, 500);
    // Make sure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error("Chart.js not loaded yet!");
        return;
    }
    
    // Check if the canvas element exists
    const sourcesUsesCanvas = document.getElementById('sourcesUsesChart');
    if (!sourcesUsesCanvas) {
        console.error("Cannot find #sourcesUsesChart canvas element");
        return;
    }
    
    // Check if there's already a Chart instance attached to this canvas
    const existingChart = Chart.getChart(sourcesUsesCanvas);
    if (existingChart) {
        console.log("Destroying existing chart instance");
        existingChart.destroy();
    }
    
    // Initialize global flags for animation control
    window.pauseChartUpdates = false;
    window.isToggling = false;
    
    const ctx = sourcesUsesCanvas.getContext('2d');

    const data = {
        labels: ['Sources', 'Uses'],
        datasets: [
            { label: 'Equity', barPercentage: 0.9, backgroundColor: 'rgba(122, 223, 187, 0.6)', borderColor: 'rgba(122, 223, 187, 1)', data: [0, 0] },
            { label: 'HEL', barPercentage: 0.9, backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgba(54, 162, 235, 1)', data: [0, 0] },
            { label: 'Initial Mortgage', barPercentage: 0.9, backgroundColor: 'rgba(255, 206, 86, 0.6)', borderColor: 'rgba(255, 206, 86, 1)', data: [0, 0] },
            { label: 'Purchase Price', barPercentage: 0.9, backgroundColor: 'rgba(153, 102, 255, 0.6)', borderColor: 'rgba(153, 102, 255, 1)', data: [0, 0] },
            { label: 'Closing Costs', barPercentage: 0.9, backgroundColor: 'rgba(252, 139, 86, 0.6)', borderColor: 'rgba(252, 139, 86, 1)', data: [0, 0] },
            { label: 'Loan Fees', barPercentage: 0.9, backgroundColor: 'rgba(255, 99, 132, 0.6)', borderColor: 'rgba(255, 99, 132, 1)', data: [0, 0] }
        ]
    };

    // Track the total values
    let totalSources = 0;
    let totalUses = 0;

    const options = {
        maintainAspectRatio: false, // This is crucial for height control
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        label += '$' + (context.raw.toLocaleString ? context.raw.toLocaleString() : context.raw);
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                stacked: true,
                ticks: {
                    callback: function(value) {
                        if (value >= 1_000_000) return '$' + (value / 1_000_000) + 'm';
                        if (value >= 1_000) return '$' + (value / 1_000) + 'k';
                        return '$' + value.toLocaleString();
                    },
                    maxTicksLimit: 10,
                    precision: 0
                }
            },
            x: {
                stacked: true,
                ticks: { font: { weight: 'bold' } }
            }
        }
    };

    // Custom plugin to draw total values above each bar stack
    const totalLabelsPlugin = {
        id: 'totalLabels',
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            const sourcesTotal = chart.totalSources || 0;
            const usesTotal = chart.totalUses || 0;
            
            if (sourcesTotal === 0 && usesTotal === 0) return;
            
            // Set text styling
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            
            // Get positions
            const meta0 = chart.getDatasetMeta(0);
            const meta3 = chart.getDatasetMeta(3);
            
            if (meta0.data.length > 0 && meta3.data.length > 0) {
                // Calculate the top of each stack
                const sourcesX = meta0.data[0].x;
                const usesX = meta3.data[1].x;
                
                // Find the height of all sources stacked bars
                let sourcesYTop = Infinity;
                [0, 1, 2].forEach(datasetIndex => {
                    const barMeta = chart.getDatasetMeta(datasetIndex);
                    if (barMeta.data[0]._model && barMeta.data[0]._model.y < sourcesYTop && chart.data.datasets[datasetIndex].data[0] > 0) {
                        sourcesYTop = barMeta.data[0]._model.y;
                    } else if (barMeta.data[0] && barMeta.data[0].y < sourcesYTop && chart.data.datasets[datasetIndex].data[0] > 0) {
                        sourcesYTop = barMeta.data[0].y;
                    }
                });
                
                // Find the height of all uses stacked bars
                let usesYTop = Infinity;
                [3, 4, 5].forEach(datasetIndex => {
                    const barMeta = chart.getDatasetMeta(datasetIndex);
                    if (barMeta.data[1]._model && barMeta.data[1]._model.y < usesYTop && chart.data.datasets[datasetIndex].data[1] > 0) {
                        usesYTop = barMeta.data[1]._model.y;
                    } else if (barMeta.data[1] && barMeta.data[1].y < usesYTop && chart.data.datasets[datasetIndex].data[1] > 0) {
                        usesYTop = barMeta.data[1].y;
                    }
                });
                
                // Set some defaults if we couldn't find the top
                if (sourcesYTop === Infinity) {
                    const chartArea = chart.chartArea;
                    sourcesYTop = chartArea.top + 20;
                }
                
                if (usesYTop === Infinity) {
                    const chartArea = chart.chartArea;
                    usesYTop = chartArea.top + 20;
                }
                
                // Format the totals
                const sourcesTotalFormatted = formatCurrency(sourcesTotal);
                const usesTotalFormatted = formatCurrency(usesTotal);
                
                // Draw the total labels
                if (sourcesTotal > 0) {
                    ctx.fillText(sourcesTotalFormatted, sourcesX, sourcesYTop - 10);
                }
                
                if (usesTotal > 0) {
                    ctx.fillText(usesTotalFormatted, usesX, usesYTop - 10);
                }
            }
        }
    };

    try {
        console.log("Creating sources-uses chart");
        
        // Set initial chart height to match table height
        const tableContainer = document.getElementById('table-container');
        if (tableContainer) {
            // Set a default minimum height
            sourcesUsesCanvas.style.height = '350px';
        }
        
        let sourcesUsesChart = new Chart(ctx, { 
            type: 'bar', 
            data: data, 
            options: options,
            plugins: [totalLabelsPlugin]
        });
        console.log("Chart created successfully");
        
        // Initialize total properties
        sourcesUsesChart.totalSources = 0;
        sourcesUsesChart.totalUses = 0;
        
        // Make chart available globally
        window.sourcesUsesChart = sourcesUsesChart;

        // ✅ Animation state: track scale per dataset
        const animationState = {};
        data.datasets.forEach((dataset, datasetIndex) => {
            animationState[datasetIndex] = { currentScale: 1 };
        });

        let lastActiveDatasetIndex = null;

        // Modified updateSourcesUsesChart function to respect pause flag
        window.updateSourcesUsesChart = function(updatedDictionary) {
            // Skip updates if we're in the middle of a form toggle
            if (window.pauseChartUpdates) {
                console.log("Chart update paused during animation");
                return;
            }
            
            const sourcesAndUses = calculateSourcesAndUses(updatedDictionary);

            sourcesUsesChart.data.datasets[0].data[0] = sourcesAndUses.equity;
            sourcesUsesChart.data.datasets[1].data[0] = sourcesAndUses.hel;
            sourcesUsesChart.data.datasets[2].data[0] = sourcesAndUses.initialMortgage;
            sourcesUsesChart.data.datasets[3].data[1] = sourcesAndUses.purchasePrice;
            sourcesUsesChart.data.datasets[4].data[1] = sourcesAndUses.closingCosts;
            sourcesUsesChart.data.datasets[5].data[1] = sourcesAndUses.closingLoanCosts;
            
            // Store the totals for the plugin to use
            sourcesUsesChart.totalSources = sourcesAndUses.totalSources;
            sourcesUsesChart.totalUses = sourcesAndUses.totalUses;

            sourcesUsesChart.update();
            
            // Synchronize heights after data update
            synchronizeHeights();
        };

        function createTable(isAdvancedForm) {
            // Get the table container
            const tableContainer = document.getElementById('table-container');
            if (!tableContainer) return;
            
            // Clear previous content
            tableContainer.innerHTML = '';
            
            // Create a wrapper for mobile scrolling if needed
            const mobileWrapper = document.createElement('div');
            mobileWrapper.style.cssText = 'width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;';
            
            // Create the table
            const table = document.createElement('table');
            table.className = 'summary-table';
            
            // Add rows based on form settings
            const sourcesAndUses = calculateSourcesAndUses(window.formDictionary);
            
            // Common function to create row
            function createRow(label, value, color, isBold = false) {
                const row = document.createElement('tr');
                
                const labelCell = document.createElement('td');
                labelCell.style.textAlign = 'left';
                
                if (color) {
                    const oval = document.createElement('div');
                    oval.className = 'oval';
                    oval.textContent = label;
                    oval.style.backgroundColor = color;
                    labelCell.appendChild(oval);
                } else {
                    labelCell.textContent = label;
                }
                
                const valueCell = document.createElement('td');
                valueCell.textContent = formatCurrency(value);
                valueCell.style.textAlign = 'right';
                valueCell.style.whiteSpace = 'nowrap'; // Critical for mobile - prevents wrapping
                
                if (isBold) {
                    row.style.fontWeight = 'bold';
                    row.style.borderTop = '4px solid black';
                }
                
                row.appendChild(labelCell);
                row.appendChild(valueCell);
                return row;
            }
            
            // Create table content
            table.appendChild(createRow('Equity', sourcesAndUses.equity, 'rgba(122, 223, 187, 0.6)'));
            
            if (isAdvancedForm && sourcesAndUses.hel > 0) {
                table.appendChild(createRow('HEL', sourcesAndUses.hel, 'rgba(54, 162, 235, 0.6)'));
            }
            
            table.appendChild(createRow('Initial Mortgage', sourcesAndUses.initialMortgage, 'rgba(255, 206, 86, 0.6)'));
            table.appendChild(createRow('Total Sources', sourcesAndUses.totalSources, null, true));
            
            // Add spacing row
            const spacingRow = document.createElement('tr');
            spacingRow.innerHTML = '<td colspan="2">&nbsp;</td>';
            table.appendChild(spacingRow);
            
            table.appendChild(createRow('Purchase Price', sourcesAndUses.purchasePrice, 'rgba(153, 102, 255, 0.6)'));
            table.appendChild(createRow('Closing Costs', sourcesAndUses.closingCosts, 'rgba(252, 139, 86, 0.6)'));
            
            if (isAdvancedForm && sourcesAndUses.closingLoanCosts > 0) {
                table.appendChild(createRow('Loan Fees', sourcesAndUses.closingLoanCosts, 'rgba(255, 99, 132, 0.6)'));
            }
            
            table.appendChild(createRow('Total Uses', sourcesAndUses.totalUses, null, true));
            
            // Add table to the wrapper and the wrapper to the container
            mobileWrapper.appendChild(table);
            tableContainer.appendChild(mobileWrapper);
        }

        // Initialize the static flag
        createTable.isCreating = false;

        function handleOvalHover(label) {
            const datasetIndex = sourcesUsesChart.data.datasets.findIndex(ds => ds.label === label);
            if (datasetIndex === -1) return;

            if (lastActiveDatasetIndex !== null && lastActiveDatasetIndex !== datasetIndex) {
                resetBarSize(lastActiveDatasetIndex, 200);
            }

            lastActiveDatasetIndex = datasetIndex;

            animateBarSize(datasetIndex, 1.1, 50);
            sourcesUsesChart.update();
            enlargeOval(label);

            // ✅ Trigger tooltip properly
            const meta = sourcesUsesChart.getDatasetMeta(datasetIndex);
            const dataIndex = ['Purchase Price', 'Closing Costs', 'Loan Fees'].includes(label) ? 1 : 0;
            const element = meta.data[dataIndex];

            if (element) {
                sourcesUsesChart.tooltip.setActiveElements([{ datasetIndex, index: dataIndex }], {
                    x: element.x,
                    y: (element.y + element.base) / 2
                });
                // ✅ Ensure chart updates at the end of the frame for tooltips
                requestAnimationFrame(() => {
                    sourcesUsesChart.update();
                });
            }
        }

        function handleOvalOut(label) {
            const datasetIndex = sourcesUsesChart.data.datasets.findIndex(ds => ds.label === label);
            if (datasetIndex === -1) return;

            resetBarSize(datasetIndex, 50);
            hideTooltip();
            resetOvalSize(); // ✅ Add this to shrink the oval back
            lastActiveDatasetIndex = null;
        }

        function showTooltip(label, datasetIndex) {
            const meta = sourcesUsesChart.getDatasetMeta(datasetIndex);
            let dataIndex = ['Purchase Price', 'Closing Costs', 'Loan Fees'].includes(label) ? 1 : 0;

            const element = meta.data[dataIndex];
            if (element) {
                sourcesUsesChart.tooltip.setActiveElements([{ datasetIndex, index: dataIndex }], {
                    x: element.x,
                    y: (element.y + element.base) / 2
                });
                sourcesUsesChart.tooltip.update();
                sourcesUsesChart.draw();
            }
        }

        function hideTooltip() {
            sourcesUsesChart.tooltip.setActiveElements([], { x: 0, y: 0 });
            sourcesUsesChart.tooltip.update();
            sourcesUsesChart.draw();
        }

        // Corrected synchronizeHeights function with proper try-catch blocks
        function synchronizeHeights() {
            // Rate limit updates to avoid rapid consecutive calls
            const now = Date.now();
            if (synchronizeHeights.lastCall && (now - synchronizeHeights.lastCall < 100)) {
                return; // Skip if called too frequently
            }
            synchronizeHeights.lastCall = now;
            
            const chartCanvas = document.getElementById('sourcesUsesChart');
            const tableContainer = document.getElementById('table-container');
            const chartsContainer = document.getElementById('charts-container');
            const chartWrapper = document.getElementById('sourcesUsesChart-wrapper');
            const chartContent = document.querySelector('#sourcesUsesChart-wrapper .chart-content');
            
            if (!chartCanvas || !tableContainer || !chartsContainer) {
                console.warn("Missing elements for height synchronization");
                return;
            }
            
            // Get the actual table element inside the container
            const table = tableContainer.querySelector('table');
            if (!table) {
                console.warn("Table not found in container");
                return;
            }
            
            // Before changing heights, capture the current state
            const currentChartHeight = chartsContainer.offsetHeight;
            
            // Get the table height (forcing browser reflow to ensure accurate values)
            const tableHeight = table.offsetHeight;
            void tableContainer.offsetHeight; // Force reflow
            
            // Detect if this is a significant change in height (e.g., form toggle)
            const heightDifference = Math.abs(currentChartHeight - tableHeight);
            const isSignificantChange = heightDifference > 50;
            
            // For significant changes, use a different approach
            if (isSignificantChange && !window.isToggling) {
                // Fade out the chart first - only if not already toggling
                chartCanvas.style.opacity = '0';
                chartCanvas.style.transition = 'opacity 0.2s ease-out';
                
                // After fade out, adjust height and fade back in
                setTimeout(() => {
                    // Apply the new height to all containers
                    chartsContainer.style.height = tableHeight + 'px';
                    chartCanvas.style.height = tableHeight + 'px';
                    
                    // IMPORTANT: Also update wrapper and content heights
                    if (chartWrapper) {
                        // Set explicit min-height on the wrapper to prevent cutoff
                        chartWrapper.style.minHeight = (tableHeight + 80) + 'px'; // Add room for heading
                    }
                    
                    if (chartContent) {
                        // Ensure the content container expands
                        chartContent.style.minHeight = tableHeight + 'px';
                    }
                    
                    // Force chart resize while invisible
                    if (window.sourcesUsesChart) {
                        try {
                            window.sourcesUsesChart.resize();
                            window.sourcesUsesChart.update('none'); // Update without animation
                        } catch (e) {
                            console.error("Error resizing chart:", e);
                        }
                    }
                    
                    // Fade back in
                    setTimeout(() => {
                        chartCanvas.style.opacity = '1';
                        chartCanvas.style.transition = 'opacity 0.3s ease-in';
                    }, 50);
                }, 200);
            } else {
                // For smaller changes or during toggle, use smooth transition without fade
                chartsContainer.style.transition = 'height 0.3s ease-in-out';
                chartCanvas.style.transition = 'height 0.3s ease-in-out';
                
                chartsContainer.style.height = tableHeight + 'px';
                chartCanvas.style.height = tableHeight + 'px';
                
                // IMPORTANT: Also update wrapper and content heights
                if (chartWrapper) {
                    // Set explicit min-height on the wrapper to prevent cutoff
                    chartWrapper.style.minHeight = (tableHeight + 80) + 'px'; // Add room for heading
                }
                
                if (chartContent) {
                    // Ensure the content container expands
                    chartContent.style.minHeight = tableHeight + 'px';
                }
                
                // Resize chart with slight delay to match CSS transition
                setTimeout(() => {
                    if (window.sourcesUsesChart) {
                        try {
                            window.sourcesUsesChart.resize();
                        } catch (e) {
                            console.error("Error resizing chart:", e);
                        }
                    }
                }, 150); // Half of transition time
            }
            
            // Log the height change
            console.log(`Chart height adjusted: ${currentChartHeight}px → ${tableHeight}px (diff: ${heightDifference}px)`);
        }

        function animateBarSize(datasetIndex, targetScale = 1.1, duration = 200) {
            const dataset = sourcesUsesChart.data.datasets[datasetIndex];
            const startPercentage = dataset.barPercentage || 0.9;
            const targetPercentage = 0.9 * targetScale;
            const startTime = performance.now();

            function animate(time) {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                dataset.barPercentage = startPercentage + (targetPercentage - startPercentage) * progress;

                sourcesUsesChart.update('none');

                if (progress < 1) requestAnimationFrame(animate);
            }

            requestAnimationFrame(animate);
        }

        function resetBarSize(datasetIndex, duration = 200) {
            animateBarSize(datasetIndex, 1, duration);
        }

        function enlargeOval(label) {
            const ovals = document.querySelectorAll('#table-container .oval');
            ovals.forEach(oval => {
                if (oval.textContent.trim() === label) {
                    oval.style.transform = 'scale(1.2)';
                }
            });
        }

        function resetOvalSize() {
            document.querySelectorAll('#table-container .oval').forEach(oval => {
                oval.style.transform = 'scale(1)';
            });
        }

        // Add chart hover interactions
        sourcesUsesCanvas.addEventListener('mousemove', function(event) {
            const points = sourcesUsesChart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
            if (points.length > 0) {
                const activePoint = points[0];
                const datasetIndex = activePoint.datasetIndex;

                if (datasetIndex !== lastActiveDatasetIndex) {
                    if (lastActiveDatasetIndex !== null) {
                        resetBarSize(lastActiveDatasetIndex, 200);
                    }

                    const label = sourcesUsesChart.data.datasets[datasetIndex].label;

                    resetOvalSize();
                    enlargeOval(label);
                    animateBarSize(datasetIndex, 1.1, 200);

                    lastActiveDatasetIndex = datasetIndex;
                }
            }
        });

        sourcesUsesCanvas.addEventListener('mouseout', function() {
            resetOvalSize();

            if (lastActiveDatasetIndex !== null) {
                resetBarSize(lastActiveDatasetIndex, 200);
                lastActiveDatasetIndex = null;
            }

            hideTooltip();
        });

        // Setup event listeners
        document.addEventListener('formDictionaryChanged', function(event) {
            if (typeof event.detail === 'object' && event.detail !== null) {
                updateSourcesUsesChart(event.detail);
                createTable(document.getElementById('toggle-switch')?.checked || false);
                // Height sync happens inside createTable now
            }
        });

        const toggleSwitch = document.getElementById('toggle-switch');
        // Enhanced toggle switch handler to improve animations
        if (toggleSwitch) {
            toggleSwitch.addEventListener('change', function() {
                // Prevent rapid multiple toggles
                if (window.isToggling) {
                    console.log("Toggle already in progress, ignoring");
                    return;
                }
                
                // Set toggle flag
                window.isToggling = true;
                
                // Temporarily disable chart updates during form toggle
                window.pauseChartUpdates = true;
                
                // Get all the elements we need to animate
                const chartCanvas = document.getElementById('sourcesUsesChart');
                const chartsContainer = document.getElementById('charts-container');
                const tableContainer = document.getElementById('table-container');
                const chartWrapper = document.getElementById('sourcesUsesChart-wrapper');
                
                // Phase 1: Fade out both table and chart simultaneously
                if (chartCanvas) {
                    chartCanvas.style.opacity = '0';
                    chartCanvas.style.transition = 'opacity 0.25s ease-out';
                }
                
                // Get existing table wrapper
                const tableWrapper = tableContainer.querySelector('.table-wrapper');
                if (tableWrapper) {
                    tableWrapper.style.opacity = '0';
                    tableWrapper.style.transition = 'opacity 0.25s ease-out';
                }
                
                // Phase 2: After fade out, create new table and prepare chart
                setTimeout(() => {
                    // Create the new table (but our enhanced version will keep it invisible initially)
                    createTable(this.checked);
                    
                    // Phase 3: After table is created, coordinate the fade-in
                    setTimeout(() => {
                        // Allow chart updates again
                        window.pauseChartUpdates = false;
                        
                        // Synchronize heights
                        synchronizeHeights();
                        
                        // Phase 4: Fade everything back in
                        setTimeout(() => {
                            // Fade in the chart
                            if (chartCanvas) {
                                chartCanvas.style.opacity = '1';
                                chartCanvas.style.transition = 'opacity 0.4s ease-in';
                            }
                            
                            // New table wrapper will already have its own fade-in animation
                            
                            // Clear toggle flag after animation completes
                            setTimeout(() => {
                                window.isToggling = false;
                            }, 400);
                        }, 100);
                    }, 200);
                }, 250);
            });
        }

        // Add window resize listener to maintain consistent heights
        window.addEventListener('resize', debounce(synchronizeHeights, 250));

        // Initialize chart with current data
        if (window.formDictionary) {
            updateSourcesUsesChart(window.formDictionary);
        }
        
        createTable(toggleSwitch?.checked || false);
        
        // Initial height sync after a slight delay to ensure rendering is complete
        setTimeout(synchronizeHeights, 250);
        
        // Force resize
        function forceContainerResize() {
            const chartWrapper = document.getElementById('sourcesUsesChart-wrapper');
            const chartContent = document.querySelector('#sourcesUsesChart-wrapper .chart-content');
            const tableContainer = document.getElementById('table-container');
            const chartsContainer = document.getElementById('charts-container');
            const chartCanvas = document.getElementById('sourcesUsesChart');
            
            if (!chartWrapper || !tableContainer || !chartsContainer || !chartCanvas) return;
            
            // Get the table element
            const table = tableContainer.querySelector('table');
            if (!table) return;
            
            // Get table height
            const tableHeight = table.offsetHeight;
            
            // Force explicit heights on all containers
            chartWrapper.style.minHeight = (tableHeight + 80) + 'px';
            if (chartContent) chartContent.style.minHeight = tableHeight + 'px';
            chartsContainer.style.height = tableHeight + 'px';
            chartCanvas.style.height = tableHeight + 'px';
            
            // Force chart resize
            if (window.sourcesUsesChart) {
                try {
                    window.sourcesUsesChart.resize();
                    window.sourcesUsesChart.update();
                } catch (e) {
                    console.error("Error in force resize:", e);
                }
            }
            
            console.log("Forced container resize - tableHeight:", tableHeight);
        }
        
        // Add an initial call to ensure proper sizing
        setTimeout(forceContainerResize, 1000);
        
    } catch (error) {
        console.error("Error creating sources-uses chart:", error);
    }
});

// Utility for debouncing resize events
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Utility
function formatCurrency(value) {
    if (typeof value !== 'number') return value;
    return '$' + value.toLocaleString('en-US');
}

function handleScreenSizeChange() {
    const windowWidth = window.innerWidth;
    const container = document.getElementById('sourcesUsesChart-wrapper');
    const tableContainer = document.getElementById('table-container');
    const chartsContainer = document.getElementById('charts-container');
    
    if (!container || !tableContainer || !chartsContainer) return;
    
    // On mobile screens
    if (windowWidth < 768) {
        // Stack table and chart
        tableContainer.style.width = '100%';
        tableContainer.style.float = 'none';
        tableContainer.style.overflow = 'auto';
        
        chartsContainer.style.width = '100%';
        chartsContainer.style.float = 'none';
        chartsContainer.style.marginTop = '20px';
        chartsContainer.style.height = '300px';
        
        // Add horizontal scroll to table if needed
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.WebkitOverflowScrolling = 'touch';
    } else {
        // Desktop layout
        tableContainer.style.width = '33%';
        tableContainer.style.float = 'left';
        
        chartsContainer.style.width = '66%';
        chartsContainer.style.float = 'right';
        
        // Remove scrolling from table
        tableContainer.style.overflowX = '';
    }
    
    // Force chart resize - completely safe version
    if (window.sourcesUsesChart) {
        try {
            // Option 1: Try resize method first
            if (typeof window.sourcesUsesChart.resize === 'function') {
                window.sourcesUsesChart.resize();
            } 
            // Option 2: Try update method
            else if (typeof window.sourcesUsesChart.update === 'function') {
                window.sourcesUsesChart.update();
            }
            // Option 3: Force canvas redraw
            else {
                // Get the canvas element
                const canvas = document.getElementById('sourcesUsesChart');
                if (canvas) {
                    // Force redraw by toggling display
                    const currentDisplay = canvas.style.display;
                    canvas.style.display = 'none';
                    // Force browser to process the display change
                    void canvas.offsetHeight; 
                    // Restore display
                    canvas.style.display = currentDisplay;
                }
            }
        } catch (e) {
            console.warn("Chart resize/update failed:", e);
            
            // Ultimate fallback - recreate chart instance if nothing else works
            // This is a last resort since it will reset animations
            try {
                if (document.getElementById('sourcesUsesChart')) {
                    // Don't try to recreate - just ignore
                    console.log("Would normally recreate chart here, but skipping to avoid disruption");
                }
            } catch (err) {
                console.error("Chart recovery failed:", err);
            }
        }
    }
    
    // Re-sync heights
    if (typeof synchronizeHeights === 'function') {
        synchronizeHeights();
    }
}

// Add resize listener
window.addEventListener('resize', function() {
    handleScreenSizeChange();
});
