document.addEventListener("DOMContentLoaded", function () {
    // ===== Check Defaults Loaded =====
    if (typeof defaultValuesBasic === 'undefined' || typeof defaultValuesAdvanced === 'undefined' || typeof tooltipsBasic === 'undefined' || typeof tooltipsAdvanced === 'undefined') {
        console.error('Defaults not loaded');
        return;
    }

    // ===== Utilities =====
    function createInfoIcon(id, tooltipDictionary) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label || label.querySelector(".info-icon")) return;

        const icon = document.createElement("span");
        icon.className = "info-icon";
        icon.innerHTML = "&#9432;";
        icon.style.cssText = "color: #a4a4a4; margin-left: 5px; cursor: pointer;";
        icon.dataset.tooltip = tooltipDictionary[id];

        icon.addEventListener("mouseover", (event) => {
            const tooltip = document.createElement("div");
            tooltip.className = "tooltip";
            tooltip.textContent = event.target.dataset.tooltip;
            document.body.appendChild(tooltip);

            const rect = event.target.getBoundingClientRect();
            tooltip.style.left = `${rect.left + window.scrollX + 20}px`;
            tooltip.style.top = `${rect.top + window.scrollY}px`;
        });

        icon.addEventListener("mouseout", () => {
            document.querySelector(".tooltip").remove();
        });

        label.appendChild(icon);
    }

    function applyTooltips(formId, tooltipDictionary) {
        const form = document.getElementById(formId);
        if (!form) return;

        Object.keys(tooltipDictionary).forEach(id => {
            if (form.querySelector(`#${id}`)) createInfoIcon(id, tooltipDictionary);
        });
    }

    function formatField(id, value, format) {
        let formattedValue = value;

        switch (format) {
            case 'currency':
                formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
                break;
            case 'percent':
                formattedValue = `${value.toFixed(2)}%`;
                break;
            case 'number':
                formattedValue = new Intl.NumberFormat('en-US').format(value);
                break;
        }

        const element = document.getElementById(id);
        if (!element) return;

        if (element.type === 'radio') {
            element.checked = element.value == value;
        } else {
            element.value = formattedValue;
            element.style.cssText = 'color: #7adfbb; font-weight: bold;';
        }
    }

    function applyFormatting(event) {
        const field = event.target;
        let value = parseFloat(field.value.replace(/[^\d.-]/g, '')) || 0;
        const format = field.dataset.format;

        formatField(field.id, value, format);
        field.style.cssText = 'color: black; font-weight: bold;';
    }

    function setDefaultValues(defaultValues) {
        Object.keys(defaultValues).forEach(key => {
            const format = document.getElementById(key)?.dataset.format;
            formatField(key, defaultValues[key], format);
        });
    }

    // ===== Initialize Fields =====
    document.querySelectorAll('input[type="number"], input[type="text"]').forEach(field => {
        const format = field.dataset.format;
        field.style.cssText = 'color: #7adfbb; font-weight: bold;';

        field.addEventListener('focus', function () {
            if (format === 'currency') this.value = `$${this.value.replace(/[^0-9.]/g, '')}`;
            else if (format === 'percent') this.value = `${this.value.replace(/[^0-9.]/g, '')}%`;
        });

        field.addEventListener('blur', applyFormatting);

        field.addEventListener('input', function () {
            if (parseFloat(this.value.replace(/[^\d.-]/g, '')) < 0) {
                this.value = this.value.replace(/[^0-9.]/g, '');
            }
        });
    });

    // ===== Collapsibles =====
    document.querySelectorAll('.collapsible input[type="checkbox"]').forEach(collapsible => {
        const content = collapsible.nextElementSibling.nextElementSibling;
        const icon = collapsible.nextElementSibling.querySelector('.collapsible-icon');

        const toggleContent = (isChecked) => {
            content.style.display = isChecked ? 'block' : 'none';
            content.style.opacity = isChecked ? 1 : 0;
            icon.textContent = isChecked ? '-' : '+';
            icon.style.fontSize = isChecked ? '24px' : '16px';
        };

        toggleContent(collapsible.checked);

        collapsible.addEventListener('change', function () {
            if (this.checked) {
                content.style.display = 'block';
                content.style.opacity = 0;
                setTimeout(() => {
                    content.style.opacity = 1;
                    content.style.transition = 'opacity 0.5s ease-in-out';
                }, 10);
            } else {
                content.style.opacity = 0;
                content.style.transition = 'opacity 0.5s ease-in-out';
                setTimeout(() => {
                    content.style.display = 'none';
                }, 500);
            }
            icon.textContent = this.checked ? '-' : '+';
            icon.style.fontSize = this.checked ? '24px' : '16px';
        });
    });

    // ===== Form Toggle =====
    const toggleSwitch = document.getElementById('toggle-switch');
    const basicForm = document.getElementById('basic-form');
    const advancedForm = document.getElementById('advanced-form');

    toggleSwitch.addEventListener('change', function () {
        const hideForm = this.checked ? basicForm : advancedForm;
        const showForm = this.checked ? advancedForm : basicForm;
        const defaults = this.checked ? defaultValuesAdvanced : defaultValuesBasic;
        const tooltips = this.checked ? tooltipsAdvanced : tooltipsBasic;

        hideForm.classList.remove('active');
        hideForm.style.opacity = 0;

        hideForm.addEventListener('transitionend', function onEnd() {
            hideForm.style.display = 'none';
            hideForm.removeEventListener('transitionend', onEnd);

            showForm.style.display = 'block';
            showForm.classList.add('active');

            setTimeout(() => {
                showForm.style.opacity = 1;
                showForm.style.transition = 'opacity 0.5s ease-in-out';
                setDefaultValues(defaults);
                applyTooltips(showForm.id, tooltips);
            }, 10);
        });
    });

    // ===== Initialize Page =====
    setDefaultValues(defaultValuesBasic);
    applyTooltips('basic-form', tooltipsBasic);
    
    // ===== Initialize Charts =====
    // Only initialize charts if Chart.js is available and elements exist
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    } else {
        console.error("Chart.js not loaded yet, charts will not be initialized");
        // Try to initialize charts after a short delay to give Chart.js time to load
        setTimeout(function() {
            if (typeof Chart !== 'undefined') {
                console.log("Chart.js loaded after delay, initializing charts now");
                initializeCharts();
            } else {
                console.error("Chart.js still not loaded after delay");
            }
        }, 1000);  // 1 second delay
    }
});

