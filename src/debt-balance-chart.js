document.addEventListener('DOMContentLoaded', function () {
    console.log("Debt balance chart script loaded");
    
    // Get the canvas element for the debt balance chart
    const debtBalanceCanvas = document.getElementById('debtBalanceChart');
    
    if (!debtBalanceCanvas) {
        console.error("Cannot find debt balance chart canvas");
        return;
    }
    
    console.log("Debt balance canvas found");
    
    // Color scheme to match with other charts
    const colors = {
        initialMortgage: 'rgba(255, 99, 132, 0.7)', 
        homeEquityLoan: 'rgba(54, 162, 235, 0.7)',   
        refinancedMortgage: 'rgba(153, 102, 255, 0.7)' 
    };
    
    try {
        // Create datasets with initial placeholder data
        const chartDatasets = [
            {
                label: 'Initial Mortgage',
                data: [300000, 290000, 280000],
                borderColor: colors.initialMortgage,
                backgroundColor: colors.initialMortgage,
                fill: true,
                tension: 0, // No smoothing
                order: 1
            },
            {
                label: 'Refinanced Mortgage',
                data: [0, 0, 0],
                borderColor: colors.refinancedMortgage,
                backgroundColor: colors.refinancedMortgage,
                fill: true,
                tension: 0, // No smoothing
                order: 2
            },
            {
                label: 'Home Equity Loan',
                data: [50000, 45000, 40000],
                borderColor: colors.homeEquityLoan,
                backgroundColor: colors.homeEquityLoan,
                fill: true,
                tension: 0, // No smoothing
                order: 3
            }
        ];
        
        // Filter out datasets with all zeros before creating the chart
        const filteredDatasets = chartDatasets.filter(dataset => 
            !dataset.data.every(value => value === 0)
        );
        
        // Initialize chart with filtered datasets
        const debtBalanceChart = new Chart(debtBalanceCanvas, {
            type: 'line',
            data: {
                labels: ['Close', '1', '2'],
                datasets: filteredDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const label = context[0].label;
                                return label === "Close" ? "At Close" : "Year " + label;
                            },
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false // No vertical grid lines
                        },
                        title: {
                            display: true,
                            text: 'Year',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            padding: {top: 10, bottom: 0}
                        },
                        ticks: {
                            font: {
                                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                                size: 12
                            }
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        title: {
                            display: true,
                            text: 'Remaining Debt Balance ($)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            padding: {right: 10, left: 0}
                        },
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return '$' + (value / 1000000).toFixed(1) + 'M';
                                } else if (value >= 1000) {
                                    return '$' + (value / 1000).toFixed(0) + 'K';
                                }
                                return '$' + value;
                            },
                            maxTicksLimit: 8,
                            font: {
                                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                                size: 12
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0 // No smoothing
                    },
                    point: {
                        radius: 3,
                        hoverRadius: 5
                    }
                }
            }
        });
        
        console.log("Chart initially created with placeholder data");
        
        // Make the chart available globally for debugging
        window.debtBalanceChart = debtBalanceChart;
        
        // Function to update the chart with new data
        function updateDebtBalanceChart(financialOutputs) {
            console.log("Updating debt balance chart with financial outputs");
            
            if (!financialOutputs) {
                console.error('No financial outputs available');
                return;
            }
    
            try {
                // Get the debt balances from financial outputs
                const imBalance = financialOutputs['IM Balance'] || [];
                const helBalance = financialOutputs['HEL Balance'] || [];
                const rmBalance = financialOutputs['RM Balance'] || [];
                
                // Get the number of years for the investment
                const investmentYears = window.formDictionary ? 
                                      (window.formDictionary['investment-years'] || 
                                       window.formDictionary['investment-years-advanced'] || 20) : 20;
                
                // Calculate year-end balances (take December values)
                const yearLabels = [];
                const yearImBalance = [];
                const yearHelBalance = [];
                const yearRmBalance = [];
    
                // Create year labels, using "Close" for year 0
                for (let year = 0; year <= investmentYears; year++) {
                    yearLabels.push(year === 0 ? "Close" : year.toString());
                }
                
                // Extract balance data for each year
                for (let year = 0; year <= investmentYears; year++) {
                    const monthIndex = year * 12;
                    
                    // Check if we have data for this month
                    if (monthIndex < imBalance.length) {
                        yearImBalance.push(imBalance[monthIndex]);
                        yearHelBalance.push(helBalance[monthIndex]);
                        yearRmBalance.push(rmBalance[monthIndex]);
                    } else {
                        yearImBalance.push(0);
                        yearHelBalance.push(0);
                        yearRmBalance.push(0);
                    }
                }
                
                // Create new datasets with the updated data
                const updatedDatasets = [
                    {
                        label: 'Initial Mortgage',
                        data: yearImBalance,
                        borderColor: colors.initialMortgage,
                        backgroundColor: colors.initialMortgage,
                        fill: true,
                        tension: 0 // No smoothing
                    },
                    {
                        label: 'Refinanced Mortgage',
                        data: yearRmBalance,
                        borderColor: colors.refinancedMortgage,
                        backgroundColor: colors.refinancedMortgage,
                        fill: true,
                        tension: 0 // No smoothing
                    },
                    {
                        label: 'Home Equity Loan',
                        data: yearHelBalance,
                        borderColor: colors.homeEquityLoan,
                        backgroundColor: colors.homeEquityLoan,
                        fill: true,
                        tension: 0 // No smoothing
                    }
                ];
                
                // Filter out datasets where all values are 0
                const filteredDatasets = updatedDatasets.filter(dataset => 
                    !dataset.data.every(value => value === 0)
                );
                
                // Update chart labels
                debtBalanceChart.data.labels = yearLabels;
                
                // Replace datasets with filtered ones
                debtBalanceChart.data.datasets = filteredDatasets;
    
                // Update the chart
                debtBalanceChart.update();
                console.log("Chart updated successfully");
            } catch (error) {
                console.error("Error updating debt balance chart:", error);
            }
        }
    
        // Listen for form changes to update the chart
        document.addEventListener('formDictionaryChanged', function (event) {
            console.log("Form dictionary changed event detected");
            if (window.financialOutputs) {
                updateDebtBalanceChart(window.financialOutputs);
            } else {
                console.warn("No financial outputs available on form change");
            }
        });
    
        // Initial chart update if data is available
        if (window.financialOutputs) {
            console.log("Initial financial outputs available");
            updateDebtBalanceChart(window.financialOutputs);
        } else {
            console.warn("No initial financial outputs available");
        }
        
        console.log("Debt balance chart setup complete");
    } catch (error) {
        console.error("Error setting up debt balance chart:", error);
    }
});