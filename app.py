from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

class PriceCalculator:
    def __init__(self):
        # Sheet prices per kg
        self.sheet_prices = {
            1.2: 0,  # 1.2mm sheet price
            1.5: 0,  # 1.5mm sheet price
            2.0: 0   # 2.0mm sheet price
        }
        # Tube prices per ft
        self.tube_prices = {
            '1.5x1.5': 0,  # 1.5" x 1.5" tube price
            '2.0x2.0': 0   # 2.0" x 2.0" tube price
        }
        # Wheel prices per set of 4
        self.wheel_prices = {
            '3': 0,  # 3" wheels
            '4': 0   # 4" wheels
        }
        self.labor_margin = 0.2  # 20% labor margin
        self.profit_margin = 0.3  # 30% profit margin

    def set_prices(self, prices):
        try:
            # Set sheet prices
            self.sheet_prices[1.2] = float(prices.get('sheet_1_2_price', 0))
            self.sheet_prices[1.5] = float(prices.get('sheet_1_5_price', 0))
            self.sheet_prices[2.0] = float(prices.get('sheet_2_0_price', 0))
            
            # Set tube prices
            self.tube_prices['1.5x1.5'] = float(prices.get('tube_1_5_price', 0))
            self.tube_prices['2.0x2.0'] = float(prices.get('tube_2_0_price', 0))
            
            # Set wheel prices
            self.wheel_prices['3'] = float(prices.get('wheel_3_price', 0))
            self.wheel_prices['4'] = float(prices.get('wheel_4_price', 0))
            
            return True, "Prices updated successfully"
        except ValueError as e:
            return False, "Invalid price value provided"
        except Exception as e:
            return False, str(e)

    def calculate_work_table_price(self, dimensions, top_thickness, undershelves, tube_size, wheel_size):
        try:
            # Calculate material costs
            material_cost = self._calculate_material_cost(dimensions, top_thickness)
            
            # Calculate tube costs
            tube_cost = self._calculate_tube_cost(dimensions, tube_size)
            
            # Calculate undershelves cost if any
            undershelves_cost = self._calculate_undershelves_cost(dimensions, undershelves)
            
            # Calculate wheel cost
            wheel_cost = self._calculate_wheel_cost(wheel_size)
            
            # Total material cost
            total_material_cost = material_cost + tube_cost + undershelves_cost + wheel_cost
            
            # Calculate labor cost (20% of material cost)
            labor_cost = total_material_cost * self.labor_margin
            
            # Calculate profit (30% of material + labor cost)
            subtotal = total_material_cost + labor_cost
            profit = subtotal * self.profit_margin
            
            # Calculate total price
            total_price = total_material_cost + labor_cost + profit
            
            return {
                "material_cost": round(total_material_cost, 2),
                "labor_cost": round(labor_cost, 2),
                "profit": round(profit, 2),
                "total_price": round(total_price, 2)
            }
        except Exception as e:
            return {
                "error": str(e)
            }

    def _calculate_material_cost(self, dimensions, thickness):
        # Calculate area in square feet
        area_sqft = (dimensions['length'] * dimensions['width']) / 144  # Convert to square feet
        
        # Get price per kg based on thickness
        price_per_kg = self.sheet_prices.get(thickness, 0)
        
        # Approximate weight calculation (this is a simplified calculation)
        # You may want to adjust these values based on actual material specifications
        weight_per_sqft = {
            1.2: 4.9,  # lbs per square foot for 1.2mm
            1.5: 6.1,  # lbs per square foot for 1.5mm
            2.0: 8.2   # lbs per square foot for 2.0mm
        }
        
        weight = area_sqft * weight_per_sqft.get(thickness, 0)
        # Convert weight to kg (1 lb = 0.453592 kg)
        weight_kg = weight * 0.453592
        
        return weight_kg * price_per_kg

    def _calculate_tube_cost(self, dimensions, tube_size):
        # Calculate perimeter for legs
        height = dimensions['height']
        num_legs = 4
        total_length = height * num_legs
        
        # Add support bars
        length_supports = dimensions['length'] / 12  # Convert to feet
        width_supports = dimensions['width'] / 12    # Convert to feet
        total_supports_length = (length_supports + width_supports) * 2  # Two supports each way
        
        total_tube_length = total_length + total_supports_length
        
        # Get price per foot based on tube size
        price_per_ft = self.tube_prices.get(tube_size, 0)
        
        return total_tube_length * price_per_ft

    def _calculate_undershelves_cost(self, dimensions, num_undershelves):
        if num_undershelves <= 0:
            return 0
            
        # Calculate area of one undershelf
        area_sqft = (dimensions['length'] * dimensions['width']) / 144  # Convert to square feet
        
        # Use 1.2mm sheet for undershelves
        price_per_kg = self.sheet_prices[1.2]
        
        # Weight calculation for 1.2mm sheet
        weight_per_sqft = 4.9  # lbs per square foot
        weight = area_sqft * weight_per_sqft
        weight_kg = weight * 0.453592  # Convert to kg
        
        return weight_kg * price_per_kg * num_undershelves

    def _calculate_wheel_cost(self, wheel_size):
        # Get price for the selected wheel size (price is for a set of 4)
        return self.wheel_prices.get(wheel_size, 0)

price_calculator = PriceCalculator()

# Material Configurations
MATERIAL_CONFIG = {
    'thicknesses': [1.2, 1.5, 2.0],
    'tube_sizes': ['1.5x1.5', '2.0x2.0'],
    'wheel_sizes': ['3', '4'],
    'max_undershelves': 3
}

@app.route('/')
def index():
    return render_template('index.html', material_config=MATERIAL_CONFIG)

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if request.method == 'POST':
        success, message = price_calculator.set_prices(request.form)
        return jsonify({
            "status": "success" if success else "error",
            "message": message
        })
    
    # For GET requests, return the settings page with current prices
    return render_template('settings.html', prices={
        'sheet_prices': price_calculator.sheet_prices,
        'tube_prices': price_calculator.tube_prices,
        'wheel_prices': price_calculator.wheel_prices
    })

@app.route('/calculate_price', methods=['POST'])
def calculate_price():
    data = request.json
    result = price_calculator.calculate_work_table_price(
        dimensions=data['dimensions'],
        top_thickness=data['top_thickness'],
        undershelves=data['undershelves'],
        tube_size=data['tube_size'],
        wheel_size=data['wheel_size']
    )
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5002)
