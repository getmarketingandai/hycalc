document.addEventListener('DOMContentLoaded', function() {

    function isMobile() {
        return window.innerWidth < 768; // Common breakpoint for mobile devices
    }

    // Check if the canvas element exists
    const annualCashFlowCanvas = document.getElementById('annualCashFlowChart');
    if (!annualCashFlowCanvas) {
        console.error("Cannot find #annualCashFlowChart canvas element");
        return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error("Chart.js not loaded yet!");
        return;
    }
    
    // Check if there's already a Chart instance attached to this canvas
    const existingChart = Chart.getChart(annualCashFlowCanvas);
    if (existingChart) {
        console.log("Destroying existing annual cash flow chart instance");
        existingChart.destroy();
    }
    

	// Function to calculate responsive sizes based on canvas width and year count
	function getResponsiveSizes() {



		const canvas = document.getElementById('annualCashFlowChart');
		if (!canvas) return { pointRadius: 16, fontSize: 11 }; // Default values

		const canvasWidth = canvas.offsetWidth;

		// Get the number of years from the chart data or form dictionary
		let yearCount = 20; // Default
		if (window.annualCashFlowChart && 
			window.annualCashFlowChart.data && 
			window.annualCashFlowChart.data.labels) {
			yearCount = window.annualCashFlowChart.data.labels.length;
		} else if (window.formDictionary) {
			yearCount = window.formDictionary['investment-years'] || 
					   window.formDictionary['investment-years-advanced'] || 20;
		}

		// Calculate sizes based on canvas width and year count
		let pointRadius, fontSize;

		// First determine base sizes based on canvas width
		let basePointRadius, baseFontSize;
		if (canvasWidth < 400) {
			basePointRadius = 12;
			baseFontSize = 11;
		} else if (canvasWidth < 600) {
			basePointRadius = 14;
			baseFontSize = 12;
		} else if (canvasWidth < 800) {
			basePointRadius = 16;
			baseFontSize = 13;
		} else {
			basePointRadius = 18;
			baseFontSize = 14;
		}
        const mobile = isMobile();

        if (mobile) {
            // Smaller sizes for mobile devices
            basePointRadius = basePointRadius * 0.4; // Make circles 40% of original size on mobile
        }

		// Then adjust based on year count
		if (yearCount <= 5) {
			// Few years - can make everything larger
			pointRadius = basePointRadius * 1.3;
			fontSize = baseFontSize * 1.2;
		} else if (yearCount <= 10) {
			// Moderate number of years
			pointRadius = basePointRadius * 1.15;
			fontSize = baseFontSize * 1.1;
		} else if (yearCount <= 15) {
			// Standard case
			pointRadius = basePointRadius;
			fontSize = baseFontSize;
		} else if (yearCount <= 25) {
			// Many years - reduce sizes slightly
			pointRadius = basePointRadius * 0.9;
			fontSize = baseFontSize * 0.9;
		} else {
			// Very many years - reduce sizes more
			pointRadius = basePointRadius * 0.75;
			fontSize = baseFontSize * 0.75;
		}


		return { pointRadius, fontSize };
	}

    // Get responsive sizes
    const { pointRadius, fontSize } = getResponsiveSizes();

    
    // Custom plugin to draw values inside the data points
    const dataPointLabelsPlugin = {
        id: 'dataPointLabels',
        afterDatasetsDraw: (chart) => {

            if (isMobile()) return;

            const ctx = chart.ctx;
            
            // Get net cash flow dataset (should be the last dataset - index 8)
            const netCashFlowDataset = chart.data.datasets[8];
            if (!netCashFlowDataset || netCashFlowDataset.type !== 'line') return;
            
            // Access the meta data to get point positions
            const meta = chart.getDatasetMeta(8);
            
            // Set text styling with responsive font size
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000000';
            
            // Draw value inside each point
            meta.data.forEach((point, index) => {
                const value = netCashFlowDataset.data[index];
                
                // Format the value in abbreviated k format
                let formattedValue;
                if (Math.abs(value) >= 1000000) {
                    formattedValue = '$' + (value / 1000000).toFixed(1) + 'M';
                } else if (Math.abs(value) >= 1000) {
                    formattedValue = '$' + (value / 1000).toFixed(0) + 'k';
                } else {
                    formattedValue = '$' + value.toFixed(0);
                }
                
                // If negative, add minus sign
                if (value < 0) {
                    formattedValue = '-' + formattedValue.replace('-', '');
                }
                
                // Draw the text inside the point
                ctx.fillText(formattedValue, point.x, point.y);
            });
        }
    };
    
    // Custom plugin to specifically prevent tooltips on the Net Cash Flow dataset
    const tooltipBlockerPlugin = {
        id: 'tooltipBlocker',
        beforeTooltip: (chart, args) => {
            if (!args.tooltip || !args.tooltip.dataPoints) return;
            
            // If ALL tooltip points are from dataset 8 (Net Cash Flow), hide the tooltip
            const allNetCashFlow = args.tooltip.dataPoints.every(p => p.datasetIndex === 8);
            if (allNetCashFlow) {
                args.tooltip.opacity = 0;
                args.tooltip.width = 0;
                args.tooltip.height = 0;
                args.tooltip.caretX = -1000; // Move off-screen
                args.tooltip.caretY = -1000;
            }
        }
    };
    
    // Initial empty data structure
    const data = {
        labels: [],
        datasets: [
            // Expenses first (bottom of stack)
            {
                label: 'Insurance',
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                stack: 'stack0',
                order: 8, // Higher order means rendered first (bottom of stack)
                data: []
            },
            {
                label: 'Property Tax',
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
                stack: 'stack0',
                order: 7,
                data: []
            },
            {
                label: 'HOA',
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                stack: 'stack0',
                order: 6,
                data: []
            },
            {
                label: 'Maintenance',
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                stack: 'stack0',
                order: 5,
                data: []
            },
            {
                label: 'Management Fee',
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
                stack: 'stack0',
                order: 4,
                data: []
            },
            {
                label: 'Interest Expense',
                backgroundColor: 'rgba(199, 199, 199, 0.6)',
                borderColor: 'rgba(199, 199, 199, 1)',
                borderWidth: 1,
                stack: 'stack0',
                order: 3,
                data: []
            },
            {
                label: 'Principal Payments',
                backgroundColor: 'rgba(120, 120, 120, 0.6)',
                borderColor: 'rgba(120, 120, 120, 1)',
                borderWidth: 1,
                stack: 'stack0',
                order: 2,
                data: []
            },
            // Revenue last (top of stack)
            {
                label: 'Revenue',
                backgroundColor: 'rgba(122, 223, 187, 0.6)',
                borderColor: 'rgba(122, 223, 187, 1)',
                borderWidth: 1,
                stack: 'stack0',
                order: 1, // Lower order means rendered last (top of stack)
                data: []
            },
            // Line chart for net cash flow
            {
                label: 'Net Cash Flow',
                type: 'line',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderColor: 'rgba(0, 0, 0, 1)',
                borderWidth: 3,
                pointBackgroundColor: 'white',
                pointBorderColor: 'black',
                pointBorderWidth: 2,
                // 20% smaller point radius - applied to the responsive size
                pointRadius: pointRadius * 0.8,
                pointHoverRadius: (pointRadius * 0.8) + 2, // Slightly larger on hover
                tension: 0.1,
                stack: 'stack1',
                order: 0, // Ensure line is drawn on top
                data: []
            }
        ]
    };

    // Chart configuration - modified to handle tooltips differently
    const options = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            title: {
                display: false,
                text: 'Annual Cash Flow Breakdown',
                font: {
                    size: 18
                }
            },
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    title: function(tooltipItems) {
                        return 'Year ' + tooltipItems[0].label;
                    },
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        let value = context.raw;
                        
                        // Format the value as currency
                        let formattedValue = new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(value);
                        
                        // For expenses (negative values), show the absolute value with an expense indicator
                        if (value < 0 && context.dataset.type !== 'line') {
                            formattedValue = formattedValue.replace('-', '') + ' (expense)';
                        }
                        
                        return label + formattedValue;
                    }
                },
                // Use nearest mode for smooth tooltip tracking
                position: 'nearest',
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Year',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                grid: {
                    display: false
                }
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Annual Amount ($)',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                ticks: {
                    callback: function(value) {
                        return new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(value);
                    }
                },
                // Ensure we have enough space for negative values
                suggestedMin: function(context) {
                    // Dynamic calculation based on data
                    const values = context.chart.data.datasets.flatMap(dataset => dataset.data);
                    const minValue = Math.min(...values.filter(v => typeof v === 'number'));
                    return minValue * 1.1; // 10% more space for readability
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        // Handle window resize
        onResize: function(chart, size) {
            // Update point sizes based on new canvas size
            const { pointRadius, fontSize } = getResponsiveSizes();
            
            // Update the point radius for the net cash flow dataset
            chart.data.datasets[8].pointRadius = pointRadius * 0.8;
            chart.data.datasets[8].pointHoverRadius = (pointRadius * 0.8) + 2;
            
            // The font size will be used by the dataPointLabelsPlugin on the next render
            chart.update();
        },
        // Special handling for tooltip interaction events - THIS IS THE KEY CHANGE
        onHover: (event, chartElements, chart) => {
            // Check if the hovered element is from the Net Cash Flow dataset
            if (chartElements.length > 0 && chartElements[0].datasetIndex === 8) {
                // For Net Cash Flow points, disable the tooltip
                chart.tooltip.setActiveElements([], { x: 0, y: 0 });
                chart.tooltip._active = [];
                chart.tooltip._model = {};
                chart.getDatasetMeta(8).controller._active = [];
            }
        }
    };

    // Create the chart
    const annualCashFlowChart = new Chart(annualCashFlowCanvas, {
        type: 'bar',
        data: data,
        options: options,
        plugins: [dataPointLabelsPlugin, tooltipBlockerPlugin]
    });

    // Make the chart globally accessible
    window.annualCashFlowChart = annualCashFlowChart;

    // Function to update the chart with new data
    window.updateAnnualCashFlowChart = function(outputs) {
        if (!outputs) return;
        
        // Extract monthly data
        const monthlyRevenue = outputs['Raw Revenue'] || outputs['Revenue'] || [];
        const monthlyInsurance = outputs['Insurance'] || [];
        const monthlyPropertyTax = outputs['Property Tax'] || [];
        const monthlyHOA = outputs['HOA'] || [];
        const monthlyMaintenance = outputs['Maintenance'] || [];
        const monthlyManagementFee = outputs['Management Fee'] || [];
        
        // Get debt service components
        const imInterest = outputs['IM Interest'] || [];
        const helInterest = outputs['HEL Interest'] || [];
        const rmInterest = outputs['RM Interest'] || [];
        
        const imPrincipal = outputs['IM Principal'] || [];
        const helPrincipal = outputs['HEL Principal'] || [];
        const rmPrincipal = outputs['RM Principal'] || [];
        
        // Combine interest and principal from all debt sources
        const totalInterest = imInterest.map((val, idx) => val + (helInterest[idx] || 0) + (rmInterest[idx] || 0));
        const totalPrincipal = imPrincipal.map((val, idx) => val + (helPrincipal[idx] || 0) + (rmPrincipal[idx] || 0));
        
        // Calculate total monthly cash flow (revenue - expenses - debt service)
        const leveredCF = outputs['Levered FCF'] || [];
        
        // Number of investment years
        const investmentYears = window.formDictionary['investment-years'] || 
                               window.formDictionary['investment-years-advanced'] || 20;
        
        // Convert monthly data to annual
        const yearlyData = aggregateMonthlyToYearly({
            revenue: monthlyRevenue,
            insurance: monthlyInsurance,
            propertyTax: monthlyPropertyTax,
            hoa: monthlyHOA,
            maintenance: monthlyMaintenance,
            managementFee: monthlyManagementFee,
            interest: totalInterest,
            principal: totalPrincipal,
            netCashFlow: leveredCF
        }, investmentYears);
        
        // Update each dataset based on our new order (expenses first, revenue last)
        // Dataset 0: Insurance
        annualCashFlowChart.data.datasets[0].data = yearlyData.insurance.map(val => -Math.abs(val));
        
        // Dataset 1: Property Tax
        annualCashFlowChart.data.datasets[1].data = yearlyData.propertyTax.map(val => -Math.abs(val));
        
        // Dataset 2: HOA
        annualCashFlowChart.data.datasets[2].data = yearlyData.hoa.map(val => -Math.abs(val));
        
        // Dataset 3: Maintenance
        annualCashFlowChart.data.datasets[3].data = yearlyData.maintenance.map(val => -Math.abs(val));
        
        // Dataset 4: Management Fee
        annualCashFlowChart.data.datasets[4].data = yearlyData.managementFee.map(val => -Math.abs(val));
        
        // Dataset 5: Interest Expense
        annualCashFlowChart.data.datasets[5].data = yearlyData.interest.map(val => -Math.abs(val));
        
        // Dataset 6: Principal Payments
        annualCashFlowChart.data.datasets[6].data = yearlyData.principal.map(val => -Math.abs(val));
        
        // Dataset 7: Revenue (now last in the stack)
        annualCashFlowChart.data.datasets[7].data = yearlyData.revenue;
        
        // Dataset 8: Net Cash Flow (line chart)
        annualCashFlowChart.data.datasets[8].data = yearlyData.netCashFlow;
        
        // Update labels
        annualCashFlowChart.data.labels = yearlyData.labels;
        
		// Update point sizes based on the number of years
		const { pointRadius, fontSize } = getResponsiveSizes();
		annualCashFlowChart.data.datasets[8].pointRadius = pointRadius * 0.8; // Apply 20% reduction
		annualCashFlowChart.data.datasets[8].pointHoverRadius = (pointRadius * 0.8) + 2;
		
        // Update chart
        annualCashFlowChart.update();
		
    };
    
    // Function to aggregate monthly data to yearly
    function aggregateMonthlyToYearly(monthlyData, years) {
        const yearlyData = {
            labels: Array.from({length: years}, (_, i) => `${i + 1}`),
            revenue: [],
            insurance: [],
            propertyTax: [],
            hoa: [],
            maintenance: [],
            managementFee: [],
            interest: [],
            principal: [],
            netCashFlow: []
        };
        
        // Sum monthly values into yearly totals
        for (let year = 0; year < years; year++) {
            let startMonth, endMonth;
            
            if (year === 0) {
                // For first year, start from month 1 (skip month 0)
                startMonth = 1;
                endMonth = 13; // End at month 13 (exclusive)
            } else {
                // For other years, use standard 12-month window
                startMonth = year * 12 + 1; 
                endMonth = startMonth + 12;
            }
            
            // Ensure we don't go beyond array bounds
            endMonth = Math.min(endMonth, monthlyData.revenue.length);
            startMonth = Math.min(startMonth, monthlyData.revenue.length - 1);
            
            // Revenue should be positive
            yearlyData.revenue.push(sumArraySlice(monthlyData.revenue, startMonth, endMonth));
            
            // Expenses - ensure we're maintaining the actual signs in the raw data
            yearlyData.insurance.push(Math.abs(sumArraySlice(monthlyData.insurance, startMonth, endMonth)));
            yearlyData.propertyTax.push(Math.abs(sumArraySlice(monthlyData.propertyTax, startMonth, endMonth)));
            yearlyData.hoa.push(Math.abs(sumArraySlice(monthlyData.hoa, startMonth, endMonth)));
            yearlyData.maintenance.push(Math.abs(sumArraySlice(monthlyData.maintenance, startMonth, endMonth)));
            yearlyData.managementFee.push(Math.abs(sumArraySlice(monthlyData.managementFee, startMonth, endMonth)));
            
            // Debt service components
            yearlyData.interest.push(Math.abs(sumArraySlice(monthlyData.interest, startMonth, endMonth)));
            yearlyData.principal.push(Math.abs(sumArraySlice(monthlyData.principal, startMonth, endMonth)));
            
            // Net cash flow can be positive or negative
            yearlyData.netCashFlow.push(sumArraySlice(monthlyData.netCashFlow, startMonth, endMonth));
        }
        
        return yearlyData;
    }
    
    // Helper function to sum a slice of an array
    function sumArraySlice(arr, start, end) {
        return arr.slice(start, end).reduce((sum, val) => sum + val, 0);
    }
    
    // Listen for form dictionary changes to update chart
    document.addEventListener('formDictionaryChanged', function() {
        if (window.financialOutputs) {
            updateAnnualCashFlowChart(window.financialOutputs);
        }
    });
    
    // Handle window resize events to make the chart responsive
    window.addEventListener('resize', function() {
        if (annualCashFlowChart) {
            // This will trigger the onResize callback defined in the options
            annualCashFlowChart.resize();
        }
    });
    
    // Initialize with current data if available
    if (window.financialOutputs) {
        updateAnnualCashFlowChart(window.financialOutputs);
    }
});