// Debt Payment Component Chart
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Chart using the existing canvas element
    initDebtPaymentChart();
    
    // Listen for form changes
    document.addEventListener('formDictionaryChanged', function(event) {
        if (window.financialOutputs) {
            updateDebtPaymentChart();
        }
    });
    
    // Listen for toggle switch changes
    const toggleSwitch = document.getElementById('toggle-switch');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', function() {
            setTimeout(() => {
                if (window.financialOutputs) {
                    updateDebtPaymentChart();
                }
            }, 500);
        });
    }
});

// Function to initialize the debt payment chart
function initDebtPaymentChart() {
    const ctx = document.getElementById('annualDebtPaymentChart');
    if (!ctx) {
        console.error("Debt payment chart canvas not found");
        return;
    }
    
    // Create empty chart with 9 possible series (3 for each debt tranche)
    window.debtPaymentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Will be filled with years
            datasets: [
                // Initial Mortgage datasets (bottom)
                {
                    label: 'Initial Mortgage Principal',
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    stack: 'Stack 0',
                    order: 1, 
                    data: []
                },
                {
                    label: 'Initial Mortgage Interest',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    stack: 'Stack 0',
                    order: 1,
                    data: []
                },
                {
                    label: 'Initial Mortgage Extra Payments',
                    backgroundColor: 'rgba(255, 99, 132, 0.3)',
                    stack: 'Stack 0',
                    order: 1,
                    data: []
                },
                
                // Refinanced Mortgage datasets (middle)
                {
                    label: 'Refinanced Mortgage Principal',
                    backgroundColor: 'rgba(153, 102, 255, 0.8)',
                    stack: 'Stack 0',
                    order: 2,
                    data: []
                },
                {
                    label: 'Refinanced Mortgage Interest',
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    stack: 'Stack 0',
                    order: 2,
                    data: []
                },
                {
                    label: 'Refinanced Mortgage Extra Payments',
                    backgroundColor: 'rgba(153, 102, 255, 0.3)',
                    stack: 'Stack 0',
                    order: 2,
                    data: []
                },
                
                // Home Equity Loan datasets (top)
                {
                    label: 'Home Equity Loan Principal',
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    stack: 'Stack 0',
                    order: 3, 
                    data: []
                },
                {
                    label: 'Home Equity Loan Interest',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)', 
                    stack: 'Stack 0',
                    order: 3,
                    data: []
                },
                {
                    label: 'Home Equity Loan Extra Payments',
                    backgroundColor: 'rgba(54, 162, 235, 0.3)',
                    stack: 'Stack 0',
                    order: 3,
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false, // No need for title since it's in the HTML
                    text: 'Annual Debt Payment Components'
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10,
                        filter: function(legendItem, data) {
                            // Only show datasets that aren't hidden
                            return !data.datasets[legendItem.datasetIndex].hidden;
                        }
                    }
                },
                tooltip: {
                    callbacks: {
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
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Year',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        // Show just the year number
                        callback: function(value, index) {
                            return index + 1;
                        }
                    },
                    grid: {
                        display: false // Hide vertical gridlines
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0
                            }).format(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
    
    // Initial update if data already exists
    if (window.financialOutputs) {
        updateDebtPaymentChart();
    }
}

