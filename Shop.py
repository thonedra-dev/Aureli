from flask import Flask, request, jsonify
import mysql.connector
from datetime import datetime
from flask_cors import CORS
import os
import traceback
from werkzeug.utils import secure_filename

# Import the users blueprint


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="your_password",
        database="aureli",
        port=4306
    )

# Register the users blueprint
@app.route('/api/register_shop', methods=['POST'])
def register_shop():
    try:
        shop_name = request.form.get('shop_name')
        category = request.form.get('category')
        country = request.form.get('country')
        state = request.form.get('state')
        shop_email = request.form.get('shop_email')
        description = request.form.get('description')
        owner_name = request.form.get('owner_name')
        password = request.form.get('password')
        contact_number = request.form.get('contact_number')

        if not all([shop_name, category, country, state, shop_email, owner_name, password, contact_number]):
            return jsonify({"message": "Missing required fields"}), 400

        profile_pic = request.files.get('profile_pic')
        profile_pic_path = None
        if profile_pic and allowed_file(profile_pic.filename):
            filename = secure_filename(profile_pic.filename)
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            profile_pic.save(save_path)
            profile_pic_path = f"/{save_path.replace(os.sep, '/')}"

        current_datetime = datetime.now()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO shops 
            (shop_name, category, country, state, shop_email, description, owner_name, password, contact_number, created_at, profile_pic)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (shop_name, category, country, state, shop_email, description, owner_name, password, contact_number, current_datetime, profile_pic_path))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Shop registered successfully!"}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error registering shop: {str(e)}"}), 500
 
@app.route('/api/shop_login', methods=['POST'])
def shop_login():
    try:
        # Extract data from the request
        shop_name = request.json.get('shop_name')
        owner_name = request.json.get('owner_name')
        password = request.json.get('password')

        # Check if all the required fields are provided
        if not all([shop_name, owner_name, password]):
            return jsonify({"message": "Missing required fields"}), 400

        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to find the shop by shop_name, owner_name, and password
        query = '''
            SELECT id FROM shops
            WHERE shop_name = %s AND owner_name = %s AND password = %s
        '''
        cursor.execute(query, (shop_name, owner_name, password))
        shop = cursor.fetchone()

        # Check if the shop is found
        if shop:
            shop_id = shop[0]  # Get the shop ID from the result
            return jsonify({"message": "Login successful", "shop_id": shop_id}), 200
        else:
            return jsonify({"message": "Invalid credentials"}), 401

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error during login: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()
        
