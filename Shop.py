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



if __name__ == '__main__':
    app.run(debug=True, port=5070)
