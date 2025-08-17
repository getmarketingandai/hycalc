// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("Advanced form JS loaded with animations");
    
    // Helper function for fade in animation
    function fadeIn(element) {
        if (!element) return;
        
        // First make it visible but transparent
        element.style.display = 'block';
        element.style.opacity = 0;
        
        // Force a reflow to make the transition work
        void element.offsetWidth;
        
        // Start the transition
        element.style.transition = 'opacity 0.5s ease-in-out';
        element.style.opacity = 1;
        
        console.log(`Fading in element: ${element.id}`);
    }
    
    // Helper function for fade out animation
    function fadeOut(element) {
        if (!element) return;
        
        // Start with the element visible
        element.style.opacity = 1;
        
        // Start the transition
        element.style.transition = 'opacity 0.5s ease-in-out';
        element.style.opacity = 0;
        
        // After the transition completes, hide the element
        setTimeout(function() {
            element.style.display = 'none';
        }, 500); // Match this duration with the CSS transition
        
        console.log(`Fading out element: ${element.id}`);
    }
    
    // Setup event handlers for HEL options
    const useHelYes = document.getElementById('use-hel-yes');
    const useHelNo = document.getElementById('use-hel-no');
    const helOptions = document.getElementById('hel-options');
    
    if (useHelYes && useHelNo && helOptions) {
        console.log("HEL elements found, setting up event handlers");
        
        // Initialize the display based on current selection
        if (useHelYes.checked) {
            helOptions.style.display = 'block';
            helOptions.style.opacity = 1;
        } else {
            helOptions.style.display = 'none';
            helOptions.style.opacity = 0;
        }
        
        useHelYes.addEventListener('click', function() {
            fadeIn(helOptions);
        });
        
        useHelNo.addEventListener('click', function() {
            fadeOut(helOptions);
        });
    } else {
        console.log("HEL elements not found:", {
            useHelYes: !!useHelYes,
            useHelNo: !!useHelNo,
            helOptions: !!helOptions
        });
    }
    
    // Setup event handlers for HEL Extra Payment options
    const helExtraYes = document.getElementById('hel-extra-payments-yes');
    const helExtraNo = document.getElementById('hel-extra-payments-no');
    const helExtraOptions = document.getElementById('hel-extra-payment-options');
    
    if (helExtraYes && helExtraNo && helExtraOptions) {
        // Initialize the display based on current selection
        if (helExtraYes.checked) {
            helExtraOptions.style.display = 'block';
            helExtraOptions.style.opacity = 1;
        } else {
            helExtraOptions.style.display = 'none';
            helExtraOptions.style.opacity = 0;
        }
        
        helExtraYes.addEventListener('click', function() {
            fadeIn(helExtraOptions);
        });
        
        helExtraNo.addEventListener('click', function() {
            fadeOut(helExtraOptions);
        });
    }
    
    // Setup event handlers for Initial Mortgage Extra Payment options
    const imExtraYes = document.getElementById('im-extra-payments-yes');
    const imExtraNo = document.getElementById('im-extra-payments-no');
    const imExtraOptions = document.getElementById('im-extra-payment-options');
    
    if (imExtraYes && imExtraNo && imExtraOptions) {
        // Initialize the display based on current selection
        if (imExtraYes.checked) {
            imExtraOptions.style.display = 'block';
            imExtraOptions.style.opacity = 1;
        } else {
            imExtraOptions.style.display = 'none';
            imExtraOptions.style.opacity = 0;
        }
        
        imExtraYes.addEventListener('click', function() {
            fadeIn(imExtraOptions);
        });
        
        imExtraNo.addEventListener('click', function() {
            fadeOut(imExtraOptions);
        });
    }
    
    // Setup event handlers for Refinance Mortgage options
    const refinanceYes = document.getElementById('refinance-mortgage-yes');
    const refinanceNo = document.getElementById('refinance-mortgage-no');
    const refinanceOptions = document.getElementById('rm-options');
    
    if (refinanceYes && refinanceNo && refinanceOptions) {
        // Initialize the display based on current selection
        if (refinanceYes.checked) {
            refinanceOptions.style.display = 'block';
            refinanceOptions.style.opacity = 1;
        } else {
            refinanceOptions.style.display = 'none';
            refinanceOptions.style.opacity = 0;
        }
        
        refinanceYes.addEventListener('click', function() {
            fadeIn(refinanceOptions);
        });
        
        refinanceNo.addEventListener('click', function() {
            fadeOut(refinanceOptions);
        });
    }
    
    // Setup event handlers for Refinanced Mortgage Extra Payment options
    const rmExtraYes = document.getElementById('rm-extra-payments-yes');
    const rmExtraNo = document.getElementById('rm-extra-payments-no');
    const rmExtraOptions = document.getElementById('rm-extra-payment-options');
    
    if (rmExtraYes && rmExtraNo && rmExtraOptions) {
        // Initialize the display based on current selection
        if (rmExtraYes.checked) {
            rmExtraOptions.style.display = 'block';
            rmExtraOptions.style.opacity = 1;
        } else {
            rmExtraOptions.style.display = 'none';
            rmExtraOptions.style.opacity = 0;
        }
        
        rmExtraYes.addEventListener('click', function() {
            fadeIn(rmExtraOptions);
        });
        
        rmExtraNo.addEventListener('click', function() {
            fadeOut(rmExtraOptions);
        });
    }
    
    // For debugging - log the state of all advanced form elements
    function logAdvancedFormElements() {
        const elements = [
            { name: 'HEL Yes', element: useHelYes },
            { name: 'HEL No', element: useHelNo },
            { name: 'HEL Options', element: helOptions },
            { name: 'HEL Extra Yes', element: helExtraYes },
            { name: 'HEL Extra No', element: helExtraNo },
            { name: 'HEL Extra Options', element: helExtraOptions },
            { name: 'IM Extra Yes', element: imExtraYes },
            { name: 'IM Extra No', element: imExtraNo },
            { name: 'IM Extra Options', element: imExtraOptions },
            { name: 'Refinance Yes', element: refinanceYes },
            { name: 'Refinance No', element: refinanceNo },
            { name: 'Refinance Options', element: refinanceOptions },
            { name: 'RM Extra Yes', element: rmExtraYes },
            { name: 'RM Extra No', element: rmExtraNo },
            { name: 'RM Extra Options', element: rmExtraOptions }
        ];
        
        console.log("Advanced Form Elements Status:");
        elements.forEach(item => {
            if (item.element) {
                console.log(`${item.name}: Found`);
                if (item.element.type === 'radio') {
                    console.log(`  - Checked: ${item.element.checked}`);
                }
                if (item.name.includes('Options')) {
                    console.log(`  - Display: ${window.getComputedStyle(item.element).display}`);
                    console.log(`  - Opacity: ${window.getComputedStyle(item.element).opacity}`);
                }
            } else {
                console.log(`${item.name}: Not Found`);
            }
        });
    }
    
    // Run the debug check after a short delay to ensure everything is loaded
    setTimeout(logAdvancedFormElements, 1000);
    
    // Also log when toggle switch is activated
    const toggleSwitch = document.getElementById('toggle-switch');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', function() {
            console.log(`Toggle switch changed to: ${this.checked ? 'Advanced' : 'Basic'}`);
            // Log elements after a short delay to allow for DOM updates
            setTimeout(logAdvancedFormElements, 500);
        });
    }
});