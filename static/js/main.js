document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables for tube sizes
    let squareTubeSizes = [];
    let roundTubeSizes = [];

    // Function to update the square tube list display
    function updateSquareTubeList() {
        const tubeList = document.getElementById('squareTubeList');
        if (!tubeList) return;

        tubeList.innerHTML = '';
        squareTubeSizes.forEach((tube, index) => {
            const tag = document.createElement('div');
            tag.className = 'badge bg-primary me-2 mb-2 p-2';
            tag.innerHTML = `${tube.width}"×${tube.width}" - PKR ${tube.price} 
                <button type="button" class="btn-close btn-close-white ms-2" 
                    onclick="removeSquareTube(${index})"></button>`;
            tubeList.appendChild(tag);
        });
    }

    // Function to update the round tube list display
    function updateRoundTubeList() {
        const tubeList = document.getElementById('roundTubeList');
        if (!tubeList) return;

        tubeList.innerHTML = '';
        roundTubeSizes.forEach((tube, index) => {
            const tag = document.createElement('div');
            tag.className = 'badge bg-primary me-2 mb-2 p-2';
            tag.innerHTML = `${tube.diameter}" - PKR ${tube.price} 
                <button type="button" class="btn-close btn-close-white ms-2" 
                    onclick="removeRoundTube(${index})"></button>`;
            tubeList.appendChild(tag);
        });
    }

    // Handle settings form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(this);
                const response = await fetch('/settings', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    window.location.href = '/'; // Redirect to home page after successful save
                } else {
                    alert('Failed to save settings');
                }
            } catch (error) {
                console.error('Error saving settings:', error);
                alert('Error saving settings');
            }
        });
    }

    // Handle calculator form submission
    const calculatorForm = document.getElementById('calculatorForm');
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(this);
                const response = await fetch('/calculate', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    displayResults(result);
                } else {
                    alert('Failed to calculate');
                }
            } catch (error) {
                console.error('Error calculating:', error);
                alert('Error calculating');
            }
        });
    }

    // Function to display calculation results
    function displayResults(result) {
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv) return;

        let html = '<h4>Cost Breakdown</h4>';
        html += '<div class="table-responsive"><table class="table table-bordered">';
        html += '<thead><tr><th>Component</th><th>Details</th><th>Cost (PKR)</th></tr></thead>';
        html += '<tbody>';

        // Add SS Sheet details
        html += `<tr>
            <td>SS Sheet</td>
            <td>${result.sheet_details}</td>
            <td>${result.sheet_cost.toFixed(2)}</td>
        </tr>`;

        // Add Square Tube details if used
        if (result.square_tube_cost > 0) {
            html += `<tr>
                <td>Square Tube</td>
                <td>${result.square_tube_details}</td>
                <td>${result.square_tube_cost.toFixed(2)}</td>
            </tr>`;
        }

        // Add Round Tube details if used
        if (result.round_tube_cost > 0) {
            html += `<tr>
                <td>Round Tube</td>
                <td>${result.round_tube_details}</td>
                <td>${result.round_tube_cost.toFixed(2)}</td>
            </tr>`;
        }

        // Add Wheels cost if selected
        if (result.wheels_cost > 0) {
            html += `<tr>
                <td>Wheels</td>
                <td>${result.wheels_details}</td>
                <td>${result.wheels_cost.toFixed(2)}</td>
            </tr>`;
        }

        // Add total
        html += `<tr class="table-primary">
            <td colspan="2"><strong>Total Cost</strong></td>
            <td><strong>${result.total_cost.toFixed(2)}</strong></td>
        </tr>`;

        html += '</tbody></table></div>';

        // Add selling price suggestions
        html += '<h4 class="mt-4">Suggested Selling Prices</h4>';
        html += '<div class="table-responsive"><table class="table table-bordered">';
        html += '<thead><tr><th>Margin</th><th>Selling Price (PKR)</th><th>Profit (PKR)</th></tr></thead>';
        html += '<tbody>';

        const margins = [0.2, 0.3, 0.4]; // 20%, 30%, 40% margins
        margins.forEach(margin => {
            const sellingPrice = result.total_cost * (1 + margin);
            const profit = sellingPrice - result.total_cost;
            html += `<tr>
                <td>${(margin * 100).toFixed(0)}%</td>
                <td>${sellingPrice.toFixed(2)}</td>
                <td>${profit.toFixed(2)}</td>
            </tr>`;
        });

        html += '</tbody></table></div>';

        resultsDiv.innerHTML = html;
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    // Add event listeners for tube size inputs
    const addSquareTubeBtn = document.getElementById('addSquareTube');
    if (addSquareTubeBtn) {
        addSquareTubeBtn.addEventListener('click', function() {
            const width = document.getElementById('newSquareTubeWidth').value;
            const price = document.getElementById('newSquareTubePrice').value;
            
            if (width && price) {
                squareTubeSizes.push({ width: parseFloat(width), price: parseFloat(price) });
                updateSquareTubeList();
                
                // Update hidden input
                document.getElementById('squareTubeSizes').value = JSON.stringify(squareTubeSizes);
                
                // Clear inputs
                document.getElementById('newSquareTubeWidth').value = '';
                document.getElementById('newSquareTubePrice').value = '';
            }
        });
    }

    const addRoundTubeBtn = document.getElementById('addRoundTube');
    if (addRoundTubeBtn) {
        addRoundTubeBtn.addEventListener('click', function() {
            const diameter = document.getElementById('newRoundTubeDia').value;
            const price = document.getElementById('newRoundTubePrice').value;
            
            if (diameter && price) {
                roundTubeSizes.push({ diameter: parseFloat(diameter), price: parseFloat(price) });
                updateRoundTubeList();
                
                // Update hidden input
                document.getElementById('roundTubeSizes').value = JSON.stringify(roundTubeSizes);
                
                // Clear inputs
                document.getElementById('newRoundTubeDia').value = '';
                document.getElementById('newRoundTubePrice').value = '';
            }
        });
    }

    // Functions to remove tubes (these need to be global)
    window.removeSquareTube = function(index) {
        squareTubeSizes.splice(index, 1);
        updateSquareTubeList();
        document.getElementById('squareTubeSizes').value = JSON.stringify(squareTubeSizes);
    };

    window.removeRoundTube = function(index) {
        roundTubeSizes.splice(index, 1);
        updateRoundTubeList();
        document.getElementById('roundTubeSizes').value = JSON.stringify(roundTubeSizes);
    };

    // Function to load settings from the server
    async function loadSettings() {
        try {
            const response = await fetch('/settings');
            const data = await response.json();
            
            // Update sheet price
            const sheetPriceInput = document.getElementById('sheet_price');
            if (sheetPriceInput) {
                sheetPriceInput.value = data.sheet_price;
            }
            
            // Update tube lists
            squareTubeSizes = data.square_tube_sizes || [];
            roundTubeSizes = data.round_tube_sizes || [];
            updateSquareTubeList();
            updateRoundTubeList();
            
            // Update wheel prices
            const wheel3Input = document.getElementById('wheel_3_price');
            const wheel4Input = document.getElementById('wheel_4_price');
            if (wheel3Input) wheel3Input.value = data.wheel_3_price;
            if (wheel4Input) wheel4Input.value = data.wheel_4_price;
            
            // Update hidden inputs
            const squareTubeSizesInput = document.getElementById('squareTubeSizes');
            const roundTubeSizesInput = document.getElementById('roundTubeSizes');
            if (squareTubeSizesInput) squareTubeSizesInput.value = JSON.stringify(squareTubeSizes);
            if (roundTubeSizesInput) roundTubeSizesInput.value = JSON.stringify(roundTubeSizes);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    // Load settings when page loads
    document.addEventListener('DOMContentLoaded', loadSettings);
});
