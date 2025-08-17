console.log("JavaScript is loaded and running evaluate");
document.addEventListener("DOMContentLoaded", function () {
    // Ensure that keysArray and defaultValuesAdvanced are loaded
    if (typeof keysArray === 'undefined' || typeof defaultValuesAdvanced === 'undefined') {
        console.error('Keys array or default values not loaded');
        return;
    }

    // Initialize a zeroed dictionary
    window.formDictionary = initializeZeroDictionary();

    // Function to initialize zeroed dictionary
    function initializeZeroDictionary() {
        let zeroDict = {};
        keysArray.forEach(key => {
            zeroDict[key] = 0;
        });
        return zeroDict;
    }

    // Function to set default values from the advanced form when toggled
    function setAdvancedFormValues() {
        Object.keys(defaultValuesAdvanced).forEach(key => {
            let fieldId = key.replace('-advanced', '');
            if (fieldId in formDictionary) {
                let field = document.getElementById(key);
                if (field) {
                    if (field.type === 'text' || field.type === 'number') {
                        field.value = defaultValuesAdvanced[key];
                    } else if (field.type === 'radio' || field.type === 'checkbox') {
                        if (defaultValuesAdvanced[key] == field.value) {
                            field.checked = true;
                        }
                    }
                }
            }
        });
    }

	// Function to convert and collect values from the form
	function convertAndCollectFormValues(formId) {
		var form = document.getElementById(formId);
		if (form) {
			var inputs = form.querySelectorAll('input, select, textarea');
			inputs.forEach(function(input) {
				let value = input.value;
				let key = input.id.replace('-advanced', '');
				if (input.type === 'radio') {
					if (input.checked) {
						// Set the field value in formDictionary to 1 when radio button is checked		
						if (input.value=='yes'){
							formDictionary[input.name.replace('-advanced', '')] = 1;
						} else if (input.value=='no'){
							formDictionary[input.name.replace('-advanced', '')] = 0;
						} else {
							formDictionary[input.name.replace('-advanced', '')] = parseFloat(input.value)
						}
					}
				} else if (input.type === 'text' || input.type === 'number') {
					if (key in formDictionary) {
						if (input.getAttribute('data-format') === 'currency') {
							formDictionary[key] = parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
						} else if (input.getAttribute('data-format') === 'percent') {
							formDictionary[key] = (parseFloat(value.replace(/[^\d.-]/g, '')) || 0) / 100;
						} else {
							formDictionary[key] = parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
						}
					}
				} else if (input.type === 'checkbox' && input.checked) {
					key = input.id.replace('-advanced', '');
					if (key in formDictionary) {
						formDictionary[key] = 1;
					}
				}
			});
		}
		return formDictionary;
	}


    // Function to handle form changes
    function handleFormChange() {
        Object.keys(formDictionary).forEach(key => formDictionary[key] = 0); // Reset dictionary
        if (document.getElementById('toggle-switch').checked) {
            convertAndCollectFormValues('advanced-form');
        } else {
            convertAndCollectFormValues('basic-form');
        }
        triggerFormDictionaryChangeEvent(formDictionary); // Trigger change event
    }

    // Trigger custom event to notify formDictionary change
    function triggerFormDictionaryChangeEvent(updatedDictionary) {
        const event = new CustomEvent('formDictionaryChanged', { detail: updatedDictionary });
        document.dispatchEvent(event);
    }

    // Populate default values in the advanced form when toggled
    var toggleSwitch = document.getElementById('toggle-switch');
    toggleSwitch.addEventListener('change', function () {
        if (toggleSwitch.checked) {
            setAdvancedFormValues();
        }
        setTimeout(handleFormChange, 0); // Ensure the form values are updated after the form is visible
    });

    // Attach change event listener to all inputs in both forms, except checkboxes
    var inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="radio"], select, textarea');
    inputs.forEach(function(input) {
        input.addEventListener('change', handleFormChange);
    });

    // Output the form values on page load
    handleFormChange();
});
