from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

class PriceCalculator:
    def __init__(self):
        self.sheet_price = 0
        self.sheet_thicknesses = [1.2, 1.5, 2.0]
        self.square_tube_sizes = [
            {'width': 1.5, 'height': 1.5, 'price': 0},
            {'width': 2.0, 'height': 2.0, 'price': 0}
        ]
        self.round_tube_sizes = [
            {'diameter': 1.5, 'price': 0},
            {'diameter': 2.0, 'price': 0}
        ]
        self.wheel_3_price = 0
        self.wheel_4_price = 0
        self.load_settings()

    def save_settings(self):
        settings = {
            'sheet_price': self.sheet_price,
            'sheet_thicknesses': self.sheet_thicknesses,
            'square_tube_sizes': self.square_tube_sizes,
            'round_tube_sizes': self.round_tube_sizes,
            'wheel_3_price': self.wheel_3_price,
            'wheel_4_price': self.wheel_4_price
        }
        with open('settings.json', 'w') as f:
            json.dump(settings, f, indent=4)
        return True, "Settings saved successfully"

    def load_settings(self):
        try:
            with open('settings.json', 'r') as f:
                settings = json.load(f)
                self.sheet_price = float(settings.get('sheet_price', 0))
                self.sheet_thicknesses = settings.get('sheet_thicknesses', [1.2, 1.5, 2.0])
                self.square_tube_sizes = settings.get('square_tube_sizes', [
                    {'width': 1.5, 'height': 1.5, 'price': 0},
                    {'width': 2.0, 'height': 2.0, 'price': 0}
                ])
                self.round_tube_sizes = settings.get('round_tube_sizes', [
                    {'diameter': 1.5, 'price': 0},
                    {'diameter': 2.0, 'price': 0}
                ])
                self.wheel_3_price = float(settings.get('wheel_3_price', 0))
                self.wheel_4_price = float(settings.get('wheel_4_price', 0))
        except FileNotFoundError:
            pass

    def _calculate_material_cost(self, dimensions, thickness):
        # Calculate area in square feet
        area_sqft = (dimensions['length'] * dimensions['width']) / 144  # Convert to square feet
        
        # Weight multiplier based on thickness (lbs per square foot)
        weight_multipliers = {
            1.2: 4.9,  # for 1.2mm
            1.5: 6.1,  # for 1.5mm
            2.0: 8.2   # for 2.0mm
        }
        
        # Calculate total weight
        weight = area_sqft * weight_multipliers[thickness]
        
        # Convert to kg (1 lb = 0.453592 kg)
        weight_kg = weight * 0.453592
        
        # Calculate cost using the single sheet price
        return weight_kg * self.sheet_price

    def _calculate_tube_cost(self, dimensions, tube_type, tube_size):
        # Calculate total length needed (perimeter)
        total_length = (dimensions['length'] + dimensions['width']) * 2
        
        # Convert to feet if dimensions are in inches
        if dimensions.get('unit', 'in') == 'in':
            total_length = total_length / 12
        
        # Get tube price based on type and size
        tube_price = 0
        if tube_type == 'square':
            width, height = map(float, tube_size.split('x'))
            tube = next((t for t in self.square_tube_sizes 
                        if t['width'] == width and t['height'] == height), None)
            if tube:
                tube_price = tube['price']
        else:  # round tube
            diameter = float(tube_size)
            tube = next((t for t in self.round_tube_sizes 
                        if t['diameter'] == diameter), None)
            if tube:
                tube_price = tube['price']
        
        return total_length * tube_price

    def _calculate_undershelves_cost(self, dimensions, num_undershelves):
        if num_undershelves <= 0:
            return 0
            
        # Calculate area of one undershelf
        area_sqft = (dimensions['length'] * dimensions['width']) / 144  # Convert to square feet
        
        # Use 1.2mm sheet for undershelves
        price_per_kg = self.sheet_price
        
        # Weight calculation for 1.2mm sheet
        weight_per_sqft = 4.9  # lbs per square foot
        weight = area_sqft * weight_per_sqft
        weight_kg = weight * 0.453592  # Convert to kg
        
        return weight_kg * price_per_kg * num_undershelves

    def _calculate_wheel_cost(self, wheel_size):
        # Get price for the selected wheel size (price is for a set of 4)
        return {'3': self.wheel_3_price, '4': self.wheel_4_price}.get(wheel_size, 0)

    def calculate_price(self, data):
        try:
            dimensions = data['dimensions']
            top_thickness = data['top_thickness']
            undershelves = data['undershelves']
            tube_type = data['tube_type']
            tube_size = data['tube_size']
            wheel_size = data['wheel_size']
            
            # Calculate material costs
            material_cost = self._calculate_material_cost(dimensions, top_thickness)
            tube_cost = self._calculate_tube_cost(dimensions, tube_type, tube_size)
            undershelves_cost = self._calculate_undershelves_cost(dimensions, undershelves)
            wheel_cost = self._calculate_wheel_cost(wheel_size)
            
            total_material_cost = material_cost + tube_cost + undershelves_cost + wheel_cost
            
            # Calculate labor cost (30% of material cost)
            labor_cost = total_material_cost * 0.3
            
            # Calculate profit (20% of total cost)
            subtotal = total_material_cost + labor_cost
            profit = subtotal * 0.2
            
            # Calculate total price
            total_price = subtotal + profit
            
            return {
                'material_cost': round(total_material_cost),
                'labor_cost': round(labor_cost),
                'profit': round(profit),
                'total_price': round(total_price)
            }
        except Exception as e:
            print(f"Error calculating price: {e}")
            return None

price_calculator = PriceCalculator()

# Material Configurations
MATERIAL_CONFIG = {
    'thicknesses': [1.2, 1.5, 2.0],
    'square_tube_sizes': [
        {'width': 1.5, 'height': 1.5, 'price': 0},
        {'width': 2.0, 'height': 2.0, 'price': 0}
    ],
    'round_tube_sizes': [
        {'diameter': 1.5, 'price': 0},
        {'diameter': 2.0, 'price': 0}
    ],
    'wheel_sizes': ['3', '4'],
    'max_undershelves': 3
}

@app.route('/')
def index():
    return render_template('index.html', material_config=MATERIAL_CONFIG)

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if request.method == 'POST':
        settings_data = {
            'sheet_price': request.form.get('sheet_price'),
            'sheet_thicknesses': request.form.get('sheet_thicknesses'),
            'square_tube_sizes': request.form.get('square_tube_sizes'),
            'round_tube_sizes': request.form.get('round_tube_sizes'),
            'wheel_sizes': request.form.get('wheel_sizes')
        }
        
        with open('settings.json', 'w') as f:
            json.dump(settings_data, f, indent=4)
        
        return redirect(url_for('index'))
    
    # GET request - return current settings
    try:
        with open('settings.json', 'r') as f:
            settings_data = json.load(f)
    except FileNotFoundError:
        settings_data = {
            'sheet_price': '',
            'sheet_thicknesses': '[]',
            'square_tube_sizes': '[]',
            'round_tube_sizes': '[]',
            'wheel_sizes': '[]'
        }
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(settings_data)
    
    return render_template('settings.html', settings=settings_data)

@app.route('/calculate_price', methods=['POST'])
def calculate_price():
    data = request.json
    result = price_calculator.calculate_price(data)
    return jsonify(result)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.jinja_env.auto_reload = True
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=True, extra_files=[
        './templates/index.html',
        './templates/base.html',
        './static/js/main.js',
        './static/css/style.css'
    ])
