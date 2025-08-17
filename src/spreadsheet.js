document.addEventListener('DOMContentLoaded', function () {
    // Main container for the spreadsheet
    const container = document.getElementById('spreadsheet-container');
    if (!container) {
        console.error("Cannot find #spreadsheet-container");
        return;
    }

    // Function to format currency values
    function formatCurrency(val, includeParentheses = true) {
        if (typeof val !== 'number' || isNaN(val)) return '-';
        if (val === 0) return '-';

        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        const absVal = Math.abs(val);
        const formatted = `$${formatter.format(absVal)}`;

        // For negative values, either use parentheses or a negative sign
        if (val < 0) {
            return includeParentheses ? `(${formatted})` : `-${formatted}`;
        }
        return formatted;
    }

// Enhanced getDataKey function that properly identifies the mortgage section
function getDataKey(category, categoriesArray) {
    // Direct mappings for most categories
    switch(category) {
        case 'Revenue': return 'Revenue';
        case 'Insurance': return 'Insurance';
        case 'HOA': return 'HOA';
        case 'Property Tax': return 'Property Tax';
        case 'Maintenance': return 'Maintenance';
        case 'Management Fee': return 'Management Fee';
        case 'Operating Cash Flow': return 'Operating CF';
        case 'Initial Mortgage': return ''; // Header row, no data
        case 'Home Equity Loan': return ''; // Header row, no data
        case 'Refinanced Mortgage': return ''; // Header row, no data
        case 'Total Debt Service': return 'Total Debt Service';
        case 'Levered FCF': return 'Levered FCF';
        case 'Additional Equity': return 'Additional Equity';
    }
    
    // If the categoriesArray is undefined or empty, use fallbacks
    if (!categoriesArray || categoriesArray.length === 0) {
        if (category === 'Principal') return 'IM Principal';
        if (category === 'Interest') return 'IM Interest';
        if (category === 'Extra Payments') return 'IM Extra Payments';
        return category; // Default fallback
    }
    
    // Find the current index of this category
    const currentIndex = categoriesArray.lastIndexOf(category);
    
    // If we couldn't find the category, use fallbacks
    if (currentIndex === -1) {
        if (category === 'Principal') return 'IM Principal';
        if (category === 'Interest') return 'IM Interest';
        if (category === 'Extra Payments') return 'IM Extra Payments';
        return category;
    }
    
    // Now find which section header comes before this category
    let sectionHeader = '';
    for (let i = currentIndex - 1; i >= 0; i--) {
        if (categoriesArray[i] === 'Initial Mortgage' || 
            categoriesArray[i] === 'Home Equity Loan' || 
            categoriesArray[i] === 'Refinanced Mortgage') {
            sectionHeader = categoriesArray[i];
            break;
        }
    }
    
    // Map the category to the correct data key based on its section
    if (sectionHeader === 'Initial Mortgage') {
        if (category === 'Principal') return 'IM Principal';
        if (category === 'Interest') return 'IM Interest';
        if (category === 'Extra Payments') return 'IM Extra Payments';
    } else if (sectionHeader === 'Home Equity Loan') {
        if (category === 'Principal') return 'HEL Principal';
        if (category === 'Interest') return 'HEL Interest';
        if (category === 'Extra Payments') return 'HEL Extra Payments';
    } else if (sectionHeader === 'Refinanced Mortgage') {
        if (category === 'Principal') return 'RM Principal';
        if (category === 'Interest') return 'RM Interest';
        if (category === 'Extra Payments') return 'RM Extra Payments';
    }
    
    // Fallbacks if we couldn't determine the section
    if (category === 'Principal') return 'IM Principal';
    if (category === 'Interest') return 'IM Interest';
    if (category === 'Extra Payments') return 'IM Extra Payments';
    
    // Final fallback - return the category itself
    return category;
}

    // Helper function to create a blank row
    function createBlankRow(colSpan, height = '0px') {
        const blankRow = document.createElement('tr');
        blankRow.style.height = height;
        
        // First cell in blank row
        const blankCell = document.createElement('td');
        blankCell.innerHTML = '&nbsp;';
        blankCell.style.padding = '2px';
        blankCell.style.backgroundColor = 'white';
        blankCell.style.borderBottom = '1px solid #ddd';
        blankRow.appendChild(blankCell);
        
        // Add remaining cells
        for (let i = 1; i <= colSpan; i++) {
            const cell = document.createElement('td');
            cell.innerHTML = '&nbsp;';
            cell.style.padding = '2px';
            cell.style.backgroundColor = 'white';
            cell.style.borderBottom = '1px solid #ddd';
            blankRow.appendChild(cell);
        }
        
        return blankRow;
    }


// Modified createDataRow function to handle mortgage data specifically
function createDataRow(label, dataArray, monthsToShow, options = {}) {
    const {
        isHeader = false,
        rowBgColor = '#f9f9f9',
        fontColor = 'inherit',
        isBold = true,
        showBorder = false,
        valueFormatter = formatCurrency,
        mortgageType = null,  // New parameter to explicitly set mortgage type
        outputs = null
    } = options;
    
    const row = document.createElement('tr');
    row.style.backgroundColor = rowBgColor;
    row.dataset.rowBgColor = rowBgColor;

    // Add header row class if needed
    if (isHeader) {
        row.classList.add('header-row');
    }
    
    // Label cell
    const labelCell = document.createElement('td');
    labelCell.textContent = label;
    labelCell.style.padding = '6px 8px';
    labelCell.style.fontWeight = isBold ? 'bold' : 'normal';
    labelCell.style.borderBottom = '1px solid #ddd';
    labelCell.style.position = 'sticky';
    labelCell.style.left = '0';
    labelCell.style.zIndex = '10';
    labelCell.style.backgroundColor = rowBgColor;
    
    // Add a data attribute to track the original background color
    labelCell.dataset.originalBg = rowBgColor;
    
    if (fontColor !== 'inherit') {
        labelCell.style.color = fontColor;
    }
    
    // For section headers, make the text span across the full row
    if (isHeader) {
        labelCell.style.whiteSpace = 'nowrap';
        labelCell.style.overflow = 'visible';
        labelCell.style.textOverflow = 'clip';
    }
    
    row.appendChild(labelCell);
    
    // Data cells
    for (let i = 1; i <= monthsToShow; i++) {
        const cell = document.createElement('td');
        cell.dataset.originalBg = rowBgColor; // Track original background color
        
        // Only show data for non-header rows
        if (!isHeader) {
            // Use correct data array based on mortgage type and label
            let value;
            if (mortgageType) {
                if (label === 'Principal') {
                    value = outputs[`${mortgageType} Principal`] ? outputs[`${mortgageType} Principal`][i] : undefined;
                } else if (label === 'Interest') {
                    value = outputs[`${mortgageType} Interest`] ? outputs[`${mortgageType} Interest`][i] : undefined;
                } else if (label === 'Extra Payments') {
                    value = outputs[`${mortgageType} Extra Payments`] ? outputs[`${mortgageType} Extra Payments`][i] : undefined;
                } else {
                    value = dataArray[i];
                }
            } else {
                value = dataArray[i];
            }
            
            cell.textContent = value !== undefined ? valueFormatter(value) : '-';
            
            // Color coding for positive/negative values
            if (value && value < 0) {
                cell.style.color = '#ff5555';  // Red for negative values
            } else if (value && value > 0) {
                cell.style.color = '#4caf50';  // Green for positive values
            }
            
            // Override font color if specified
            if (fontColor !== 'inherit') {
                cell.style.color = fontColor;
            }
        } else {
            // Empty cell for section headers
            cell.innerHTML = '&nbsp;';
        }
        
        cell.style.padding = '6px 8px';
        cell.style.textAlign = 'right';
        cell.style.borderBottom = '1px solid #ddd';
        row.appendChild(cell);
    }
    
    if (showBorder) {
        row.style.borderTop = '4px solid black';
    }
    
    return row;
}

    // Helper function to get filtered categories
    function getFilteredCategories() {
        const isAdvancedForm = document.getElementById('toggle-switch')?.checked || false;
        const helActive = document.querySelector('input[name="use-hel"]:checked')?.value === 'yes' || false;
        const refinanceActive = document.querySelector('input[name="refinance-mortgage"]:checked')?.value === 'yes' || false;
        
        // Always include the basic categories
        let filteredCategories = [
            'Revenue', 
            'Insurance', 
            'HOA', 
            'Property Tax', 
            'Maintenance', 
            'Management Fee',
            'Operating Cash Flow',
            'Initial Mortgage',
            'Principal', 
            'Interest'
        ];

        // Add IM Extra Payments only if it's enabled
        if (document.querySelector('input[name="im-extra-payments"]:checked')?.value === 'yes') {
            filteredCategories.push('Extra Payments');
        }
        
        // Add Home Equity Loan section if active
        if (isAdvancedForm && helActive) {
            filteredCategories = filteredCategories.concat([
                'Home Equity Loan',
                'Principal',
                'Interest',
                'Extra Payments'
            ]);
        }
        
        // Add Refinanced Mortgage section if active
        if (isAdvancedForm && refinanceActive) {
            filteredCategories = filteredCategories.concat([
                'Refinanced Mortgage',
                'Principal',
                'Interest',
                'Extra Payments'
            ]);
        }
        
        // Always add summary rows
        filteredCategories = filteredCategories.concat([
            'Total Debt Service',
            'Levered FCF',
            'Additional Equity'
        ]);
        
        return filteredCategories;
    }

function createCashflowTable(outputs) {
    if (!outputs) {
        console.error("No financial outputs available");
        return;
    }

    // Clear previous content
    container.innerHTML = '';

    // Get total months from the output data
    const months = outputs['Revenue'].length;

    // Performance optimization
    const isLargeTable = months > 100;
    if (isLargeTable) {
        console.log("Large table detected, applying optimizations");
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Function to efficiently batch table row creation
        function createTableInBatches(container, rowsToCreate, batchSize = 20) {
            let currentBatch = 0;
            
            function processNextBatch() {
                const startIndex = currentBatch * batchSize;
                const endIndex = Math.min(startIndex + batchSize, rowsToCreate.length);
                
                if (startIndex >= rowsToCreate.length) {
                    // All batches processed, append to container
                    container.appendChild(fragment);
                    return;
                }
                
                // Process current batch
                for (let i = startIndex; i < endIndex; i++) {
                    const rowCreator = rowsToCreate[i];
                    const newRow = rowCreator();
                    fragment.appendChild(newRow);
                }
                
                currentBatch++;
                
                // Process next batch in next animation frame
                requestAnimationFrame(processNextBatch);
            }
            
            // Start processing
            processNextBatch();
        }
        
        // This will be used later in the function
    }

    // Get form state to determine which sections are visible
    const isAdvancedForm = document.getElementById('toggle-switch')?.checked || false;
    const helActive = document.querySelector('input[name="use-hel"]:checked')?.value === 'yes' || false;
    const refinanceActive = document.querySelector('input[name="refinance-mortgage"]:checked')?.value === 'yes' || false;
    
    // Get filtered categories
    const filteredCategories = getFilteredCategories();

    // Create table element
    const table = document.createElement('table');
    table.id = 'cashflow-detail-table';
    table.className = 'spreadsheet-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '15px';
    table.style.fontSize = '14px';
    table.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    table.style.position = 'relative';
    table.style.borderCollapse = 'separate'; // This helps with sticky columns
    table.style.borderSpacing = '0';

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Create and add the category header
    const categoryHeader = document.createElement('th');
    categoryHeader.textContent = 'Category';
    categoryHeader.style.padding = '8px';
    categoryHeader.style.backgroundColor = '#7adfbb';
    categoryHeader.style.color = 'white';
    categoryHeader.style.fontWeight = 'bold';
    categoryHeader.style.textAlign = 'left';
    headerRow.appendChild(categoryHeader);
    
    // Default to showing only 12 months (Year 1)
    let initialMonthsToShow = window.selectedMonthsToShow || Math.min(240, months - 1);
    
    // Add month headers (starting from month 1)
    for (let i = 1; i <= initialMonthsToShow; i++) {
        const th = document.createElement('th');
        th.textContent = `Month ${i}`;
        th.style.padding = '8px';
        th.style.backgroundColor = '#7adfbb';
        th.style.color = 'white';
        th.style.fontWeight = 'bold';
        th.style.textAlign = 'right';
        headerRow.appendChild(th);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    
    // Track which section we're currently in while processing rows
    let currentSection = null;
    
    // Add rows for each category from the filtered list
    filteredCategories.forEach((cat, index) => {
        // Determine if this is a section header
        const isHeader = cat === 'Initial Mortgage' || cat === 'Home Equity Loan' || cat === 'Refinanced Mortgage';
        
        // Update current section when we encounter a section header
        if (cat === 'Initial Mortgage') {
            currentSection = 'IM';
        } else if (cat === 'Home Equity Loan') {
            currentSection = 'HEL';
        } else if (cat === 'Refinanced Mortgage') {
            currentSection = 'RM';
        }
        
        // Determine row background color
        const bgColor = isHeader ? 'rgba(255, 209, 81, 0.6)' : (index % 2 === 0 ? '#f9f9f9' : 'white');
        
        // Set font color to black for mortgage-related rows
        const fontColor = cat === 'Initial Mortgage' || cat === 'Refinanced Mortgage' || cat === 'Home Equity Loan' || 
                          cat === 'Principal' || cat === 'Interest' || cat === 'Extra Payments' || 
                          cat === 'Additional Equity' ? 'black' : 'inherit';
        
        // Create row with explicit mortgage type if it's in a mortgage section
        let row;
        if ((cat === 'Principal' || cat === 'Interest' || cat === 'Extra Payments') && 
            (currentSection === 'IM' || currentSection === 'HEL' || currentSection === 'RM')) {
            
            // Create row with explicit mortgage type parameter
            row = createDataRow(
                cat, 
                [], // Empty array since we'll get data directly in createDataRow 
                initialMonthsToShow, 
                {
                    isHeader: false,
                    rowBgColor: bgColor,
                    fontColor,
                    showBorder: cat === 'Operating Cash Flow' || cat === 'Total Debt Service',
                    mortgageType: currentSection, // Explicitly pass mortgage type
                    outputs: outputs  // Pass the outputs parameter here
                }
            );
        } else {
            // For non-mortgage sections, use the built-in helper to get the data key
            const dataKey = getSimpleDataKey(cat);
            
            // Create row normally
            row = createDataRow(
                cat, 
                outputs[dataKey] || [], 
                initialMonthsToShow, 
                {
                    isHeader,
                    rowBgColor: bgColor,
                    fontColor,
                    showBorder: cat === 'Operating Cash Flow' || cat === 'Total Debt Service'
                }
            );
        }
        
        tbody.appendChild(row);
        
        // Add a blank row after specific sections
        if (cat === 'Operating Cash Flow' || cat === 'Total Debt Service') {
            tbody.appendChild(createBlankRow(initialMonthsToShow));
        }

        // Add additional rows after Additional Equity
        if (cat === 'Additional Equity') {
            // Add a blank row
            tbody.appendChild(createBlankRow(initialMonthsToShow));
            
            // Add Property Value row
            const propertyValueRow = createDataRow(
                'Property Value',
                outputs['Property Price'] || [],
                initialMonthsToShow,
                { rowBgColor: '#f9f9f9' }
            );
            tbody.appendChild(propertyValueRow);
            
            // If in advanced form, add Appraised Value row
            if (isAdvancedForm && outputs['Appraised Value']) {
                const appraisedValueRow = createDataRow(
                    'Appraised Value',
                    outputs['Appraised Value'] || [],
                    initialMonthsToShow,
                    { rowBgColor: 'white' }
                );
                tbody.appendChild(appraisedValueRow);
            }

            // Add blank row after appraised value
            tbody.appendChild(createBlankRow(initialMonthsToShow));
            
            // Add Initial Mortgage Balance row
            const imBalanceRow = createDataRow(
                'Initial Mortgage Balance',
                outputs['IM Balance'] || [],
                initialMonthsToShow,
                { rowBgColor: '#f9f9f9' }
            );
            tbody.appendChild(imBalanceRow);
            
            // Add Home Equity Loan Balance row if active
            if (helActive) {
                const helBalanceRow = createDataRow(
                    'Home Equity Loan Balance',
                    outputs['HEL Balance'] || [],
                    initialMonthsToShow,
                    { rowBgColor: 'white' }
                );
                tbody.appendChild(helBalanceRow);
            }
            
            // Add Refinanced Mortgage Balance row if active
            if (refinanceActive) {
                const rmBalanceRow = createDataRow(
                    'Refinanced Mortgage Balance',
                    outputs['RM Balance'] || [],
                    initialMonthsToShow,
                    { 
                        rowBgColor: isAdvancedForm && helActive ? '#f9f9f9' : 'white'
                    }
                );
                tbody.appendChild(rmBalanceRow);
            }
            
            // Add Total Debt Balance row with a thicker border
            const totalDebtRow = document.createElement('tr');
            totalDebtRow.style.backgroundColor = isAdvancedForm && ((helActive && refinanceActive) ? 'white' : (helActive || refinanceActive) ? '#f9f9f9' : 'white');
            totalDebtRow.style.borderTop = '4px solid black';
            
            const totalDebtLabel = document.createElement('td');
            totalDebtLabel.textContent = 'Total Debt Balance';
            totalDebtLabel.style.padding = '6px 8px';
            totalDebtLabel.style.fontWeight = 'bold';
            totalDebtLabel.style.borderBottom = '1px solid #ddd';
            totalDebtLabel.style.position = 'sticky';
            totalDebtLabel.style.left = '0';
            totalDebtLabel.style.zIndex = '10';
            totalDebtLabel.style.backgroundColor = 'white';
            totalDebtRow.appendChild(totalDebtLabel);
            
            // Get the total debt balance data
            for (let i = 1; i <= initialMonthsToShow; i++) {
                const cell = document.createElement('td');
                if (outputs['Total Debt Balance'] && outputs['Total Debt Balance'][i]) {
                    cell.textContent = formatCurrency(outputs['Total Debt Balance'][i]);
                    cell.style.color = '#ff5555';  // Red for debt
                    cell.style.fontWeight = 'bold';
                } else {
                    cell.textContent = '-';
                }
                cell.style.padding = '6px 8px';
                cell.style.textAlign = 'right';
                cell.style.borderBottom = '1px solid #ddd';
                totalDebtRow.appendChild(cell);
            }
            
            tbody.appendChild(totalDebtRow);
            
            // Add Property Equity row (Property Value minus Total Debt)
            const equityRow = document.createElement('tr');
            equityRow.style.backgroundColor = '#f9f9f9';
            
            const equityLabel = document.createElement('td');
            equityLabel.textContent = 'Property Equity';
            equityLabel.style.padding = '6px 8px';
            equityLabel.style.fontWeight = 'bold';
            equityLabel.style.borderBottom = '1px solid #ddd';
            equityLabel.style.position = 'sticky';
            equityLabel.style.left = '0';
            equityLabel.style.zIndex = '10';
            equityLabel.style.backgroundColor = '#f9f9f9';
            equityRow.appendChild(equityLabel);
            
            // Calculate property equity for each month
            for (let i = 1; i <= initialMonthsToShow; i++) {
                const cell = document.createElement('td');
                if (outputs['Property Price'] && outputs['Property Price'][i] && 
                    outputs['Total Debt Balance'] && outputs['Total Debt Balance'][i]) {
                    const propertyValue = outputs['Property Price'][i];
                    const totalDebt = outputs['Total Debt Balance'][i];
                    const equity = propertyValue - totalDebt;
                    
                    cell.textContent = formatCurrency(equity);
                    if (equity > 0) {
                        cell.style.color = '#4caf50';  // Green for positive equity
                    } else {
                        cell.style.color = '#ff5555';  // Red for negative equity
                    }
                } else {
                    cell.textContent = '-';
                }
                cell.style.padding = '6px 8px';
                cell.style.textAlign = 'right';
                cell.style.borderBottom = '1px solid #ddd';
                equityRow.appendChild(cell);
            }
            
            tbody.appendChild(equityRow);
        }
    });
    
    // Make table header sticky at the top of the scrollable area
    const headerCells = thead.querySelectorAll('th');
    headerCells.forEach(cell => {
        cell.style.position = 'sticky';
        cell.style.top = '0';
        cell.style.zIndex = '20';
    });
    
    // Special styling for the corner cell (intersection of fixed row and column)
    const cornerCell = headerCells[0];
    if (cornerCell) {
        cornerCell.style.position = 'sticky';
        cornerCell.style.left = '0';
        cornerCell.style.zIndex = '30'; // Higher than other header cells
    }
    
    table.appendChild(tbody);
    
    // Unique styles for the table - this part was missing proper initialization
    const styleElement = document.createElement('style');
    styleElement.id = 'cashflow-table-styles';
    
    // Remove any existing style element to prevent duplicates
    const existingStyle = document.getElementById('cashflow-table-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // This is the critical part - adding the hover effect CSS
    styleElement.innerHTML = `
    /* Table header styles */
    #cashflow-detail-table th {
        position: sticky;
        top: 0;
        z-index: 20;
        background-color: #7adfbb;
    }

    /* Special style for the corner cell (top-left) */
    #cashflow-detail-table th:first-child {
        position: sticky;
        left: 0;
        top: 0;
        z-index: 30;
        background-color: #7adfbb;
    }

    /* Sticky first column (row headers) */
    #cashflow-detail-table td:first-child {
        position: sticky;
        left: 0;
        z-index: 10;
    }

    /* Basic row styling - alternating colors */
    #cashflow-detail-table tbody tr:nth-child(odd):not(.header-row) {
        background-color: #f9f9f9;
    }

    #cashflow-detail-table tbody tr:nth-child(even):not(.header-row) {
        background-color: white;
    }

    /* Header row styling */
    #cashflow-detail-table tbody tr.header-row,
    #cashflow-detail-table tbody tr.header-row:hover {
        background-color: rgba(255, 209, 81, 0.6) !important;
    }

    #cashflow-detail-table tbody tr.header-row td,
    #cashflow-detail-table tbody tr.header-row:hover td {
        background-color: rgba(255, 209, 81, 0.6) !important;
    }

    /* Row header (first cell) background colors to match row backgrounds */
    #cashflow-detail-table tbody tr:nth-child(odd):not(.header-row) td:first-child {
        background-color: #f9f9f9;
    }

    #cashflow-detail-table tbody tr:nth-child(even):not(.header-row) td:first-child {
        background-color: white;
    }

    /* Header row first cells maintain their special styling */
    #cashflow-detail-table tbody tr.header-row td:first-child {
        background-color: rgba(255, 209, 81, 0.6) !important;
    }

    /* Row hover effect - applied to all cells EXCEPT the first cell */
    #cashflow-detail-table tbody tr:not(.header-row):hover td:not(:first-child) {
        background-color: rgba(0, 0, 0, 0.05) !important;
    }

    /* Scrollbar styling */
    #cashflow-detail-table::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    #cashflow-detail-table::-webkit-scrollbar-track {
        background: #f5f5f5;
    }

    #cashflow-detail-table::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 4px;
    }
    `;
    document.head.appendChild(styleElement);
    
    // Create a scrollable wrapper for the table with both horizontal and vertical scrolling
    const tableWrapper = document.createElement('div');
    tableWrapper.style.overflowX = 'auto';
    tableWrapper.style.overflowY = 'auto';
    tableWrapper.style.height = '500px';
    tableWrapper.style.position = 'relative';
    
    // Set up CSS for better frozen panes 
    tableWrapper.style.scrollbarWidth = 'thin'; // For Firefox
    tableWrapper.style.scrollbarColor = '#ddd #f5f5f5'; // For Firefox
    
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
    
    // Add time period controls (these will be sticky at the top)
    addViewControls(container, table, outputs, filteredCategories);

    return table;
}

// Simple helper function for basic data keys - no complex mapping logic
function getSimpleDataKey(category) {
    // Direct mappings for most categories
    switch(category) {
        case 'Revenue': return 'Revenue';
        case 'Insurance': return 'Insurance';
        case 'HOA': return 'HOA';
        case 'Property Tax': return 'Property Tax';
        case 'Maintenance': return 'Maintenance';
        case 'Management Fee': return 'Management Fee';
        case 'Operating Cash Flow': return 'Operating CF';
        case 'Initial Mortgage': return ''; // Header row, no data
        case 'Home Equity Loan': return ''; // Header row, no data
        case 'Refinanced Mortgage': return ''; // Header row, no data
        case 'Total Debt Service': return 'Total Debt Service';
        case 'Levered FCF': return 'Levered FCF';
        case 'Additional Equity': return 'Additional Equity';
        default: return category; // For any other category, return as is
    }
}

    // Add controls to select year range and download option
    function addViewControls(container, table, outputs, categories) {
        // Create a fixed position header for controls
        const controlsContainer = document.createElement('div');
        controlsContainer.style.position = 'sticky';
        controlsContainer.style.top = '0';
        controlsContainer.style.backgroundColor = 'white';
        controlsContainer.style.zIndex = '10';
        controlsContainer.style.padding = '15px 0';
        controlsContainer.style.borderBottom = '1px solid #ddd';
        controlsContainer.style.marginBottom = '15px';
    
        // Create the controls div for the year selection
        const controlsDiv = document.createElement('div');
        controlsDiv.style.display = 'flex';
        controlsDiv.style.alignItems = 'center';
        controlsDiv.style.flexWrap = 'wrap';
        controlsDiv.style.gap = '10px';
        
        // Get total months and calculate max years
        const months = outputs['Revenue'].length;
        const maxYears = Math.ceil((months - 1) / 12);
        
        // Create subheading text
        const subheading = document.createElement('div');
        subheading.textContent = 'I want to see cash flows from Year 1 to Year ';
        subheading.style.fontWeight = 'bold';
        subheading.style.fontSize = '16px';
        
        // Create year input
        const yearInput = document.createElement('input');
        yearInput.type = 'number';
        yearInput.min = '1';
        yearInput.max = maxYears.toString();
        yearInput.value = window.selectedMonthsToShow ? Math.ceil(window.selectedMonthsToShow / 12).toString() : '20'; // Use saved value if available
        yearInput.style.width = '60px';
        yearInput.style.padding = '6px 8px';
        yearInput.style.fontSize = '16px';
        yearInput.style.border = '1px solid #ccc';
        yearInput.style.borderRadius = '4px';
        yearInput.style.textAlign = 'center';
        yearInput.style.marginLeft = '5px';
        yearInput.style.marginRight = '5px';
        
        // Create Apply button
        const applyButton = document.createElement('button');
        applyButton.textContent = 'Apply';
        applyButton.style.padding = '8px 15px';
        applyButton.style.backgroundColor = '#7adfbb';
        applyButton.style.border = '1px solid #65c9a7';
        applyButton.style.borderRadius = '4px';
        applyButton.style.cursor = 'pointer';
        applyButton.style.fontWeight = 'bold';
        applyButton.style.color = 'white';
        applyButton.style.marginLeft = '10px';
        applyButton.style.transition = 'all 0.2s ease';
        
        // Create Show All Years button
        const showAllButton = document.createElement('button');
        showAllButton.textContent = 'Show All Years';
        showAllButton.style.padding = '8px 15px';
        showAllButton.style.backgroundColor = '#f0f0f0';
        showAllButton.style.border = '1px solid #ccc';
        showAllButton.style.borderRadius = '4px';
        showAllButton.style.cursor = 'pointer';
        showAllButton.style.fontWeight = 'normal';
        showAllButton.style.color = 'black';
        showAllButton.style.marginLeft = '10px';
        showAllButton.style.transition = 'all 0.2s ease';
        
        // Add hover effect for Apply button
        applyButton.addEventListener('mouseover', () => {
            applyButton.style.backgroundColor = '#65c9a7';
        });
        
        applyButton.addEventListener('mouseout', () => {
            applyButton.style.backgroundColor = '#7adfbb';
        });
        
        // Add hover effect for Show All button
        showAllButton.addEventListener('mouseover', () => {
            showAllButton.style.backgroundColor = '#e0e0e0';
        });
        
        showAllButton.addEventListener('mouseout', () => {
            showAllButton.style.backgroundColor = '#f0f0f0';
        });
        
        // Handle click to update the table view
        applyButton.addEventListener('click', () => {
            const selectedYear = parseInt(yearInput.value) || 1;
            const monthsToShow = Math.min(selectedYear * 12, months - 1);
            
            // Save the selected number of months in a global variable
            window.selectedMonthsToShow = monthsToShow;
            
            // Recreate the table with the selected number of months
            createCashflowTable(outputs);
        });
        
        // Handle click to show all months
        showAllButton.addEventListener('click', () => {
            yearInput.value = maxYears;
            const monthsToShow = Math.min(maxYears * 12, months - 1);
            
            // Save the selected number of months in a global variable
            window.selectedMonthsToShow = monthsToShow;
            
            // Recreate the table with all months
            createCashflowTable(outputs);
        });
        
        // Add a download button
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download CSV';
        downloadButton.style.padding = '8px 15px';
        downloadButton.style.backgroundColor = '#2196f3';
        downloadButton.style.border = '1px solid #0d8bf2';
        downloadButton.style.borderRadius = '4px';
        downloadButton.style.cursor = 'pointer';
        downloadButton.style.fontWeight = 'normal';
        downloadButton.style.color = 'white';
        downloadButton.style.marginLeft = 'auto';
        downloadButton.style.transition = 'all 0.2s ease';
        
        // Add hover effect
        downloadButton.addEventListener('mouseover', () => {
            downloadButton.style.backgroundColor = '#0d8bf2';
        });
        
        downloadButton.addEventListener('mouseout', () => {
            downloadButton.style.backgroundColor = '#2196f3';
        });
        
        // Handle click to download CSV
        downloadButton.addEventListener('click', () => {
            const selectedYear = parseInt(yearInput.value) || 1;
            const monthsToShow = Math.min(selectedYear * 12, months - 1);
            downloadTableAsCSV(table, outputs, categories, monthsToShow);
        });
        
        // Set max attribute and validation for yearInput
        yearInput.addEventListener('input', function() {
            let value = this.value;
            
            // Allow empty value during typing
            if (value === "") return;
            
            // Convert to integer if possible
            value = parseInt(value) || 1;
            
            // Apply min/max constraints only after user is done typing
            if (value < 1 || value > maxYears) {
                // Schedule validation to happen after the current input event
                setTimeout(() => {
                    if (value < 1) this.value = "1";
                    if (value > maxYears) this.value = maxYears.toString();
                }, 0);
            }
        });
        
        // Apply constraints when focus is lost
        yearInput.addEventListener('blur', function() {
            let value = parseInt(this.value) || 1;
            if (value < 1) value = 1;
            if (value > maxYears) value = maxYears;
            this.value = value;
        });
        
        // Assemble the controls
        controlsDiv.appendChild(subheading);
        controlsDiv.appendChild(yearInput);
        controlsDiv.appendChild(applyButton);
        controlsDiv.appendChild(showAllButton);
        controlsDiv.appendChild(downloadButton);
        
        controlsContainer.appendChild(controlsDiv);
        
        // Insert controls before the table
        container.insertBefore(controlsContainer, container.firstChild);
    }

    // Function to download table data as CSV
    function downloadTableAsCSV(table, outputs, categories, monthsToShow) {
        // Create CSV content
        let csvContent = "Category";
        
        // Add headers
        for (let i = 1; i <= monthsToShow; i++) {
            csvContent += `,Month ${i}`;
        }
        csvContent += "\n";
        
        // Add data rows
        categories.forEach(cat => {
            csvContent += `"${cat}"`;
            
            const dataArray = outputs[getDataKey(cat, categories)] || [];
            for (let i = 1; i <= monthsToShow; i++) {
                if (dataArray[i] !== undefined) {
                    csvContent += `,${dataArray[i]}`;
                } else {
                    csvContent += `,`;
                }
            }
            csvContent += "\n";
        });
        
        // Create download link
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "cash_flow_data.csv");
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up
        document.body.removeChild(link);
    }
    
    // Add a container for the spreadsheet if it doesn't exist
    function ensureContainerExists() {
        const chartContainer = document.getElementById('chart-container');
        if (!chartContainer) return;
        
        let spreadsheetContainer = document.getElementById('spreadsheet-container');
        if (!spreadsheetContainer) {
            // Create a heading for the spreadsheet section
            const heading = document.createElement('h2');
            heading.textContent = 'Monthly Cash Flow Details';
            heading.className = 'subheading';
            heading.style.marginTop = '30px';
            chartContainer.appendChild(heading);
            
            // Create the container for the spreadsheet
            spreadsheetContainer = document.createElement('div');
            spreadsheetContainer.id = 'spreadsheet-container';
            spreadsheetContainer.style.marginTop = '10px';
            spreadsheetContainer.style.width = '100%';
            spreadsheetContainer.style.backgroundColor = '#fff';
            spreadsheetContainer.style.border = '1px solid #ccc';
            spreadsheetContainer.style.borderRadius = '4px';
            spreadsheetContainer.style.padding = '15px';
            spreadsheetContainer.style.boxSizing = 'border-box';
            spreadsheetContainer.style.position = 'relative'; // For proper positioning of sticky elements
            
            chartContainer.appendChild(spreadsheetContainer);
        }
        
        return spreadsheetContainer;
    }

    // Listen for form dictionary changes
    document.addEventListener('formDictionaryChanged', function () {
        if (window.financialOutputs) {
            ensureContainerExists();
            createCashflowTable(window.financialOutputs);
        }
    });

    // Listen for changes to HEL, refinance, and IM extra payments radio buttons
    document.addEventListener('change', function(event) {
        const target = event.target;
        if (target.name === 'use-hel' || target.name === 'refinance-mortgage' || target.name === 'im-extra-payments') {
            if (window.financialOutputs) {
                createCashflowTable(window.financialOutputs);
            }
        }
    });

    // Initial load if data is available
    setTimeout(() => {
        ensureContainerExists();
        if (window.financialOutputs) {
            createCashflowTable(window.financialOutputs);
        }
    }, 500);
});