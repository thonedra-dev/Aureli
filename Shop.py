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
        database="shein",
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
def login():
    try:
        login_data = request.get_json()
        owner_name = login_data.get('owner_name')
        password = login_data.get('password')

        if not owner_name or not password:
            return jsonify({"message": "Missing username or password"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute('SELECT owner_name, password FROM shops WHERE owner_name = %s', (owner_name,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user and user['password'] == password:
            return jsonify({"message": "Login successful", "owner_name": user['owner_name']}), 200
        else:
            return jsonify({"message": "Invalid username or password"}), 401

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Login error: {str(e)}"}), 500

@app.route('/api/shop_profile', methods=['GET'])
def shop_profile():
    try:
        owner_name = request.args.get('owner_name')
        if not owner_name:
            return jsonify({"message": "Missing owner_name parameter"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute('SELECT id, shop_name, profile_pic, category, country, state, shop_email, description, contact_number FROM shops WHERE owner_name = %s', (owner_name,))
        shop = cursor.fetchone()

        cursor.close()
        conn.close()

        if shop:
            return jsonify(shop), 200
        else:
            return jsonify({"message": "Shop not found"}), 404

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching shop profile: {str(e)}"}), 500

@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        product_name = request.form.get('product_name')
        category = request.form.get('category')
        default_price = request.form.get('default_price')
        default_color = request.form.get('default_color')
        is_active = request.form.get('is_active', '1')  # Default to '1' (True)

        if not product_name or not category:
            return jsonify({"message": "Product name and category are required"}), 400

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

        # Collect size availability: XS, S, M, L, XL, XLL (default to '0' if missing)
        sizes = ["XS", "S", "M", "L", "XL", "XLL"]
        size_values = {size: request.form.get(size, '0') for size in sizes}

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO products 
            (shop_id, product_name, category, created_at, default_price, default_color, default_picture, is_active, XS, S, M, L, XL, XLL)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            shop_id, product_name, category, current_datetime, default_price, default_color, default_picture_path, is_active,
            size_values["XS"], size_values["S"], size_values["M"], size_values["L"], size_values["XL"], size_values["XLL"]
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
    def safe_int(val):
        try:
            return int(val)
        except (ValueError, TypeError):
            return 0

    try:
        product_id = request.form.get('product_id')
        price = request.form.get('price')
        color = request.form.get('color')

        if not product_id or not price or not color:
            return jsonify({"message": "Missing required fields for variance"}), 400

        product_id = int(product_id)
        price = float(price)

        sizes = ["XS", "S", "M", "L", "XL", "XLL"]
        size_values = {size: safe_int(request.form.get(size)) for size in sizes}

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

        cursor.execute('''
            INSERT INTO variances
            (product_id, price, color, picture, XS, S, M, L, XL, XLL)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            product_id, price, color, picture_path,
            size_values["XS"], size_values["S"], size_values["M"],
            size_values["L"], size_values["XL"], size_values["XLL"]
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Variance created successfully"}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error creating variance: {str(e)}"}), 500


@app.route('/api/products', methods=['GET'])
def fetch_products():
    shop_id = request.args.get('shop_id')
    if not shop_id:
        return jsonify({"message": "Missing shop_id parameter"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute('''
            SELECT product_id, product_name, default_price, default_picture
            FROM products
            WHERE shop_id = %s AND is_active = 1
        ''', (shop_id,))

        products = cursor.fetchall()

        for product in products:
            if product['default_picture']:
                product['default_picture'] = product['default_picture'].replace('\\', '/')
            else:
                product['default_picture'] = None

        cursor.close()
        conn.close()

        return jsonify(products), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching products: {str(e)}"}), 500
  

#This def is no need technically
@app.route('/api/shop_product_details/<int:product_id>', methods=['GET'])
def fetch_shop_product_details(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch product info
        cursor.execute(''' 
            SELECT product_id, shop_id, product_name, category, default_price, default_color,
                   default_picture, XS, S, M, L, XL, XLL, created_at
            FROM products
            WHERE product_id = %s AND is_active = 1
        ''', (product_id,))
        product = cursor.fetchone()

        if not product:
            cursor.close()
            conn.close()
            return jsonify({"message": "Product not found"}), 404

        if product['default_picture']:
            product['default_picture'] = product['default_picture'].replace("\\", "/")
        else:
            product['default_picture'] = None

        # Fetch variants info
        cursor.execute(''' 
            SELECT variance_id, price, color, picture, XS, S, M, L, XL, XLL
            FROM variances
            WHERE product_id = %s
        ''', (product_id,))
        variants = cursor.fetchall()
        
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

#This def is no need technically




@app.route('/api/get_owner_name', methods=['GET'])
def get_owner_name():
    try:
        shop_id = request.args.get('shop_id')
        if not shop_id:
            return jsonify({"message": "Missing shop_id parameter"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch owner_name by shop_id
        cursor.execute('SELECT owner_name FROM shops WHERE id = %s', (shop_id,))
        shop = cursor.fetchone()

        cursor.close()
        conn.close()

        if shop:
            return jsonify({"owner_name": shop['owner_name']}), 200
        else:
            return jsonify({"message": "Shop not found"}), 404

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error fetching owner name: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5070)
