document.addEventListener("DOMContentLoaded", function () {
    // Set default values and limits for fields
    var defaultValues = {
        'purchase-price': 500000,
        'closing-costs': 5000,
        'investment-years': 20,
        'home-growth-rate': 4,
        'down-payment-percent': 25,
        'mortgage-rate': 6,
        'monthly-rent': 4500,
        'annual-rent-increase': 2,
        'annual-insurance': 2000,
        'annual-hoa': 1500,
        'annual-property-tax': 2.25,
        'annual-maintenance': 1000,
        'cpi-assumption': 2,
        'management-fee': 10
    };

    var tooltips = {
        'purchase-price': "The total price at which the property is being purchased.",
        'closing-costs': "Additional costs incurred during the closing of the property purchase.",
        'investment-years': "The number of years you plan to hold the investment.",
        'home-growth-rate': "The expected annual growth rate of the property's value.",
        'down-payment-percent': "The percentage of the purchase price paid upfront.",
        'mortgage-rate': "The annual interest rate on the mortgage loan.",
        'monthly-rent': "The expected monthly rental income from the property.",
        'annual-rent-increase': "The expected annual increase in rent.",
        'annual-insurance': "The annual cost of insuring the property.",
        'annual-hoa': "The annual cost of homeowners association fees.",
        'annual-property-tax': "The annual property tax rate.",
        'annual-maintenance': "The annual cost of maintaining the property.",
        'cpi-assumption': "The expected annual increase in consumer price index.",
        'management-fee': "The percentage of rental income paid for property management services."
    };

    // Function to create info icon and tooltip
    function createInfoIcon(id) {
        var label = document.querySelector(`label[for="${id}"]`);
        if (label) {
            var icon = document.createElement("span");
            icon.className = "info-icon";
            icon.innerHTML = "&#9432;"; // HTML entity for 'i' inside a circle
            icon.style.color = "#a4a4a4";
            icon.style.marginLeft = "5px";
            icon.style.cursor = "pointer";
            icon.setAttribute("data-tooltip", tooltips[id]);

            icon.addEventListener("mouseover", function (event) {
                var tooltip = document.createElement("div");
                tooltip.className = "tooltip";
                tooltip.textContent = event.target.getAttribute("data-tooltip");
                document.body.appendChild(tooltip);

                var rect = event.target.getBoundingClientRect();
                tooltip.style.left = `${rect.left + window.scrollX + 20}px`;
                tooltip.style.top = `${rect.top + window.scrollY}px`;
            });

            icon.addEventListener("mouseout", function () {
                var tooltip = document.querySelector(".tooltip");
                if (tooltip) {
                    tooltip.remove();
                }
            });

            label.appendChild(icon);
        }
    }

    Object.keys(tooltips).forEach(createInfoIcon);

    function formatField(id, value, format) {
        let formattedValue = value;
        switch (format) {
            case 'currency':
                formattedValue = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(value);
                break;
            case 'percent':
                formattedValue = value.toFixed(0) + '%';
                break;
            case 'number':
                formattedValue = new Intl.NumberFormat('en-US').format(value);
                break;
            default:
                break;
        }
        const element = document.getElementById(id);
        element.value = formattedValue;
        element.style.color = '#7adfbb';
        element.style.fontWeight = 'bold';
    }

    function applyFormatting(event) {
        let field = event.target;
        let value = parseFloat(field.value.replace(/[^\d.-]/g, ''));
        let format = field.getAttribute('data-format');
        if (isNaN(value) || value < 0) value = 0;
        formatField(field.id, value, format);
        field.style.color = 'black';
        field.style.fontWeight = 'bold';
    }

    function setDefaultValues() {
        formatField('purchase-price', defaultValues['purchase-price'], 'currency');
        formatField('closing-costs', defaultValues['closing-costs'], 'currency');
        formatField('investment-years', defaultValues['investment-years'], 'number');
        formatField('home-growth-rate', defaultValues['home-growth-rate'], 'percent');
        formatField('down-payment-percent', defaultValues['down-payment-percent'], 'percent');
        formatField('mortgage-rate', defaultValues['mortgage-rate'], 'percent');
        formatField('monthly-rent', defaultValues['monthly-rent'], 'currency');
        formatField('annual-rent-increase', defaultValues['annual-rent-increase'], 'percent');
        formatField('annual-insurance', defaultValues['annual-insurance'], 'currency');
        formatField('annual-hoa', defaultValues['annual-hoa'], 'currency');
        formatField('annual-property-tax', defaultValues['annual-property-tax'], 'percent');
        formatField('annual-maintenance', defaultValues['annual-maintenance'], 'currency');
        formatField('cpi-assumption', defaultValues['cpi-assumption'], 'percent');
        formatField('management-fee', defaultValues['management-fee'], 'percent');
    }

    setDefaultValues();

    document.querySelectorAll('input[type="number"], input[type="text"]').forEach(field => {
        let format = field.getAttribute('data-format');
        field.style.color = '#7adfbb';
		field.style.fontWeight = 'bold';
        field.addEventListener('focus', function () {
            if (format === 'currency') {
                this.value = '$' + this.value.replace(/[^0-9.]/g, '');
            } else if (format === 'percent') {
                this.value = this.value.replace(/[^0-9.]/g, '') + '%';
            }
        });
        field.addEventListener('blur', applyFormatting);
        field.addEventListener('input', function () {
            if (parseFloat(this.value.replace(/[^\d.-]/g, '')) < 0) {
                this.value = this.value.replace(/[^0-9.]/g, '');
            }
        });
    });

    // Function to handle collapsible sections
    var collapsibles = document.querySelectorAll('.collapsible input[type="checkbox"]');
	
	
	collapsibles.forEach(function (collapsible) {
		var content = collapsible.nextElementSibling.nextElementSibling;
		var icon = collapsible.nextElementSibling.querySelector('.collapsible-icon');

		if (collapsible.checked) {
			content.style.display = "block";
			content.style.opacity = 1;
			icon.textContent = "-";
			icon.style.fontSize = "24px"; // Set minus sign font size
		} else {
			content.style.display = "none";
			content.style.opacity = 0;
			icon.textContent = "+";
			icon.style.fontSize = "16px"; // Set plus sign font size
		}

		collapsible.addEventListener('change', function () {
			if (this.checked) {
				content.style.display = "block";
				content.style.opacity = 0;
				setTimeout(function () {
					content.style.opacity = 1;
					content.style.transition = "opacity 0.5s ease-in-out";
				}, 10);
				icon.textContent = "-";
				icon.style.fontSize = "24px"; // Set minus sign font size
			} else {
				content.style.opacity = 0;
				content.style.transition = "opacity 0.5s ease-in-out";
				setTimeout(function () {
					content.style.display = "none";
				}, 500);
				icon.textContent = "+";
				icon.style.fontSize = "16px"; // Set plus sign font size
			}
		});
	});

    // Function to handle form toggling
    var toggleSwitch = document.getElementById('toggle-switch');
    var basicForm = document.getElementById('basic-form');
    var advancedForm = document.getElementById('advanced-form');

    toggleSwitch.addEventListener('change', function () {
        if (this.checked) {
            basicForm.style.opacity = 0;
            basicForm.addEventListener('transitionend', function onTransitionEnd() {
                basicForm.style.display = 'none';
                basicForm.removeEventListener('transitionend', onTransitionEnd);
                advancedForm.style.display = 'block';
                setTimeout(function () {
                    advancedForm.style.opacity = 1;
                    advancedForm.style.transition = "opacity 0.5s ease-in-out";
                }, 10);
            });
        } else {
            advancedForm.style.opacity = 0;
            advancedForm.addEventListener('transitionend', function onTransitionEnd() {
                advancedForm.style.display = 'none';
                advancedForm.removeEventListener('transitionend', onTransitionEnd);
                basicForm.style.display = 'block';
                setTimeout(function () {
                    basicForm.style.opacity = 1;
                    basicForm.style.transition = "opacity 0.5s ease-in-out";
                }, 10);
            });
        }
    });
});