// Function to update the debt payment chart
function updateDebtPaymentChart() {
    if (!window.debtPaymentChart || !window.financialOutputs) {
        console.error("Chart or financial outputs not available");
        return;
    }
    
    const outputs = window.financialOutputs;
    const formDictionary = window.formDictionary || {};
    
    // Get investment years
    const investmentYears = formDictionary['investment-years'] || 
                           formDictionary['investment-years-advanced'] || 20;
    
    // Generate year labels
    const yearLabels = Array.from({ length: investmentYears }, (_, i) => `Year ${i+1}`);
    
    // Check which debt tranches are active
    const isAdvancedForm = document.getElementById('toggle-switch')?.checked || false;
    
    // Check radio buttons for HEL and refinance status
    const helRadioBtn = document.querySelector('input[name="use-hel"]:checked');
    const refinanceRadioBtn = document.querySelector('input[name="refinance-mortgage"]:checked');
    
    // Determine if HEL is active based on radio button or form dictionary
    const helActive = isAdvancedForm && (
        (helRadioBtn && helRadioBtn.value === 'yes') || 
        formDictionary['use-hel'] === 1
    );
    
    // Determine if refinance is active based on radio button or form dictionary
    const refinanceActive = isAdvancedForm && (
        (refinanceRadioBtn && refinanceRadioBtn.value === 'yes') || 
        formDictionary['refinance-mortgage'] === 1
    );
    
    // Check if IM extra payments are enabled
    const imExtraRadioBtn = document.querySelector('input[name="im-extra-payments"]:checked');
    const imExtraActive = isAdvancedForm && (
        (imExtraRadioBtn && imExtraRadioBtn.value === 'yes') || 
        formDictionary['im-extra-payments'] === 1
    );
    
    // Check if HEL extra payments are enabled
    const helExtraRadioBtn = document.querySelector('input[name="hel-extra-payments"]:checked');
    const helExtraActive = helActive && (
        (helExtraRadioBtn && helExtraRadioBtn.value === 'yes') || 
        formDictionary['hel-extra-payments'] === 1
    );
    
    // Check if RM extra payments are enabled
    const rmExtraRadioBtn = document.querySelector('input[name="rm-extra-payments"]:checked');
    const rmExtraActive = refinanceActive && (
        (rmExtraRadioBtn && rmExtraRadioBtn.value === 'yes') || 
        formDictionary['rm-extra-payments'] === 1
    );
    
    // Get refinance year (if applicable)
    const refinanceYear = refinanceActive ? parseInt(formDictionary['refinance-years'] || 5) : 0;
    
    // Create arrays to hold annual data for each component
    let imPrincipal = Array(investmentYears).fill(0);
    let imInterest = Array(investmentYears).fill(0);
    let imExtra = Array(investmentYears).fill(0);
    let rmPrincipal = Array(investmentYears).fill(0);
    let rmInterest = Array(investmentYears).fill(0);
    let rmExtra = Array(investmentYears).fill(0);
    let helPrincipal = Array(investmentYears).fill(0);
    let helInterest = Array(investmentYears).fill(0);
    let helExtra = Array(investmentYears).fill(0);
    
    // Function to sum monthly values for a specific year
    function sumAnnualValues(dataArray, yearIndex, skipRefinance = false) {
        // Get first and last month indices for the year (1-indexed to skip month 0)
        const startMonth = yearIndex * 12 + 1;
        const endMonth = startMonth + 12;
        
        // If refinancing occurs in this year, handle differently
        if (skipRefinance && refinanceActive && yearIndex === refinanceYear) {
            // For initial mortgage in refinance year, only count up to the refinance month
            // Refinance month is the last month of the refinance year
            const refinanceMonthIndex = (refinanceYear + 1) * 12;
            let sum = 0;
            for (let i = startMonth; i < refinanceMonthIndex; i++) {
                if (i < dataArray.length) {
                    sum += Math.abs(dataArray[i] || 0);
                }
            }
            return sum;
        }
        
        // Normal summation for all other cases
        let sum = 0;
        for (let i = startMonth; i < endMonth; i++) {
            if (i < dataArray.length) {
                sum += Math.abs(dataArray[i] || 0);
            }
        }
        return sum;
    }
    
    // Process Initial Mortgage data
    if (outputs['IM Principal'] && outputs['IM Interest']) {
        for (let year = 0; year < investmentYears; year++) {
            // Only include IM data for years before refinancing
            // For refinance year, use the special handling
            if (!refinanceActive || year < refinanceYear) {
                imPrincipal[year] = sumAnnualValues(outputs['IM Principal'], year, refinanceActive && year === refinanceYear - 1);
                imInterest[year] = sumAnnualValues(outputs['IM Interest'], year, refinanceActive && year === refinanceYear - 1);
                
                if (imExtraActive && outputs['IM Extra Payments']) {
                    imExtra[year] = sumAnnualValues(outputs['IM Extra Payments'], year, refinanceActive && year === refinanceYear - 1);
                }
            }
        }
    }
    
    // Process Refinanced Mortgage data
    if (refinanceActive && outputs['RM Principal'] && outputs['RM Interest']) {
        for (let year = 0; year < investmentYears; year++) {
            // Only include RM data from refinance year onwards
            if (year >= refinanceYear) {
                rmPrincipal[year] = sumAnnualValues(outputs['RM Principal'], year);
                rmInterest[year] = sumAnnualValues(outputs['RM Interest'], year);
                
                if (rmExtraActive && outputs['RM Extra Payments']) {
                    rmExtra[year] = sumAnnualValues(outputs['RM Extra Payments'], year);
                }
            }
        }
    }
    
    // Process Home Equity Loan data
    if (helActive && outputs['HEL Principal'] && outputs['HEL Interest']) {
        for (let year = 0; year < investmentYears; year++) {
            helPrincipal[year] = sumAnnualValues(outputs['HEL Principal'], year);
            helInterest[year] = sumAnnualValues(outputs['HEL Interest'], year);
            
            if (helExtraActive && outputs['HEL Extra Payments']) {
                helExtra[year] = sumAnnualValues(outputs['HEL Extra Payments'], year);
            }
        }
    }
    
    // Update chart data
    window.debtPaymentChart.data.labels = yearLabels;
    
    // Update datasets with the new data
    window.debtPaymentChart.data.datasets[0].data = imPrincipal;
    window.debtPaymentChart.data.datasets[1].data = imInterest;
    window.debtPaymentChart.data.datasets[2].data = imExtra;
    
    window.debtPaymentChart.data.datasets[3].data = rmPrincipal;
    window.debtPaymentChart.data.datasets[4].data = rmInterest;
    window.debtPaymentChart.data.datasets[5].data = rmExtra;
    
    window.debtPaymentChart.data.datasets[6].data = helPrincipal;
    window.debtPaymentChart.data.datasets[7].data = helInterest;
    window.debtPaymentChart.data.datasets[8].data = helExtra;
    
    // Hide datasets for inactive debt tranches or zero data
    // Initial mortgage datasets
    window.debtPaymentChart.data.datasets[0].hidden = imPrincipal.every(val => val === 0);
    window.debtPaymentChart.data.datasets[1].hidden = imInterest.every(val => val === 0);
    window.debtPaymentChart.data.datasets[2].hidden = !imExtraActive || imExtra.every(val => val === 0);
    
    // Refinanced mortgage datasets
    window.debtPaymentChart.data.datasets[3].hidden = !refinanceActive || rmPrincipal.every(val => val === 0);
    window.debtPaymentChart.data.datasets[4].hidden = !refinanceActive || rmInterest.every(val => val === 0);
    window.debtPaymentChart.data.datasets[5].hidden = !rmExtraActive || rmExtra.every(val => val === 0);
    
    // HEL datasets
    window.debtPaymentChart.data.datasets[6].hidden = !helActive || helPrincipal.every(val => val === 0);
    window.debtPaymentChart.data.datasets[7].hidden = !helActive || helInterest.every(val => val === 0);
    window.debtPaymentChart.data.datasets[8].hidden = !helExtraActive || helExtra.every(val => val === 0);
    
    // Update chart
    window.debtPaymentChart.update();
}