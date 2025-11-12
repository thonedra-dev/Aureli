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
                "profile_pic": shop[2],
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


if __name__ == '__main__':
    app.run(debug=True, port=5070)