@app.route('/api/shop_profile', methods=['POST'])
def shop_profile():
    try:
        # Extract shop_id from the request body (received as JSON)
        data = request.get_json()
        shop_id = data.get('shop_id')

        if not shop_id:
            return jsonify({"message": "Shop ID is required"}), 400

        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to fetch shop profile details based on the shop_id
        query = '''
            SELECT id, shop_name, profile_pic, category, country, state, shop_email, description, contact_number
            FROM shops
            WHERE id = %s
        '''
        cursor.execute(query, (shop_id,))
        shop = cursor.fetchone()

        # Check if the shop is found
        if shop:
            shop_data = {
                "id": shop[0],
                "shop_name": shop[1],
                "profile_pic": shop[2],  # File path for profile_pic
                "category": shop[3],
                "country": shop[4],
                "state": shop[5],
                "shop_email": shop[6],
                "description": shop[7],
                "contact_number": shop[8]
            }
            return jsonify(shop_data), 200
        else:
            return jsonify({"message": "Shop not found"}), 404

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching shop profile: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/api/shop_profile_product_cards', methods=['POST'])
def fetch_products():
    try:
        # Extract shop_id from the request body (received as JSON)
        data = request.get_json()
        shop_id = data.get('shop_id')

        if not shop_id:
            return jsonify({"message": "Shop ID is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(''' 
            SELECT product_id, product_name, XS, S, M, L, XL, XLL, XS_price, S_price, M_price, L_price, XL_price, XLL_price, 
                   XS_stock, S_stock, M_stock, L_stock, XL_stock, XLL_stock, default_picture
            FROM products
            WHERE shop_id = %s AND is_active = 1
        ''', (shop_id,))

        products = cursor.fetchall()

        # Loop through each product to calculate the default price and format the image path
        for product in products:
            # Find the smallest price among the available sizes
            price_columns = ['XS_price', 'S_price', 'M_price', 'L_price', 'XL_price', 'XLL_price']
            valid_prices = [product[col] for col in price_columns if product[col] is not None]

            if valid_prices:
                default_price = min(valid_prices)  # Select the smallest price
            else:
                default_price = None  # If no price is available, set to None

            product['default_price'] = default_price  # Add the calculated default_price to the product data

            # ✅ Just normalize the path, do NOT add http://localhost:5070
            if product['default_picture']:
                path = product['default_picture'].replace('\\', '/')
                product['default_picture'] = path  # e.g. "/static/uploads/xxx.jpg"
            else:
                product['default_picture'] = None

        cursor.close()
        conn.close()

        return jsonify(products), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching products: {str(e)}"}), 500

@app.route('/api/shop_product_details/<int:product_id>', methods=['GET'])
def fetch_shop_product_details(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch product info (no default/min price calculation)
        cursor.execute(''' 
            SELECT product_id, shop_id, product_name, category,
                   default_color, default_picture,
                   XS, S, M, L, XL, XLL,
                   XS_price, S_price, M_price, L_price, XL_price, XLL_price,
                   XS_stock, S_stock, M_stock, L_stock, XL_stock, XLL_stock,
                   created_at
            FROM products
            WHERE product_id = %s AND is_active = 1
        ''', (product_id,))
        product = cursor.fetchone()

        if not product:
            cursor.close()
            conn.close()
            return jsonify({"message": "Product not found"}), 404

        # Normalize main product picture path
        if product['default_picture']:
            product['default_picture'] = product['default_picture'].replace("\\", "/")
        else:
            product['default_picture'] = None

        # Fetch variants (send all size flags + prices + stocks as-is)
        cursor.execute(''' 
            SELECT variance_id, product_id, color, picture,
                   XS, S, M, L, XL, XLL,
                   XS_price, S_price, M_price, L_price, XL_price, XLL_price,
                   XS_stock, S_stock, M_stock, L_stock, XL_stock, XLL_stock
            FROM variances
            WHERE product_id = %s
        ''', (product_id,))
        variants = cursor.fetchall()

        # Normalize variant picture paths
        for variant in variants:
            if variant['picture']:
                variant['picture'] = variant['picture'].replace("\\", "/")
            else:
                variant['picture'] = None

        cursor.close()
        conn.close()

        return jsonify({
            "product": product,
            "variants": variants
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching product details: {str(e)}"}), 500




@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        # Inline helper logic: Safely convert value to float or None
        def inline_safe_float(val):
            try:
                return float(val) if val else None
            except (ValueError, TypeError):
                return None

        # Inline helper logic: Safely convert value to integer or None
        def inline_safe_int(val):
            try:
                return int(val) if val else None
            except (ValueError, TypeError):
                return None

        product_name = request.form.get('product_name')
        category = request.form.get('category')
        default_color = request.form.get('default_color')
        is_active = request.form.get('is_active', '1')  # Default to '1' (True)

        if not product_name or not category:
            return jsonify({"message": "Product name and category are required"}), 400

        # --- FILE UPLOAD ---
        default_picture = request.files.get('default_picture')
        default_picture_path = None
        if default_picture and allowed_file(default_picture.filename):
            filename = secure_filename(default_picture.filename)
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            default_picture.save(save_path)
            default_picture_path = f"/{save_path.replace(os.sep, '/')}"
        
        current_datetime = datetime.now()
        shop_id = request.form.get('shop_id')
        if not shop_id:
            return jsonify({"message": "shop_id is required to associate product"}), 400

        # --- COLLECT NEW PRICE/STOCK FIELDS ---
        sizes = ["XS", "S", "M", "L", "XL", "XLL"]
        size_data = {}
        size_columns = {}  # This will store the size column update logic
        for size in sizes:
            price = inline_safe_float(request.form.get(f"{size}_price"))
            stock = inline_safe_int(request.form.get(f"{size}_stock"))
            size_data[f"{size}_price"] = price
            size_data[f"{size}_stock"] = stock
            
            # Check if both price and stock are provided for the size
            if price is not None and stock is not None:
                size_columns[size] = 1  # Mark the size as active by setting the column to 1
            else:
                size_columns[size] = 0  # Mark the size as inactive by setting the column to 0

        conn = get_db_connection()
        cursor = conn.cursor()

        # NOTE: SQL INSERT STATEMENT IS MODIFIED TO REFLECT NEW DB COLUMNS
        cursor.execute('''
            INSERT INTO products 
            (shop_id, product_name, category, created_at, default_color, default_picture, is_active, 
             XS_price, XS_stock, S_price, S_stock, M_price, M_stock, 
             L_price, L_stock, XL_price, XL_stock, XLL_price, XLL_stock,
             XS, S, M, L, XL, XLL)  -- Include size columns in the insert statement
            VALUES (%s, %s, %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s)
        ''', (
            shop_id, product_name, category, current_datetime, default_color, default_picture_path, is_active,
            size_data["XS_price"], size_data["XS_stock"], 
            size_data["S_price"], size_data["S_stock"], 
            size_data["M_price"], size_data["M_stock"], 
            size_data["L_price"], size_data["L_stock"], 
            size_data["XL_price"], size_data["XL_stock"], 
            size_data["XLL_price"], size_data["XLL_stock"],
            size_columns["XS"], size_columns["S"], size_columns["M"], size_columns["L"], size_columns["XL"], size_columns["XLL"]
        ))

        conn.commit()
        product_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify({"message": "Product created successfully", "product_id": product_id}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error creating product: {str(e)}"}), 500

    
@app.route('/api/variances', methods=['POST'])
def create_variance():
    try:
        # Inline helper logic: Safely convert value to float or None
        def inline_safe_float(val):
            try:
                return float(val) if val else None
            except (ValueError, TypeError):
                return None

        # Inline helper logic: Safely convert value to integer or None
        def inline_safe_int(val):
            try:
                # Stock should only be saved if a value is actually provided
                return int(val) if val else None
            except (ValueError, TypeError):
                return None

        product_id = request.form.get('product_id')
        color = request.form.get('color')

        if not product_id or not color:
            return jsonify({"message": "Missing required fields for variance (product_id or color)"}), 400

        # Ensure product_id is an integer
        try:
            product_id = int(product_id)
        except (ValueError, TypeError):
            return jsonify({"message": "Invalid product_id format"}), 400

        # --- COLLECT NEW PRICE/STOCK FIELDS ---
        sizes = ["XS", "S", "M", "L", "XL", "XLL"]
        size_data = {}
        size_columns = {}  # To store which sizes are active

        for size in sizes:
            price = inline_safe_float(request.form.get(f"{size}_price"))
            stock = inline_safe_int(request.form.get(f"{size}_stock"))
            size_data[f"{size}_price"] = price
            size_data[f"{size}_stock"] = stock

            # Check if both price and stock are provided for the size
            if price is not None and stock is not None:
                size_columns[size] = 1  # Mark the size as active by setting the column to 1
            else:
                size_columns[size] = 0  # Mark the size as inactive by setting the column to 0

        # --- FILE UPLOAD ---
        picture = request.files.get('picture')
        picture_path = None
        if picture and allowed_file(picture.filename):
            filename = secure_filename(picture.filename)
            filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            picture.save(save_path)
            picture_path = f"/{save_path.replace(os.sep, '/')}"
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # NOTE: SQL INSERT STATEMENT IS MODIFIED TO REFLECT NEW DB COLUMNS
        cursor.execute('''
            INSERT INTO variances
            (product_id, color, picture, 
             XS_price, XS_stock, S_price, S_stock, M_price, M_stock, 
             L_price, L_stock, XL_price, XL_stock, XLL_price, XLL_stock,
             XS, S, M, L, XL, XLL)  -- Include size columns in the insert statement
            VALUES (%s, %s, %s, 
                    %s, %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s)
        ''', (
            product_id, color, picture_path,
            size_data["XS_price"], size_data["XS_stock"], 
            size_data["S_price"], size_data["S_stock"], 
            size_data["M_price"], size_data["M_stock"], 
            size_data["L_price"], size_data["L_stock"], 
            size_data["XL_price"], size_data["XL_stock"], 
            size_data["XLL_price"], size_data["XLL_stock"],
            size_columns["XS"], size_columns["S"], size_columns["M"], size_columns["L"], size_columns["XL"], size_columns["XLL"]
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Variance created successfully"}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error creating variance: {str(e)}"}), 500
    



if __name__ == '__main__':
    app.run(debug=True, port=5070)
