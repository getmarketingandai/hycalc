/**
 * Equity Summary Table - Mobile Initialization Fix
 * This version fixes the constant reassignment error
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log("Equity summary script loaded");
    
    // Use let instead of const for isMobile so it can be changed later
    let isMobile = window.innerWidth < 992;
    let initialMobileLoad = isMobile;
    let equityTableInitialized = false;
    
    // Get the container for the table
    const tableContainer = document.getElementById('equity-summary-table-container');
    if (!tableContainer) {
        console.error("Equity summary table container not found");
        return;
    }

    // Add a mobile-optimized flag to the container
    if (isMobile) {
        tableContainer.classList.add('mobile-view');
        document.body.classList.add('mobile-initialized');
    }
    
    // Add a style element for mobile optimization
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* Mobile enhancements - lock table rendering */
        body.mobile-initialized #equity-summary-table-container,
        body.mobile-initialized .summary-table {
            transform: translateZ(0);
            will-change: transform;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }
        
        /* Scroll protection for mobile devices */
        body.mobile-scrolling #equity-summary-table-container {
            pointer-events: none;
        }
        
        /* Mobile table enhancements */
        .mobile-view .summary-table {
            table-layout: fixed;
            width: 100%;
        }
        
        /* Optimize table rendering */
        .summary-table {
            contain: content;
        }
        
        /* Ensure mobile table cells don't cause horizontal overflow */
        .mobile-view .summary-table td {
            box-sizing: border-box;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* Force hardware acceleration for currency cells */
        .mobile-view .currency-cell {
            transform: translateZ(0);
            will-change: transform;
        }
    `;
    document.head.appendChild(styleEl);
    
    // Mobile scroll detection
    let isScrolling = false;
    let scrollTimer = null;
    
    // Function to handle mobile scroll
    function handleMobileScroll() {
        if (!isMobile) return;
        
        isScrolling = true;
        document.body.classList.add('mobile-scrolling');
        
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() {
            isScrolling = false;
            document.body.classList.remove('mobile-scrolling');
        }, 350);
    }
    
    // Add passive scroll listener for mobile optimization
    if (isMobile) {
        window.addEventListener('scroll', handleMobileScroll, { passive: true });
        window.addEventListener('touchmove', handleMobileScroll, { passive: true });
    }

    // ===== Utility Functions =====
    function formatCurrency(value, makeNegative = false) {
        const displayValue = makeNegative ? -Math.abs(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(displayValue);
    }

    function formatPercent(value) {
        return (value * 100).toFixed(2) + '%';
    }
    
    function formatMultiple(value) {
        return value.toFixed(2) + 'x';
    }
    
    // Get radio button value helper
    function getRadioValue(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio ? radio.value : null;
    }
    
    // Create a blank row for spacing
    function createBlankRow(tbody) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.style.height = '0px';
        row.appendChild(cell);
        tbody.appendChild(row);
        return row;
    }

    // ===== Data Tracking for Optimization =====
    let lastEquityHash = null;
    let updateCount = 0;
    const UPDATE_LIMIT = 5; // For safer mobile initialization


    
    // ===== Main Update Function =====
    function updateEquitySummary() {

        console.trace("🔥 updateEquitySummary() called");
        // Skip during mobile scrolling
        if (isMobile && isScrolling) {
            console.log("Skipping update during mobile scroll");
            return;
        }
        
        // For mobile initialization safety, limit initial updates 
        if (initialMobileLoad && updateCount >= UPDATE_LIMIT) {
            console.log(`Mobile initialization: max ${UPDATE_LIMIT} updates reached`);
            return;
        }
        
        const outputs = window.financialOutputs;
        const sourcesAndUses = window.sourcesAndUses;
    
        if (!outputs || !sourcesAndUses) {
            console.log("Missing financial data for update");
            return;
        }
    
        // ===== Data extraction =====
        const home = outputs['Home Sale Components'] || {};
        const homeValue = home['Property Value'] || 0;
        const imBal = home['Initial Mortgage Balance'] || 0;
        const helBal = home['Home Equity Loan Balance'] || 0;
        const rmBal = home['Refinanced Mortgage Balance'] || 0;
        const proceeds = home['Net Sale Proceeds'] || 0;
        const totalDebt = imBal + helBal + rmBal;
    
        const rent = outputs['Levered FCF']?.reduce((a, b) => a + b, 0) || 0;
        const addEquity = outputs['Additional Equity']?.reduce((a, b) => a + b, 0) || 0;
        const baseEquity = sourcesAndUses.equity || 0;
        const equity = baseEquity + addEquity;
    
        const moic = outputs.MOIC || 0;
        const irr = outputs.IRR || 0;
        const isAdvanced = document.getElementById('toggle-switch')?.checked || false;
        const helActive = getRadioValue('use-hel') === 'yes';
        const refiActive = getRadioValue('refinance-mortgage') === 'yes';
    
        const totalProfit = proceeds + rent + addEquity;
    
        // ===== Hash Comparison (mobile-safe) =====
        const currentHash = JSON.stringify({
            homeValue, imBal, helBal, rmBal, proceeds, totalDebt,
            rent, addEquity, equity, moic, irr, isAdvanced, helActive, refiActive
        });
    
        if (currentHash === lastEquityHash) {
            console.log("Skipping update - no data changes");
            return; // No change — skip update
        }
        
        lastEquityHash = currentHash;
        updateCount++; // Track update count for mobile initialization limit
        console.log(`Equity table update #${updateCount}`);
    
        // ===== Store scroll position to restore after update =====
        const scrollY = window.scrollY;
    
        // ===== Build table in memory =====
        const table = document.createElement('table');
        table.className = 'summary-table';
        table.style.lineHeight = '1.2';
        table.style.fontSize = '14px';
        
        // For mobile optimization
        if (isMobile) {
            table.classList.add('mobile-optimized');
        }
        
        const tbody = document.createElement('tbody');
    
        const addRow = (label, value, { bold = false, borderTop = false, color = '', blankBelow = false } = {}) => {
            const row = document.createElement('tr');
            const td1 = document.createElement('td');
            const td2 = document.createElement('td');
            td1.textContent = label;
            td2.textContent = value;
            td2.className = 'currency-cell';
            if (color) td2.style.color = color;
            if (bold) row.style.fontWeight = 'bold';
            if (borderTop) row.style.borderTop = '4px solid black';
            row.appendChild(td1);
            row.appendChild(td2);
            tbody.appendChild(row);
            if (blankBelow) {
                const spacer = document.createElement('tr');
                const spacerTd = document.createElement('td');
                spacerTd.colSpan = 2;
                spacerTd.style.height = '0px';
                spacer.appendChild(spacerTd);
                tbody.appendChild(spacer);
            }
        };
    
        // ===== Equity Section =====
        addRow('Equity at Closing', formatCurrency(baseEquity));
        addRow('Additional Equity to Cover Cash Needs', formatCurrency(addEquity));
        addRow('Total Equity Invested', formatCurrency(equity), { bold: true, borderTop: true, blankBelow: true });
    
        // ===== Home Sale Section =====
        addRow('Home Value at Sale', formatCurrency(homeValue), { color: 'green' });
    
        if (isAdvanced) {
            if (imBal) addRow('Initial Mortgage at Sale', formatCurrency(imBal, true), { color: 'red' });
            if (helActive && helBal) addRow('Home Equity Loan at Sale', formatCurrency(helBal, true), { color: 'red' });
            if (refiActive && rmBal) addRow('Refinanced Mortgage at Sale', formatCurrency(rmBal, true), { color: 'red' });
        } else {
            addRow('Mortgage at Sale', formatCurrency(totalDebt, true), { color: 'red' });
        }
    
        addRow('Home Sale Proceeds', formatCurrency(proceeds), {
            bold: true, borderTop: true, color: 'green'
        });
    
        // ===== Rental Cash Flow =====
        addRow('Rental Proceeds After Debt Payments', formatCurrency(rent + addEquity), {
            color: (rent + addEquity) < 0 ? 'red' : 'green'
        });
    
        // ===== Total Investment Profits =====
        addRow('Total Investment Profits', formatCurrency(totalProfit), {
            bold: true, borderTop: true,
            color: totalProfit < 0 ? 'red' : 'green',
            blankBelow: true
        });
    
        // ===== Return Metrics =====
        addRow('Annualized Return (IRR)', formatPercent(irr));
        addRow('Return on Equity (ROE)', formatMultiple(moic));
    
        table.appendChild(tbody);
    
        // ===== Inject if changed =====
        const newHTML = table.outerHTML.trim();
        const existingHTML = tableContainer.firstElementChild?.outerHTML?.trim() || '';
        
        if (newHTML !== existingHTML) {
            tableContainer.innerHTML = '';
            tableContainer.appendChild(table);
            console.log('✅ Equity summary table DOM updated');
        } else {
            console.log('⚠️ Skipped DOM update – content identical');
        }
        
        equityTableInitialized = true;
        
        // Restore scroll position if it changed (important for mobile)
        if (isMobile && window.scrollY !== scrollY) {
            window.scrollTo(0, scrollY);
        }
    }

    // ===== Event Listeners =====
    // Special protective wrapper for form dictionary changes
    function formDictionaryHandler() {
        // Skip if we've already hit the update limit during mobile initialization
        if (initialMobileLoad && updateCount >= UPDATE_LIMIT) {
            return;
        }
        
        // Skip during scrolling on mobile
        if (isMobile && isScrolling) {
            return;
        }
        
        // Regular update
        if (window.financialOutputs && window.sourcesAndUses) {
            updateEquitySummary();
        }
    }
    
    
    document.addEventListener('formDictionaryChanged', function (event) {
        if (isMobile && isScrolling) {
            console.log('⛔ Skipping equity update — scroll in progress');
            return;
        }
    
        if (initialMobileLoad && updateCount >= UPDATE_LIMIT) {
            console.log('⛔ Skipping — mobile init limit reached');
            return;
        }
    
        if (window.financialOutputs && window.sourcesAndUses) {
            updateEquitySummary();
        }
    });
    
    // Listen for radio button changes for HEL and refinance options
    const setupRadioListeners = function() {
        const radioButtons = document.querySelectorAll('input[name="use-hel"], input[name="refinance-mortgage"]');
        radioButtons.forEach(radio => {
            // Remove any existing listeners to prevent duplicates
            radio.removeEventListener('change', radioChangeHandler);
            
            // Add new listener
            radio.addEventListener('change', radioChangeHandler);
        });
    };
    
    // Handler for radio button changes
    const radioChangeHandler = function() {
        // The change will trigger formDictionaryChanged, so we don't need to do anything else
    };
    
    // Handle form toggle changes
    const toggleSwitch = document.getElementById('toggle-switch');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', function() {
            // Wait for form to update before setting up radio listeners again
            setTimeout(setupRadioListeners, 500);
        });
    }
    
    // ===== Special Mobile Initialization =====
    // When directly loading on mobile, add extra protection
    function performMobileInitialization() {
        if (!isMobile) return;
        
        // Set up initial table if it hasn't been set up yet
        if (!equityTableInitialized && window.financialOutputs && window.sourcesAndUses) {
            // Add brief delay to let other scripts initialize
            setTimeout(() => {
                updateEquitySummary();
                
                // Force reset of mobile initialization after 5 seconds
                setTimeout(() => {
                    initialMobileLoad = false;
                    console.log("Mobile initialization period ended");
                }, 5000);
            }, 1000);
        }
    }
    
    // Special window load handler for mobile
    window.addEventListener('load', function() {
        performMobileInitialization();
    });
    
    // ===== Initial Setup =====
    setupRadioListeners();
    
    // Initial render if data is available, but not during scrolling
    if (window.financialOutputs && window.sourcesAndUses && (!isMobile || !isScrolling)) {
        // For mobile, delay initial setup slightly
        if (isMobile) {
            setTimeout(updateEquitySummary, 500);
        } else {
            updateEquitySummary();
        }
    }
    
    // Detect switching between mobile and desktop 
    window.addEventListener('resize', function() {
        const wasMobile = isMobile;
        const nowMobile = window.innerWidth < 992;
        
        // Only do something if mobile state changed
        if (wasMobile !== nowMobile) {
            console.log(`View changed: ${wasMobile ? 'Mobile' : 'Desktop'} -> ${nowMobile ? 'Mobile' : 'Desktop'}`);
            
            // Update mobile state - this line was causing the error before
            isMobile = nowMobile;
            
            // Update classes
            if (nowMobile) {
                tableContainer.classList.add('mobile-view');
                document.body.classList.add('mobile-initialized');
            } else {
                tableContainer.classList.remove('mobile-view');
                document.body.classList.remove('mobile-initialized');
                document.body.classList.remove('mobile-scrolling');
                
                // Reset all mobile initialization flags
                initialMobileLoad = false;
                updateCount = 0;
                
                // Force update after mode switch
                setTimeout(updateEquitySummary, 500);
            }
        }
    });
});