// ============================
// Sources & Uses Chart Setup - Moved to a function to prevent immediate execution
// ============================
function initializeCharts() {
    console.log("Initializing charts...");
    
    // Only proceed if the chart canvas exists
    const sourcesUsesChartCanvas = document.getElementById('sourcesUsesChart');
    if (!sourcesUsesChartCanvas) {
        console.error("Sources & Uses chart canvas not found");
        return;
    }
    
    const sourcesUsesChartConfig = {
        type: 'bar',
        data: {
            labels: ['Debt', 'Equity', 'Fees', 'Other'],
            datasets: [{
                label: 'Amount',
                data: [5000000, 3000000, 200000, 100000],
                backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0'],
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `$${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: {
                        callback: value => `$${value.toLocaleString()}`
                    }
                }
            },
            animation: { duration: 500 }
        }
    };

    try {
        // Create the chart inside a try/catch to handle errors
        console.log("Creating Sources & Uses chart...");
        const sourcesUsesChart = new Chart(
            sourcesUsesChartCanvas,
            sourcesUsesChartConfig
        );
        console.log("Sources & Uses chart created successfully");

        // Define the chart update function
        window.updateSourcesUsesChart = function(newData) {
            sourcesUsesChart.data.datasets[0].data = newData;
            sourcesUsesChart.update();
        }

        // Create the table for the chart
        createSourcesUsesTable(sourcesUsesChart.data);
        
        // Setup event listeners for table interactivity
        const tableContainer = document.getElementById('table-container');
        if (tableContainer) {
            tableContainer.addEventListener('mouseover', e => highlightChartElement(e, true, sourcesUsesChart));
            tableContainer.addEventListener('mouseout', e => highlightChartElement(e, false, sourcesUsesChart));
        }
    } catch (error) {
        console.error("Error creating Sources & Uses chart:", error);
    }
}

// Function to create sources uses table
function createSourcesUsesTable(data) {
    const tableContainer = document.getElementById('table-container');
    if (!tableContainer) return;
    
    tableContainer.innerHTML = '';

    data.labels.forEach(label => {
        const row = document.createElement('div');
        row.className = 'table-row';

        const oval = document.createElement('div');
        oval.className = 'oval';
        oval.dataset.key = label;

        const text = document.createElement('div');
        text.className = 'table-text';
        text.textContent = label;

        row.append(oval, text);
        tableContainer.appendChild(row);
    });
}

// Function to highlight chart element
function highlightChartElement(event, isActive, chart) {
    const oval = event.target.closest('.oval');
    if (!oval || !chart) return;

    const key = oval.dataset.key;
    const dataIndex = chart.data.labels.findIndex(label => label === key);

    if (dataIndex !== -1) {
        const datasetIndex = 0;
        chart.setActiveElements(isActive ? [{ datasetIndex, index: dataIndex }] : []);
        chart.tooltip.setActiveElements(isActive ? [{ datasetIndex, index: dataIndex }] : [], { x: 0, y: 0 });
        chart.update();
    }
}