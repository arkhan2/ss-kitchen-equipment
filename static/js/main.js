document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Handle undershelf selection
    const undershelvesSelect = document.getElementById('undershelves');
    const undershelfThickness = document.getElementById('undershelfThickness');

    if (undershelvesSelect && undershelfThickness) {
        console.log('Undershelf elements found');
        
        undershelvesSelect.addEventListener('change', function() {
            const hasUndershelves = parseInt(this.value) > 0;
            console.log('Undershelf value changed:', this.value, 'hasUndershelves:', hasUndershelves);
            undershelfThickness.disabled = !hasUndershelves;
        });

        // Initialize undershelf thickness state
        const initialValue = parseInt(undershelvesSelect.value) > 0;
        console.log('Initial undershelf value:', undershelvesSelect.value, 'enable thickness:', initialValue);
        undershelfThickness.disabled = !initialValue;
    } else {
        console.log('Undershelf elements not found');
    }
    
    // Get the settings modal element
    const settingsModal = document.getElementById('settingsModal');
    
    // Add event listener for when the modal is about to be shown
    if (settingsModal) {
        settingsModal.addEventListener('show.bs.modal', async function() {
            try {
                // Fetch current settings
                const response = await fetch('/settings');
                const data = await response.text();
                
                // Extract prices from the HTML response using a temporary div
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data;
                
                // Find all input fields in both the modal and the fetched data
                const modalForm = document.getElementById('settingsForm');
                const fetchedForm = tempDiv.querySelector('#settingsForm');
                
                if (modalForm && fetchedForm) {
                    // Update all input values
                    const inputs = modalForm.querySelectorAll('input[type="number"]');
                    inputs.forEach(input => {
                        const fetchedInput = fetchedForm.querySelector(`#${input.id}`);
                        if (fetchedInput) {
                            input.value = fetchedInput.value;
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                alert('Error loading settings');
            }
        });

        // Clean up modal backdrop when the modal is hidden
        settingsModal.addEventListener('hidden.bs.modal', function() {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    }

    // Handle settings form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(settingsForm);
            
            fetch('/settings', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Close the modal properly
                    const modal = bootstrap.Modal.getInstance(settingsModal);
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Show success message
                    alert('Settings saved successfully!');
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error saving settings');
            });
        });
    }

    // Unit conversion functions
    const conversions = {
        in: {
            in: 1,
            ft: 1/12,
            mm: 25.4
        },
        ft: {
            in: 12,
            ft: 1,
            mm: 304.8
        },
        mm: {
            in: 0.0393701,
            ft: 0.00328084,
            mm: 1
        }
    };

    function convertValue(value, fromUnit, toUnit) {
        return value * conversions[fromUnit][toUnit];
    }

    // Handle unit selection
    const unitRadios = document.querySelectorAll('input[name="unitSelector"]');
    const unitLabels = document.querySelectorAll('.unit-label');
    
    unitRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const newUnit = this.value;
                const oldUnit = localStorage.getItem('preferredUnit') || 'in';
                
                // Convert existing values
                const inputs = ['length', 'width', 'height'];
                inputs.forEach(id => {
                    const input = document.getElementById(id);
                    if (input.value) {
                        input.value = (convertValue(parseFloat(input.value), oldUnit, newUnit)).toFixed(2);
                    }
                });

                // Save preference and update labels
                localStorage.setItem('preferredUnit', newUnit);
                updateUnitLabels(newUnit);
            }
        });
    });

    // Load saved unit preference
    const savedUnit = localStorage.getItem('preferredUnit') || 'in';
    document.getElementById('unit' + savedUnit.charAt(0).toUpperCase() + savedUnit.slice(1)).checked = true;
    updateUnitLabels(savedUnit);

    function updateUnitLabels(unit) {
        const unitLabels = document.querySelectorAll('.unit-label');
        unitLabels.forEach(label => {
            label.textContent = unit;
        });
    }

    // Handle calculator form submission
    const calculatorForm = document.getElementById('calculatorForm');
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const length = parseFloat(document.getElementById('length').value);
            const width = parseFloat(document.getElementById('width').value);
            const height = parseFloat(document.getElementById('height').value);
            const thickness = document.getElementById('thickness').value;
            const undershelf = document.getElementById('undershelf').checked;
            const wheels = document.getElementById('wheels').value;
            const currentUnit = document.querySelector('input[name="unitSelector"]:checked').value;

            // Convert dimensions to inches for calculation
            const lengthInches = convertValue(length, currentUnit, 'in');
            const widthInches = convertValue(width, currentUnit, 'in');
            const heightInches = convertValue(height, currentUnit, 'in');

            const formData = {
                dimensions: {
                    length: lengthInches,
                    width: widthInches,
                    height: heightInches
                },
                top_thickness: parseFloat(document.getElementById('thickness').value),
                undershelves: parseInt(document.getElementById('undershelves').value),
                tube_size: document.getElementById('tubeSize').value,
                wheel_size: document.getElementById('wheelSize').value
            };

            fetch('/calculate_price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('materialCost').textContent = `PKR ${data.material_cost}`;
                document.getElementById('laborCost').textContent = `PKR ${data.labor_cost}`;
                document.getElementById('profit').textContent = `PKR ${data.profit}`;
                document.getElementById('totalPrice').textContent = `PKR ${data.total_price}`;
                document.getElementById('priceBreakdown').style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error calculating price');
            });
        });
    }

    // Add click handler for the gear icon
    const settingsButton = document.getElementById('settingsButton');
    if (settingsButton) {
        console.log('Settings Button Found');
        settingsButton.addEventListener('click', function(e) {
            console.log('Settings Button Clicked');
            e.preventDefault();
            const modal = bootstrap.Modal.getInstance(settingsModal);
            if (modal) {
                modal.show();
            }
        });
    }
});
