document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
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

    // Handle calculator form submission
    const calculatorForm = document.getElementById('calculatorForm');
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                dimensions: {
                    length: parseFloat(document.getElementById('length').value),
                    width: parseFloat(document.getElementById('width').value),
                    height: parseFloat(document.getElementById('height').value)
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
